import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const screenshotDir = 'C:\\Users\\harsh\\.gemini\\antigravity\\brain\\0492bb3c-dcf0-4f20-b946-44c00d83febe\\screenshots\\deep_audit';
const reportFile = 'C:\\Users\\harsh\\OneDrive\\Desktop\\compl sdms - Copy (2)\\sdms-main\\DEEP_BROWSER_AUDIT_REPORT.json';

fs.mkdirSync(screenshotDir, { recursive: true });

const BASE_URL = 'http://localhost:5173';

const accounts = [
  {
    role: 'admin',
    username: 'hod.cs@gbu.ac.in',
    password: 'TestPass@123',
    routes: [
      '/admin/dashboard',
      '/admin/records',
      '/admin/classes',
      '/admin/faculty',
      '/admin/faculty-assignments',
      '/admin/attendance',
      '/admin/roles',
      '/admin/chairpersons',
      '/admin/timetable',
      '/admin/messages',
    ],
  },
  {
    role: 'coordinator',
    username: 'test_coord@gbu.ac.in',
    password: 'TestPass@123',
    routes: [
      '/coordinator/dashboard',
      '/coordinator/records',
      '/coordinator/classes',
      '/coordinator/mark-attendance',
      '/coordinator/messages',
    ],
  },
  {
    role: 'chairperson',
    username: 'test_chair@gbu.ac.in',
    password: 'TestPass@123',
    routes: [
      '/chairperson/dashboard',
      '/chairperson/classes',
      '/chairperson/records',
      '/chairperson/mark-attendance',
      '/chairperson/messages',
      '/chairperson/logs',
    ],
  },
  {
    role: 'faculty',
    username: 'test_faculty@gbu.ac.in',
    password: 'TestPass@123',
    routes: [
      '/faculty/dashboard',
      '/faculty/profile',
      '/faculty/classes',
      '/faculty/mark-attendance',
      '/faculty/messages',
    ],
  },
  {
    role: 'student',
    username: '2500100481',
    password: 'TestPass@123',
    routes: ['/student'],
    tabs: ['profile', 'registration', 'attendance', 'timetable', 'fees', 'messages'],
  },
];

const auditReport = {
  startedAt: new Date().toISOString(),
  summary: {
    totalRolesTested: 0,
    totalPagesVisited: 0,
    totalButtonsClicked: 0,
    totalNetworkRequests: 0,
    failedNetworkRequests: 0,
    consoleErrorsCount: 0,
    consoleWarningsCount: 0,
    screenshotsCaptured: 0,
  },
  networkFailures: [],
  consoleErrors: [],
  roleResults: {},
};

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function runAudit() {
  console.log('===============================================================');
  console.log('STARTING REAL BROWSER DEEP AUDIT PASS');
  console.log('===============================================================');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const page = await browser.newPage();

  page.on('request', () => {
    auditReport.summary.totalNetworkRequests++;
  });

  page.on('response', async (res) => {
    const status = res.status();
    const url = res.url();
    if (status >= 400 && !url.includes('favicon.ico')) {
      auditReport.summary.failedNetworkRequests++;
      let errorBody = '';
      try {
        errorBody = await res.text();
      } catch {}
      auditReport.networkFailures.push({
        url,
        method: res.request().method(),
        status,
        bodySnippet: errorBody.substring(0, 300),
        time: new Date().toISOString(),
      });
      console.error('  [NET ERROR] ' + res.request().method() + ' ' + url + ' -> ' + status);
    }
  });

  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      if (!text.includes('favicon') && !text.includes('chrome-extension')) {
        auditReport.summary.consoleErrorsCount++;
        auditReport.consoleErrors.push({
          type,
          text,
          time: new Date().toISOString(),
        });
        console.error('  [CONSOLE ERROR] ' + text);
      }
    } else if (type === 'warn') {
      if (!text.includes('React Router') && !text.includes('React does not recognize')) {
        auditReport.summary.consoleWarningsCount++;
      }
    }
  });

  page.on('pageerror', (err) => {
    auditReport.summary.consoleErrorsCount++;
    auditReport.consoleErrors.push({
      type: 'uncaught_exception',
      text: err.message,
      time: new Date().toISOString(),
    });
    console.error('  [PAGE EXCEPTION] ' + err.message);
  });

  for (const account of accounts) {
    console.log('\n--------------------------------------------------------------');
    console.log('TESTING ROLE: ' + account.role.toUpperCase() + ' (' + account.username + ')');
    console.log('--------------------------------------------------------------');

    auditReport.roleResults[account.role] = {
      pagesVisited: [],
      buttonsClicked: 0,
      tabsTested: [],
      status: 'pass',
    };

    const client = await page.createCDPSession();
    await client.send('Network.clearBrowserCookies');
    await client.send('Network.clearBrowserCache');

    await page.goto(BASE_URL + '/login', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(600);

    const inputs = await page.$$('input');
    if (inputs.length >= 2) {
      await inputs[0].click({ clickCount: 3 });
      await inputs[0].type(account.username);
      await inputs[1].click({ clickCount: 3 });
      await inputs[1].type(account.password);

      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
      } else {
        const btns = await page.$$('button');
        for (const b of btns) {
          const t = await page.evaluate((el) => el.innerText, b);
          if (t && (t.toLowerCase().includes('log') || t.toLowerCase().includes('sign'))) {
            await b.click();
            break;
          }
        }
      }
    }

    await sleep(2000);
    console.log('  Logged in, landed at: ' + page.url());

    const shotPath = path.join(screenshotDir, account.role + '_01_landing.png');
    await page.screenshot({ path: shotPath });
    auditReport.summary.screenshotsCaptured++;

    for (const r of account.routes) {
      const fullUrl = BASE_URL + r;
      console.log('  Navigating to: ' + r);
      await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await sleep(1000);

      auditReport.summary.totalPagesVisited++;
      auditReport.roleResults[account.role].pagesVisited.push(r);

      const pageShotName = account.role + '_' + r.replace(/[\/-]/g, '_') + '.png';
      await page.screenshot({ path: path.join(screenshotDir, pageShotName) });
      auditReport.summary.screenshotsCaptured++;

      const buttons = await page.$$('button:not([disabled])');
      for (const btn of buttons.slice(0, 6)) {
        try {
          const btnText = await page.evaluate((el) => el.innerText.trim(), btn);
          const lower = btnText.toLowerCase();
          if (
            lower.includes('delete') ||
            lower.includes('remove') ||
            lower.includes('destroy') ||
            lower.includes('logout') ||
            lower.includes('sign out') ||
            lower.includes('reset')
          ) {
            continue;
          }

          if (lower.includes('refresh') || lower.includes('tab') || lower.includes('filter') || lower.includes('view') || lower.includes('export') || lower.length < 25) {
            await btn.click();
            auditReport.summary.totalButtonsClicked++;
            auditReport.roleResults[account.role].buttonsClicked++;
            await sleep(300);
          }
        } catch {}
      }
    }

    if (account.tabs && account.tabs.length > 0) {
      for (const tab of account.tabs) {
        console.log('  Testing Student Tab: ' + tab);
        const clicked = await page.evaluate((tabName) => {
          const elements = Array.from(document.querySelectorAll('button, a, div, li, span'));
          for (const el of elements) {
            const txt = (el.innerText || '').toLowerCase().trim();
            if (
              (tabName === 'timetable' && (txt.includes('time table') || txt.includes('timetable'))) ||
              (tabName === 'fees' && (txt.includes('fee') || txt.includes('account'))) ||
              (tabName === 'attendance' && txt === 'attendance') ||
              (tabName === 'registration' && txt === 'registration') ||
              (tabName === 'profile' && txt === 'profile') ||
              (tabName === 'messages' && txt === 'messages')
            ) {
              el.click();
              return true;
            }
          }
          return false;
        }, tab);

        if (clicked) {
          await sleep(1000);
          auditReport.roleResults[account.role].tabsTested.push(tab);
          const tabShot = path.join(screenshotDir, 'student_tab_' + tab + '.png');
          await page.screenshot({ path: tabShot });
          auditReport.summary.screenshotsCaptured++;

          if (tab === 'messages') {
            await page.evaluate(() => {
              const b = Array.from(document.querySelectorAll('button')).find((x) =>
                x.innerText.toLowerCase().includes('sent')
              );
              if (b) b.click();
            });
            await sleep(600);
            await page.screenshot({ path: path.join(screenshotDir, 'student_messages_sent_view.png') });
            auditReport.summary.screenshotsCaptured++;

            await page.evaluate(() => {
              const b = Array.from(document.querySelectorAll('button')).find((x) =>
                x.innerText.toLowerCase().includes('inbox')
              );
              if (b) b.click();
            });
            await sleep(600);
          }
        }
      }
    }

    auditReport.summary.totalRolesTested++;
  }

  await browser.close();

  auditReport.completedAt = new Date().toISOString();
  fs.writeFileSync(reportFile, JSON.stringify(auditReport, null, 2), 'utf-8');

  console.log('\n===============================================================');
  console.log('REAL BROWSER DEEP AUDIT COMPLETED!');
  console.log('Total Roles Tested:        ' + auditReport.summary.totalRolesTested);
  console.log('Total Pages Visited:       ' + auditReport.summary.totalPagesVisited);
  console.log('Total Buttons Clicked:     ' + auditReport.summary.totalButtonsClicked);
  console.log('Total Network Requests:    ' + auditReport.summary.totalNetworkRequests);
  console.log('Failed Network Requests:   ' + auditReport.summary.failedNetworkRequests);
  console.log('Console Errors:            ' + auditReport.summary.consoleErrorsCount);
  console.log('Console Warnings:          ' + auditReport.summary.consoleWarningsCount);
  console.log('Screenshots Captured:      ' + auditReport.summary.screenshotsCaptured);
  console.log('Full JSON Report Written:  ' + reportFile);
  console.log('===============================================================');
}

runAudit().catch((err) => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
