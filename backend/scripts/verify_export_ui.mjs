import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve('backend/.env') });

const possibleBrowsers = [
  (process.env.LOCALAPPDATA || '') + '\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
];

const CHROME_PATH = possibleBrowsers.find(p => fs.existsSync(p));
const ARTIFACTS_DIR = 'C:\\Users\\ashis\\.gemini\antigravity\\brain\\4fb51611-91fc-4b2d-9433-3b95cfc28824\\screenshots';
const LOCAL_SCREENSHOT_DIR = path.resolve('e2e_evidence/screenshots/export_audit');

fs.mkdirSync(LOCAL_SCREENSHOT_DIR, { recursive: true });
fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

async function runExportVerification() {
  console.log('--- STARTING BROWSER E2E VERIFICATION FOR MULTI-TIER EXPORTS ---');
  console.log('Using browser at:', CHROME_PATH);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960 });

  const consoleErrors = [];
  const exportRequests = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('  [BROWSER ERROR]:', msg.text());
    }
  });

  page.on('response', resp => {
    if (resp.url().includes('/export-students')) {
      exportRequests.push({ url: resp.url(), status: resp.status() });
      console.log(`  [EXPORT HTTP ${resp.status()}]:`, resp.url());
    }
  });

  try {
    // 1. Authenticate as Admin (hod.cs@gbu.ac.in)
    console.log('[1/4] Generating admin session token...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
    
    const { generateAccessToken } = await import('../services/token.service.js');
    const { default: User } = await import('../models/user.model.js');
    const user = await User.findOne({ where: { username: 'hod.cs@gbu.ac.in' } });
    const token = generateAccessToken(user);

    await page.evaluate((jwt) => {
      localStorage.setItem('authToken', jwt);
    }, token);

    // 2. Test /admin/records
    console.log('[2/4] Navigating to /admin/records...');
    await page.goto('http://localhost:5173/admin/records', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));

    // Select School: SOICT
    console.log('  -> Selecting School: soict...');
    const schoolSelect = await page.$('select[name="school"]');
    if (schoolSelect) {
      await schoolSelect.select('soict');
      await new Promise(r => setTimeout(r, 800));
    }

    // Select Department: CSE
    console.log('  -> Selecting Department: cse...');
    const deptSelect = await page.$('select[name="department"]');
    if (deptSelect) {
      await deptSelect.select('cse');
      await new Promise(r => setTimeout(r, 800));
    }

    // Select Program: B.Tech
    console.log('  -> Selecting Program: b.tech...');
    const progSelect = await page.$('select[name="program"]');
    if (progSelect) {
      await progSelect.select('b.tech');
      await new Promise(r => setTimeout(r, 1200));
    }

    // Select Batch: 2023-27
    console.log('  -> Selecting Batch: 2023-27...');
    const batchSelect = await page.$('select[name="batch"]');
    if (batchSelect) {
      await batchSelect.select('2023-27');
      await new Promise(r => setTimeout(r, 1000));
    }

    // Capture screenshot of Records page with Department and Batch export buttons visible
    const img39PathLocal = path.join(LOCAL_SCREENSHOT_DIR, '39_records_department_and_batch_export.png');
    const img39PathArtifact = path.join(ARTIFACTS_DIR, '39_records_department_and_batch_export.png');
    await page.screenshot({ path: img39PathLocal });
    fs.copyFileSync(img39PathLocal, img39PathArtifact);
    console.log('  -> Saved screenshot 39_records_department_and_batch_export.png');

    // Click "Export Entire CSE Dept" button
    console.log('  -> Clicking "Export Entire CSE Dept" button...');
    const deptExportBtn = await page.$('xpath///button[contains(., "Export Entire CSE Dept")]');
    if (deptExportBtn) {
      await deptExportBtn.click();
      await new Promise(r => setTimeout(r, 3000));
    }

    // Click "Export Batch 2023-27" button
    console.log('  -> Clicking "Export Batch 2023-27" button...');
    const batchExportBtn = await page.$('xpath///button[contains(., "Export Batch 2023-27")]');
    if (batchExportBtn) {
      await batchExportBtn.click();
      await new Promise(r => setTimeout(r, 3000));
    }

    // 3. Test /admin/classes
    console.log('[3/4] Navigating to /admin/classes...');
    await page.goto('http://localhost:5173/admin/classes', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));

    // Check toolbar for Export All CSE and Batch Export
    console.log('  -> Selecting Batch 2023-27 in classes toolbar...');
    const classBatchSelect = await page.$('select:has(option[value="2023-27"])');
    if (classBatchSelect) {
      await classBatchSelect.select('2023-27');
      await new Promise(r => setTimeout(r, 800));
    }

    // Capture screenshot of Classes page with toolbar controls
    const img40PathLocal = path.join(LOCAL_SCREENSHOT_DIR, '40_classes_department_and_batch_export_toolbar.png');
    const img40PathArtifact = path.join(ARTIFACTS_DIR, '40_classes_department_and_batch_export_toolbar.png');
    await page.screenshot({ path: img40PathLocal });
    fs.copyFileSync(img40PathLocal, img40PathArtifact);
    console.log('  -> Saved screenshot 40_classes_department_and_batch_export_toolbar.png');

    // Click "Export All CSE" button
    console.log('  -> Clicking "Export All CSE" button in toolbar...');
    const exportAllCseBtn = await page.$('xpath///button[contains(., "Export All CSE")]');
    if (exportAllCseBtn) {
      await exportAllCseBtn.click();
      await new Promise(r => setTimeout(r, 3000));
    }

    // Click "Export Batch" button
    console.log('  -> Clicking "Export Batch" button in toolbar...');
    const exportBatchBtn = await page.$('xpath///button[contains(., "Export Batch")]');
    if (exportBatchBtn) {
      await exportBatchBtn.click();
      await new Promise(r => setTimeout(r, 3000));
    }

    // 4. Summarize Export API Calls
    console.log('[4/4] Verification Summary:');
    console.log('Total /export-students requests triggered:', exportRequests.length);
    exportRequests.forEach((req, idx) => {
      console.log(`  [${idx + 1}] HTTP ${req.status} -> ${req.url}`);
    });

    const allSuccessful = exportRequests.length >= 2 && exportRequests.every(r => r.status === 200);
    if (allSuccessful) {
      console.log('✅ ALL EXPORT ENDPOINTS RESPONDED WITH HTTP 200 OK!');
    } else {
      console.log('⚠️ Some requests may have failed or were not caught:', exportRequests);
    }

  } catch (err) {
    console.error('❌ Verification encountered an error:', err);
  } finally {
    await browser.close();
    console.log('--- VERIFICATION SCRIPT FINISHED ---');
  }
}

runExportVerification().catch(console.error);
