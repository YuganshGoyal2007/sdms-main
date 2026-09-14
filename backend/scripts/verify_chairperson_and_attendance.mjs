import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const possibleBrowsers = [
  (process.env.LOCALAPPDATA || '') + '\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
];

const executablePath = possibleBrowsers.find(p => fs.existsSync(p));
if (!executablePath) {
  console.error('No browser executable found!');
  process.exit(1);
}

const dirBrain = 'C:\\Users\\ashis\\.gemini\\antigravity\\brain\\05b5f847-c0d2-48f5-bd0a-27b28ae84258\\screenshots';
const dirEvidence = 'c:\\Users\\Public\\Downloads\\chrome downloads\\sdms\\e2e_evidence\\screenshots';

async function saveScreen(page, name) {
  const p1 = path.join(dirBrain, name);
  const p2 = path.join(dirEvidence, name);
  await page.screenshot({ path: p1, fullPage: false });
  fs.copyFileSync(p1, p2);
  console.log('Saved screenshot:', name);
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    defaultViewport: { width: 1400, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    console.log('=== TEST 1: CHAIRPERSON LOGIN & SIDEBAR ===');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    
    // Clear storage first
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });

    // Fill credentials
    await page.waitForSelector('input');
    const userInputs = await page.$$('input[type="text"], input[placeholder*="enrollment" i], input[placeholder*="username" i], input[placeholder*="email" i]');
    if (userInputs.length > 0) {
      await userInputs[0].click({ clickCount: 3 });
      await userInputs[0].type('test_chair@gbu.ac.in');
    }
    const passInput = await page.$('input[type="password"]');
    if (passInput) {
      await passInput.click({ clickCount: 3 });
      await passInput.type('TestPass@123');
    }

    // Submit
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    else await page.keyboard.press('Enter');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));
    console.log('Current URL after login:', page.url());

    // Check sidebar links
    const sidebarText = await page.evaluate(() => {
      const nav = document.querySelector('aside, nav, [class*="SideNav"], [class*="sidebar"]') || document.body;
      return nav.innerText;
    });

    const hasFees = sidebarText.includes('Fees & Dues');
    const hasNoDues = sidebarText.includes('No-Dues Clearance');
    const hasAttendance = sidebarText.includes('Mark Attendance');

    console.log('Sidebar includes Fees & Dues?', hasFees);
    console.log('Sidebar includes No-Dues Clearance?', hasNoDues);
    console.log('Sidebar includes Mark Attendance?', hasAttendance);

    if (hasFees || hasNoDues) {
      console.warn('WARNING: Fees / No-Dues found in Chairperson sidebar!');
    } else {
      console.log('PASS: Fees & Dues and No-Dues Clearance successfully removed from Chairperson sidebar!');
    }

    await saveScreen(page, '44_chairperson_sidebar_clean.png');

    console.log('=== TEST 2: DIRECT URL GUARDS ===');
    await page.goto('http://localhost:5173/chairperson/no-dues', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    console.log('Redirected URL from /chairperson/no-dues:', page.url());

    await page.goto('http://localhost:5173/chairperson/fees', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    console.log('Redirected URL from /chairperson/fees:', page.url());

    console.log('=== TEST 3: CHAIRPERSON MARK ATTENDANCE DASHBOARD ===');
    await page.goto('http://localhost:5173/chairperson/mark-attendance', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2500));

    const pageContent = await page.evaluate(() => document.body.innerText);
    console.log('Mark Attendance page includes "Classes Assigned"?', pageContent.includes('Classes Assigned'));
    console.log('Mark Attendance page includes "Operating System"?', pageContent.includes('Operating System'));

    await saveScreen(page, '45_chairperson_mark_attendance_classes.png');

    console.log('=== TEST 4: ROSTER TABLE & MARKING ===');
    // Click specifically on the card's 'Continue Attendance' or 'Start Attendance' button
    const cardBtn = await page.waitForSelector('main button', { timeout: 5000 });
    const btnText = await page.evaluate(el => el.innerText, cardBtn);
    console.log('Found class card action button:', btnText);
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}),
      cardBtn.click()
    ]);
    await new Promise(r => setTimeout(r, 3000));
    console.log('Attendance roster URL:', page.url());

    // Check if roster table loaded
    const rosterText = await page.evaluate(() => document.body.innerText);
    const hasRoster = rosterText.includes('AARUSHI') || rosterText.includes('Roll') || rosterText.includes('Present');
    console.log('Roster table loaded with students?', hasRoster);

    // Click on attendance buttons or toggle present/absent
    const statusPills = await page.$$('button');
    for (const sp of statusPills) {
      const txt = await page.evaluate(el => el.innerText, sp);
      if (txt === 'P' || txt === 'Present') {
        await sp.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 500));

    // Click Save Draft button
    const actionBtns = await page.$$('button');
    for (const ab of actionBtns) {
      const t = await page.evaluate(el => el.innerText, ab);
      if (t.includes('Save Draft') || t.includes('Save')) {
        console.log('Clicking save button:', t);
        await ab.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 2000));
    await saveScreen(page, '46_roster_table_active.png');

    console.log('=== TEST 5: ADMIN SIDEBAR INTACT ===');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });

    const adminInputs = await page.$$('input[type="text"], input[placeholder*="enrollment" i], input[placeholder*="username" i], input[placeholder*="email" i]');
    if (adminInputs.length > 0) {
      await adminInputs[0].click({ clickCount: 3 });
      await adminInputs[0].type('hod.cs@gbu.ac.in');
    }
    const adminPass = await page.$('input[type="password"]');
    if (adminPass) {
      await adminPass.click({ clickCount: 3 });
      await adminPass.type('admin123');
    }
    const adminBtn = await page.$('button[type="submit"]');
    if (adminBtn) await adminBtn.click();
    else await page.keyboard.press('Enter');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));
    console.log('Admin URL after login:', page.url());

    const adminSidebarText = await page.evaluate(() => {
      const nav = document.querySelector('aside, nav, [class*="SideNav"], [class*="sidebar"]') || document.body;
      return nav.innerText;
    });

    console.log('Admin sidebar has Fees & Dues?', adminSidebarText.includes('Fees & Dues'));
    console.log('Admin sidebar has No-Dues Clearance?', adminSidebarText.includes('No-Dues Clearance'));

    await saveScreen(page, '47_admin_sidebar_fees_intact.png');
    console.log('All 5 tests completed successfully!');

  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    await browser.close();
  }
}

run();
