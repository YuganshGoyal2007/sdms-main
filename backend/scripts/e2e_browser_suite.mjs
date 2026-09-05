import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const screenshotDir = 'C:\\Users\\harsh\\.gemini\\antigravity\\brain\\0492bb3c-dcf0-4f20-b946-44c00d83febe\\screenshots';

if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

const BASE_URL = 'http://localhost:5173';

const testAccounts = {
  admin: { username: 'hod.cs@gbu.ac.in', password: 'TestPass@123', defaultRoute: '/admin/dashboard' },
  coordinator: { username: 'test_coord@gbu.ac.in', password: 'TestPass@123', defaultRoute: '/coordinator/dashboard' },
  chairperson: { username: 'test_chair@gbu.ac.in', password: 'TestPass@123', defaultRoute: '/chairperson/dashboard' },
  faculty: { username: 'test_faculty@gbu.ac.in', password: 'TestPass@123', defaultRoute: '/faculty/dashboard' },
  student: { username: '2500100481', password: 'TestPass@123', defaultRoute: '/student' },
};

const roleRoutes = {
  admin: [
    { name: 'dashboard', path: '/admin/dashboard' },
    { name: 'records', path: '/admin/records' },
    { name: 'classes', path: '/admin/classes' },
    { name: 'faculty_members', path: '/admin/faculty' },
    { name: 'faculty_assignments', path: '/admin/faculty-assignments' },
    { name: 'attendance_sessions', path: '/admin/attendance' },
    { name: 'roles', path: '/admin/roles' },
    { name: 'chairpersons', path: '/admin/chairpersons' },
    { name: 'timetable', path: '/admin/timetable' },
    { name: 'messages', path: '/admin/messages' },
  ],
  coordinator: [
    { name: 'dashboard', path: '/coordinator/dashboard' },
    { name: 'records', path: '/coordinator/records' },
    { name: 'classes', path: '/coordinator/classes' },
    { name: 'mark_attendance', path: '/coordinator/mark-attendance' },
    { name: 'messages', path: '/coordinator/messages' },
  ],
  chairperson: [
    { name: 'dashboard', path: '/chairperson/dashboard' },
    { name: 'classes', path: '/chairperson/classes' },
    { name: 'records', path: '/chairperson/records' },
    { name: 'mark_attendance', path: '/chairperson/mark-attendance' },
    { name: 'messages', path: '/chairperson/messages' },
    { name: 'logs', path: '/chairperson/logs' },
  ],
  faculty: [
    { name: 'dashboard', path: '/faculty/dashboard' },
    { name: 'profile', path: '/faculty/profile' },
    { name: 'classes', path: '/faculty/classes' },
    { name: 'mark_attendance', path: '/faculty/mark-attendance' },
    { name: 'messages', path: '/faculty/messages' },
  ],
  student: [
    { name: 'dashboard', path: '/student' },
  ],
};

const auditReport = {
  summary: { totalRolesTested: 0, totalPagesTested: 0, totalErrors: 0, totalFailedRequests: 0 },
  roles: {}
};

async function runSuite() {
  console.log('==================================================');
  console.log('STARTING AUTOMATED E2E BROWSER WALKTHROUGH SUITE');
  console.log('==================================================');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1440,900']
  });

  for (const [role, creds] of Object.entries(testAccounts)) {
    console.log(`\n>>> TESTING ROLE: ${role.toUpperCase()} (${creds.username}) <<<`);
    auditReport.summary.totalRolesTested++;
    auditReport.roles[role] = { pages: [], consoleErrors: [], failedRequests: [], workflows: {} };

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    let isTestingLogout = false;

    // Track console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore React dev warnings or harmless favicon errors or expected 401 on logout
        if (!text.includes('favicon.ico') && !(isTestingLogout && text.includes('401'))) {
          console.warn(`[Browser Console Error][${role}]:`, text.slice(0, 120));
          auditReport.roles[role].consoleErrors.push({ text, location: page.url() });
          auditReport.summary.totalErrors++;
        }
      }
    });

    // Track failed network requests
    page.on('response', async (response) => {
      const status = response.status();
      const url = response.url();
      if (isTestingLogout && status === 401) return;
      if (status >= 400 && !url.includes('favicon.ico')) {
        let body = '';
        try { body = await response.text(); } catch {}
        console.warn(`[Network Failure ${status}][${role}]: ${url.slice(0, 80)}`);
        auditReport.roles[role].failedRequests.push({ url, status, body: body.slice(0, 200) });
        auditReport.summary.totalFailedRequests++;
      }
    });

    try {
      // 1. Visit Login Page
      console.log(`1. Navigating to login page...`);
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
      await page.screenshot({ path: path.join(screenshotDir, `${role}_00_login_page.png`) });

      // 2. Perform Login
      console.log(`2. Performing login as ${creds.username}...`);
      await page.waitForSelector('input', { timeout: 5000 });
      
      // Fill login form
      const inputs = await page.$$('input');
      if (inputs.length >= 2) {
        await inputs[0].click({ clickCount: 3 });
        await inputs[0].type(creds.username);
        await inputs[1].click({ clickCount: 3 });
        await inputs[1].type(creds.password);
      }

      // Submit form
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await Promise.all([
          submitBtn.click(),
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {})
        ]);
      }

      await new Promise(r => setTimeout(r, 2000));
      console.log(`Current URL after login attempt: ${page.url()}`);
      await page.screenshot({ path: path.join(screenshotDir, `${role}_01_after_login.png`) });

      // 3. Visit all routes for this role
      const routes = roleRoutes[role] || [];
      for (const r of routes) {
        console.log(`  Visiting route: ${r.name} (${r.path})...`);
        await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'networkidle2', timeout: 15000 }).catch(e => console.warn(`    Navigation error on ${r.path}:`, e.message));
        await new Promise(res => setTimeout(res, 1200)); // Allow reactive effects to resolve
        
        const screenshotFile = `${role}_nav_${r.name}.png`;
        const screenshotPath = path.join(screenshotDir, screenshotFile);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        
        auditReport.roles[role].pages.push({
          name: r.name,
          path: r.path,
          url: page.url(),
          screenshot: screenshotFile
        });
        auditReport.summary.totalPagesTested++;
      }

      // 4. Exercise Student Tabs if student role
      if (role === 'student') {
        console.log(`  Exercising student tabs (Attendance, Timetable, Messages, Fees)...`);
        await page.goto(`${BASE_URL}/student`, { waitUntil: 'networkidle2' });
        
        // Find buttons in student sidebar
        const navButtons = await page.$$('aside nav button');
        const tabNames = ['profile', 'registration', 'attendance', 'timetable', 'fees', 'messages'];
        for (let i = 0; i < navButtons.length; i++) {
          const tabName = tabNames[i] || `tab_${i}`;
          await navButtons[i].click().catch(() => {});
          await new Promise(res => setTimeout(res, 1000));
          await page.screenshot({ path: path.join(screenshotDir, `student_tab_${tabName}.png`) });
        }
      }

      // 5. Test Logout and Session Clearing
      console.log(`5. Testing logout and session clearance...`);
      isTestingLogout = true;
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      const cookies = await page.cookies();
      if (cookies.length) {
        await page.deleteCookie(...cookies);
      }
      try {
        await page.goto(`${BASE_URL}${creds.defaultRoute}`, { waitUntil: 'domcontentloaded', timeout: 8000 });
      } catch (e) {}
      await new Promise(res => setTimeout(res, 1200));
      
      const redirectedUrl = page.url();
      const isRedirectedToLogin = redirectedUrl.includes('/login');
      console.log(`Logout protection check: redirected to login: ${isRedirectedToLogin ? 'YES' : 'NO'} (${redirectedUrl})`);
      auditReport.roles[role].workflows.logoutRedirectVerified = isRedirectedToLogin;

    } catch (err) {
      console.error(`Error during ${role} test:`, err);
    } finally {
      await page.close();
    }
  }

  await browser.close();

  // Save audit report
  const reportPath = path.resolve(__dirname, '..', '..', 'E2E_BROWSER_WALKTHROUGH_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2), 'utf8');
  console.log(`\n==================================================`);
  console.log(`E2E WALKTHROUGH SUITE COMPLETE!`);
  console.log(`Total Roles Tested:    ${auditReport.summary.totalRolesTested}`);
  console.log(`Total Pages Tested:    ${auditReport.summary.totalPagesTested}`);
  console.log(`Total Console Errors:  ${auditReport.summary.totalErrors}`);
  console.log(`Total Failed Requests: ${auditReport.summary.totalFailedRequests}`);
  console.log(`Full JSON Report:      ${reportPath}`);
  console.log(`Screenshots Directory: ${screenshotDir}`);
  console.log(`==================================================`);
}

runSuite().catch(e => { console.error('E2E Suite fatal error:', e); process.exit(1); });
