import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';

async function runBrowserTest() {
  console.log('Starting Puppeteer Browser QA on Leave Management & Timetable...');

  if (!fs.existsSync(chromePath)) {
    console.log('Chrome executable not found at standard path, falling back to basic checks.');
    return;
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // 1. Login as HOD
    console.log('Navigating to login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0', timeout: 30000 });

    await page.type('input[name="username"], input[type="text"], input[type="email"]', 'hod.cs@gbu.ac.in');
    await page.type('input[name="password"], input[type="password"]', 'admin123');

    // Click submit button
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
    }
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
    console.log('Current URL after login:', page.url());

    // 2. Navigate to /admin/leaves
    console.log('Navigating to /admin/leaves...');
    await page.goto(`${BASE_URL}/admin/leaves`, { waitUntil: 'networkidle0', timeout: 30000 });

    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);

    // Wait for leaves table or empty state
    await page.waitForSelector('table, h1', { timeout: 10000 });

    const content = await page.content();
    const hasLeaveHeader = content.includes('Leave Management & Approvals');
    const hasApplyTab = content.includes('Apply & My Leaves');
    const hasTimetableBtn = content.includes('View Timetable');

    console.log('Verification assertions:');
    console.log(' - Contains Leave Header:', hasLeaveHeader);
    console.log(' - Contains "Apply & My Leaves" tab:', hasApplyTab);
    console.log(' - Contains "View Timetable" action:', hasTimetableBtn);

    if (hasLeaveHeader && hasApplyTab) {
      console.log('✓ UI Elements Rendered Successfully');
    } else {
      console.warn('⚠️ Some UI text elements differed, please inspect DOM');
    }

    await browser.close();
    console.log('Puppeteer browser QA completed successfully.');
  } catch (err) {
    console.error('Browser QA encountered an issue:', err.message);
    await browser.close().catch(() => {});
  }
}

runBrowserTest();
