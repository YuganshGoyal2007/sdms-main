import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const BROWSER_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACTS_DIR = 'C:\\Users\\ashis\\.gemini\\antigravity\\brain\\05b5f847-c0d2-48f5-bd0a-27b28ae84258';
const SCREENSHOTS_DIR = path.join(ARTIFACTS_DIR, 'screenshots');

async function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function run() {
  console.log('🚀 Launching Edge browser for DAG capture...');
  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,1100'],
    defaultViewport: { width: 1440, height: 1100 }
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  try {
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await sleep(1000);

    const rollInput = await page.$('input[type="text"]');
    if (rollInput) {
      await rollInput.click({ clickCount: 3 });
      await rollInput.type('2500100481');
    }

    const passInput = await page.$('input[type="password"]');
    if (passInput) {
      await passInput.click({ clickCount: 3 });
      await passInput.type('TestPass@123');
    }

    await page.click('button[type="submit"]');
    await sleep(3500);

    // Dismiss notification popup if present
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const notNow = btns.find(b => b.textContent.includes('Not now'));
      if (notNow) notNow.click();
    });
    await sleep(500);

    // Click Fees sidebar
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('aside button'));
      const feesBtn = btns.find(b => b.textContent.includes('Fees'));
      if (feesBtn) feesBtn.click();
    });
    await sleep(2000);

    // Click No-Dues Clearance tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const noDuesBtn = btns.find(b => b.textContent.includes('No-Dues Clearance'));
      if (noDuesBtn) noDuesBtn.click();
    });
    await sleep(2500);

    // Scroll directly to the DAG canvas
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('h3')).find(h => h.textContent.includes('Verification DAG Canvas'));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    await sleep(1500);

    const dagShotPath = path.join(ARTIFACTS_DIR, '52_dag_workflow_responsive_clean.png');
    await page.screenshot({ path: dagShotPath, fullPage: false });
    fs.copyFileSync(dagShotPath, path.join(SCREENSHOTS_DIR, '52_dag_workflow_responsive_clean.png'));
    console.log('✅ Captured clean DAG workflow screenshot:', dagShotPath);
  } catch (err) {
    console.error('Error during DAG capture:', err);
  } finally {
    await browser.close();
  }
}

run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
