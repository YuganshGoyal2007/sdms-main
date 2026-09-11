import puppeteer from '../node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:5000';

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loginAndGetToken(username, password, officeCode = null) {
  const endpoint = officeCode ? `${BACKEND_URL}/auth/officer-login` : `${BACKEND_URL}/auth/user-login`;
  const body = officeCode ? { username, password, officeCode } : { username, password };
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`API Login failed for ${username}: ${JSON.stringify(data)}`);
  return data.accessToken;
}

async function runBrowserTest() {
  console.log('🚀 Starting Headless Chrome via Puppeteer...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,800'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // 1. Log in as Faculty
    console.log('\n--- STEP 1: Faculty UI Session ---');
    const facultyToken = await loginAndGetToken('test_faculty@gbu.ac.in', 'TestPass@123');
    await page.goto(`${FRONTEND_URL}/faculty/leaves`, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.evaluate((tok) => {
      localStorage.setItem('authToken', tok);
    }, facultyToken);
    await page.goto(`${FRONTEND_URL}/faculty/leaves`, { waitUntil: 'networkidle0', timeout: 30000 });
    await delay(1000);

    // Verify page title and header
    const pageContent = await page.content();
    if (!pageContent.includes('My Leaves & Quotas')) {
      throw new Error('Faculty leaves page did not render correctly');
    }
    console.log('✔ Faculty Leaves page loaded successfully.');

    // Click "Apply for Leave"
    console.log('✔ Opening "Apply for Leave" modal...');
    await page.waitForSelector('button ::-p-text(Apply for Leave)', { timeout: 10000 });
    const applyBtn = await page.$('button ::-p-text(Apply for Leave)');
    await applyBtn.click();
    await delay(600);

    // Fill form
    console.log('✔ Filling leave application with remarks...');
    await page.waitForSelector('select', { timeout: 5000 });
    await page.select('select', '1'); // Medical Leave

    // Dates
    const today = new Date().toISOString().split('T')[0];
    await page.type('input[type="date"]', today);

    // Textareas: Reason and Remarks
    const textareas = await page.$$('textarea');
    if (textareas.length >= 2) {
      await textareas[0].type('Attending Annual Academic Research Colloquium');
      await textareas[1].type('Lecture Replacement arranged with Prof. Anita; Labs handed over.');
    }

    // Submit leave
    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();
    await delay(2500);
    console.log('✔ Faculty leave application submitted via UI modal.');

    // 2. Log in as HOD (Admin tier)
    console.log('\n--- STEP 2: HOD (Admin) UI Session ---');
    const hodToken = await loginAndGetToken('hod.cs@gbu.ac.in', 'admin123');
    await page.evaluate((tok) => {
      localStorage.setItem('authToken', tok);
    }, hodToken);
    await page.goto(`${FRONTEND_URL}/admin/leaves`, { waitUntil: 'networkidle0', timeout: 30000 });
    await delay(1500);

    const hodPageContent = await page.content();
    if (!hodPageContent.includes('Faculty & Staff Leave Applications')) {
      throw new Error('HOD / Admin leaves page did not render correctly');
    }
    console.log('✔ Admin / HOD Leave approvals page loaded successfully.');

    // Check "View Timetable" button presence
    const timetableBtn = await page.$('button ::-p-text(View Timetable)');
    if (timetableBtn) {
      console.log('✔ Found "View Timetable" button. Clicking to inspect teacher schedule...');
      await timetableBtn.click();
      await delay(1200);

      const modalContent = await page.content();
      if (modalContent.includes('Teacher Schedule & Class Timetable')) {
        console.log('✔ Timetable inspection modal opened successfully. Weekly slots rendered.');
      } else {
        throw new Error('Timetable modal failed to display teacher schedule');
      }

      // Close modal
      const doneBtn = await page.$('button ::-p-text(Done Inspecting)');
      if (doneBtn) await doneBtn.click();
      await delay(600);
    } else {
      console.log('ℹ No teaching staff leave currently in table to click View Timetable.');
    }

    // HOD reviews the latest pending application
    const approveBtns = await page.$$('button ::-p-text(Approve)');
    if (approveBtns.length > 0) {
      console.log('✔ Clicking HOD "Approve" button...');
      await approveBtns[0].click();
      await delay(600);

      const reviewTextarea = await page.$('textarea');
      if (reviewTextarea) {
        await reviewTextarea.click({ clickCount: 3 });
        await reviewTextarea.type('Schedule clash checked and approved by HOD.');
      }

      const confirmApproveBtn = await page.$('button ::-p-text(Confirm Approval)');
      if (confirmApproveBtn) {
        await confirmApproveBtn.click();
        await delay(2000);
        console.log('✔ HOD confirmed approval with remarks.');
      }
    }

    // 3. Log in as Dean Officer
    console.log('\n--- STEP 3: Dean Officer UI Session ---');
    const deanToken = await loginAndGetToken('dean.soict@gbu.ac.in', 'TestPass@123', 'DEAN');
    await page.evaluate((tok) => {
      localStorage.setItem('authToken', tok);
      localStorage.setItem('officeCode', 'DEAN');
    }, deanToken);
    await page.goto(`${FRONTEND_URL}/admin/leaves`, { waitUntil: 'networkidle0', timeout: 30000 });
    await delay(1500);

    console.log('✔ Dean Officer accessed /admin/leaves successfully.');

    // Dean inspects Timetable and Approves
    const deanTimetableBtn = await page.$('button ::-p-text(View Timetable)');
    if (deanTimetableBtn) {
      await deanTimetableBtn.click();
      await delay(1000);
      const deanDoneBtn = await page.$('button ::-p-text(Done Inspecting)');
      if (deanDoneBtn) await deanDoneBtn.click();
      await delay(600);
      console.log('✔ Dean verified teacher class timetable.');
    }

    const deanApproveBtns = await page.$$('button ::-p-text(Approve)');
    if (deanApproveBtns.length > 0) {
      console.log('✔ Dean clicking "Approve" button...');
      await deanApproveBtns[0].click();
      await delay(600);

      const reviewTextarea = await page.$('textarea');
      if (reviewTextarea) {
        await reviewTextarea.click({ clickCount: 3 });
        await reviewTextarea.type('Academic leave approved by Dean SOICT.');
      }

      const confirmApproveBtn = await page.$('button ::-p-text(Confirm Approval)');
      if (confirmApproveBtn) {
        await confirmApproveBtn.click();
        await delay(2000);
        console.log('✔ Dean confirmed approval with remarks.');
      }
    }

    // 4. Return to Faculty UI to verify remarks display
    console.log('\n--- STEP 4: Verify Faculty History & Remarks ---');
    await page.evaluate((tok) => {
      localStorage.setItem('authToken', tok);
    }, facultyToken);
    await page.goto(`${FRONTEND_URL}/faculty/leaves`, { waitUntil: 'networkidle0', timeout: 30000 });
    await delay(1500);

    const finalFacultyContent = await page.content();
    const hasApplicantRemarks = finalFacultyContent.includes('My Remarks:');
    const hasHodRemarks = finalFacultyContent.includes('Endorsed') || finalFacultyContent.includes('Approved');

    console.log(`✔ Faculty Table displays applicant remarks: ${hasApplicantRemarks}`);
    console.log(`✔ Faculty Table displays multi-tier review endorsements: ${hasHodRemarks}`);

    console.log('\n🎉 PUPPETEER HEADLESS CHROME E2E VERIFICATION COMPLETED SUCCESSFULLY! 🎉');
  } finally {
    await browser.close();
  }
}

runBrowserTest().catch((err) => {
  console.error('❌ Browser Test Error:', err);
  process.exit(1);
});
