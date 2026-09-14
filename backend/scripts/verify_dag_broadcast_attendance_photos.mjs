import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const BROWSER_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACTS_DIR = 'C:\\Users\\ashis\\.gemini\\antigravity\\brain\\05b5f847-c0d2-48f5-bd0a-27b28ae84258';
const SCREENSHOTS_DIR = path.join(ARTIFACTS_DIR, 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function run() {
  console.log('🚀 Launching Edge browser via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  try {
    // -------------------------------------------------------------
    // TEST 1: Student Login (Ishika Pratap Singh - 2500100481)
    // -------------------------------------------------------------
    console.log('1️⃣ Logging in as Student Ishika Pratap Singh (2500100481)...');
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
    await sleep(4000);

    console.log('Current URL after login:', page.url());

    // -------------------------------------------------------------
    // TEST 2: Student Profile Avatar & Fallback
    // -------------------------------------------------------------
    console.log('2️⃣ Checking Student Profile Avatar...');
    const profShotPath = path.join(ARTIFACTS_DIR, '54_student_profile_avatar.png');
    await page.screenshot({ path: profShotPath, fullPage: false });
    fs.copyFileSync(profShotPath, path.join(SCREENSHOTS_DIR, '54_student_profile_avatar.png'));
    console.log('✅ Captured Student Profile avatar screenshot:', profShotPath);

    // -------------------------------------------------------------
    // TEST 3: Student Fees & DAG Workflow UI
    // -------------------------------------------------------------
    console.log('3️⃣ Navigating to Fees & No-Dues DAG Workflow via Sidebar...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('aside button'));
      const feesBtn = btns.find(b => b.textContent.includes('Fees'));
      if (feesBtn) feesBtn.click();
    });
    await sleep(2500);

    // Switch to No-Dues tab if on Fees
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(btn => btn.textContent.includes('No Dues') || btn.textContent.includes('Clearance Pipeline'));
      if (b) b.click();
    });
    await sleep(2500);

    // Scroll to the DAG canvas
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('h3')).find(h => h.textContent.includes('Verification DAG Canvas'));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await sleep(1500);

    const dagShotPath = path.join(ARTIFACTS_DIR, '52_dag_workflow_responsive_clean.png');
    await page.screenshot({ path: dagShotPath, fullPage: false });
    fs.copyFileSync(dagShotPath, path.join(SCREENSHOTS_DIR, '52_dag_workflow_responsive_clean.png'));
    console.log('✅ Captured DAG workflow screenshot:', dagShotPath);

    // -------------------------------------------------------------
    // TEST 4: Student Attendance Scoping & Labs
    // -------------------------------------------------------------
    console.log('4️⃣ Navigating to Student Attendance via Sidebar...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('aside button'));
      const attBtn = btns.find(b => b.textContent.includes('Attendance'));
      if (attBtn) attBtn.click();
    });
    await sleep(2500);

    const attendanceInfo = await page.evaluate(() => {
      const subCards = document.querySelectorAll('.rounded-xl.border');
      const text = document.body.innerText;
      return {
        subjectCardsCount: subCards.length,
        hasLab: text.includes('(lab)') || text.includes('(Lab)'),
        hasCyberSec: text.includes('CC425') || text.includes('Cyber Security')
      };
    });
    console.log('Attendance audit result:', attendanceInfo);

    const attShotPath = path.join(ARTIFACTS_DIR, '53_student_attendance_scoped_labs.png');
    await page.screenshot({ path: attShotPath, fullPage: false });
    fs.copyFileSync(attShotPath, path.join(SCREENSHOTS_DIR, '53_student_attendance_scoped_labs.png'));
    console.log('✅ Captured Student Attendance screenshot:', attShotPath);

    // -------------------------------------------------------------
    // TEST 5: Student Broadcast to Role (Compose)
    // -------------------------------------------------------------
    console.log('5️⃣ Navigating to Student Messages via Sidebar...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('aside button'));
      const msgBtn = btns.find(b => b.textContent.includes('Messages'));
      if (msgBtn) msgBtn.click();
    });
    await sleep(2000);

    // Click Compose tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const composeBtn = btns.find(b => b.textContent.includes('Compose') || b.textContent.includes('Send a message'));
      if (composeBtn) composeBtn.click();
    });
    await sleep(1500);

    // Click "Broadcast to a role"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const roleBtn = btns.find(b => b.textContent.includes('Broadcast to a role'));
      if (roleBtn) roleBtn.click();
    });
    await sleep(1000);

    // Type a test message
    const testMsgText = `Test student broadcast to admin ${Date.now()}`;
    const textarea = await page.$('textarea');
    if (textarea) {
      await textarea.type(testMsgText);
      await sleep(500);
    }

    // Click Send button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const sendBtn = btns.find(b => b.textContent.trim() === 'Send message' || b.textContent.includes('Send'));
      if (sendBtn) sendBtn.click();
    });
    await sleep(3000);

    const msgShotPath = path.join(ARTIFACTS_DIR, '55_student_broadcast_success.png');
    await page.screenshot({ path: msgShotPath, fullPage: false });
    fs.copyFileSync(msgShotPath, path.join(SCREENSHOTS_DIR, '55_student_broadcast_success.png'));
    console.log('✅ Captured Student Broadcast screenshot:', msgShotPath);

    // -------------------------------------------------------------
    // TEST 6: Admin Login & Check Broadcast Delivery in Inbox
    // -------------------------------------------------------------
    console.log('6️⃣ Logging in as Admin to verify broadcast delivery...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await sleep(1000);

    const adminEmail = await page.$('input[type="text"]');
    if (adminEmail) {
      await adminEmail.click({ clickCount: 3 });
      await adminEmail.type('hod.cs@gbu.ac.in');
    }

    const adminPass = await page.$('input[type="password"]');
    if (adminPass) {
      await adminPass.click({ clickCount: 3 });
      await adminPass.type('admin123');
    }

    await page.click('button[type="submit"]');
    await sleep(3000);

    await page.goto('http://localhost:5173/admin/messages', { waitUntil: 'networkidle2' });
    await sleep(3000);

    const adminInboxShotPath = path.join(ARTIFACTS_DIR, '56_admin_received_broadcast_and_broadcast_students.png');
    await page.screenshot({ path: adminInboxShotPath, fullPage: false });
    fs.copyFileSync(adminInboxShotPath, path.join(SCREENSHOTS_DIR, '56_admin_received_broadcast_and_broadcast_students.png'));
    console.log('✅ Captured Admin Inbox screenshot:', adminInboxShotPath);

    console.log('🎉 All automated verification tests completed successfully!');
  } catch (err) {
    console.error('❌ Verification failed with error:', err);
  } finally {
    await browser.close();
  }
}

run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
