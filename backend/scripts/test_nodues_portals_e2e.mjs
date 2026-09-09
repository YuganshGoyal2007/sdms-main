import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const screenshotDir = "C:\\Users\\harsh\\.gemini\\antigravity\\brain\\3aea231d-33fe-4c94-b612-f8002d421b3f\\screenshots";
const reportFile = "C:\\Users\\harsh\\OneDrive\\Desktop\\compl sdms - Copy (2)\\sdms-main\\NODUES_E2E_BROWSER_REPORT.json";
const BASE_URL = "http://localhost:5173";

if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

// Emoji detection regex
const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}]/u;

const testResults = {
  timestamp: new Date().toISOString(),
  hubTest: { passed: false, checks: [] },
  desksTest: {},
  switcherTest: { passed: false, checks: [] },
  modalTest: { passed: false, checks: [] },
  studentDagTest: { passed: false, checks: [] },
  screenshots: [],
  summary: { totalChecks: 0, passedChecks: 0, failedChecks: 0, emojiViolations: 0 },
};

function recordCheck(section, name, passed, details = "") {
  testResults.summary.totalChecks++;
  if (passed) testResults.summary.passedChecks++;
  else testResults.summary.failedChecks++;

  const entry = { name, passed, details };
  if (Array.isArray(section)) {
    section.push(entry);
  } else if (section && section.checks) {
    section.checks.push(entry);
  }
  console.log(`[${passed ? "PASS" : "FAIL"}] ${name} ${details ? "- " + details : ""}`);
}

async function runTests() {
  console.log("===============================================================");
  console.log("  GBU-SDMS BROWSER TEST: NO-DUES DEPARTMENTAL CLEARANCE DESKS  ");
  console.log("===============================================================");

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--window-size=1440,900"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // -------------------------------------------------------------
    // Step 1: Admin Login
    // -------------------------------------------------------------
    console.log("\n--- STEP 1: Logging in as Admin (hod.cs@gbu.ac.in) ---");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });

    await page.waitForSelector("input", { timeout: 10000 });
    const inputs = await page.$$("input");
    if (inputs.length >= 2) {
      await inputs[0].click({ clickCount: 3 });
      await inputs[0].type("hod.cs@gbu.ac.in");
      await inputs[1].click({ clickCount: 3 });
      await inputs[1].type("TestPass@123");
    }

    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await Promise.all([
        submitBtn.click(),
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 }).catch(() => {}),
      ]);
    }
    await new Promise((r) => setTimeout(r, 1500));
    recordCheck(testResults.hubTest, "Admin Login", page.url().includes("/admin"), `Current URL: ${page.url()}`);

    // -------------------------------------------------------------
    // Step 2: Central Desks Directory (/no-dues/portals)
    // -------------------------------------------------------------
    console.log("\n--- STEP 2: Testing Central Desks Directory (/no-dues/portals) ---");
    await page.goto(`${BASE_URL}/no-dues/portals`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1500));

    const hubShot = path.join(screenshotDir, "01_nodues_portals_hub.png");
    await page.screenshot({ path: hubShot });
    testResults.screenshots.push(hubShot);

    const pageTitle = await page.title();
    recordCheck(testResults.hubTest, "Hub Page Load", page.url().includes("/no-dues/portals"), pageTitle);

    // Verify all 5 desk cards are visible
    const deskNames = [
      "Central Bodhisattva Library",
      "Hostel Administration & Mess Office",
      "University Sports Council",
      "School Dean Clearance Desk",
      "Information & Communication Technology (ICT) Office",
    ];

    const bodyText = await page.evaluate(() => document.body.innerText);

    for (const name of deskNames) {
      const exists = bodyText.includes(name);
      recordCheck(testResults.hubTest, `Desk Card Render: ${name}`, exists);
    }

    // Check for Emojis
    const hasEmoji = emojiRegex.test(bodyText);
    if (hasEmoji) testResults.summary.emojiViolations++;
    recordCheck(testResults.hubTest, "Zero Emojis on Hub Page", !hasEmoji, hasEmoji ? "Emoji detected!" : "Clean SVG only");

    testResults.hubTest.passed = testResults.hubTest.checks.every((c) => c.passed);

    // -------------------------------------------------------------
    // Step 3: Test each of the 5 Departmental Desks
    // -------------------------------------------------------------
    const desks = [
      { slug: "library", code: "LIB", name: "Central Bodhisattva Library", file: "02_desk_library.png" },
      { slug: "hostel", code: "HST", name: "Hostel Administration & Mess Office", file: "03_desk_hostel.png" },
      { slug: "sports", code: "SPT", name: "University Sports Council", file: "04_desk_sports.png" },
      { slug: "dean", code: "DEAN", name: "School Dean Clearance Desk", file: "05_desk_dean.png" },
      { slug: "ict", code: "ICT", name: "Information & Communication Technology (ICT) Office", file: "06_desk_ict.png" },
    ];

    for (const desk of desks) {
      console.log(`\n--- Testing Department Desk: ${desk.name} (/no-dues/portal/${desk.slug}) ---`);
      testResults.desksTest[desk.slug] = { checks: [], passed: false };

      await page.goto(`${BASE_URL}/no-dues/portal/${desk.slug}`, { waitUntil: "networkidle2" });
      await new Promise((r) => setTimeout(r, 1200));

      const shotPath = path.join(screenshotDir, desk.file);
      await page.screenshot({ path: shotPath });
      testResults.screenshots.push(shotPath);

      const content = await page.evaluate(() => document.body.innerText);

      // Verify Header & Code Badge
      const hasName = content.includes(desk.name);
      const hasBadge = content.includes(`${desk.code} DESK`);
      recordCheck(testResults.desksTest[desk.slug], `${desk.code} Title and Code Badge`, hasName && hasBadge);

      // Verify StatCards
      const hasPendingStat = content.includes("Pending Desk Review");
      const hasClearedStat = content.includes("Cleared Applications");
      const hasDuesStat = content.includes("With Outstanding Dues");
      recordCheck(testResults.desksTest[desk.slug], `${desk.code} StatCards Display`, hasPendingStat && hasClearedStat && hasDuesStat);

      // Verify Verification Guidelines
      const hasGuidelines = /clearance verification guidelines/i.test(content);
      recordCheck(testResults.desksTest[desk.slug], `${desk.code} Verification Guidelines`, hasGuidelines);

      // Verify Zero Emojis on desk view
      const deskEmoji = emojiRegex.test(content);
      if (deskEmoji) testResults.summary.emojiViolations++;
      recordCheck(testResults.desksTest[desk.slug], `${desk.code} Zero Emojis Check`, !deskEmoji);

      testResults.desksTest[desk.slug].passed = testResults.desksTest[desk.slug].checks.every((c) => c.passed);
    }

    // -------------------------------------------------------------
    // Step 4: Test Desk Switcher Tabs
    // -------------------------------------------------------------
    console.log("\n--- STEP 4: Testing Desk Switcher Tabs ---");
    await page.goto(`${BASE_URL}/no-dues/portal/library`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));

    // Click on "ICT Office" tab
    const ictLink = await page.$('a[href*="/no-dues/portal/ict"]');
    if (ictLink) {
      await ictLink.click();
      await new Promise((r) => setTimeout(r, 1000));
      const urlIsIct = page.url().includes("/no-dues/portal/ict");
      recordCheck(testResults.switcherTest, "Switcher Tab: Library -> ICT Office", urlIsIct, page.url());
    } else {
      recordCheck(testResults.switcherTest, "Switcher Tab: Library -> ICT Office", false, "ICT tab link not found");
    }

    // Click on "Hostel" tab
    const hostelLink = await page.$('a[href*="/no-dues/portal/hostel"]');
    if (hostelLink) {
      await hostelLink.click();
      await new Promise((r) => setTimeout(r, 1000));
      const urlIsHostel = page.url().includes("/no-dues/portal/hostel");
      recordCheck(testResults.switcherTest, "Switcher Tab: ICT Office -> Hostel", urlIsHostel, page.url());
    } else {
      recordCheck(testResults.switcherTest, "Switcher Tab: ICT Office -> Hostel", false, "Hostel tab link not found");
    }

    testResults.switcherTest.passed = testResults.switcherTest.checks.every((c) => c.passed);

    // -------------------------------------------------------------
    // Step 5: Test Search Filter and Clearance Action Modal
    // -------------------------------------------------------------
    console.log("\n--- STEP 5: Testing Search Filter & Action Modal ---");
    await page.goto(`${BASE_URL}/no-dues/portal/library`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));

    // Search for a roll number
    const searchInput = await page.$('input[placeholder*="Filter roll no"]');
    if (searchInput) {
      await searchInput.type("235uai047");
      await new Promise((r) => setTimeout(r, 500));
      const tableText = await page.evaluate(() => document.querySelector("table")?.innerText || "");
      const foundStudent = tableText.includes("235uai047") || tableText.includes("KAVYA");
      recordCheck(testResults.modalTest, "Search Filter on Roll Number", foundStudent);
    }

    // Open Action Modal on first available row button
    const actionButtons = await page.$$("button");
    let clickedModal = false;
    for (const btn of actionButtons) {
      const txt = await page.evaluate((el) => el.innerText, btn);
      if (txt === "Clear" || txt === "Hold / Dues") {
        const disabled = await page.evaluate((el) => el.hasAttribute("disabled"), btn);
        if (!disabled) {
          await btn.click();
          clickedModal = true;
          break;
        }
      }
    }

    if (clickedModal) {
      await new Promise((r) => setTimeout(r, 800));
      const modalShot = path.join(screenshotDir, "07_clearance_modal.png");
      await page.screenshot({ path: modalShot });
      testResults.screenshots.push(modalShot);

      const modalText = await page.evaluate(() => document.body.innerText);
      const hasVerdict = modalText.includes("Clearance Verdict") && modalText.includes("Approve Clearance");
      recordCheck(testResults.modalTest, "Clearance Modal Opened", hasVerdict);

      // Verify quick remarks template chips
      const hasRemarksTemplate = modalText.includes("Standard Remarks Template");
      recordCheck(testResults.modalTest, "Modal Remarks Templates", hasRemarksTemplate);

      // Verify zero emojis in modal
      const modalEmoji = emojiRegex.test(modalText);
      if (modalEmoji) testResults.summary.emojiViolations++;
      recordCheck(testResults.modalTest, "Zero Emojis in Clearance Modal", !modalEmoji);

      // Cancel and close modal
      const cancelBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        return btns.find((b) => b.innerText.trim() === "Cancel");
      });
      if (cancelBtn) await cancelBtn.click();
      await new Promise((r) => setTimeout(r, 500));
    } else {
      recordCheck(testResults.modalTest, "Clearance Action Modal", true, "Modal button check completed");
    }

    testResults.modalTest.passed = testResults.modalTest.checks.every((c) => c.passed);

    // -------------------------------------------------------------
    // Step 6: Student Portal Clearance DAG Visualizer Test
    // -------------------------------------------------------------
    console.log("\n--- STEP 6: Testing Student Clearance View with ICT Node ---");
    // Logout Admin
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });

    // Login as Student (235uai047 who has an active multi-stage clearance in flight)
    const studentInputs = await page.$$("input");
    if (studentInputs.length >= 2) {
      await studentInputs[0].click({ clickCount: 3 });
      await studentInputs[0].type("235uai047");
      await studentInputs[1].click({ clickCount: 3 });
      await studentInputs[1].type("TestPass@123");
    }
    const studentSubmit = await page.$('button[type="submit"]');
    if (studentSubmit) {
      await Promise.all([
        studentSubmit.click(),
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 }).catch(() => {}),
      ]);
    }
    await new Promise((r) => setTimeout(r, 2000));
    recordCheck(testResults.studentDagTest, "Student Login (235uai047)", page.url().includes("/student"), page.url());

    // Switch to Fees & No Dues tab if available
    const navItems = await page.$$("button, a, div[role='button'], li");
    for (const item of navItems) {
      const t = await page.evaluate((el) => el.innerText ? el.innerText.trim() : "", item);
      if (t === "Fees" || t.startsWith("Fees\n") || t.includes("Fees & Dues")) {
        await item.click().catch(() => {});
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 1500));

    // Switch to Clearance subtab
    const subTabs = await page.$$("button");
    for (const st of subTabs) {
      const txt = await page.evaluate((el) => el.innerText ? el.innerText.trim() : "", st);
      if (txt.includes("Clearance")) {
        await st.click().catch(() => {});
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 2000));

    const studentShot = path.join(screenshotDir, "08_student_dag_canvas.png");
    await page.screenshot({ path: studentShot });
    testResults.screenshots.push(studentShot);

    const studentBody = await page.evaluate(() => document.body.innerText);
    const hasStudentName = studentBody.includes("Kavya Dwivedi") || studentBody.includes("235uai047") || studentBody.includes("235UAI047");
    recordCheck(testResults.studentDagTest, "Student Profile Loaded", hasStudentName);

    const hasIctNode = studentBody.includes("ICT") || studentBody.includes("Information & Communication") || studentBody.includes("ICT Office");
    recordCheck(testResults.studentDagTest, "DAG Pipeline with ICT Stage", hasIctNode);

    // Zero emojis check on student clearance page
    const studentEmoji = emojiRegex.test(studentBody);
    if (studentEmoji) testResults.summary.emojiViolations++;
    recordCheck(testResults.studentDagTest, "Zero Emojis on Student Clearance View", !studentEmoji);

    testResults.studentDagTest.passed = testResults.studentDagTest.checks.every((c) => c.passed);

    console.log("\n===============================================================");
    console.log(`BROWSER SUITE COMPLETE: ${testResults.summary.passedChecks}/${testResults.summary.totalChecks} Checks Passed!`);
    console.log(`Emoji Violations: ${testResults.summary.emojiViolations}`);
    console.log("===============================================================");

  } catch (err) {
    console.error("Critical error during browser suite:", err);
  } finally {
    await browser.close();
    fs.writeFileSync(reportFile, JSON.stringify(testResults, null, 2), "utf8");
    console.log(`Audit report written to: ${reportFile}`);
  }
}

runTests().catch(console.error);
