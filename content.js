(function() {
  var DEFAULT_COLOR = '#d0d0d0';
  var DEFAULT_HOT_COLOR = '#ffeb3b';
  var DEFAULT_HOT_THRESHOLD = 50;
  var DEFAULT_FONT_SIZE = 100;
  var DEFAULT_MAX_AGE_DAYS = 0;

  function init() {
    var table = document.getElementById('posts_table');
    
    if (!table) return;
    
    var existingPicker = document.getElementById('zebra-picker');
    if (existingPicker) existingPicker.remove();

    var picker = document.createElement('div');
    picker.id = 'zebra-picker';
    picker.innerHTML = 
      '<div id="zebra-header" style="background: #2c5aa0; color: white; padding: 6px 8px; margin: -8px -8px 8px -8px; border-radius: 4px 4px 0 0; font-weight: bold; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">' +
        '<span>Bogleheads Chrome Extension</span>' +
        '<span id="collapse-icon">▲</span>' +
      '</div>' +
      '<div id="zebra-content">' +
        '<div style="margin-bottom: 6px;">' +
          '<label>Stripe color: <input type="color" id="stripe-color" value="' + DEFAULT_COLOR + '"></label>' +
        '</div>' +
        '<div style="margin-bottom: 6px;">' +
          '<label><input type="checkbox" id="hide-read"> Hide read threads</label>' +
        '</div>' +
        '<div style="margin-bottom: 6px;">' +
          '<label><input type="checkbox" id="highlight-hot"> Highlight hot topics</label>' +
        '</div>' +
        '<div style="margin-bottom: 6px; margin-left: 20px;">' +
          '<label>Replies threshold: <input type="number" id="hot-threshold" min="1" max="1000" style="width: 60px;" value="' + DEFAULT_HOT_THRESHOLD + '"></label>' +
        '</div>' +
        '<div style="margin-bottom: 6px; margin-left: 20px;">' +
          '<label>Hot color: <input type="color" id="hot-color" value="' + DEFAULT_HOT_COLOR + '"></label>' +
        '</div>' +
        '<div style="margin-bottom: 6px;">' +
          '<label><input type="checkbox" id="hide-old"> Hide old threads</label>' +
        '</div>' +
        '<div style="margin-bottom: 6px; margin-left: 20px;">' +
          '<label>Max age (days): <input type="number" id="max-age-days" min="1" max="365" style="width: 60px;" value="30"></label>' +
        '</div>' +
        '<div style="margin-bottom: 6px;">' +
          '<label>Font size: <span id="font-size-display">' + DEFAULT_FONT_SIZE + '%</span></label>' +
          '<div style="margin-top: 4px;">' +
            '<button id="font-decrease" style="width: 30px; cursor: pointer;">-</button>' +
            '<input type="range" id="font-size" min="50" max="200" value="' + DEFAULT_FONT_SIZE + '" style="width: 100px; vertical-align: middle;">' +
            '<button id="font-increase" style="width: 30px; cursor: pointer;">+</button>' +
            '<button id="font-reset" style="margin-left: 5px; font-size: 11px; cursor: pointer;">Reset</button>' +
          '</div>' +
        '</div>' +
        '<div>' +
          '<button id="clear-read" style="font-size: 11px; cursor: pointer;">Clear read history</button>' +
          '<span id="read-count" style="font-size: 11px; margin-left: 5px;"></span>' +
        '</div>' +
      '</div>';
    document.body.appendChild(picker);

    var zebraHeader = document.getElementById('zebra-header');
    var zebraContent = document.getElementById('zebra-content');
    var collapseIcon = document.getElementById('collapse-icon');
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

    function applyCollapsedState(collapsed) {
      if (collapsed) {
        zebraContent.style.display = 'none';
        collapseIcon.textContent = '▼';
        picker.style.padding = '0';
        zebraHeader.style.margin = '0';
        zebraHeader.style.borderRadius = '4px';
      } else {
        zebraContent.style.display = 'block';
        collapseIcon.textContent = '▲';
        picker.style.padding = '8px';
        zebraHeader.style.margin = '-8px -8px 8px -8px';
        zebraHeader.style.borderRadius = '4px 4px 0 0';
      }
    }

    zebraHeader.onclick = function() {
      var isCollapsed = zebraContent.style.display === 'none';
      var newCollapsed = !isCollapsed;
      applyCollapsedState(newCollapsed);
      chrome.storage.sync.set({ panelCollapsed: newCollapsed });
    };

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
      table.style.setProperty('font-size', size + '%', 'important');
      fontSizeDisplay.textContent = size + '%';
      fontSizeInput.value = size;
    }

    function applyStripes(color) {
      var rows = getDataRows();
      var highlightHot = highlightHotCheckbox.checked;
      var hotThreshold = parseInt(hotThresholdInput.value, 10) || DEFAULT_HOT_THRESHOLD;
      var hotColor = hotColorInput.value;
      var count = 0;
      
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        if (row.style.display === 'none') continue;
        
        var replyCount = getReplyCount(row);
        var bgColor;
        
        if (highlightHot && replyCount >= hotThreshold) {
          bgColor = hotColor;
        } else {
          bgColor = (count % 2 === 0) ? color : '#ffffff';
        }
        
        row.style.setProperty('background-color', bgColor, 'important');
        count++;
      }
    }

    function applyFilters(readThreads) {
      var hideRead = hideReadCheckbox.checked;
      var hideOld = hideOldCheckbox.checked;
      var maxAgeDays = parseInt(maxAgeDaysInput.value, 10) || 30;
      
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
      applyStripes(colorInput.value);
    }

    function updateReadCount(readThreads) {
      var count = Object.keys(readThreads).length;
      readCountSpan.textContent = '(' + count + ' read)';
    }

    function trackClicks(readThreads) {
      var rows = getDataRows();
      rows.forEach(function(row) {
        var links = row.querySelectorAll('td a[href*="viewtopic.php"]');
        links.forEach(function(link) {
          link.addEventListener('click', function() {
            var threadId = getThreadId(row);
            var lastPostId = getLastPostId(row);
            if (threadId && lastPostId) {
              readThreads[threadId] = lastPostId;
              chrome.storage.sync.set({ readThreads: readThreads });
              updateReadCount(readThreads);
            }
          });
        });
      });
    }

    chrome.storage.sync.get(['stripeColor', 'hideRead', 'readThreads', 'highlightHot', 'hotThreshold', 'hotColor', 'fontSize', 'hideOld', 'maxAgeDays', 'panelCollapsed'], function(result) {
      var color = result.stripeColor || DEFAULT_COLOR;
      var hideRead = result.hideRead || false;
      var readThreads = result.readThreads || {};
      if (Array.isArray(readThreads)) {
        readThreads = {};
      }
      var highlightHot = result.highlightHot || false;
      var hotThreshold = result.hotThreshold || DEFAULT_HOT_THRESHOLD;
      var hotColor = result.hotColor || DEFAULT_HOT_COLOR;
      var fontSize = result.fontSize || DEFAULT_FONT_SIZE;
      var hideOld = result.hideOld || false;
      var maxAgeDays = result.maxAgeDays || 30;
      var panelCollapsed = result.panelCollapsed || false;
      
      colorInput.value = color;
      hideReadCheckbox.checked = hideRead;
      highlightHotCheckbox.checked = highlightHot;
      hotThresholdInput.value = hotThreshold;
      hotColorInput.value = hotColor;
      hideOldCheckbox.checked = hideOld;
      maxAgeDaysInput.value = maxAgeDays;
      applyFontSize(fontSize);
      applyCollapsedState(panelCollapsed);
      
      updateReadCount(readThreads);
      applyFilters(readThreads);
      trackClicks(readThreads);
    });

    colorInput.oninput = function() {
      applyStripes(this.value);
    };

    colorInput.onchange = function() {
      chrome.storage.sync.set({ stripeColor: this.value });
    };

    hideReadCheckbox.onchange = function() {
      chrome.storage.sync.set({ hideRead: this.checked });
      chrome.storage.sync.get(['readThreads'], function(result) {
        var readThreads = result.readThreads || {};
        if (Array.isArray(readThreads)) readThreads = {};
        applyFilters(readThreads);
      });
    };

    highlightHotCheckbox.onchange = function() {
      chrome.storage.sync.set({ highlightHot: this.checked });
      applyStripes(colorInput.value);
    };

    hotThresholdInput.onchange = function() {
      chrome.storage.sync.set({ hotThreshold: parseInt(this.value, 10) });
      applyStripes(colorInput.value);
    };

    hotColorInput.oninput = function() {
      applyStripes(colorInput.value);
    };

    hotColorInput.onchange = function() {
      chrome.storage.sync.set({ hotColor: this.value });
    };

    hideOldCheckbox.onchange = function() {
      chrome.storage.sync.set({ hideOld: this.checked });
      chrome.storage.sync.get(['readThreads'], function(result) {
        var readThreads = result.readThreads || {};
        if (Array.isArray(readThreads)) readThreads = {};
        applyFilters(readThreads);
      });
    };

    maxAgeDaysInput.onchange = function() {
      chrome.storage.sync.set({ maxAgeDays: parseInt(this.value, 10) });
      chrome.storage.sync.get(['readThreads'], function(result) {
        var readThreads = result.readThreads || {};
        if (Array.isArray(readThreads)) readThreads = {};
        applyFilters(readThreads);
      });
    };

    fontSizeInput.oninput = function() {
      applyFontSize(parseInt(this.value, 10));
    };

    fontSizeInput.onchange = function() {
      chrome.storage.sync.set({ fontSize: parseInt(this.value, 10) });
    };

    fontDecreaseButton.onclick = function() {
      var newSize = Math.max(50, parseInt(fontSizeInput.value, 10) - 10);
      applyFontSize(newSize);
      chrome.storage.sync.set({ fontSize: newSize });
    };

    fontIncreaseButton.onclick = function() {
      var newSize = Math.min(200, parseInt(fontSizeInput.value, 10) + 10);
      applyFontSize(newSize);
      chrome.storage.sync.set({ fontSize: newSize });
    };

    fontResetButton.onclick = function() {
      applyFontSize(DEFAULT_FONT_SIZE);
      chrome.storage.sync.set({ fontSize: DEFAULT_FONT_SIZE });
    };

    clearReadButton.onclick = function() {
      if (confirm('This will reset all threads to unread. Threads you previously viewed will no longer be hidden. Continue?')) {
        chrome.storage.sync.set({ readThreads: {} });
        updateReadCount({});
        applyFilters({});
      }
    };
  }

  init();

  window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
      init();
    }
  });
})();
