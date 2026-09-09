import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:5173";
const screenshotDir = "C:\\Users\\harsh\\.gemini\\antigravity\\brain\\3aea231d-33fe-4c94-b612-f8002d421b3f\\screenshots";
const reportFile = "C:\\Users\\harsh\\OneDrive\\Desktop\\compl sdms - Copy (2)\\sdms-main\\OFFICER_RBAC_BROWSER_REPORT.json";

if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F0F5}\u{1F200}-\u{1F270}]/u;

const testResults = {
  timestamp: new Date().toISOString(),
  checks: [],
  screenshots: [],
  summary: { total: 0, passed: 0, failed: 0, emojiViolations: 0 }
};

function recordCheck(name, passed, details = "") {
  testResults.summary.total++;
  if (passed) {
    testResults.summary.passed++;
    console.log(`[PASS] ${name} ${details ? "- " + details : ""}`);
  } else {
    testResults.summary.failed++;
    console.log(`[FAIL] ${name} ${details ? "- " + details : ""}`);
  }
  testResults.checks.push({ name, passed, details });
}

async function runSuite() {
  console.log("===============================================================");
  console.log("  GBU-SDMS BROWSER TEST: DEPARTMENTAL OFFICER LOGIN & RBAC     ");
  console.log("===============================================================");

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // STEP 1: Test Login Page & Officer Link
    console.log("\n--- STEP 1: Main Login Page with Officer Link ---");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));

    const mainLoginText = await page.evaluate(() => document.body.innerText);
    const hasOfficerLink = mainLoginText.includes("Departmental Clearance Officer Login");
    recordCheck("Main Login page shows Officer Login button", hasOfficerLink);

    // STEP 2: Dedicated Officer Login Page (/officer-login)
    console.log("\n--- STEP 2: Dedicated Officer Login Portal (/officer-login) ---");
    await page.goto(`${BASE_URL}/officer-login`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1200));

    const shot1 = path.join(screenshotDir, "09_officer_login_portal.png");
    await page.screenshot({ path: shot1 });
    testResults.screenshots.push(shot1);

    const officerLoginText = await page.evaluate(() => document.body.innerText);
    const hasLib = officerLoginText.includes("Central Bodhisattva Library");
    const hasHst = officerLoginText.includes("Hostel Administration");
    const hasSpt = officerLoginText.includes("University Sports Council");
    const hasDean = officerLoginText.includes("School Dean Clearance Desk");
    const hasIct = officerLoginText.includes("ICT Infrastructure Office");
    const hasAdmin = officerLoginText.includes("Central HOD / Administrator");
    recordCheck("All 6 Department / Admin Options Rendered", hasLib && hasHst && hasSpt && hasDean && hasIct && hasAdmin);

    const hasEmoji = emojiRegex.test(officerLoginText);
    if (hasEmoji) testResults.summary.emojiViolations++;
    recordCheck("Zero Emojis on Officer Login Portal", !hasEmoji);

    // STEP 3: Test Direct Endpoint (/login/library)
    console.log("\n--- STEP 3: Direct Endpoint (/login/library) ---");
    await page.goto(`${BASE_URL}/login/library`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));
    const urlLib = page.url();
    recordCheck("Direct Desk URL loaded (/login/library)", urlLib.includes("/login/library"));

    // STEP 4: Login as Central Library Officer (LIB)
    console.log("\n--- STEP 4: Authenticating as Library Officer (LIB) ---");
    // Pre-fill is already active for library
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await Promise.all([
        submitBtn.click(),
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 }).catch(() => {})
      ]);
    }
    await new Promise((r) => setTimeout(r, 2000));

    const currentUrl = page.url();
    const routedToLib = currentUrl.includes("/no-dues/portal/library");
    recordCheck("Library Officer routed directly to /no-dues/portal/library", routedToLib, currentUrl);

    const shot2 = path.join(screenshotDir, "10_library_officer_authenticated.png");
    await page.screenshot({ path: shot2 });
    testResults.screenshots.push(shot2);

    const libDeskText = await page.evaluate(() => document.body.innerText);
    const hasOfficerBadge = libDeskText.includes("Officer Session (LIB)") || libDeskText.includes("Central Library Officer");
    recordCheck("Library Officer Session Badge displayed", hasOfficerBadge);

    // STEP 5: Verify RBAC: Library Officer Accessing Hostel Desk
    console.log("\n--- STEP 5: Testing RBAC Enforcement (Library Officer -> Hostel Desk) ---");
    await page.goto(`${BASE_URL}/no-dues/portal/hostel`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1500));

    const shot3 = path.join(screenshotDir, "11_library_officer_blocked_on_hostel.png");
    await page.screenshot({ path: shot3 });
    testResults.screenshots.push(shot3);

    const hostelAttemptText = await page.evaluate(() => document.body.innerText);
    const isAccessDenied = hostelAttemptText.includes("Access Denied") || hostelAttemptText.includes("Restricted Departmental Desk");
    recordCheck("RBAC Access Denied Barrier rendered on unauthorized desk", isAccessDenied);

    const hasReturnButton = hostelAttemptText.includes("Return to My Clearance Desk");
    recordCheck("Return to Authorized Desk button displayed", hasReturnButton);

    // STEP 6: Authenticate as Hostel Officer
    console.log("\n--- STEP 6: Authenticating as Hostel Officer (HST) ---");
    await page.goto(`${BASE_URL}/login/hostel`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));

    const hstSubmit = await page.$('button[type="submit"]');
    if (hstSubmit) {
      await Promise.all([
        hstSubmit.click(),
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 }).catch(() => {})
      ]);
    }
    await new Promise((r) => setTimeout(r, 2000));

    const hstUrl = page.url();
    recordCheck("Hostel Officer routed directly to /no-dues/portal/hostel", hstUrl.includes("/no-dues/portal/hostel"), hstUrl);

    const shot4 = path.join(screenshotDir, "12_hostel_officer_authenticated.png");
    await page.screenshot({ path: shot4 });
    testResults.screenshots.push(shot4);

    const hstDeskText = await page.evaluate(() => document.body.innerText);
    const hasHstBadge = hstDeskText.includes("Officer Session (HST)") || hstDeskText.includes("Hostel Administration");
    recordCheck("Hostel Officer Session Badge displayed", hasHstBadge);

    // STEP 7: Authenticate as HOD Admin (Unrestricted Authority)
    console.log("\n--- STEP 7: Authenticating as HOD Master Admin ---");
    await page.goto(`${BASE_URL}/officer-login`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));

    // Click on Central HOD / Administrator tab
    const buttons = await page.$$("button");
    for (const b of buttons) {
      const txt = await page.evaluate((el) => el.innerText, b);
      if (txt.includes("HOD / Administrator") || txt.includes("ADMIN")) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 500));

    const adminSubmit = await page.$('button[type="submit"]');
    if (adminSubmit) {
      await Promise.all([
        adminSubmit.click(),
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 }).catch(() => {})
      ]);
    }
    await new Promise((r) => setTimeout(r, 2000));

    const adminUrl = page.url();
    recordCheck("HOD Admin routed to Clearance Directory", adminUrl.includes("/no-dues/portals") || adminUrl.includes("/admin"), adminUrl);

    // Visit Library and Hostel as HOD -> should have full access with NO barrier
    await page.goto(`${BASE_URL}/no-dues/portal/library`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1200));
    const adminLibText = await page.evaluate(() => document.body.innerText);
    recordCheck("HOD Unrestricted Access to Library Desk", !adminLibText.includes("Access Denied") && adminLibText.includes("Central Bodhisattva Library"));

    await page.goto(`${BASE_URL}/no-dues/portal/hostel`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1200));
    const adminHstText = await page.evaluate(() => document.body.innerText);
    recordCheck("HOD Unrestricted Access to Hostel Desk", !adminHstText.includes("Access Denied") && adminHstText.includes("Hostel Administration"));

    const shot5 = path.join(screenshotDir, "13_hod_admin_full_access.png");
    await page.screenshot({ path: shot5 });
    testResults.screenshots.push(shot5);

    console.log("\n===============================================================");
    console.log(`OFFICER RBAC SUITE COMPLETE: ${testResults.summary.passed}/${testResults.summary.total} Checks Passed!`);
    console.log(`Emoji Violations: ${testResults.summary.emojiViolations}`);
    console.log("===============================================================");
  } catch (err) {
    console.error("Test execution error:", err);
  } finally {
    await browser.close();
    fs.writeFileSync(reportFile, JSON.stringify(testResults, null, 2), "utf8");
    console.log(`Audit report written to: ${reportFile}`);
  }
}

runSuite().catch(console.error);
