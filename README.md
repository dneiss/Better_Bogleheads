# Better Bogleheads

A Chrome extension that enhances the [Bogleheads.org](https://www.bogleheads.org) forum thread listing page with visual improvements and filtering options.

## Features

- **Zebra Striping** - Alternating row colors for easier reading (customizable color)
- **Hide Read Threads** - Automatically tracks threads you've clicked and can hide them. Threads reappear when new replies are posted.
- **Highlight Hot Topics** - Highlight threads with many replies (customizable threshold and color)
- **Hide Old Threads** - Filter out threads older than a specified number of days
- **Adjustable Font Size** - Increase or decrease the thread list font size (50% - 200%)
- **Collapsible Panel** - Click the title bar to collapse/expand the settings panel
- **Draggable Panel** - Drag the title bar to reposition the panel anywhere on screen

All settings are saved and persist across sessions.

## Installation (from repo)

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

1. Navigate to https://bogleheads.org/
2. The extension panel appears in the top-right corner
3. Adjust settings as desired - changes apply immediately
4. Click the title bar to collapse/expand, or drag to reposition

## Permissions

- **storage** - To save your preferences
- **Host permission** - Only runs on bogleheads.org

## License(s)

- MIT License - Feel free to modify and distribute.
- Bogleheads® is a registered service mark of The John C. Bogle Center for Financial Literacy
