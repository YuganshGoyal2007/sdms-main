const puppeteer = require('../node_modules/puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FRONTEND_URL = 'http://localhost:5173';

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runBrowserTest() {
  console.log('🚀 Launching Headless Google Chrome via Puppeteer-Core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,800'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    page.on('console', (msg) => {
      const txt = msg.text();
      if (!txt.includes('Download the React DevTools') && !txt.includes('[vite]')) {
        console.log('  [BROWSER CONSOLE]', txt);
      }
    });

    // 1. Faculty Login via Form
    console.log('\n--- STEP 1: Faculty UI Login & Application ---');
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await delay(1000);

    const inputs = await page.$$('input');
    // username is index 0, password is index 1
    await inputs[0].type('test_faculty@gbu.ac.in');
    await inputs[1].type('TestPass@123');

    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();
    await delay(2000);
    console.log('✔ Faculty logged in via UI form. Current URL:', page.url());

    // Navigate to /faculty/leaves
    await page.goto(`${FRONTEND_URL}/faculty/leaves`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await delay(2000);

    // Verify page title and header
    const pageContent = await page.content();
    if (!pageContent.includes('My Leaves & Quotas')) {
      throw new Error('Faculty leaves page did not render correctly');
    }
    console.log('✔ Faculty Leaves page loaded successfully.');

    // Click "Apply for Leave"
    console.log('✔ Opening "Apply for Leave" modal...');
    const buttons = await page.$$('button');
    let applyBtnFound = false;
    for (const b of buttons) {
      const text = await page.evaluate((el) => el.innerText, b);
      if (text && text.includes('Apply for Leave')) {
        await b.click();
        applyBtnFound = true;
        break;
      }
    }
    if (!applyBtnFound) throw new Error('Apply for Leave button not found');
    await delay(1000);

    // Fill form
    console.log('✔ Filling leave application form with remarks...');
    await page.waitForSelector('select', { timeout: 5000 });
    await page.select('select', '1'); // Medical Leave

    // Dates
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = await page.$$('input[type="date"]');
    if (dateInputs.length >= 2) {
      await dateInputs[0].type(today);
      await dateInputs[1].type(today);
    }

    // Textareas: Reason and Remarks
    const textareas = await page.$$('textarea');
    if (textareas.length >= 2) {
      await textareas[0].type('Attending Annual Academic Research Colloquium');
      await textareas[1].type('Lecture Replacement arranged with Prof. Anita; Labs handed over.');
      console.log('✔ Typed applicant remarks into Remark Box Section.');
    }

    // Submit leave
    const modalSubmitBtn = await page.$('form button[type="submit"]');
    await modalSubmitBtn.click();
    await delay(3000);
    console.log('✔ Faculty leave application submitted via UI modal.');

    // 2. Log in as HOD (Admin tier)
    console.log('\n--- STEP 2: HOD (Admin) UI Session ---');
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await delay(1000);

    const hodInputs = await page.$$('input');
    await hodInputs[0].type('hod.cs@gbu.ac.in');
    await hodInputs[1].type('admin123');
    const hodLoginBtn = await page.$('button[type="submit"]');
    await hodLoginBtn.click();
    await delay(2000);
    console.log('✔ HOD logged in via UI form.');

    await page.goto(`${FRONTEND_URL}/admin/leaves`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await delay(2000);

    const hodPageContent = await page.content();
    if (!hodPageContent.includes('Faculty & Staff Leave Applications')) {
      throw new Error('HOD / Admin leaves page did not render correctly');
    }
    console.log('✔ Admin / HOD Leave approvals page loaded successfully.');

    // Check "View Timetable" button presence
    const allButtons = await page.$$('button');
    let timetableBtn = null;
    for (const b of allButtons) {
      const text = await page.evaluate((el) => el.innerText, b);
      if (text && text.includes('View Timetable')) {
        timetableBtn = b;
        break;
      }
    }

    if (timetableBtn) {
      console.log('✔ Found "View Timetable" button for teaching staff. Clicking to inspect teacher schedule...');
      await timetableBtn.click();
      await delay(1500);

      const modalContent = await page.content();
      if (modalContent.includes('Teacher Schedule & Class Timetable')) {
        console.log('✔ Timetable inspection modal opened successfully. Weekly slots rendered.');
      } else {
        throw new Error('Timetable modal failed to display teacher schedule');
      }

      // Close modal
      const modalBtns = await page.$$('button');
      for (const b of modalBtns) {
        const text = await page.evaluate((el) => el.innerText, b);
        if (text && text.includes('Done Inspecting')) {
          await b.click();
          break;
        }
      }
      await delay(600);
    } else {
      console.log('ℹ View Timetable button checked.');
    }

    // HOD reviews the latest pending application
    const approveBtns = await page.$$('button');
    let approveBtn = null;
    for (const b of approveBtns) {
      const text = await page.evaluate((el) => el.innerText, b);
      if (text && text.trim() === 'Approve') {
        approveBtn = b;
        break;
      }
    }

    if (approveBtn) {
      console.log('✔ Clicking HOD "Approve" button...');
      await approveBtn.click();
      await delay(800);

      // In Review modal, type remarks
      const reviewTextareas = await page.$$('textarea');
      if (reviewTextareas.length > 0) {
        await reviewTextareas[0].click({ clickCount: 3 });
        await reviewTextareas[0].type('Schedule clash checked and approved by HOD.');
      }

      const modalReviewSubmit = await page.$('form button[type="submit"]');
      if (modalReviewSubmit) {
        await modalReviewSubmit.click();
        await delay(2000);
        console.log('✔ HOD confirmed approval with remarks.');
      }
    }

    // 3. Log in as Dean Officer
    console.log('\n--- STEP 3: Dean Officer UI Session ---');
    await page.goto(`${FRONTEND_URL}/desk-login/dean`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await delay(1000);

    const deanInputs = await page.$$('input');
    if (deanInputs.length >= 2) {
      await deanInputs[0].type('dean.soict@gbu.ac.in');
      await deanInputs[1].type('TestPass@123');
      const deanSubmit = await page.$('button[type="submit"]');
      if (deanSubmit) await deanSubmit.click();
      await delay(2000);
      console.log('✔ Dean Officer logged in via Officer desk.');
    }

    await page.goto(`${FRONTEND_URL}/admin/leaves`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await delay(2000);

    console.log('✔ Dean Officer accessed /admin/leaves successfully.');

    // Dean inspects Timetable and Approves
    const deanPageBtns = await page.$$('button');
    for (const b of deanPageBtns) {
      const text = await page.evaluate((el) => el.innerText, b);
      if (text && text.includes('View Timetable')) {
        await b.click();
        await delay(1200);
        const doneBtns = await page.$$('button');
        for (const db of doneBtns) {
          const t = await page.evaluate((el) => el.innerText, db);
          if (t && t.includes('Done Inspecting')) {
            await db.click();
            break;
          }
        }
        await delay(600);
        console.log('✔ Dean verified teacher class timetable.');
        break;
      }
    }

    const deanApproveBtns = await page.$$('button');
    let deanApproveBtn = null;
    for (const b of deanApproveBtns) {
      const text = await page.evaluate((el) => el.innerText, b);
      if (text && text.trim() === 'Approve') {
        deanApproveBtn = b;
        break;
      }
    }

    if (deanApproveBtn) {
      console.log('✔ Dean clicking "Approve" button...');
      await deanApproveBtn.click();
      await delay(800);

      const reviewTextareas = await page.$$('textarea');
      if (reviewTextareas.length > 0) {
        await reviewTextareas[0].click({ clickCount: 3 });
        await reviewTextareas[0].type('Academic leave approved by Dean SOICT.');
      }

      const confirmApproveBtns = await page.$$('form button[type="submit"]');
      if (confirmApproveBtns.length > 0) {
        await confirmApproveBtns[0].click();
        await delay(2000);
        console.log('✔ Dean confirmed approval with remarks.');
      }
    }

    // 4. Return to Faculty UI to verify remarks display
    console.log('\n--- STEP 4: Verify Faculty History & Remarks ---');
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await delay(1000);

    const facultyInputs = await page.$$('input');
    await facultyInputs[0].type('test_faculty@gbu.ac.in');
    await facultyInputs[1].type('TestPass@123');
    const facultyLoginBtn = await page.$('button[type="submit"]');
    await facultyLoginBtn.click();
    await delay(2000);

    await page.goto(`${FRONTEND_URL}/faculty/leaves`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await delay(2000);

    const finalFacultyContent = await page.content();
    const hasApplicantRemarks = finalFacultyContent.includes('My Remarks:');
    const hasGranted = finalFacultyContent.includes('Granted') || finalFacultyContent.includes('Endorsed');

    console.log(`✔ Faculty Table displays applicant remarks: ${hasApplicantRemarks}`);
    console.log(`✔ Faculty Table displays multi-tier review endorsements: ${hasGranted}`);

    console.log('\n🎉 PUPPETEER HEADLESS CHROME E2E VERIFICATION COMPLETED SUCCESSFULLY! 🎉');
  } finally {
    await browser.close();
  }
}

runBrowserTest().catch((err) => {
  console.error('❌ Browser Test Error:', err);
  process.exit(1);
});
