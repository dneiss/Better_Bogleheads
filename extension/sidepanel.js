(function() {
  var DEFAULT_COLOR = '#d0d0d0';
  var DEFAULT_HOT_COLOR = '#ffeb3b';
  var DEFAULT_HOT_THRESHOLD = 50;
  var DEFAULT_FONT_SIZE = 100;
  var DEFAULT_WATCH_COLOR = '#c8e6c9';

  var pendingSync = {};
  var syncTimeout = null;
  function debouncedSyncSet(obj) {
    Object.assign(pendingSync, obj);
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(function() {
      chrome.storage.sync.set(pendingSync);
      pendingSync = {};
    }, 300);
  }

  var SUBFORUM_MAP = [
    { letter: 'h', name: 'Personal Investments' },
    { letter: 't', name: 'Investing - Theory, News & General' },
    { letter: 'p', name: 'Personal Finance' },
    { letter: 'n', name: 'Non-US Investing' },
    { letter: 's', name: 'Spain' },
    { letter: 'u', name: 'United Arab Emirates' },
    { letter: 'c', name: 'Personal Consumer Issues' },
    { letter: 'b', name: 'Bogleheads Community' },
    { letter: 'l', name: 'US Local Chapters' },
    { letter: 'I', name: 'Non-US Local Chapters' },
    { letter: 'f', name: 'Forum Issues and Administration' }
  ];

  // Collapsible sections
  chrome.storage.sync.get(['collapsedSections'], function(result) {
    var collapsed = result.collapsedSections || [];
    collapsed.forEach(function(id) {
      var group = document.querySelector('.section-group[data-section="' + id + '"]');
      if (group) group.classList.add('collapsed');
    });
  });

  document.querySelectorAll('.section-group[data-section] > .section:first-child').forEach(function(header) {
    header.addEventListener('click', function(e) {
      // Don't toggle when interacting with form controls inside the header
      if (e.target.closest('input, button, select, textarea, a')) return;
      var group = header.parentElement;
      group.classList.toggle('collapsed');
      // Save collapsed state
      var allCollapsed = [];
      document.querySelectorAll('.section-group.collapsed[data-section]').forEach(function(g) {
        allCollapsed.push(g.dataset.section);
      });
      chrome.storage.sync.set({ collapsedSections: allCollapsed });
    });
  });

  var currentThemeSetting = 'system';

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
      document.body.classList.add('bh-dark');
    } else {
      document.body.classList.remove('bh-dark');
    }
  }

  // Re-apply theme when OS color scheme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
    if (currentThemeSetting === 'system') {
      applyTheme('system');
    }
  });

  // Load and apply theme on init
  chrome.storage.sync.get(['theme'], function(result) {
    var theme = result.theme || 'system';
    applyTheme(theme);
    // Set the correct radio button
    var radio = document.getElementById('theme-' + theme);
    if (radio) radio.checked = true;
  });

  document.getElementById('panel-header-link').onclick = function(e) {
    e.preventDefault();
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.update(tabs[0].id, { url: 'https://www.bogleheads.org/' });
      }
    });
  };

  var themeRadios = document.querySelectorAll('input[name="theme"]');
  var enableStripingCheckbox = document.getElementById('enable-striping');
  var colorInput = document.getElementById('stripe-color');
  var hideReadCheckbox = document.getElementById('hide-read');
  var showNewRepliesCheckbox = document.getElementById('show-new-replies');
  var markAllReadButton = document.getElementById('mark-all-read');
  var clearReadButton = document.getElementById('clear-read');
  var readCountSpan = document.getElementById('read-count');
  var highlightHotCheckbox = document.getElementById('highlight-hot');
  var hotThresholdInput = document.getElementById('hot-threshold');
  var hotColorInput = document.getElementById('hot-color');
  var fontSizeInput = document.getElementById('font-size');
  var fontSizeDisplay = document.getElementById('font-size-display');
  var fontDecreaseButton = document.getElementById('font-decrease');
  var fontIncreaseButton = document.getElementById('font-increase');
  var fontResetButton = document.getElementById('font-reset');
  var hideOldCheckbox = document.getElementById('hide-old');
  var maxAgeDaysInput = document.getElementById('max-age-days');
  var pointerCursorCheckbox = document.getElementById('pointer-cursor');
  var timeTodayEl = document.getElementById('time-today');
  var timeTotalEl = document.getElementById('time-total');
  var sparklineEl = document.getElementById('sparkline');
  var timeStatsEl = document.getElementById('time-stats');
  var resetTimeButton = document.getElementById('reset-time');
  var enableWatchPostersCheckbox = document.getElementById('enable-watch-posters');
  var watchPosterInput = document.getElementById('watch-poster-input');
  var watchPosterAddButton = document.getElementById('watch-poster-add');
  var watchColorInput = document.getElementById('watch-color');
  var watchPosterListEl = document.getElementById('watch-poster-list');
  var watchPosterCountSpan = document.getElementById('watch-poster-count');
  var subforumListEl = document.getElementById('subforum-list');
  var bookmarkListEl = document.getElementById('bookmark-list');
  var bookmarkCountSpan = document.getElementById('bookmark-count');

  function updateReadCount(readTopics) {
    var count = Object.keys(readTopics).length;
    readCountSpan.textContent = '(' + count + ' read)';
  }

  function updateWatchCount(watchedPosters) {
    var count = watchedPosters.length;
    watchPosterCountSpan.textContent = count > 0 ? '(' + count + ' watched)' : '';
  }

  function renderSubforumCheckboxes(hiddenSubforums) {
    subforumListEl.innerHTML = '';
    SUBFORUM_MAP.forEach(function(entry) {
      var item = document.createElement('label');
      item.className = 'subforum-item';
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = hiddenSubforums.indexOf(entry.letter) === -1;
      cb.dataset.subforum = entry.letter;
      cb.onchange = function() {
        updateHiddenSubforums();
      };
      item.appendChild(cb);
      item.appendChild(document.createTextNode(' ' + entry.letter + ' - ' + entry.name));
      subforumListEl.appendChild(item);
    });
  }

  function updateHiddenSubforums() {
    var hidden = [];
    var checkboxes = subforumListEl.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(function(cb) {
      if (!cb.checked) {
        hidden.push(cb.dataset.subforum);
      }
    });
    chrome.storage.sync.set({ hiddenSubforums: hidden });
  }

  function renderWatchedPosters(watchedPosters) {
    watchPosterListEl.innerHTML = '';
    watchedPosters.forEach(function(name) {
      var item = document.createElement('div');
      item.className = 'watch-poster-item';
      var nameSpan = document.createElement('span');
      nameSpan.textContent = name;
      var removeBtn = document.createElement('button');
      removeBtn.className = 'watch-poster-remove';
      removeBtn.textContent = '\u00d7';
      removeBtn.dataset.tooltip = 'Remove ' + name + ' from watch list';
      removeBtn.setAttribute('aria-label', 'Remove ' + name + ' from watch list');
      removeBtn.onclick = function() {
        chrome.storage.sync.get(['watchedPosters'], function(result) {
          var list = result.watchedPosters || [];
          var idx = list.indexOf(name);
          if (idx !== -1) {
            list.splice(idx, 1);
            chrome.storage.sync.set({ watchedPosters: list });
            renderWatchedPosters(list);
            updateWatchCount(list);
          }
        });
      };
      item.appendChild(nameSpan);
      item.appendChild(removeBtn);
      watchPosterListEl.appendChild(item);
    });
    updateWatchCount(watchedPosters);
  }

  function updateBookmarkCount(bookmarks) {
    var count = Object.keys(bookmarks).length;
    bookmarkCountSpan.textContent = count > 0 ? '(' + count + ')' : '';
  }

  function renderBookmarks(bookmarks) {
    bookmarkListEl.innerHTML = '';
    var entries = Object.keys(bookmarks).sort(function(a, b) {
      return (bookmarks[b].date || 0) - (bookmarks[a].date || 0);
    });
    if (entries.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'bookmark-empty';
      empty.textContent = 'No bookmarks yet. Click the star next to a topic to bookmark it.';
      bookmarkListEl.appendChild(empty);
    }
    entries.forEach(function(topicId) {
      var bm = bookmarks[topicId];
      var item = document.createElement('div');
      item.className = 'bookmark-item';
      var titleLink = document.createElement('a');
      titleLink.className = 'bookmark-title';
      titleLink.href = '#';
      titleLink.textContent = bm.title || 'Untitled';
      titleLink.onclick = function(e) {
        e.preventDefault();
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          if (tabs[0]) {
            chrome.tabs.update(tabs[0].id, { url: bm.url });
          }
        });
      };
      var removeBtn = document.createElement('button');
      removeBtn.className = 'bookmark-remove';
      removeBtn.textContent = '\u00d7';
      removeBtn.dataset.tooltip = 'Remove bookmark';
      removeBtn.setAttribute('aria-label', 'Remove bookmark');
      removeBtn.onclick = function() {
        chrome.storage.sync.get(['bookmarkedTopics'], function(result) {
          var bms = result.bookmarkedTopics || {};
          delete bms[topicId];
          chrome.storage.sync.set({ bookmarkedTopics: bms });
        });
      };
      var info = document.createElement('div');
      info.className = 'bookmark-info';
      info.appendChild(titleLink);
      item.appendChild(info);
      item.appendChild(removeBtn);
      bookmarkListEl.appendChild(item);
    });
    updateBookmarkCount(bookmarks);
  }

  function formatTime(seconds) {
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      var hourText = hours === 1 ? '1 hour' : hours + ' hours';
      if (minutes > 0) {
        var minText = minutes === 1 ? '1 minute' : minutes + ' minutes';
        return hourText + ' ' + minText;
      }
      return hourText;
    }
    return minutes === 1 ? '1 minute' : minutes + ' minutes';
  }

  function formatAvgTime(seconds, days) {
    var avgSeconds = days > 0 ? seconds / days : 0;
    var avgMinutes = avgSeconds / 60;
    if (avgMinutes >= 60) {
      return (avgMinutes / 60).toFixed(1) + ' hours/day';
    }
    return Math.round(avgMinutes) + ' minutes/day';
  }

  function getTodayDateString() {
    var d = new Date();
    var year = d.getFullYear();
    var month = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function getLast30Days() {
    var days = [];
    for (var i = 29; i >= 0; i--) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      var year = d.getFullYear();
      var month = String(d.getMonth() + 1).padStart(2, '0');
      var day = String(d.getDate()).padStart(2, '0');
      days.push(year + '-' + month + '-' + day);
    }
    return days;
  }

  function renderSparkline(dailySeconds) {
    var days = getLast30Days();
    var values = days.map(function(day) {
      return (dailySeconds && dailySeconds[day]) ? dailySeconds[day] / 60 : 0; // convert to minutes
    });
    var maxVal = Math.max.apply(null, values);
    var hasData = maxVal > 0;
    if (maxVal === 0) maxVal = 1; // prevent division by zero

    var svgWidth = 200;
    var svgHeight = 40;
    var barWidth = svgWidth / 30 - 1;
    var gap = 1;

    var bars = '';
    for (var i = 0; i < 30; i++) {
      var x = i * (barWidth + gap);
      if (hasData) {
        var barHeight = (values[i] / maxVal) * (svgHeight - 4);
        if (barHeight < 1 && values[i] > 0) barHeight = 1; // minimum visible height
        var y = svgHeight - barHeight - 2;
        bars += '<rect class="sparkline-bar" x="' + x + '" y="' + y + '" width="' + barWidth + '" height="' + barHeight + '"><title>' + days[i] + ': ' + Math.round(values[i]) + ' min</title></rect>';
      } else {
        // Show placeholder bars when no data
        var y = svgHeight - 4;
        bars += '<rect class="sparkline-bar sparkline-empty" x="' + x + '" y="' + y + '" width="' + barWidth + '" height="2"><title>' + days[i] + ': no data</title></rect>';
      }
    }

    var baseline = '<line class="sparkline-baseline" x1="0" y1="' + (svgHeight - 2) + '" x2="' + svgWidth + '" y2="' + (svgHeight - 2) + '" />';
    sparklineEl.innerHTML = '<svg viewBox="0 0 ' + svgWidth + ' ' + svgHeight + '" preserveAspectRatio="none">' + baseline + bars + '</svg>';
  }

  function updateTimeDisplay(tracking) {
    var today = getTodayDateString();
    if (!tracking) {
      timeTodayEl.textContent = '0 minutes today';
      timeTotalEl.textContent = '0 minutes all-time';
      timeStatsEl.textContent = '0 days tracked · 0 minutes/day';
      renderSparkline({});
      return;
    }
    var dailySeconds = tracking.dailySeconds || {};
    var todaySeconds = dailySeconds[today] || 0;

    // Count days with actual activity
    var daysWithActivity = Object.keys(dailySeconds).length;

    timeTodayEl.textContent = formatTime(todaySeconds) + ' today';
    timeTotalEl.textContent = formatTime(tracking.totalSeconds) + ' all-time';
    timeStatsEl.textContent = daysWithActivity + ' days tracked · ' + formatAvgTime(tracking.totalSeconds, Math.max(1, daysWithActivity));
    renderSparkline(dailySeconds);
  }

  // Statistics elements
  var statsStreakEl = document.getElementById('stats-streak');
  var statsTopicsTotalEl = document.getElementById('stats-topics-total');
  var statsTopicsChartEl = document.getElementById('stats-topics-chart');
  var statsForumListEl = document.getElementById('stats-forum-list');
  var resetStatsButton = document.getElementById('reset-stats');

  function computeStreak(dailySeconds) {
    if (!dailySeconds) return 0;
    var streak = 0;
    var d = new Date();
    // Check today first
    var today = getTodayDateString();
    if (!dailySeconds[today] || dailySeconds[today] <= 0) {
      // No activity today — check if yesterday starts a streak
      d.setDate(d.getDate() - 1);
    }
    while (true) {
      var year = d.getFullYear();
      var month = String(d.getMonth() + 1).padStart(2, '0');
      var day = String(d.getDate()).padStart(2, '0');
      var key = year + '-' + month + '-' + day;
      if (dailySeconds[key] && dailySeconds[key] > 0) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  function renderTopicsBarChart(dailyTopicsRead) {
    var days = getLast30Days();
    var values = days.map(function(day) {
      return (dailyTopicsRead && dailyTopicsRead[day]) ? dailyTopicsRead[day] : 0;
    });
    var maxVal = Math.max.apply(null, values);
    var hasData = maxVal > 0;
    if (maxVal === 0) maxVal = 1;

    var svgWidth = 200;
    var svgHeight = 40;
    var barWidth = svgWidth / 30 - 1;
    var gap = 1;

    var bars = '';
    for (var i = 0; i < 30; i++) {
      var x = i * (barWidth + gap);
      if (hasData) {
        var barHeight = (values[i] / maxVal) * (svgHeight - 4);
        if (barHeight < 1 && values[i] > 0) barHeight = 1;
        var y = svgHeight - barHeight - 2;
        bars += '<rect class="stats-bar" x="' + x + '" y="' + y + '" width="' + barWidth + '" height="' + barHeight + '"><title>' + days[i] + ': ' + values[i] + ' topics</title></rect>';
      } else {
        var y = svgHeight - 4;
        bars += '<rect class="stats-bar stats-bar-empty" x="' + x + '" y="' + y + '" width="' + barWidth + '" height="2"><title>' + days[i] + ': no data</title></rect>';
      }
    }

    var baseline = '<line class="sparkline-baseline" x1="0" y1="' + (svgHeight - 2) + '" x2="' + svgWidth + '" y2="' + (svgHeight - 2) + '" />';
    statsTopicsChartEl.innerHTML = '<svg viewBox="0 0 ' + svgWidth + ' ' + svgHeight + '" preserveAspectRatio="none">' + baseline + bars + '</svg>';
  }

  function renderForumList(forumVisits) {
    statsForumListEl.innerHTML = '';
    if (!forumVisits || Object.keys(forumVisits).length === 0) {
      statsForumListEl.innerHTML = '<div class="stats-forum-empty">No forum visits yet</div>';
      return;
    }
    var sorted = Object.keys(forumVisits).sort(function(a, b) {
      return forumVisits[b].count - forumVisits[a].count;
    }).slice(0, 5);

    sorted.forEach(function(id, index) {
      var entry = forumVisits[id];
      var row = document.createElement('div');
      row.className = 'stats-forum-row';
      var rank = document.createElement('span');
      rank.className = 'stats-forum-rank';
      rank.textContent = (index + 1) + '.';
      var name = document.createElement('span');
      name.className = 'stats-forum-name';
      name.textContent = entry.name;
      name.title = entry.name;
      var count = document.createElement('span');
      count.className = 'stats-forum-count';
      count.textContent = entry.count;
      row.appendChild(rank);
      row.appendChild(name);
      row.appendChild(count);
      statsForumListEl.appendChild(row);
    });
  }

  function updateStatsDisplay() {
    // Load time tracking for streak (sync) and forum stats (local)
    chrome.storage.sync.get(['timeTracking'], function(syncResult) {
      var tracking = syncResult.timeTracking || {};
      var streak = computeStreak(tracking.dailySeconds);
      statsStreakEl.textContent = streak;

      chrome.storage.local.get(['forumStats'], function(localResult) {
        var stats = localResult.forumStats || { forumVisits: {}, dailyTopicsRead: {} };
        var dailyTopicsRead = stats.dailyTopicsRead || {};

        // Sum topics over 30 days
        var days = getLast30Days();
        var total = 0;
        days.forEach(function(day) {
          total += dailyTopicsRead[day] || 0;
        });
        statsTopicsTotalEl.textContent = total;

        renderTopicsBarChart(dailyTopicsRead);
        renderForumList(stats.forumVisits || {});
      });
    });
  }

  function applyFontSizeDisplay(size) {
    fontSizeDisplay.textContent = size + '%';
    fontSizeInput.value = size;
  }

  // Load saved settings and apply to UI
  chrome.storage.sync.get(['enableStriping', 'stripeColor', 'hideRead', 'showNewReplies', 'readTopics', 'highlightHot', 'hotThreshold', 'hotColor', 'fontSize', 'hideOld', 'maxAgeDays', 'pointerCursor', 'enableWatchPosters', 'watchedPosters', 'watchColor', 'hiddenSubforums', 'bookmarkedTopics'], function(result) {
    var color = result.stripeColor || DEFAULT_COLOR;
    var hideRead = result.hideRead || false;
    var readTopics = result.readTopics || {};
    if (Array.isArray(readTopics)) readTopics = {};
    var highlightHot = result.highlightHot || false;
    var hotThreshold = result.hotThreshold || DEFAULT_HOT_THRESHOLD;
    var hotColor = result.hotColor || DEFAULT_HOT_COLOR;
    var fontSize = result.fontSize || DEFAULT_FONT_SIZE;
    var hideOld = result.hideOld || false;
    var maxAgeDays = result.maxAgeDays || 30;
    var pointerCursor = result.pointerCursor || false;

    var enableStriping = result.enableStriping !== false;
    enableStripingCheckbox.checked = enableStriping;
    colorInput.value = color;
    hideReadCheckbox.checked = hideRead;
    showNewRepliesCheckbox.checked = result.showNewReplies || false;
    highlightHotCheckbox.checked = highlightHot;
    hotThresholdInput.value = hotThreshold;
    hotColorInput.value = hotColor;
    hideOldCheckbox.checked = hideOld;
    maxAgeDaysInput.value = maxAgeDays;
    pointerCursorCheckbox.checked = pointerCursor;
    applyFontSizeDisplay(fontSize);
    updateReadCount(readTopics);

    var enableWatchPosters = result.enableWatchPosters || false;
    enableWatchPostersCheckbox.checked = enableWatchPosters;
    var watchedPosters = result.watchedPosters || [];
    var watchColor = result.watchColor || DEFAULT_WATCH_COLOR;
    watchColorInput.value = watchColor;
    renderWatchedPosters(watchedPosters);
    renderSubforumCheckboxes(result.hiddenSubforums || []);
    renderBookmarks(result.bookmarkedTopics || {});
  });

  // Load time tracking data
  chrome.storage.sync.get(['timeTracking'], function(result) {
    updateTimeDisplay(result.timeTracking);
  });

  // Load statistics
  updateStatsDisplay();

  // Listen for storage changes (e.g., read count updates from content script)
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'local') {
      if (changes.forumStats) {
        updateStatsDisplay();
      }
      return;
    }
    if (namespace !== 'sync') return;
    if (changes.readTopics) {
      var readTopics = changes.readTopics.newValue || {};
      if (Array.isArray(readTopics)) readTopics = {};
      updateReadCount(readTopics);
    }
    if (changes.theme) {
      var theme = changes.theme.newValue || 'system';
      applyTheme(theme);
      var radio = document.getElementById('theme-' + theme);
      if (radio) radio.checked = true;
    }
    if (changes.timeTracking) {
      updateTimeDisplay(changes.timeTracking.newValue);
      updateStatsDisplay(); // streak depends on time tracking
    }
    if (changes.watchedPosters) {
      var watchedPosters = changes.watchedPosters.newValue || [];
      renderWatchedPosters(watchedPosters);
    }
    if (changes.bookmarkedTopics) {
      renderBookmarks(changes.bookmarkedTopics.newValue || {});
    }
    if (changes.hiddenSubforums) {
      renderSubforumCheckboxes(changes.hiddenSubforums.newValue || []);
    }
    if (changes.collapsedSections) {
      var collapsed = changes.collapsedSections.newValue || [];
      document.querySelectorAll('.section-group[data-section]').forEach(function(group) {
        if (collapsed.indexOf(group.dataset.section) !== -1) {
          group.classList.add('collapsed');
        } else {
          group.classList.remove('collapsed');
        }
      });
    }
  });

  // Event handlers
  themeRadios.forEach(function(radio) {
    radio.onchange = function() {
      chrome.storage.sync.set({ theme: this.value });
      applyTheme(this.value);
    };
  });

  enableStripingCheckbox.onchange = function() {
    chrome.storage.sync.set({ enableStriping: this.checked });
  };

  colorInput.oninput = function() {
    debouncedSyncSet({ stripeColor: this.value });
  };

  hideReadCheckbox.onchange = function() {
    chrome.storage.sync.set({ hideRead: this.checked });
  };

  showNewRepliesCheckbox.onchange = function() {
    chrome.storage.sync.set({ showNewReplies: this.checked });
  };

  highlightHotCheckbox.onchange = function() {
    chrome.storage.sync.set({ highlightHot: this.checked });
  };

  hotThresholdInput.oninput = function() {
    debouncedSyncSet({ hotThreshold: parseInt(this.value, 10) });
  };

  hotColorInput.oninput = function() {
    debouncedSyncSet({ hotColor: this.value });
  };

  hideOldCheckbox.onchange = function() {
    chrome.storage.sync.set({ hideOld: this.checked });
  };

  maxAgeDaysInput.oninput = function() {
    debouncedSyncSet({ maxAgeDays: parseInt(this.value, 10) });
  };

  pointerCursorCheckbox.onchange = function() {
    chrome.storage.sync.set({ pointerCursor: this.checked });
  };

  enableWatchPostersCheckbox.onchange = function() {
    chrome.storage.sync.set({ enableWatchPosters: this.checked });
  };

  function addWatchedPoster() {
    var name = watchPosterInput.value.trim().toLowerCase();
    if (!name) return;
    chrome.storage.sync.get(['watchedPosters'], function(result) {
      var list = result.watchedPosters || [];
      if (list.indexOf(name) === -1) {
        list.push(name);
        chrome.storage.sync.set({ watchedPosters: list });
        renderWatchedPosters(list);
      }
    });
    watchPosterInput.value = '';
  }

  watchPosterAddButton.onclick = addWatchedPoster;

  watchPosterInput.onkeydown = function(e) {
    if (e.key === 'Enter') addWatchedPoster();
  };

  watchColorInput.oninput = function() {
    debouncedSyncSet({ watchColor: this.value });
  };

  fontSizeInput.oninput = function() {
    var size = parseInt(this.value, 10);
    applyFontSizeDisplay(size);
    debouncedSyncSet({ fontSize: size });
  };

  fontDecreaseButton.onclick = function() {
    var newSize = Math.max(50, parseInt(fontSizeInput.value, 10) - 10);
    applyFontSizeDisplay(newSize);
    chrome.storage.sync.set({ fontSize: newSize });
  };

  fontIncreaseButton.onclick = function() {
    var newSize = Math.min(200, parseInt(fontSizeInput.value, 10) + 10);
    applyFontSizeDisplay(newSize);
    chrome.storage.sync.set({ fontSize: newSize });
  };

  fontResetButton.onclick = function() {
    applyFontSizeDisplay(DEFAULT_FONT_SIZE);
    chrome.storage.sync.set({ fontSize: DEFAULT_FONT_SIZE });
  };

  markAllReadButton.onclick = function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'markAllRead' });
      }
    });
  };

  clearReadButton.onclick = function() {
    if (confirm('This will reset all topics to unread. Topics you previously viewed will no longer be hidden. Continue?')) {
      chrome.storage.sync.set({ readTopics: {} });
      updateReadCount({});
    }
  };

  resetTimeButton.onclick = function() {
    if (confirm('This will reset your tracked time to zero. Continue?')) {
      var now = Date.now();
      var newTracking = {
        totalSeconds: 0,
        resetTimestamp: now,
        lastUpdateTimestamp: now,
        dailySeconds: {}
      };
      chrome.storage.sync.set({ timeTracking: newTracking });
      updateTimeDisplay(newTracking);
    }
  };

  resetStatsButton.onclick = function() {
    if (confirm('This will reset forum visit and topic read statistics. Continue?')) {
      chrome.storage.local.set({ forumStats: { forumVisits: {}, dailyTopicsRead: {} } });
      updateStatsDisplay();
    }
  };

  // Export / Import settings
  var exportButton = document.getElementById('export-settings');
  var importButton = document.getElementById('import-settings');
  var importFileInput = document.getElementById('import-file');

  exportButton.onclick = function() {
    chrome.storage.sync.get(null, function(data) {
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'better-bogleheads-settings.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  importButton.onclick = function() {
    importFileInput.click();
  };

  importFileInput.onchange = function() {
    var file = this.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var data = JSON.parse(e.target.result);
        chrome.storage.sync.set(data, function() {
          location.reload();
        });
      } catch (err) {
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    this.value = '';
  };
})();
