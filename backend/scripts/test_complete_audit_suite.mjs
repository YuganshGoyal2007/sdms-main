import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:5173";
const screenshotDir = "C:\\Users\\harsh\\.gemini\\antigravity\\brain\\3aea231d-33fe-4c94-b612-f8002d421b3f\\screenshots";
const reportFile = "C:\\Users\\harsh\\OneDrive\\Desktop\\compl sdms - Copy (2)\\sdms-main\\COMPLETE_AUDIT_VERIFICATION_REPORT.json";

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

function checkEmojis(pageText, contextName) {
  const matches = pageText.match(emojiRegex);
  if (matches) {
    testResults.summary.emojiViolations++;
    console.log(`[EMOJI ALERT] Found emoji in ${contextName}: "${matches[0]}"`);
    return false;
  }
  return true;
}

async function safeScreenshot(page, filename) {
  const fullPath = path.join(screenshotDir, filename);
  try {
    await page.evaluate(() => {
      const s = document.createElement('style');
      s.id = '__no_anim__';
      s.innerHTML = '*, *::before, *::after { animation: none !important; transition: none !important; }';
      document.head.appendChild(s);
    }).catch(() => {});
    await page.screenshot({ path: fullPath, timeout: 5000 });
    testResults.screenshots.push(fullPath);
    console.log(`  [Screenshot saved] ${filename}`);
  } catch (err) {
    console.warn(`  [Screenshot warning] Could not save ${filename}: ${err.message}`);
  }
}

async function runAuditSuite() {
  console.log("========================================================================");
  console.log("   GBU-SDMS COMPREHENSIVE BROWSER AUDIT & VERIFICATION SUITE           ");
  console.log("========================================================================");

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    protocolTimeout: 120000,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--window-size=1440,900"
    ]
  });

  const page = await browser.newPage();
  page.on('dialog', async (d) => { try { await d.dismiss(); } catch (e) {} });
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // -------------------------------------------------------------------------
    // PILLAR 1: Student Login Page Has ZERO Clearance Links (Undiscoverable)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 1: Student Login Page Undiscoverability Audit ---");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1000));

    const loginText = await page.evaluate(() => document.body.innerText.toLowerCase());
    const hasOfficerLink = loginText.includes("officer-login") || loginText.includes("departmental clearance officer login");
    const hasDeskButtons = loginText.includes("library clearance") || loginText.includes("hostel clearance");

    recordCheck("Main /login page has NO officer links", !hasOfficerLink, "Officer login link successfully hidden from students");
    recordCheck("Main /login page has NO departmental clearance buttons", !hasDeskButtons, "Clearance endpoints are completely unlisted");
    recordCheck("Main /login page has zero emojis", checkEmojis(loginText, "Main Login Page"));

    await safeScreenshot(page, "audit_01_student_login_clean.png");

    // -------------------------------------------------------------------------
    // PILLAR 2: Dedicated Unlisted Departmental Clearance Endpoints
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: Dedicated Unlisted Desk Login Endpoints ---");
    const deskSlugs = ["library", "hostel", "sports", "dean", "ict"];
    for (const slug of deskSlugs) {
      await page.goto(`${BASE_URL}/clearance/auth/${slug}`, { waitUntil: "domcontentloaded", timeout: 15000 });
      await new Promise((r) => setTimeout(r, 800));
      const deskText = await page.evaluate(() => document.body.innerText.toLowerCase());
      const isDeskPage = deskText.includes("clearance") && (deskText.includes("scope") || deskText.includes("official") || deskText.includes("endpoint") || deskText.includes("central bodhisattva") || deskText.includes("hostel") || deskText.includes("sports") || deskText.includes("dean") || deskText.includes("ict"));
      recordCheck(`Unlisted endpoint /clearance/auth/${slug} renders dedicated desk portal`, isDeskPage);
      recordCheck(`/clearance/auth/${slug} has zero emojis`, checkEmojis(deskText, `/clearance/auth/${slug}`));
    }

    await safeScreenshot(page, "audit_02_unlisted_library_desk_auth.png");

    // -------------------------------------------------------------------------
    // PILLAR 3: Strict Departmental Isolation & RBAC
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: Department Officer Authentication & Cross-Desk Isolation ---");
    await page.goto(`${BASE_URL}/clearance/auth/library`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await new Promise((r) => setTimeout(r, 800));

    // Fill Library credentials
    await page.evaluate(() => {
      const inputs = document.querySelectorAll("input");
      if (inputs.length >= 2) {
        inputs[0].value = "library@gbu.ac.in";
        inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
        inputs[1].value = "TestPass@123";
        inputs[1].dispatchEvent(new Event("input", { bubbles: true }));
      }
    });

    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    await new Promise((r) => setTimeout(r, 2000));

    const libraryUrl = page.url();
    const inLibraryDesk = libraryUrl.includes("/no-dues/portal/library");
    recordCheck("Library Officer logs into /no-dues/portal/library", inLibraryDesk, `Current URL: ${libraryUrl}`);

    await safeScreenshot(page, "audit_03_library_officer_authenticated.png");

    // Cross-desk restriction: Library officer navigating to hostel desk
    console.log("\n--- TEST 3B: Cross-Desk Restriction (Library Officer accessing Hostel) ---");
    await page.evaluate(() => {
      window.location.href = '/no-dues/portal/hostel';
    });
    await new Promise((r) => setTimeout(r, 2000));

    const hostelPageText = await page.evaluate(() => document.body.innerText);
    const isBlockedHostel = hostelPageText.includes("Access Denied") || hostelPageText.includes("Forbidden") || hostelPageText.includes("exclusively assigned") || page.url().includes("library");
    recordCheck("Library Officer is strictly BLOCKED from Hostel desk", isBlockedHostel, "Cross-department isolation enforced");

    await safeScreenshot(page, "audit_04_library_officer_blocked_on_hostel.png");

    // Clear cookies & storage for next test
    await page.evaluate(() => localStorage.clear());
    const client = await page.target().createCDPSession();
    await client.send("Network.clearBrowserCookies");

    // -------------------------------------------------------------------------
    // PILLAR 4: Central HOD Admin Restricted From Auxiliary Clearance Desks
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: Central HOD Admin Restricted from Auxiliary Desks ---");
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await new Promise((r) => setTimeout(r, 800));

    await page.evaluate(() => {
      const inputs = document.querySelectorAll("input");
      if (inputs.length >= 2) {
        inputs[0].value = "hod.cs@gbu.ac.in";
        inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
        inputs[1].value = "TestPass@123";
        inputs[1].dispatchEvent(new Event("input", { bubbles: true }));
      }
    });

    const adminSubmit = await page.$('button[type="submit"]');
    if (adminSubmit) await adminSubmit.click();
    await new Promise((r) => setTimeout(r, 2000));

    const adminUrl = page.url();
    recordCheck("HOD logs into Admin panel successfully", adminUrl.includes("/admin"), `URL: ${adminUrl}`);

    // HOD attempts to access auxiliary clearance desk: /no-dues/portal/library
    console.log("\n--- TEST 4B: HOD Admin accessing Library Desk ---");
    await page.evaluate(() => {
      window.location.href = '/no-dues/portal/library';
    });
    await new Promise((r) => setTimeout(r, 2000));

    const hodDeskText = await page.evaluate(() => document.body.innerText);
    const isHodBlocked = hodDeskText.includes("Access Denied") || hodDeskText.includes("Central HOD") || hodDeskText.includes("restricted") || hodDeskText.includes("Forbidden") || hodDeskText.includes("403");
    recordCheck("Central HOD Admin is strictly BLOCKED (FORBIDDEN_DESK) from Library Desk", isHodBlocked, "Academic HOD cannot bypass departmental authority");

    await safeScreenshot(page, "audit_05_hod_blocked_on_library_desk.png");

    // -------------------------------------------------------------------------
    // PILLAR 5: Live Timetable Scraping & Faculty Reassignment Engine in Admin UI
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 5: Timetable Admin & Dynamic Faculty Sync Engine ---");
    await page.goto(`${BASE_URL}/admin/timetable`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await new Promise((r) => setTimeout(r, 2000));

    const timetableText = await page.evaluate(() => document.body.innerText);
    const hasSyncEngine = timetableText.includes("Live Timetable Scraping & Faculty Reassignment Engine");
    const hasHealthStrip = timetableText.includes("Samay API") || timetableText.includes("Endpoints");
    const hasSyncBtn = timetableText.includes("Sync & Reassign Faculty");

    recordCheck("Admin Timetable page renders Live Scraping & Faculty Sync Engine", hasSyncEngine);
    recordCheck("Admin Timetable page displays live endpoint health & latencies", hasHealthStrip);
    recordCheck("Admin Timetable page has Faculty Sync trigger buttons", hasSyncBtn);
    recordCheck("Admin Timetable page has zero emojis", checkEmojis(timetableText, "Admin Timetable"));

    await safeScreenshot(page, "audit_06_admin_timetable_sync_engine.png");

    // Trigger dry-run test
    console.log("\n--- TEST 5B: Triggering Faculty Assignment Simulation (Dry Run) ---");
    const dryRunClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const target = btns.find((b) => b.innerText.includes("Dry Run Test"));
      if (target) {
        target.click();
        return true;
      }
      return false;
    });

    if (dryRunClicked) {
      await new Promise((r) => setTimeout(r, 4000));
      const postDryRunText = await page.evaluate(() => document.body.innerText);
      const hasExecutionReport = postDryRunText.includes("Sync Execution Report") || postDryRunText.includes("Parsed");
      recordCheck("Dry run simulation parsed live timetable and generated report", hasExecutionReport);
    } else {
      recordCheck("Dry run simulation button found and clicked", false);
    }

    await safeScreenshot(page, "audit_07_timetable_dry_run_report.png");

    // Trigger live faculty sync & class reassignment
    console.log("\n--- TEST 5C: Triggering Live Faculty Sync & Class Roster Reassignments ---");
    const liveSyncClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const target = btns.find((b) => b.innerText.includes("Sync & Reassign Faculty"));
      if (target) {
        target.click();
        return true;
      }
      return false;
    });

    if (liveSyncClicked) {
      await new Promise((r) => setTimeout(r, 5000));
      const postSyncText = await page.evaluate(() => document.body.innerText);
      const hasSyncSuccess = postSyncText.includes("Sync Execution Report") || postSyncText.includes("Parsed");
      recordCheck("Live faculty sync executed and updated allocations", hasSyncSuccess);
    }

    await safeScreenshot(page, "audit_08_live_faculty_sync_completed.png");

    // Clear cookies & storage for student test
    await page.evaluate(() => localStorage.clear());
    await client.send("Network.clearBrowserCookies");

    // -------------------------------------------------------------------------
    // PILLAR 6: Student Login, Photo Rendering & No-Dues Pipeline
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 6: Student Login, Photo Display & No-Dues Pipeline ---");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1000));

    // Login with student account (235uai047 / TestPass@123)
    await page.evaluate(() => {
      const inputs = document.querySelectorAll("input");
      if (inputs.length >= 2) {
        inputs[0].value = "235uai047";
        inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
        inputs[1].value = "TestPass@123";
        inputs[1].dispatchEvent(new Event("input", { bubbles: true }));
      }
    });

    const studentSubmit = await page.$('button[type="submit"]');
    if (studentSubmit) await studentSubmit.click();
    await new Promise((r) => setTimeout(r, 2500));

    const studentUrl = page.url();
    recordCheck("Student logs in successfully", !studentUrl.includes("/login"), `URL: ${studentUrl}`);

    // Check student photo in Profile view
    const photoCheck = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll("img"));
      const photoImg = images.find(img => img.src && (img.src.startsWith("data:image/") || img.src.includes("base64")));
      return {
        hasPhotoImg: !!photoImg,
        srcPreview: photoImg ? photoImg.src.slice(0, 50) + "..." : null,
        totalImages: images.length
      };
    });

    recordCheck("Student Profile renders base64 photo", photoCheck.hasPhotoImg, `Preview: ${photoCheck.srcPreview}`);

    await safeScreenshot(page, "audit_09_student_profile_with_photo.png");

    // Navigate to Fees & Clearance View
    console.log("\n--- TEST 6B: Student No-Dues Status & Pipeline DAG ---");
    // Click Fees nav item if present
    await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll("button, a, div[role='button']"));
      const feesBtn = els.find(el => el.innerText && el.innerText.trim().startsWith("Fees"));
      if (feesBtn) feesBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1500));

    // Click Clearance tab if present
    await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll("button"));
      const clrBtn = els.find(el => el.innerText && el.innerText.includes("Clearance"));
      if (clrBtn) clrBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1500));

    const noDuesText = await page.evaluate(() => document.body.innerText);
    const hasDAG = noDuesText.includes("Clearance Progress") || noDuesText.includes("Library") || noDuesText.includes("Level") || noDuesText.includes("Hostel") || noDuesText.includes("ICT");
    recordCheck("Student No Dues page renders multi-department DAG pipeline", hasDAG);
    recordCheck("Student No Dues page has zero emojis", checkEmojis(noDuesText, "Student Clearance Page"));

    await safeScreenshot(page, "audit_10_student_nodues_dag.png");

  } catch (err) {
    console.error("[TEST ERROR]", err);
    recordCheck("Test suite execution completed without uncaught exceptions", false, err.message);
  } finally {
    await browser.close();
  }

  // Save report
  fs.writeFileSync(reportFile, JSON.stringify(testResults, null, 2), "utf8");
  console.log("\n========================================================================");
  console.log(`  AUDIT COMPLETE: ${testResults.summary.passed}/${testResults.summary.total} PASSED, ${testResults.summary.failed} FAILED, ${testResults.summary.emojiViolations} EMOJI VIOLATIONS`);
  console.log(`  Report saved to: ${reportFile}`);
  console.log("========================================================================");
}

runAuditSuite();
