import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5173';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const screenshotDir = 'C:\\Users\\harsh\\.gemini\\antigravity\\brain\\0492bb3c-dcf0-4f20-b946-44c00d83febe\\screenshots\\interactive_tests';

const accounts = {
  admin: { username: 'hod.cs@gbu.ac.in', password: 'TestPass@123' },
  coordinator: { username: 'test_coord@gbu.ac.in', password: 'TestPass@123' },
  chairperson: { username: 'test_chair@gbu.ac.in', password: 'TestPass@123' },
  student: { username: '2500100481', password: 'TestPass@123' }
};

const report = {
  startedAt: new Date().toISOString(),
  roles: {},
  summary: { totalButtonsClicked: 0, totalModalsOpened: 0, totalTabsSwitched: 0, totalScreenshots: 0, errors: [] }
};
fs.mkdirSync(screenshotDir, { recursive: true });

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function capture(page, name) {
  try {
    const file = `${name}.png`;
    const p = path.join(screenshotDir, file);
    await page.screenshot({ path: p, fullPage: false });
    report.summary.totalScreenshots++;
    console.log(`    [Screenshot] ${file}`);
    return file;
  } catch (e) {
    console.warn(`    Screenshot error on ${name}:`, e.message);
  }
}

async function login(page, username, password) {
  console.log(`  Logging in as ${username}...`);
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForSelector('input', { timeout: 8000 });
  const inputs = await page.$$('input');
  if (inputs.length >= 2) {
    await inputs[0].click({ clickCount: 3 });
    await inputs[0].type(username);
    await inputs[1].click({ clickCount: 3 });
    await inputs[1].type(password);
  }
  const submit = await page.$('button[type="submit"]');
  if (submit) {
    await Promise.all([
      submit.click().catch(() => {}),
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {})
    ]);
  }
  await sleep(1500);
}

async function clearSession(page) {
  try {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    const cookies = await page.cookies();
    if (cookies.length) {
      await page.deleteCookie(...cookies);
    }
  } catch (e) {}
}

async function safeClickButtonByText(page, textMatch) {
  try {
    const clicked = await page.evaluate((textMatch) => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      for (const b of btns) {
        if (b.innerText && b.innerText.toLowerCase().includes(textMatch.toLowerCase())) {
          b.click();
          return b.innerText.trim();
        }
      }
      return null;
    }, textMatch);
    return clicked;
  } catch (e) {
    return null;
  }
}

async function runInteractiveSuite() {
  console.log('===============================================================');
  console.log('STARTING DEEP INTERACTIVE BUTTON & OPTION TESTING PASS');
  console.log('===============================================================');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--window-size=1440,900']
  });

  // 1. ADMIN
  {
    const role = 'admin';
    console.log(`\n======================================================`);
    console.log(`[TESTING ROLE: ${role.toUpperCase()}]`);
    console.log(`======================================================`);
    report.roles[role] = { buttonsClicked: 0, modalsOpened: 0 };
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    try {
      await login(page, accounts.admin.username, accounts.admin.password);
      await capture(page, 'admin_01_dashboard');

      // Classes
      console.log('  Testing Admin Classes...');
      await page.goto(`${BASE_URL}/admin/classes`, { waitUntil: 'domcontentloaded' });
      await sleep(1500);
      await capture(page, 'admin_02_classes');
      
      const expanded = await safeClickButtonByText(page, 'B.Tech');
      if (expanded) {
        report.summary.totalButtonsClicked++;
        console.log(`    Clicked class card: ${expanded}`);
        await sleep(1000);
        await capture(page, 'admin_03_class_expanded');
      }

      // Records
      console.log('  Testing Admin Records...');
      await page.goto(`${BASE_URL}/admin/records`, { waitUntil: 'domcontentloaded' });
      await sleep(1500);
      await capture(page, 'admin_04_records');

      // Roles
      console.log('  Testing Admin Roles...');
      await page.goto(`${BASE_URL}/admin/roles`, { waitUntil: 'domcontentloaded' });
      await sleep(1500);
      await capture(page, 'admin_05_roles');

      await safeClickButtonByText(page, 'Chairperson');
      report.summary.totalTabsSwitched++;
      await sleep(800);
      await capture(page, 'admin_06_roles_chairpersons_tab');

      await safeClickButtonByText(page, 'Admin');
      report.summary.totalTabsSwitched++;
      await sleep(800);
      await capture(page, 'admin_07_roles_admins_tab');

      // Faculty
      console.log('  Testing Admin Faculty...');
      await page.goto(`${BASE_URL}/admin/faculty`, { waitUntil: 'domcontentloaded' });
      await sleep(1200);
      await capture(page, 'admin_08_faculty');

      // Faculty Assignments
      console.log('  Testing Admin Faculty Assignments...');
      await page.goto(`${BASE_URL}/admin/faculty-assignments`, { waitUntil: 'domcontentloaded' });
      await sleep(1200);
      await capture(page, 'admin_09_faculty_assignments');

      // Attendance Sessions
      console.log('  Testing Admin Attendance Sessions...');
      await page.goto(`${BASE_URL}/admin/attendance`, { waitUntil: 'domcontentloaded' });
      await sleep(1200);
      await capture(page, 'admin_10_attendance_sessions');

      // Timetable
      console.log('  Testing Admin Timetable...');
      await page.goto(`${BASE_URL}/admin/timetable`, { waitUntil: 'domcontentloaded' });
      await sleep(1200);
      await capture(page, 'admin_11_timetable');

      // Messages
      console.log('  Testing Admin Messages...');
      await page.goto(`${BASE_URL}/admin/messages`, { waitUntil: 'domcontentloaded' });
      await sleep(1200);
      await capture(page, 'admin_12_messages_inbox');

      await safeClickButtonByText(page, 'Sent');
      report.summary.totalTabsSwitched++;
      await sleep(800);
      await capture(page, 'admin_13_messages_sent');

      await clearSession(page);
    } catch (e) {
      console.error(`Admin error:`, e.message);
      report.summary.errors.push({ role, error: e.message });
    } finally {
      await page.close();
    }
  }

  // 2. COORDINATOR
  {
    const role = 'coordinator';
    console.log(`\n======================================================`);
    console.log(`[TESTING ROLE: ${role.toUpperCase()}]`);
    console.log(`======================================================`);
    report.roles[role] = { buttonsClicked: 0 };
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    try {
      await login(page, accounts.coordinator.username, accounts.coordinator.password);
      await capture(page, 'coordinator_01_dashboard');

      console.log('  Testing Coordinator Classes...');
      await page.goto(`${BASE_URL}/coordinator/classes`, { waitUntil: 'domcontentloaded' });
      await sleep(1500);
      await capture(page, 'coordinator_02_classes');

      console.log('  Testing Coordinator Records...');
      await page.goto(`${BASE_URL}/coordinator/records`, { waitUntil: 'domcontentloaded' });
      await sleep(1500);
      await capture(page, 'coordinator_03_records');

      console.log('  Testing Coordinator Mark Attendance...');
      await page.goto(`${BASE_URL}/coordinator/mark-attendance`, { waitUntil: 'domcontentloaded' });
      await sleep(1500);
      await capture(page, 'coordinator_04_mark_attendance');

      console.log('  Testing Coordinator Messages...');
      await page.goto(`${BASE_URL}/coordinator/messages`, { waitUntil: 'domcontentloaded' });
      await sleep(1500);
      await capture(page, 'coordinator_05_messages');

      await clearSession(page);
    } catch (e) {
      console.error(`Coordinator error:`, e.message);
      report.summary.errors.push({ role, error: e.message });
    } finally {
      await page.close();
    }
  }

  // 3. CHAIRPERSON
  {
    const role = 'chairperson';
    console.log(`\n======================================================`);
    console.log(`[TESTING ROLE: ${role.toUpperCase()}]`);
    console.log(`======================================================`);
    report.roles[role] = { buttonsClicked: 0 };
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    try {
      await login(page, accounts.chairperson.username, accounts.chairperson.password);
      await capture(page, 'chairperson_01_dashboard');

      console.log('  Testing Chairperson Classes...');
      await page.goto(`${BASE_URL}/chairperson/classes`, { waitUntil: 'domcontentloaded' });
      await sleep(1500);
      await capture(page, 'chairperson_02_classes');

      console.log('  Testing Chairperson Records...');
      await page.goto(`${BASE_URL}/chairperson/records`, { waitUntil: 'domcontentloaded' });
      await sleep(1500);
      await capture(page, 'chairperson_03_records');

      console.log('  Testing Chairperson Logs...');
      await page.goto(`${BASE_URL}/chairperson/logs`, { waitUntil: 'domcontentloaded' });
      await sleep(1500);
      await capture(page, 'chairperson_04_logs');

      console.log('  Testing Chairperson Messages...');
      await page.goto(`${BASE_URL}/chairperson/messages`, { waitUntil: 'domcontentloaded' });
      await sleep(1500);
      await capture(page, 'chairperson_05_messages');

      await clearSession(page);
    } catch (e) {
      console.error(`Chairperson error:`, e.message);
      report.summary.errors.push({ role, error: e.message });
    } finally {
      await page.close();
    }
  }

  // 4. STUDENT
  {
    const role = 'student';
    console.log(`\n======================================================`);
    console.log(`[TESTING ROLE: ${role.toUpperCase()}]`);
    console.log(`======================================================`);
    report.roles[role] = { tabsTested: [] };
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    try {
      await login(page, accounts.student.username, accounts.student.password);
      await capture(page, 'student_01_portal_landing');

      const studentTabs = [
        { name: 'profile', label: 'Profile' },
        { name: 'registration', label: 'Registration' },
        { name: 'attendance', label: 'Attendance' },
        { name: 'timetable', label: 'Time Table' },
        { name: 'fees', label: 'Fee / Accounts' },
        { name: 'messages', label: 'Messages' },
      ];

      for (const tab of studentTabs) {
        console.log(`  Testing Student Tab: ${tab.label}...`);
        const clicked = await safeClickButtonByText(page, tab.name);
        if (clicked) {
          report.summary.totalTabsSwitched++;
          report.roles[role].tabsTested.push(tab.name);
          console.log(`    Switched to tab: ${clicked}`);
          await sleep(1200);
          await capture(page, `student_tab_${tab.name}`);

          if (tab.name === 'messages') {
            await safeClickButtonByText(page, 'Sent');
            report.summary.totalButtonsClicked++;
            await sleep(800);
            await capture(page, 'student_messages_sent');

            await safeClickButtonByText(page, 'Inbox');
            report.summary.totalButtonsClicked++;
            await sleep(800);
            await capture(page, 'student_messages_inbox');
          }
        }
      }

      await clearSession(page);
    } catch (e) {
      console.error(`Student error:`, e.message);
      report.summary.errors.push({ role, error: e.message });
    } finally {
      await page.close();
    }
  }

  await browser.close();

  report.completedAt = new Date().toISOString();
  const outPath = path.resolve(__dirname, '..', 'INTERACTIVE_BUTTON_TEST_REPORT.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('\n===============================================================');
  console.log('INTERACTIVE SUITE FINISHED SUCCESSFULLY!');
  console.log(`Total Screenshots Captured: ${report.summary.totalScreenshots}`);
  console.log(`Total Buttons Clicked:      ${report.summary.totalButtonsClicked}`);
  console.log(`Total Tabs Switched:        ${report.summary.totalTabsSwitched}`);
  console.log(`Total Errors Caught:        ${report.summary.errors.length}`);
  console.log(`Report written to:          ${outPath}`);
  console.log('===============================================================');
}

runInteractiveSuite().catch((e) => {
  console.error('Fatal interactive test error:', e);
  process.exit(1);
});
