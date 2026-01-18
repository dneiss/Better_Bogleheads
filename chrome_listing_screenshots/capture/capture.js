import puppeteer from 'puppeteer';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RESOLUTIONS = [
  { width: 1280, height: 800 },
  { width: 640, height: 400 }
];

const TARGET_URL = 'https://www.bogleheads.org/index.php';
const EXTENSION_PATH = path.resolve(__dirname, '../..');
const OUTPUT_DIR = path.resolve(__dirname, '..');

async function captureScreenshots() {
  console.log('Launching Chrome with extension...');
  console.log(`Extension path: ${EXTENSION_PATH}`);

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--no-first-run',
      '--no-default-browser-check'
    ]
  });

  const page = await browser.newPage();

  console.log(`Navigating to ${TARGET_URL}...`);
  await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });

  // Wait for the extension panel to load
  console.log('Waiting for extension panel (#zebra-picker)...');
  try {
    await page.waitForSelector('#zebra-picker', { timeout: 10000 });
    console.log('Extension panel found!');
  } catch (e) {
    console.warn('Warning: #zebra-picker not found within timeout. Continuing anyway...');
  }

  // Small delay for content to settle
  await new Promise(resolve => setTimeout(resolve, 2000));

  for (const { width, height } of RESOLUTIONS) {
    console.log(`\nCapturing ${width}x${height}...`);

    await page.setViewport({ width, height });
    // Small delay after viewport change
    await new Promise(resolve => setTimeout(resolve, 500));

    const pngPath = path.join(OUTPUT_DIR, `screenshot_${width}x${height}.png`);
    const jpgPath = path.join(OUTPUT_DIR, `screenshot_${width}x${height}.jpg`);

    // Take PNG screenshot
    await page.screenshot({ path: pngPath, type: 'png' });
    console.log(`  Saved: ${pngPath}`);

    // Convert to JPG using sharp
    await sharp(pngPath)
      .jpeg({ quality: 90 })
      .toFile(jpgPath);
    console.log(`  Saved: ${jpgPath}`);
  }

  console.log('\nClosing browser...');
  await browser.close();

  console.log('\nDone! Screenshots saved to:');
  console.log(`  ${OUTPUT_DIR}`);
}

captureScreenshots().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
