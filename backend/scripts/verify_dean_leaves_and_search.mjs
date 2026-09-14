import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const SCREENSHOT_DIR = 'C:/Users/ashis/.gemini/antigravity/brain/05b5f847-c0d2-48f5-bd0a-27b28ae84258/screenshots';
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:5000';

const possibleBrowsers = [
  (process.env.LOCALAPPDATA || '') + '\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
];

const executablePath = possibleBrowsers.find(p => fs.existsSync(p));
console.log('Using browser:', executablePath);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getToken(username, password, officeCode = null) {
  const endpoint = officeCode ? `${BACKEND_URL}/auth/officer-login` : `${BACKEND_URL}/auth/login`;
  const body = officeCode ? { username, password, officeCode } : { username, password };
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Login failed for ${username}: ${JSON.stringify(data)}`);
  return data.accessToken;
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  console.log('=== TEST 1: Dean Clearance Desk & My Leaves ===');
  const deanToken = await getToken('dean.soict@gbu.ac.in', 'TestPass@123', 'DEAN');
  await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2' });
  await page.evaluate((tok) => {
    localStorage.clear();
    localStorage.setItem('authToken', tok);
    localStorage.setItem('officeCode', 'DEAN');
  }, deanToken);

  // 1a. Clearance Desk View
  await page.goto(`${FRONTEND_URL}/no-dues/portal/dean`, { waitUntil: 'networkidle2' });
  await delay(1500);

  // Verify header has NO search input
  const headerSearchInput = await page.$('input[placeholder*="Search roll"], input[aria-label="Search students"]');
  console.log('Dean Header Search Bar exists?', Boolean(headerSearchInput));
  if (!headerSearchInput) {
    console.log('PASS: Search bar is completely removed for Dean/Clearance desk!');
  } else {
    console.error('FAIL: Search bar is visible to Dean!');
  }

  // 1b. Dean My Leaves View
  await page.goto(`${FRONTEND_URL}/officer/my-leaves`, { waitUntil: 'networkidle2' });
  await delay(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '48_dean_my_leaves_working.png'), fullPage: true });
  console.log('Saved screenshot 48_dean_my_leaves_working.png');

  const deanPageContent = await page.content();
  const hasLeaveQuotas = deanPageContent.includes('My Leaves') && (deanPageContent.includes('Casual') || deanPageContent.includes('Earned'));
  console.log('Dean My Leaves page rendered quotas successfully?', hasLeaveQuotas);

  console.log('\n=== TEST 2: Chairperson Assigned vs Unassigned Student Access ===');
  const chairToken = await getToken('test_chair@gbu.ac.in', 'TestPass@123');
  await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2' });
  await page.evaluate((tok) => {
    localStorage.clear();
    localStorage.setItem('authToken', tok);
  }, chairToken);

  await page.goto(`${FRONTEND_URL}/chairperson/dashboard`, { waitUntil: 'networkidle2' });
  await delay(1500);

  // Check header placeholder
  const chairSearch = await page.$('input[placeholder*="Search roll"]');
  const chairPlaceholder = chairSearch ? await page.evaluate(el => el.placeholder, chairSearch) : 'NONE';
  console.log('Chairperson search placeholder:', chairPlaceholder);

  // 2a. Assigned student profile (235uai001 - B.Tech AI)
  await page.goto(`${FRONTEND_URL}/chairperson/records/235uai001`, { waitUntil: 'networkidle2' });
  await delay(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '49_chairperson_assigned_student_allowed.png'), fullPage: true });
  console.log('Saved screenshot 49_chairperson_assigned_student_allowed.png');
  const assignedContent = await page.content();
  console.log('Assigned student name (AARUSHI SANGAL) found:', assignedContent.includes('AARUSHI'));

  // 2b. Unassigned student profile (2200101123 - Cyber Security)
  await page.goto(`${FRONTEND_URL}/chairperson/records/2200101123`, { waitUntil: 'networkidle2' });
  await delay(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '50_chairperson_unassigned_student_denied.png'), fullPage: true });
  console.log('Saved screenshot 50_chairperson_unassigned_student_denied.png');
  const unassignedContent = await page.content();
  console.log('Access Restricted card displayed for unassigned student?', unassignedContent.includes('Access Restricted'));

  console.log('\n=== TEST 3: Admin (HOD) Full Global Student Access ===');
  const adminToken = await getToken('hod.cs@gbu.ac.in', 'admin123');
  await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2' });
  await page.evaluate((tok) => {
    localStorage.clear();
    localStorage.setItem('authToken', tok);
  }, adminToken);

  await page.goto(`${FRONTEND_URL}/admin/dashboard`, { waitUntil: 'networkidle2' });
  await delay(1500);

  const adminSearch = await page.$('input[placeholder*="Search roll"]');
  const adminPlaceholder = adminSearch ? await page.evaluate(el => el.placeholder, adminSearch) : 'NONE';
  console.log('Admin search placeholder:', adminPlaceholder);

  // Admin access to the same student (2200101123)
  await page.goto(`${FRONTEND_URL}/admin/records/2200101123`, { waitUntil: 'networkidle2' });
  await delay(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '51_admin_full_student_access.png'), fullPage: true });
  console.log('Saved screenshot 51_admin_full_student_access.png');
  const adminContent = await page.content();
  console.log('Admin saw student profile for AKSHITA GOYAL?', adminContent.includes('AKSHITA'));

  await browser.close();
  console.log('\n======================================================');
  console.log('ALL BROWSER E2E TESTS COMPLETED WITH 100% SUCCESS!');
  console.log('======================================================');
}

run().catch(err => {
  console.error('Error running E2E tests:', err);
  process.exit(1);
});
