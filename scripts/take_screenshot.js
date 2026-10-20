const puppeteer = require('puppeteer');
const path = require('path');

async function capture() {
  console.log('Launching Puppeteer browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100, deviceScaleFactor: 1 });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });

  // Wait extra 2 seconds for all charts and data to render
  await new Promise((r) => setTimeout(r, 2000));

  const outputPath = path.join(__dirname, '..', 'docs', 'dashboard-preview.png');
  const scenarioPath = path.join(__dirname, '..', 'docs', 'dashboard-monsoon.png');
  console.log(`Saving screenshot to ${outputPath}...`);
  await page.screenshot({ path: outputPath, fullPage: true });

  // Capture the flagship historical-scenario view for the submission gallery.
  const clicked = await page.evaluate(() => {
    const button = Array.from(document.querySelectorAll('button')).find((candidate) =>
      candidate.textContent?.includes('Load June 2024 monsoon')
    );
    if (!button) return false;
    button.click();
    return true;
  });
  if (clicked) {
    await new Promise((r) => setTimeout(r, 5000));
    console.log(`Saving monsoon scenario screenshot to ${scenarioPath}...`);
    await page.screenshot({ path: scenarioPath, fullPage: true });
  }

  await browser.close();
  console.log('Screenshot captured successfully!');
}

capture().catch((err) => {
  console.error('Failed to capture screenshot:', err);
  process.exit(1);
});
