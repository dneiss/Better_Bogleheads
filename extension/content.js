(function() {
  var DEFAULT_COLOR = '#d0d0d0';
  var DEFAULT_HOT_COLOR = '#ffeb3b';
  var DEFAULT_HOT_THRESHOLD = 50;
  var DEFAULT_FONT_SIZE = 100;

  var table = null;
  var currentColor = DEFAULT_COLOR;
  var darkStylesInjected = false;

  // Time tracking variables
  var timeTrackingInterval = null;
  var isTracking = false;

  function injectDarkStyles() {
    if (darkStylesInjected) return;
    var style = document.createElement('style');
    style.id = 'bh-dark-theme';
    style.textContent = [
      'body.bh-dark { background-color: #1a1a1a !important; color: #e0e0e0 !important; }',
      'body.bh-dark .page-body { background-color: #1a1a1a !important; }',
      'body.bh-dark .post, body.bh-dark .panel { background-color: #2d2d2d !important; border-color: #444 !important; }',
      'body.bh-dark a { color: #6db3f2 !important; }',
      'body.bh-dark #posts_table { background-color: #2d2d2d !important; }',
      'body.bh-dark #posts_table tr { background-color: #2d2d2d !important; }',
      'body.bh-dark #posts_table td, body.bh-dark #posts_table th { color: #e0e0e0 !important; border-color: #444 !important; }',
      'body.bh-dark .forumbg, body.bh-dark .forabg { background-color: #2d2d2d !important; }',
      'body.bh-dark .header-bar, body.bh-dark .forum-row { background-color: #333 !important; }',
      'body.bh-dark input, body.bh-dark select, body.bh-dark textarea { background-color: #333 !important; color: #e0e0e0 !important; border-color: #555 !important; }'
    ].join('\n');
    document.head.appendChild(style);
    darkStylesInjected = true;
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      injectDarkStyles();
      document.body.classList.add('bh-dark');
    } else {
      document.body.classList.remove('bh-dark');
    }
  }

  function getTodayDateString() {
    var d = new Date();
    var year = d.getFullYear();
    var month = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function pruneOldDays(dailySeconds) {
    var cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    var cutoffStr = cutoff.toISOString().split('T')[0];
    var pruned = {};
    for (var dateKey in dailySeconds) {
      if (dateKey >= cutoffStr) {
        pruned[dateKey] = dailySeconds[dateKey];
      }
    }
    return pruned;
  }

  function saveTimeTracking() {
    if (!isTracking) return;
    var now = Date.now();
    var today = getTodayDateString();
    try {
      chrome.storage.sync.get(['timeTracking'], function(result) {
        if (chrome.runtime.lastError) {
          // Extension context invalidated, stop tracking
          stopTimeTracking();
          return;
        }
        var tracking = result.timeTracking || {
          totalSeconds: 0,
          resetTimestamp: now,
          lastUpdateTimestamp: now,
          dailySeconds: {}
        };
        // Ensure dailySeconds exists for migration
        if (!tracking.dailySeconds) {
          tracking.dailySeconds = {};
        }
        tracking.totalSeconds += 30;
        tracking.lastUpdateTimestamp = now;
        // Add to today's count
        tracking.dailySeconds[today] = (tracking.dailySeconds[today] || 0) + 30;
        // Prune entries older than 30 days
        tracking.dailySeconds = pruneOldDays(tracking.dailySeconds);
        chrome.storage.sync.set({ timeTracking: tracking });
      });
    } catch (e) {
      // Extension context invalidated, stop tracking
      stopTimeTracking();
    }
  }

  function startTimeTracking() {
    if (isTracking) return;
    isTracking = true;
    timeTrackingInterval = setInterval(saveTimeTracking, 30000);
  }

  function stopTimeTracking() {
    if (!isTracking) return;
    isTracking = false;
    if (timeTrackingInterval) {
      clearInterval(timeTrackingInterval);
      timeTrackingInterval = null;
    }
  }

  function initTimeTracking() {
    // Initialize tracking data if it doesn't exist
    chrome.storage.sync.get(['timeTracking'], function(result) {
      if (!result.timeTracking) {
        var now = Date.now();
        chrome.storage.sync.set({
          timeTracking: {
            totalSeconds: 0,
            resetTimestamp: now,
            lastUpdateTimestamp: now
          }
        });
      }
    });

    // Start tracking if tab is visible
    if (document.visibilityState === 'visible') {
      startTimeTracking();
    }

    // Handle visibility changes
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'visible') {
        startTimeTracking();
      } else {
        stopTimeTracking();
      }
    });

    // Save on page unload
    window.addEventListener('beforeunload', stopTimeTracking);
    window.addEventListener('pagehide', stopTimeTracking);
  }

  function init() {
    table = document.getElementById('posts_table');

    // Apply theme on load
    chrome.storage.sync.get(['theme'], function(result) {
      applyTheme(result.theme || 'light');
    });

    // Start time tracking (works on all bogleheads.org pages)
    initTimeTracking();

    if (!table) return;

    // Load settings and apply initial state
    chrome.storage.sync.get(['stripeColor', 'hideRead', 'readThreads', 'highlightHot', 'hotThreshold', 'hotColor', 'fontSize', 'hideOld', 'maxAgeDays', 'pointerCursor'], function(result) {
      currentColor = result.stripeColor || DEFAULT_COLOR;
      var readThreads = result.readThreads || {};
      if (Array.isArray(readThreads)) readThreads = {};
      var fontSize = result.fontSize || DEFAULT_FONT_SIZE;
      var pointerCursor = result.pointerCursor || false;

      applyFontSize(fontSize);
      applyPointerCursor(pointerCursor);
      applyFilters(readThreads);
      trackClicks(readThreads);
      updateBadge(readThreads);
    });
  }

  function getDataRows() {
    var rows = document.querySelectorAll('#posts_table tbody tr');
    return Array.from(rows).filter(function(row) {
      return !row.querySelector('th');
    });
  }

  function getThreadId(row) {
    var link = row.querySelector('td a[href*="viewtopic.php"]');
    if (link) {
      var match = link.href.match(/t=(\d+)/);
      return match ? match[1] : null;
    }
    return null;
  }

  function getLastPostId(row) {
    var links = row.querySelectorAll('td a[href*="viewtopic.php?p="]');
    for (var i = 0; i < links.length; i++) {
      var match = links[i].href.match(/p=(\d+)/);
      if (match) return match[1];
    }
    return null;
  }

  function getReplyCount(row) {
    var cell = row.querySelector('td.NoMobile');
    if (cell) {
      var text = cell.textContent.trim();
      var count = parseInt(text, 10);
      return isNaN(count) ? 0 : count;
    }
    return 0;
  }

  function getThreadAgeDays(row) {
    var cells = row.querySelectorAll('td.NoMobile');
    for (var i = 0; i < cells.length; i++) {
      var cell = cells[i];
      var link = cell.querySelector('a');
      if (link) {
        var text = link.textContent.trim();
        var yearMatch = text.match(/^(\d{4})$/);
        if (yearMatch) {
          var year = parseInt(yearMatch[1], 10);
          var now = new Date();
          var threadDate = new Date(year, 0, 1);
          var diffDays = Math.floor((now - threadDate) / (1000 * 60 * 60 * 24));
          return diffDays;
        }
        var dateMatch = text.match(/^(\d{1,2})\/(\d{1,2})$/);
        if (dateMatch) {
          var month = parseInt(dateMatch[1], 10) - 1;
          var day = parseInt(dateMatch[2], 10);
          var now = new Date();
          var year = now.getFullYear();
          var threadDate = new Date(year, month, day);
          if (threadDate > now) {
            threadDate = new Date(year - 1, month, day);
          }
          var diffDays = Math.floor((now - threadDate) / (1000 * 60 * 60 * 24));
          return diffDays;
        }
        var timeMatch = text.match(/^(\d{1,2}):(\d{2})$/);
        if (timeMatch) {
          return 0;
        }
      }
    }
    return 0;
  }

  function applyFontSize(size) {
    if (!table) return;
    table.style.setProperty('font-size', size + '%', 'important');
  }

  function applyPointerCursor(enabled) {
    if (!table) return;
    var rows = getDataRows();
    var cursorStyle = enabled ? 'pointer' : '';
    rows.forEach(function(row) {
      row.style.cursor = cursorStyle;
    });
  }

  function updateBadge(readThreads) {
    if (!table) return;
    var rows = getDataRows();
    var unreadCount = 0;
    for (var i = 0; i < rows.length; i++) {
      var threadId = getThreadId(rows[i]);
      if (threadId && !readThreads[threadId]) {
        unreadCount++;
      }
    }
    chrome.runtime.sendMessage({ type: 'updateBadge', unreadCount: unreadCount });
  }

  function applyStripes(color) {
    if (!table) return;
    currentColor = color || currentColor;

    chrome.storage.sync.get(['highlightHot', 'hotThreshold', 'hotColor'], function(result) {
      var highlightHot = result.highlightHot || false;
      var hotThreshold = result.hotThreshold || DEFAULT_HOT_THRESHOLD;
      var hotColor = result.hotColor || DEFAULT_HOT_COLOR;

      var rows = getDataRows();
      var count = 0;

      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        if (row.style.display === 'none') continue;

        var replyCount = getReplyCount(row);
        var bgColor;

        if (highlightHot && replyCount >= hotThreshold) {
          bgColor = hotColor;
        } else {
          bgColor = (count % 2 === 0) ? currentColor : '#ffffff';
        }

        row.style.setProperty('background-color', bgColor, 'important');
        count++;
      }
    });
  }

  function applyFilters(readThreads) {
    if (!table) return;

    chrome.storage.sync.get(['hideRead', 'hideOld', 'maxAgeDays', 'stripeColor'], function(result) {
      var hideRead = result.hideRead || false;
      var hideOld = result.hideOld || false;
      var maxAgeDays = result.maxAgeDays || 30;
      currentColor = result.stripeColor || currentColor;

      var rows = getDataRows();
      rows.forEach(function(row) {
        var shouldHide = false;

        if (hideRead) {
          var threadId = getThreadId(row);
          var lastPostId = getLastPostId(row);
          var savedPostId = threadId ? readThreads[threadId] : null;
          var isFullyRead = savedPostId && savedPostId === lastPostId;
          if (isFullyRead) shouldHide = true;
        }

        if (hideOld && !shouldHide) {
          var ageDays = getThreadAgeDays(row);
          if (ageDays > maxAgeDays) shouldHide = true;
        }

        row.style.display = shouldHide ? 'none' : '';
      });

      applyStripes(currentColor);
    });
  }

  function trackClicks(readThreads) {
    var rows = getDataRows();
    rows.forEach(function(row) {
      var links = row.querySelectorAll('td a[href*="viewtopic.php"]');
      links.forEach(function(link) {
        if (link.dataset.tracked) return;
        link.dataset.tracked = 'true';
        link.addEventListener('click', function() {
          var threadId = getThreadId(row);
          var lastPostId = getLastPostId(row);
          if (threadId && lastPostId) {
            readThreads[threadId] = lastPostId;
            chrome.storage.sync.set({ readThreads: readThreads });
            updateBadge(readThreads);
          }
        });
      });
    });
  }

  // Listen for messages from the side panel
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.type === 'stripeColor') {
      applyStripes(message.value);
    } else if (message.type === 'applyStripes') {
      applyStripes();
    } else if (message.type === 'applyFilters') {
      chrome.storage.sync.get(['readThreads'], function(result) {
        var readThreads = result.readThreads || {};
        if (Array.isArray(readThreads)) readThreads = {};
        applyFilters(readThreads);
      });
    } else if (message.type === 'fontSize') {
      applyFontSize(message.value);
    }
  });

  // Also listen for storage changes (backup for side panel communication)
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace !== 'sync') return;

    // Theme can change even without a table
    if (changes.theme) {
      applyTheme(changes.theme.newValue || 'light');
    }

    if (!table) return;

    if (changes.fontSize) {
      applyFontSize(changes.fontSize.newValue || DEFAULT_FONT_SIZE);
    }
    if (changes.pointerCursor) {
      applyPointerCursor(changes.pointerCursor.newValue || false);
    }
    if (changes.stripeColor) {
      currentColor = changes.stripeColor.newValue || DEFAULT_COLOR;
      applyStripes(currentColor);
    }
    if (changes.highlightHot || changes.hotThreshold || changes.hotColor) {
      applyStripes();
    }
    if (changes.hideRead || changes.hideOld || changes.maxAgeDays || changes.readThreads) {
      chrome.storage.sync.get(['readThreads'], function(result) {
        var readThreads = result.readThreads || {};
        if (Array.isArray(readThreads)) readThreads = {};
        applyFilters(readThreads);
        updateBadge(readThreads);
      });
    }
  });

  init();

  window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
      init();
    }
  });
})();
