// Enable side panel to open on bogleheads.org
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Omnibox: Navigate to URL in active tab
function navigateTo(url) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs[0]) {
      chrome.tabs.update(tabs[0].id, { url: url });
    }
  });
}

// Omnibox: Command definitions
var omniboxCommands = [
  { keyword: 'new', description: 'Go to active topics' },
  { keyword: 'hot', description: 'Enable hot topic highlighting' },
  { keyword: 'hot off', description: 'Disable hot topic highlighting' },
  { keyword: 'reset', description: 'Clear read history' },
  { keyword: 'zebra', description: 'Enable zebra striping' },
  { keyword: 'zebra off', description: 'Disable zebra striping' },
  { keyword: 'font inc', description: 'Increase font size' },
  { keyword: 'font dec', description: 'Decrease font size' }
];

// Omnibox: Show suggestions as user types
chrome.omnibox.onInputChanged.addListener(function(text, suggest) {
  var input = text.trim().toLowerCase();
  var suggestions = [];

  // Match commands
  omniboxCommands.forEach(function(cmd) {
    if (cmd.keyword.startsWith(input) || input === '') {
      suggestions.push({
        content: cmd.keyword,
        description: cmd.keyword + ' - ' + cmd.description
      });
    }
  });

  // Thread ID pattern
  if (input.startsWith('#') || /^\d/.test(input)) {
    var id = input.replace('#', '');
    suggestions.push({
      content: '#' + id,
      description: '#' + id + ' - Go to thread ' + id
    });
  }

  // User search pattern
  if (input.startsWith('user:')) {
    var user = input.substring(5);
    suggestions.push({
      content: 'user:' + user,
      description: 'user:' + user + ' - Search posts by ' + user
    });
  }

  // Quoted search
  if (input.startsWith('"')) {
    var term = input.replace(/"/g, '');
    suggestions.push({
      content: '"' + term + '"',
      description: '"' + term + '" - Search forum for ' + term
    });
  }

  suggest(suggestions);
});

// Omnibox: Execute command on Enter
chrome.omnibox.onInputEntered.addListener(function(text) {
  var input = text.trim();
  var inputLower = input.toLowerCase();

  // new → active topics
  if (inputLower === 'new') {
    navigateTo('https://www.bogleheads.org/forum/search.php?search_id=active_topics');
    return;
  }

  // hot → toggle hot topic highlighting
  if (inputLower === 'hot') {
    chrome.storage.sync.set({ highlightHot: true });
    return;
  }
  if (inputLower === 'hot off') {
    chrome.storage.sync.set({ highlightHot: false });
    return;
  }

  // #ID → thread
  if (inputLower.startsWith('#') || /^\d+$/.test(input)) {
    var id = input.replace('#', '');
    navigateTo('https://www.bogleheads.org/forum/viewtopic.php?t=' + id);
    return;
  }

  // user:X → search by author
  if (inputLower.startsWith('user:')) {
    var user = input.substring(5);
    navigateTo('https://www.bogleheads.org/forum/search.php?author=' + encodeURIComponent(user) + '&sr=posts');
    return;
  }

  // "search term" → forum search
  if (input.startsWith('"') && input.endsWith('"')) {
    var term = input.slice(1, -1);
    navigateTo('https://www.bogleheads.org/forum/search.php?keywords=' + encodeURIComponent(term));
    return;
  }

  // reset → clear read history
  if (inputLower === 'reset') {
    chrome.storage.sync.set({ readThreads: {} });
    return;
  }

  // zebra on/off → toggle striping
  if (inputLower === 'zebra' || inputLower === 'zebra on') {
    chrome.storage.sync.set({ stripeColor: '#d0d0d0' });
    return;
  }
  if (inputLower === 'zebra off') {
    chrome.storage.sync.set({ stripeColor: '#ffffff' });
    return;
  }

  // font inc/dec → adjust font size
  if (inputLower === 'font inc') {
    chrome.storage.sync.get(['fontSize'], function(result) {
      var current = result.fontSize || 100;
      var newSize = Math.min(200, current + 10);
      chrome.storage.sync.set({ fontSize: newSize });
    });
    return;
  }
  if (inputLower === 'font dec') {
    chrome.storage.sync.get(['fontSize'], function(result) {
      var current = result.fontSize || 100;
      var newSize = Math.max(50, current - 10);
      chrome.storage.sync.set({ fontSize: newSize });
    });
    return;
  }

  // Fallback: treat as search
  navigateTo('https://www.bogleheads.org/forum/search.php?keywords=' + encodeURIComponent(input));
});

// Returns badge color based on unread count thresholds
function getBadgeColor(count) {
  if (count <= 20) return '#22c55e';  // Green
  if (count <= 60) return '#eab308';  // Yellow
  return '#ff0000';                    // Red
}

// Listen for badge updates from content script
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.type === 'updateBadge') {
    if (message.unreadCount > 0) {
      chrome.action.setBadgeText({ text: String(message.unreadCount), tabId: sender.tab.id });
      chrome.action.setBadgeBackgroundColor({ color: getBadgeColor(message.unreadCount), tabId: sender.tab.id });
      chrome.action.setBadgeTextColor({ color: '#ffffff', tabId: sender.tab.id });
    } else {
      chrome.action.setBadgeText({ text: '', tabId: sender.tab.id });
    }
  }
});

