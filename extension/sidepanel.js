(function() {
  var DEFAULT_COLOR = '#d0d0d0';
  var DEFAULT_HOT_COLOR = '#ffeb3b';
  var DEFAULT_HOT_THRESHOLD = 50;
  var DEFAULT_FONT_SIZE = 100;

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('bh-dark');
    } else {
      document.body.classList.remove('bh-dark');
    }
  }

  // Load and apply theme on init
  chrome.storage.sync.get(['theme'], function(result) {
    applyTheme(result.theme || 'light');
  });

  var colorInput = document.getElementById('stripe-color');
  var hideReadCheckbox = document.getElementById('hide-read');
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

  function updateReadCount(readThreads) {
    var count = Object.keys(readThreads).length;
    readCountSpan.textContent = '(' + count + ' read)';
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

    sparklineEl.innerHTML = '<svg viewBox="0 0 ' + svgWidth + ' ' + svgHeight + '" preserveAspectRatio="none">' + bars + '</svg>';
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

  function applyFontSizeDisplay(size) {
    fontSizeDisplay.textContent = size + '%';
    fontSizeInput.value = size;
  }

  // Load saved settings and apply to UI
  chrome.storage.sync.get(['stripeColor', 'hideRead', 'readThreads', 'highlightHot', 'hotThreshold', 'hotColor', 'fontSize', 'hideOld', 'maxAgeDays', 'pointerCursor'], function(result) {
    var color = result.stripeColor || DEFAULT_COLOR;
    var hideRead = result.hideRead || false;
    var readThreads = result.readThreads || {};
    if (Array.isArray(readThreads)) readThreads = {};
    var highlightHot = result.highlightHot || false;
    var hotThreshold = result.hotThreshold || DEFAULT_HOT_THRESHOLD;
    var hotColor = result.hotColor || DEFAULT_HOT_COLOR;
    var fontSize = result.fontSize || DEFAULT_FONT_SIZE;
    var hideOld = result.hideOld || false;
    var maxAgeDays = result.maxAgeDays || 30;
    var pointerCursor = result.pointerCursor || false;

    colorInput.value = color;
    hideReadCheckbox.checked = hideRead;
    highlightHotCheckbox.checked = highlightHot;
    hotThresholdInput.value = hotThreshold;
    hotColorInput.value = hotColor;
    hideOldCheckbox.checked = hideOld;
    maxAgeDaysInput.value = maxAgeDays;
    pointerCursorCheckbox.checked = pointerCursor;
    applyFontSizeDisplay(fontSize);
    updateReadCount(readThreads);
  });

  // Load time tracking data
  chrome.storage.sync.get(['timeTracking'], function(result) {
    updateTimeDisplay(result.timeTracking);
  });

  // Listen for storage changes (e.g., read count updates from content script)
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace !== 'sync') return;
    if (changes.readThreads) {
      var readThreads = changes.readThreads.newValue || {};
      if (Array.isArray(readThreads)) readThreads = {};
      updateReadCount(readThreads);
    }
    if (changes.theme) {
      applyTheme(changes.theme.newValue || 'light');
    }
    if (changes.timeTracking) {
      updateTimeDisplay(changes.timeTracking.newValue);
    }
  });

  // Event handlers
  colorInput.oninput = function() {
    chrome.storage.sync.set({ stripeColor: this.value });
  };

  hideReadCheckbox.onchange = function() {
    chrome.storage.sync.set({ hideRead: this.checked });
  };

  highlightHotCheckbox.onchange = function() {
    chrome.storage.sync.set({ highlightHot: this.checked });
  };

  hotThresholdInput.oninput = function() {
    chrome.storage.sync.set({ hotThreshold: parseInt(this.value, 10) });
  };

  hotColorInput.oninput = function() {
    chrome.storage.sync.set({ hotColor: this.value });
  };

  hideOldCheckbox.onchange = function() {
    chrome.storage.sync.set({ hideOld: this.checked });
  };

  maxAgeDaysInput.oninput = function() {
    chrome.storage.sync.set({ maxAgeDays: parseInt(this.value, 10) });
  };

  pointerCursorCheckbox.onchange = function() {
    chrome.storage.sync.set({ pointerCursor: this.checked });
  };

  fontSizeInput.oninput = function() {
    var size = parseInt(this.value, 10);
    applyFontSizeDisplay(size);
    chrome.storage.sync.set({ fontSize: size });
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

  clearReadButton.onclick = function() {
    if (confirm('This will reset all threads to unread. Threads you previously viewed will no longer be hidden. Continue?')) {
      chrome.storage.sync.set({ readThreads: {} });
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
})();
