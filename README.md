# Better Bogleheads

A Chrome extension that supercharges the [Bogleheads.org](https://www.bogleheads.org) forum with visual improvements and filtering options.

## Features

- **Unread Badge** - Shows the count of unread topics on the extension icon. Badge color changes based on count: green (1-20), yellow (21-60), or red (61+)
- **Zebra Striping** - Alternating row colors for easier reading (customizable color)
- **Hide Read Topics** - Automatically tracks topics you've clicked and can hide them. Topics reappear when new replies are posted.
- **Highlight Hot Topics** - Highlight topics with many replies (customizable threshold and color)
- **Watch Posters** - Highlight topics where a watched poster is the author or last poster (add via side panel or right-click a profile link)
- **Hide Old Topics** - Filter out topics older than a specified number of days
- **Show Subforums** - Show or hide topics from specific subforums on the active topics page
- **Adjustable Font Size** - Increase or decrease the topic list font size (50% - 200%)
- **Mark as Read (Right-Click)** - Right-click any topic row to mark it as read without opening it
- **Keyboard Shortcuts** - Quick access from any Bogleheads page (see below)
- **Pointer Cursor** - Optional pointer cursor when hovering over topic rows
- **Dark Mode** - Full dark theme for Bogleheads forum pages and the side panel. Choose System (follows your OS setting), Light, or Dark. Switches automatically when your OS theme changes.
- **Time Tracking** - Tracks time spent on the site with today's time, all-time total, and a 30-day sparkline graph
- **Statistics** - Reading streak, topics read per day with bar chart, and top 5 most-visited forums
- **Mark All as Read** - One-click button to mark all visible topics on the current page as read
- **New Replies Indicator** - Red dot next to topics you've previously read that have new replies since your last visit (toggleable)
- **Topic Muting** - Right-click a topic and select "Mute this Topic" to hide it. Manage muted topics (up to 20) in the side panel. Toggle muting on/off — muted topics are saved even when the feature is disabled.
- **Topic Bookmarks** - Star any topic to save it to the Bookmarks section in the side panel for quick access, even after it leaves the active topics page
- **Sticky Header** - Page title, stats line, and column headers stay pinned at the top while scrolling through topics
- **Compact Mode** - Reduces row padding and line height to fit more topics on screen
- **Hide Left Sidebar** - Removes the left navigation sidebar to give more space to the topic list
- **Subforum Color Coding** - Colored left border on topic rows based on subforum, with matching color squares in the subforum list. Hover over the border or subforum letter to see the full subforum name.
- **Unread Count in Tab Title** - Tab title shows "Bogleheads (23 unread)" when there are unread topics
- **Collapsible Side Panel Sections** - Click any section header to collapse/expand it. Collapsed state syncs across devices.
- **Clickable Rows** - Click anywhere on a topic row to navigate to that topic, not just the link text
- **Export/Import Settings** - Download your settings as a JSON file or restore them from a previous export

All settings are saved and persist across sessions.

## Side Panel

The extension uses Chrome's side panel for all controls. The panel automatically opens when you visit Bogleheads.org and slides out from the right side of the browser. You can also click the extension icon to toggle it. Click the "Better Bogleheads" header at the top of the panel to navigate to Bogleheads.org. All settings in the panel apply immediately. Hover over any setting to see a tooltip explaining what it does.

## Omnibox Commands

Type `bh` in Chrome's address bar, press Tab, then use these shortcuts:

- `new` - Go to active topics
- `hot` / `hot off` - Toggle hot topic highlighting
- `zebra` / `zebra off` - Toggle zebra striping
- `font inc` / `font dec` - Adjust font size
- `reset` - Clear read history
- `#12345` - Go to topic by ID
- `user:alice` - Search posts by user
- `"search term"` - Search the forum

## Keyboard Shortcuts

Use these shortcuts from any Bogleheads page:

- **Alt+B** - Toggle side panel
- **Alt+Shift+H** - Toggle hide read topics
- **Alt+Shift+N** - Navigate to active topics
- **Alt+Shift+R** - Mark current topic as read

Reassign shortcuts at `chrome://extensions/shortcuts`.

## Installation (from repo)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `extension` folder

## Files

- `manifest.json` - Extension configuration (Manifest V3)
- `content.js` - Applies enhancements to forum pages
- `background.js` - Service worker for side panel, context menus, omnibox, and badge
- `sidepanel.html` - Settings panel UI
- `sidepanel.js` - Settings panel logic
- `sidepanel.css` - Settings panel styling
- `icons/` - Extension icons

## Usage

1. Navigate to https://bogleheads.org/
2. Click the extension icon in the Chrome toolbar to open the side panel
3. Adjust settings as desired - changes apply immediately

## Permissions

- **storage** - To save your preferences
- **sidePanel** - To display settings in Chrome's side panel
- **contextMenus** - To provide right-click "Mark Topic as Read"
- **scripting** - To re-inject content script after extension updates
- **Host permission** - Only runs on bogleheads.org

## License(s)

- MIT License - Feel free to modify and distribute
- Bogleheads® is a registered service mark of The John C. Bogle Center for Financial Literacy
