const puppeteer = require('puppeteer');
const path = require('path');

async function capture() {
  console.log('Launching Puppeteer browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100, deviceScaleFactor: 2 });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });

  // Wait extra 2 seconds for all charts and data to render
  await new Promise((r) => setTimeout(r, 2000));

  const outputPath = path.join(__dirname, 'docs', 'dashboard-preview.png');
  console.log(`Saving screenshot to ${outputPath}...`);
  await page.screenshot({ path: outputPath, fullPage: true });

  await browser.close();
  console.log('Screenshot captured successfully!');
}

capture().catch((err) => {
  console.error('Failed to capture screenshot:', err);
  process.exit(1);
});
