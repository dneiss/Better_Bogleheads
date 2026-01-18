# Screenshot Capture Script

Automates capturing Chrome Web Store screenshots of the extension at required resolutions.

## Prerequisites

- Node.js 18+ installed
- Chrome browser installed

## Setup

```bash
cd chrome_listing_screenshots/capture
npm install
```

## Usage

```bash
npm run capture
```

This will:
1. Launch Chrome (non-headless) with the extension loaded
2. Navigate to bogleheads.org forum
3. Wait for the extension panel to load
4. Capture screenshots at 1280x800 and 640x400
5. Save PNG and JPG versions to the parent directory

## Output Files

Screenshots are saved to `chrome_listing_screenshots/`:
- `screenshot_1280x800.png`
- `screenshot_1280x800.jpg`
- `screenshot_640x400.png`
- `screenshot_640x400.jpg`

## Notes

- Uses a fresh Chrome profile (Puppeteer default) - no personal browser data is exposed
- The browser window will be visible during capture so you can verify the content
- The script waits for the `#zebra-picker` element to confirm the extension loaded
