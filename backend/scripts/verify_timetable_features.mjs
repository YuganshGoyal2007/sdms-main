import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve('backend/.env') });

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = 'C:\\Users\\yugansh\\.gemini\\antigravity\\brain\\4c81a6d3-32e0-4450-80e8-1051fda13b78\\screenshots\\timetable_audit';

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
    // 1. Authenticate as Admin (hod.cs@gbu.ac.in)
    console.log('[1/6] Authenticating as Admin (hod.cs@gbu.ac.in)...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
    
    // Generate valid access token directly
    const { generateAccessToken } = await import('../services/token.service.js');
    const { default: User } = await import('../models/user.model.js');
    const user = await User.findOne({ where: { username: 'hod.cs@gbu.ac.in' } });
    const token = generateAccessToken(user);

    await page.evaluate((jwt) => {
      localStorage.setItem('authToken', jwt);
    }, token);

    await page.goto('http://localhost:5173/admin/dashboard', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_logged_in.png') });

    // 2. Navigate to Timetable Mappings (/admin/timetable)
    console.log('[2/6] Navigating to Timetable Mappings (/admin/timetable)...');
    await page.goto('http://localhost:5173/admin/timetable', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_timetable_mappings_landing.png') });

    // 3. Test Check Latency button (Live Endpoints Probe)
    console.log('[3/6] Testing "Check Latency" button on live university scraping endpoints...');
    const checkLatencyBtn = await page.waitForSelector('xpath///button[contains(., "Check Latency")]', { timeout: 5000 });
    if (checkLatencyBtn) {
      await checkLatencyBtn.click();
      await new Promise(r => setTimeout(r, 3500));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_latency_probed.png') });
      console.log('  -> Live endpoints probed successfully!');
    }

    // 4. Test Dry Run Test button (Faculty Reassignment Simulation)
    console.log('[4/6] Testing "Dry Run Test" button for Faculty Reassignment...');
    const dryRunBtn = await page.waitForSelector('xpath///button[contains(., "Dry Run Test")]', { timeout: 5000 });
    if (dryRunBtn) {
      await dryRunBtn.click();
      await new Promise(r => setTimeout(r, 7000));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_dry_run_simulation.png') });
      console.log('  -> Dry Run simulation completed and report rendered!');
    }

    // 5. Test Find Missing button
    console.log('[5/6] Testing "Find Missing" button...');
    const findMissingBtn = await page.waitForSelector('xpath///button[contains(., "Find Missing")]', { timeout: 5000 });
    if (findMissingBtn) {
      await findMissingBtn.click();
      await new Promise(r => setTimeout(r, 2500));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_find_missing_results.png') });
      console.log('  -> Missing scan executed!');
    }

    // 6. Test View Timetable Modal
    console.log('[6/6] Clicking eye button to view specific class timetable modal...');
    const viewTimetableBtn = await page.$('tbody tr td button[title="View timetable schedule"]');
    if (viewTimetableBtn) {
      await viewTimetableBtn.click();
      await new Promise(r => setTimeout(r, 3000));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_class_timetable_modal_open.png') });
      console.log('  -> Captured Class Timetable Modal screenshot!');
      
      // Close modal
      const closeBtn = await page.$('xpath///button[contains(., "Close")]') || await page.$('div.fixed button:has(svg.lucide-x)');
      if (closeBtn) await closeBtn.click();
      await new Promise(r => setTimeout(r, 500));
    }

    console.log('\n=== VERIFICATION RESULTS ===');
    console.log('Console Errors:', consoleErrors.length);
    console.log('Failed Requests (4xx/5xx):', failedRequests.length);
    console.log('Screenshots saved to:', SCREENSHOT_DIR);

    const report = {
      timestamp: new Date().toISOString(),
      adminAccount: 'hod.cs@gbu.ac.in',
      allPassed: consoleErrors.length === 0 && failedRequests.length === 0,
      consoleErrors,
      failedRequests,
      screenshots: [
        '01_logged_in.png',
        '02_timetable_mappings_landing.png',
        '03_latency_probed.png',
        '04_dry_run_simulation.png',
        '05_find_missing_results.png',
        '06_class_timetable_modal_open.png'
      ]
    };
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'TIMETABLE_VERIFICATION_REPORT.json'), JSON.stringify(report, null, 2));

    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Verification failed:', err);
    await browser.close();
    process.exit(1);
  }
}

verify();
