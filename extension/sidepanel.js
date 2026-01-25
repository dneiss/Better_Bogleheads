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

  function updateReadCount(readThreads) {
    var count = Object.keys(readThreads).length;
    readCountSpan.textContent = '(' + count + ' read)';
  }

  function applyFontSizeDisplay(size) {
    fontSizeDisplay.textContent = size + '%';
    fontSizeInput.value = size;
  }

  // Load saved settings and apply to UI
  chrome.storage.sync.get(['stripeColor', 'hideRead', 'readThreads', 'highlightHot', 'hotThreshold', 'hotColor', 'fontSize', 'hideOld', 'maxAgeDays'], function(result) {
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

    colorInput.value = color;
    hideReadCheckbox.checked = hideRead;
    highlightHotCheckbox.checked = highlightHot;
    hotThresholdInput.value = hotThreshold;
    hotColorInput.value = hotColor;
    hideOldCheckbox.checked = hideOld;
    maxAgeDaysInput.value = maxAgeDays;
    applyFontSizeDisplay(fontSize);
    updateReadCount(readThreads);
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
})();
