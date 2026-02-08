(function() {
  // Skip if already running with a valid extension context
  if (document.documentElement.dataset.bhActive === 'true') {
    try {
      if (chrome.runtime && chrome.runtime.id) return;
    } catch (e) {
      // Context invalid, proceed with re-injection
    }
  }
  document.documentElement.dataset.bhActive = 'true';

  var DEFAULT_COLOR = '#d0d0d0';
  var DEFAULT_HOT_COLOR = '#ffeb3b';
  var DEFAULT_HOT_THRESHOLD = 50;
  var DEFAULT_FONT_SIZE = 100;
  var DEFAULT_WATCH_COLOR = '#c8e6c9';

  function isContextValid() {
    return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
  }

  var table = null;
  var currentColor = DEFAULT_COLOR;
  var darkStylesInjected = false;
  var currentThemeSetting = 'system';
  var lastRightClickedRow = null;
  var lastRightClickedProfileLink = null;
  var lastRightClickedCell = null;

  // Time tracking variables
  var timeTrackingInterval = null;
  var isTracking = false;

  function injectDarkStyles() {
    if (darkStylesInjected) return;
    var style = document.createElement('style');
    style.id = 'bh-dark-theme';
    style.textContent = [
      /* Base */
      'body.bh-dark { background-color: #1a1a1a !important; color: #e0e0e0 !important; }',

      /* Major containers */
      'body.bh-dark #wrap, body.bh-dark #page-body, body.bh-dark #page-header, body.bh-dark #page-footer, body.bh-dark .page-body { background-color: #1a1a1a !important; color: #e0e0e0 !important; }',

      /* Forum list containers */
      'body.bh-dark .forumbg, body.bh-dark .forabg { background-color: #2d2d2d !important; }',
      'body.bh-dark .forumbg .header, body.bh-dark .forabg .header { background-color: #333 !important; color: #e0e0e0 !important; }',

      /* Row items and alternating backgrounds */
      'body.bh-dark li.row, body.bh-dark .bg1, body.bh-dark .bg2, body.bh-dark .bg3 { background-color: #2d2d2d !important; }',
      'body.bh-dark li.row:nth-child(even) { background-color: #252525 !important; }',
      'body.bh-dark dl.row-item { background-color: inherit !important; }',
      'body.bh-dark dt, body.bh-dark dd { color: #e0e0e0 !important; }',

      /* Tables */
      'body.bh-dark table { background-color: #2d2d2d !important; border-color: #444 !important; }',
      'body.bh-dark #posts_table { background-color: #2d2d2d !important; }',
      'body.bh-dark td, body.bh-dark th { background-color: #1a1a1a !important; color: #e0e0e0 !important; border-color: #444 !important; }',

      /* Right side main content area */
      'body.bh-dark #rightside { background-color: #1a1a1a !important; }',
      'body.bh-dark .accordion { background-color: #333 !important; color: #e0e0e0 !important; border-color: #444 !important; }',

      /* Links */
      'body.bh-dark a { color: #6db3f2 !important; }',
      'body.bh-dark a:visited { color: #9b8ec8 !important; }',
      'body.bh-dark a:hover { color: #8cc8ff !important; }',

      /* Posts */
      'body.bh-dark .post, body.bh-dark .panel { background-color: #2d2d2d !important; border-color: #444 !important; }',
      'body.bh-dark .postbody, body.bh-dark .content { color: #e0e0e0 !important; }',
      'body.bh-dark .postprofile { background-color: #252525 !important; border-color: #444 !important; }',
      'body.bh-dark .post .author { color: #e0e0e0 !important; }',
      'body.bh-dark .post .notice { color: #a0aec0 !important; }',
      'body.bh-dark .signature { border-color: #444 !important; color: #a0aec0 !important; }',

      /* Navigation and headers */
      'body.bh-dark .header-bar, body.bh-dark .forum-row, body.bh-dark .navbar { background-color: #333 !important; }',
      'body.bh-dark .headerbar { background-color: #333 !important; }',
      'body.bh-dark .action-bar { background-color: #2d2d2d !important; border-color: #444 !important; }',
      'body.bh-dark .breadcrumbs { color: #a0aec0 !important; }',
      'body.bh-dark .pagination { color: #a0aec0 !important; }',
      'body.bh-dark .pagination a { color: #6db3f2 !important; }',

      /* Forms */
      'body.bh-dark input, body.bh-dark select, body.bh-dark textarea { background-color: #333 !important; color: #e0e0e0 !important; border-color: #555 !important; }',
      'body.bh-dark button, body.bh-dark input[type="submit"], body.bh-dark .button, body.bh-dark .button2 { background-color: #444 !important; color: #e0e0e0 !important; border-color: #555 !important; }',

      /* Override inline styles (forum uses hardcoded colors) */
      'body.bh-dark [style*="background-color"], body.bh-dark [style*="background:"] { background-color: inherit !important; }',
      'body.bh-dark [bgcolor] { background-color: inherit !important; }',
      'body.bh-dark font[color], body.bh-dark [style*="color:"] { color: inherit !important; }',

      /* Blockquotes and code in posts */
      'body.bh-dark blockquote { background-color: #252525 !important; border-color: #555 !important; color: #d0d0d0 !important; }',
      'body.bh-dark .codebox { background-color: #252525 !important; border-color: #555 !important; }',
      'body.bh-dark .codebox code { color: #e0e0e0 !important; }',

      /* Dropdowns and menus */
      'body.bh-dark .dropdown-contents { background-color: #333 !important; border-color: #555 !important; }',

      /* Separators */
      'body.bh-dark hr { border-color: #444 !important; }',

      /* Left sidebar (portal homepage) */
      'body.bh-dark #leftside { background-color: #1a1a1a !important; }',
      'body.bh-dark .leftside_table, body.bh-dark .leftside_table td { background-color: #1a1a1a !important; }',

      /* Misc text and small elements */
      'body.bh-dark .topic-title { color: #e0e0e0 !important; }',
      'body.bh-dark span, body.bh-dark p, body.bh-dark div, body.bh-dark li { color: inherit; }',
      'body.bh-dark .stat-block { color: #a0aec0 !important; }',
      'body.bh-dark .search-box { background-color: #333 !important; }',
      'body.bh-dark #search-box { background-color: #333 !important; }',

      /* Announcement and sticky bars */
      'body.bh-dark .announce-bar, body.bh-dark .sticky-bar { background-color: #333 !important; }',

      /* phpBB quick-login and similar panels */
      'body.bh-dark .login-box, body.bh-dark #login-box { background-color: #2d2d2d !important; border-color: #444 !important; }',

      /* Footer */
      'body.bh-dark #page-footer, body.bh-dark .copyright { color: #888 !important; }',

      /* Scrollbar (Webkit) */
      'body.bh-dark ::-webkit-scrollbar { background-color: #1a1a1a; }',
      'body.bh-dark ::-webkit-scrollbar-thumb { background-color: #555; }',
      'body.bh-dark ::-webkit-scrollbar-track { background-color: #2d2d2d; }'
    ].join('\n');
    document.head.appendChild(style);
    darkStylesInjected = true;
  }

  function resolveTheme(theme) {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  }

  function applyTheme(theme) {
    currentThemeSetting = theme;
    var resolved = resolveTheme(theme);
    if (resolved === 'dark') {
      injectDarkStyles();
      document.body.classList.add('bh-dark');
    } else {
      document.body.classList.remove('bh-dark');
    }
    applyStripes();
  }

  // Re-apply theme when OS color scheme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
    if (currentThemeSetting === 'system') {
      applyTheme('system');
    }
  });

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

  function getCurrentForumInfo() {
    var breadcrumbs = document.querySelectorAll('.breadcrumbs a');
    for (var i = breadcrumbs.length - 1; i >= 0; i--) {
      var href = breadcrumbs[i].href || '';
      if (href.indexOf('viewforum.php') !== -1) {
        var match = href.match(/f=(\d+)/);
        if (match) {
          return { id: match[1], name: breadcrumbs[i].textContent.trim() };
        }
      }
    }
    return null;
  }

  function trackForumVisit() {
    var forum = getCurrentForumInfo();
    if (!forum) return;
    try {
      chrome.storage.local.get(['forumStats'], function(result) {
        if (chrome.runtime.lastError) return;
        var stats = result.forumStats || { forumVisits: {}, dailyTopicsRead: {} };
        if (!stats.forumVisits) stats.forumVisits = {};
        var entry = stats.forumVisits[forum.id] || { name: '', count: 0 };
        entry.name = forum.name;
        entry.count += 1;
        stats.forumVisits[forum.id] = entry;
        chrome.storage.local.set({ forumStats: stats });
      });
    } catch (e) { /* context invalidated */ }
  }

  function trackDailyTopicRead() {
    try {
      chrome.storage.local.get(['forumStats'], function(result) {
        if (chrome.runtime.lastError) return;
        var stats = result.forumStats || { forumVisits: {}, dailyTopicsRead: {} };
        if (!stats.dailyTopicsRead) stats.dailyTopicsRead = {};
        var today = getTodayDateString();
        stats.dailyTopicsRead[today] = (stats.dailyTopicsRead[today] || 0) + 1;
        stats.dailyTopicsRead = pruneOldDays(stats.dailyTopicsRead);
        chrome.storage.local.set({ forumStats: stats });
      });
    } catch (e) { /* context invalidated */ }
  }

  function init() {
    if (!isContextValid()) return;
    table = document.getElementById('posts_table');

    // Migrate readThreads to readTopics (one-time)
    chrome.storage.sync.get(['readThreads', 'readTopics'], function(result) {
      if (result.readThreads && !result.readTopics) {
        chrome.storage.sync.set({ readTopics: result.readThreads });
        chrome.storage.sync.remove('readThreads');
      }
    });

    // Apply theme on load
    chrome.storage.sync.get(['theme'], function(result) {
      applyTheme(result.theme || 'system');
    });

    // Start time tracking (works on all bogleheads.org pages)
    initTimeTracking();

    // Track forum visits for statistics
    trackForumVisit();

    if (!table) return;

    // Load settings and apply initial state
    chrome.storage.sync.get(['stripeColor', 'hideRead', 'readTopics', 'highlightHot', 'hotThreshold', 'hotColor', 'fontSize', 'hideOld', 'maxAgeDays', 'pointerCursor'], function(result) {
      currentColor = result.stripeColor || DEFAULT_COLOR;
      var readTopics = result.readTopics || {};
      if (Array.isArray(readTopics)) readTopics = {};
      var fontSize = result.fontSize || DEFAULT_FONT_SIZE;
      var pointerCursor = result.pointerCursor || false;

      applyFontSize(fontSize);
      applyPointerCursor(pointerCursor);
      applyFilters(readTopics);
      trackClicks(readTopics);
      trackRightClicks();
      updateBadge(readTopics);
    });
  }

  function getDataRows() {
    var rows = document.querySelectorAll('#posts_table tbody tr');
    return Array.from(rows).filter(function(row) {
      return !row.querySelector('th');
    });
  }

  function getTopicId(row) {
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

  function extractPosterName(cell) {
    if (!cell) return '';
    var text = cell.textContent.trim();
    text = text.replace(/^\d{1,2}:\d{2}\s*/, '');
    text = text.replace(/^\d{1,2}\/\d{1,2}\s*/, '');
    text = text.replace(/^\d{4}\s*/, '');
    return text.trim().toLowerCase();
  }

  function getTopicAuthor(row) {
    var cells = row.querySelectorAll('td');
    return cells.length >= 2 ? extractPosterName(cells[cells.length - 2]) : '';
  }

  function getLastPoster(row) {
    var cells = row.querySelectorAll('td');
    return cells.length >= 1 ? extractPosterName(cells[cells.length - 1]) : '';
  }

  function getTopicAgeDays(row) {
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
          var topicDate = new Date(year, 0, 1);
          var diffDays = Math.floor((now - topicDate) / (1000 * 60 * 60 * 24));
          return diffDays;
        }
        var dateMatch = text.match(/^(\d{1,2})\/(\d{1,2})$/);
        if (dateMatch) {
          var month = parseInt(dateMatch[1], 10) - 1;
          var day = parseInt(dateMatch[2], 10);
          var now = new Date();
          var year = now.getFullYear();
          var topicDate = new Date(year, month, day);
          if (topicDate > now) {
            topicDate = new Date(year - 1, month, day);
          }
          var diffDays = Math.floor((now - topicDate) / (1000 * 60 * 60 * 24));
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

  function updateBadge(readTopics) {
    if (!table || !isContextValid()) return;
    var rows = getDataRows();
    var unreadCount = 0;
    for (var i = 0; i < rows.length; i++) {
      var topicId = getTopicId(rows[i]);
      if (topicId && !readTopics[topicId]) {
        unreadCount++;
      }
    }
    chrome.runtime.sendMessage({ type: 'updateBadge', unreadCount: unreadCount });
  }

  function applyStripes(color) {
    if (!table) return;
    currentColor = color || currentColor;

    chrome.storage.sync.get(['enableStriping', 'highlightHot', 'hotThreshold', 'hotColor', 'enableWatchPosters', 'watchedPosters', 'watchColor'], function(result) {
      var enableStriping = result.enableStriping !== false;
      var highlightHot = result.highlightHot || false;
      var hotThreshold = result.hotThreshold || DEFAULT_HOT_THRESHOLD;
      var hotColor = result.hotColor || DEFAULT_HOT_COLOR;
      var enableWatchPosters = result.enableWatchPosters || false;
      var watchedPosters = result.watchedPosters || [];
      var watchColor = result.watchColor || DEFAULT_WATCH_COLOR;

      var rows = getDataRows();
      var count = 0;

      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        if (row.style.display === 'none') continue;

        var bgColor;
        var author = getTopicAuthor(row);
        var lastPoster = getLastPoster(row);
        var isWatched = enableWatchPosters && watchedPosters.length > 0 && (watchedPosters.indexOf(author) !== -1 || watchedPosters.indexOf(lastPoster) !== -1);

        var baseBg = document.body.classList.contains('bh-dark') ? '#2d2d2d' : '#ffffff';

        if (isWatched) {
          bgColor = watchColor;
        } else if (highlightHot && getReplyCount(row) >= hotThreshold) {
          bgColor = hotColor;
        } else if (enableStriping) {
          bgColor = (count % 2 === 0) ? currentColor : baseBg;
        } else {
          bgColor = baseBg;
        }

        row.style.setProperty('background-color', bgColor, 'important');
        var cells = row.querySelectorAll('td');
        for (var j = 0; j < cells.length; j++) {
          cells[j].style.setProperty('background-color', bgColor, 'important');
        }
        count++;
      }
    });
  }

  function applyFilters(readTopics) {
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
          var topicId = getTopicId(row);
          var lastPostId = getLastPostId(row);
          var savedPostId = topicId ? readTopics[topicId] : null;
          var isFullyRead = savedPostId && savedPostId === lastPostId;
          if (isFullyRead) shouldHide = true;
        }

        if (hideOld && !shouldHide) {
          var ageDays = getTopicAgeDays(row);
          if (ageDays > maxAgeDays) shouldHide = true;
        }

        row.style.display = shouldHide ? 'none' : '';
      });

      applyStripes(currentColor);
    });
  }

  function trackRightClicks() {
    var rows = getDataRows();
    rows.forEach(function(row) {
      row.addEventListener('contextmenu', function() {
        lastRightClickedRow = row;
      });
    });
    document.addEventListener('contextmenu', function(e) {
      var link = e.target.closest('a[href*="memberlist.php"]');
      lastRightClickedProfileLink = link || null;
      var cell = e.target.closest('td');
      lastRightClickedCell = cell || null;
    });
  }

  function trackClicks(readTopics) {
    var rows = getDataRows();
    rows.forEach(function(row) {
      var links = row.querySelectorAll('td a[href*="viewtopic.php"]');
      links.forEach(function(link) {
        if (link.dataset.tracked) return;
        link.dataset.tracked = 'true';
        link.addEventListener('click', function() {
          if (!isContextValid()) return;
          var topicId = getTopicId(row);
          var lastPostId = getLastPostId(row);
          if (topicId && lastPostId) {
            readTopics[topicId] = lastPostId;
            chrome.storage.sync.set({ readTopics: readTopics });
            trackDailyTopicRead();
            updateBadge(readTopics);
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
      chrome.storage.sync.get(['readTopics'], function(result) {
        var readTopics = result.readTopics || {};
        if (Array.isArray(readTopics)) readTopics = {};
        applyFilters(readTopics);
      });
    } else if (message.type === 'fontSize') {
      applyFontSize(message.value);
    } else if (message.type === 'contextMenuAction') {
      if (!lastRightClickedRow) return;
      var topicId = getTopicId(lastRightClickedRow);
      if (!topicId) return;
      chrome.storage.sync.get(['readTopics'], function(result) {
        var readTopics = result.readTopics || {};
        if (Array.isArray(readTopics)) readTopics = {};
        if (message.action === 'markRead') {
          var lastPostId = getLastPostId(lastRightClickedRow);
          if (lastPostId) {
            readTopics[topicId] = lastPostId;
            trackDailyTopicRead();
          }
        }
        chrome.storage.sync.set({ readTopics: readTopics });
        applyFilters(readTopics);
        updateBadge(readTopics);
      });
    } else if (message.type === 'watchPoster') {
      var username = '';
      if (lastRightClickedProfileLink) {
        username = lastRightClickedProfileLink.textContent.trim().toLowerCase();
      } else if (lastRightClickedCell) {
        username = extractPosterName(lastRightClickedCell);
      }
      if (!username) return;
      chrome.storage.sync.get(['watchedPosters'], function(result) {
        var watchedPosters = result.watchedPosters || [];
        if (watchedPosters.indexOf(username) === -1) {
          watchedPosters.push(username);
          chrome.storage.sync.set({ watchedPosters: watchedPosters });
        }
      });
    } else if (message.type === 'keyboardAction' && message.action === 'markTopicRead') {
      var url = window.location.href;
      if (url.indexOf('viewtopic.php') === -1) return;

      var urlParams = new URLSearchParams(window.location.search);
      var topicId = urlParams.get('t');

      // Fallback for direct post links (viewtopic.php?p=XXXXX)
      if (!topicId) {
        var topicLink = document.querySelector('h2.topic-title a[href*="viewtopic.php"]');
        if (topicLink) {
          var tMatch = topicLink.href.match(/t=(\d+)/);
          if (tMatch) topicId = tMatch[1];
        }
      }
      if (!topicId) return;

      // Find last post ID on the page (phpBB uses <div id="pXXXXXX"> for each post)
      var postDivs = document.querySelectorAll('div[id^="p"]');
      var lastPostId = null;
      for (var i = postDivs.length - 1; i >= 0; i--) {
        var pMatch = postDivs[i].id.match(/^p(\d+)$/);
        if (pMatch) {
          lastPostId = pMatch[1];
          break;
        }
      }
      if (!lastPostId) return;

      chrome.storage.sync.get(['readTopics'], function(result) {
        var readTopics = result.readTopics || {};
        if (Array.isArray(readTopics)) readTopics = {};
        readTopics[topicId] = lastPostId;
        chrome.storage.sync.set({ readTopics: readTopics });
        trackDailyTopicRead();
      });
    }
  });

  // Also listen for storage changes (backup for side panel communication)
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace !== 'sync') return;

    // Theme can change even without a table
    if (changes.theme) {
      applyTheme(changes.theme.newValue || 'system');
    }

    if (!table) return;

    if (changes.fontSize) {
      applyFontSize(changes.fontSize.newValue || DEFAULT_FONT_SIZE);
    }
    if (changes.pointerCursor) {
      applyPointerCursor(changes.pointerCursor.newValue || false);
    }
    if (changes.enableStriping) {
      applyStripes();
    }
    if (changes.stripeColor) {
      currentColor = changes.stripeColor.newValue || DEFAULT_COLOR;
      applyStripes(currentColor);
    }
    if (changes.highlightHot || changes.hotThreshold || changes.hotColor) {
      applyStripes();
    }
    if (changes.enableWatchPosters || changes.watchedPosters || changes.watchColor) {
      applyStripes();
    }
    if (changes.hideRead || changes.hideOld || changes.maxAgeDays || changes.readTopics) {
      chrome.storage.sync.get(['readTopics'], function(result) {
        var readTopics = result.readTopics || {};
        if (Array.isArray(readTopics)) readTopics = {};
        applyFilters(readTopics);
        updateBadge(readTopics);
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
