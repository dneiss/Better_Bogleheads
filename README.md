# Bogleheads Chrome Extension

A Chrome extension that enhances the [Bogleheads.org](https://www.bogleheads.org) forum thread listing page with visual improvements and filtering options.

## Features

- **Zebra Striping** - Alternating row colors for easier reading (customizable color)
- **Hide Read Threads** - Automatically tracks threads you've clicked and can hide them. Threads reappear when new replies are posted.
- **Highlight Hot Topics** - Highlight threads with many replies (customizable threshold and color)
- **Hide Old Threads** - Filter out threads older than a specified number of days
- **Adjustable Font Size** - Increase or decrease the thread list font size (50% - 200%)
- **Collapsible Panel** - Click the title bar to collapse/expand the settings panel

All settings are saved and persist across sessions.

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the folder containing the extension files

## Files

- `manifest.json` - Extension configuration
- `content.js` - Main extension logic
- `styles.css` - Panel styling

## Usage

1. Navigate to https://www.bogleheads.org/index.php
2. The extension panel appears in the top-right corner
3. Adjust settings as desired - changes apply immediately
4. Click the title bar to collapse/expand the panel

## Permissions

- **storage** - To save your preferences
- **Host permission** - Only runs on bogleheads.org

## License

MIT License - Feel free to modify and distribute.
