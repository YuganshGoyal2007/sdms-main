import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = 'C:\\Users\\harsh\\.gemini\\antigravity\\brain\\0492bb3c-dcf0-4f20-b946-44c00d83febe\\screenshots\\timetable_audit';

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function verify() {
  console.log('--- LAUNCHING CHROME AUTOMATED VERIFICATION FOR TIMETABLE FIXES ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const consoleErrors = [];
  const failedRequests = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('  [BROWSER ERROR]:', msg.text());
    }
  });

  page.on('response', resp => {
    if (resp.status() >= 400) {
      failedRequests.push({ url: resp.url(), status: resp.status() });
      console.log(`  [HTTP ${resp.status()}]:`, resp.url());
    }
  });

  try {
    // 1. Login as Admin
    console.log('[1/5] Logging in as Admin...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"], input[type="text"]', 'hod.cs@gbu.ac.in');
    await page.type('input[type="password"]', 'TestPass@123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1500));

    // 2. Navigate to Timetable Mappings
    console.log('[2/5] Navigating to Timetable Mappings (/admin/timetable)...');
    await page.goto('http://localhost:5173/admin/timetable', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_timetable_mappings_landing.png') });

    // 3. Click Find Missing
    console.log('[3/5] Clicking "Find Missing" button...');
    const findMissingBtn = await page.waitForSelector('xpath///button[contains(., "Find Missing")]', { timeout: 5000 });
    await findMissingBtn.click();
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_find_missing_results.png') });

    // 4. Click View Timetable for a specific class
    console.log('[4/5] Clicking specific class to open Class Timetable Modal...');
    // Look for first class link or eye button in table
    const viewTimetableBtn = await page.$('tbody tr td button');
    if (viewTimetableBtn) {
      await viewTimetableBtn.click();
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_class_timetable_modal_open.png') });
      console.log('  -> Captured Class Timetable Modal screenshot!');
      
      // Close modal
      const closeBtn = await page.$('xpath///button[contains(., "Close")]');
      if (closeBtn) await closeBtn.click();
      await new Promise(r => setTimeout(r, 500));
    }

    // 5. Navigate to /admin/classes and test View Timetable from Classes
    console.log('[5/5] Navigating to Classes (/admin/classes) and verifying Timetable integration...');
    await page.goto('http://localhost:5173/admin/classes', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_classes_page_with_timetable_buttons.png') });

    // Click Timetable pill on the first class card
    const classTimetablePill = await page.$('span[title="View class timetable"]');
    if (classTimetablePill) {
      console.log('  Clicking Timetable pill on class card...');
      await classTimetablePill.click();
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_timetable_opened_from_classes.png') });
    }

    console.log('\n=== VERIFICATION RESULTS ===');
    console.log('Console Errors:', consoleErrors.length);
    console.log('Failed Requests (4xx/5xx):', failedRequests.length);
    console.log('Screenshots saved to:', SCREENSHOT_DIR);

    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Verification failed:', err);
    await browser.close();
    process.exit(1);
  }
}

verify();
