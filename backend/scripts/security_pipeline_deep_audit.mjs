import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:5000';
const AUTH_URL = 'http://localhost:5000/auth';
const REPORT_FILE = 'C:\\Users\\harsh\\OneDrive\\Desktop\\compl sdms - Copy (2)\\sdms-main\\SECURITY_PIPELINE_DEEP_AUDIT_REPORT.json';

const results = {
  timestamp: new Date().toISOString(),
  auditType: 'Full E2E Security & Pipeline Deep Audit',
  categories: {
    authentication: { passed: 0, failed: 0, tests: [] },
    authorization_rbac: { passed: 0, failed: 0, tests: [] },
    privilege_escalation: { passed: 0, failed: 0, tests: [] },
    state_machine_pipeline: { passed: 0, failed: 0, tests: [] },
    fees_and_data_integrity: { passed: 0, failed: 0, tests: [] },
    timetable_scraping_engine: { passed: 0, failed: 0, tests: [] },
  },
  summary: { total: 0, passed: 0, failed: 0 }
};

function record(category, name, passed, details = '') {
  results.summary.total++;
  const cat = results.categories[category];
  if (passed) {
    results.summary.passed++;
    cat.passed++;
    console.log(`[PASS] [${category}] ${name} ${details ? '- ' + details : ''}`);
  } else {
    results.summary.failed++;
    cat.failed++;
    console.log(`[FAIL] [${category}] ${name} ${details ? '- ' + details : ''}`);
  }
  cat.tests.push({ name, passed, details });
}

async function request(url, options = {}) {
  const res = await fetch(url, options);
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function runAudit() {
  console.log('========================================================================');
  console.log('   GBU-SDMS DEEP SECURITY AUDIT & PIPELINE INVARIANT VERIFICATION       ');
  console.log('========================================================================\n');

  // ---------------------------------------------------------------------------
  // SECTION 1: AUTHENTICATION & TOKEN INTEGRITY AUDIT
  // ---------------------------------------------------------------------------
  console.log('--- 1. Authentication & Token Integrity Audit ---');

  // 1.1 Unauthenticated requests to protected endpoints
  const unauth1 = await request(`${API_URL}/no-dues/portals/overview`);
  record('authentication', 'Unauthenticated request to clearance overview rejected', unauth1.status === 401, `Status: ${unauth1.status}`);

  const unauth2 = await request(`${API_URL}/timetable/sections`);
  record('authentication', 'Unauthenticated request to admin timetable rejected', unauth2.status === 401, `Status: ${unauth2.status}`);

  const unauth3 = await request(`${API_URL}/no-dues/my`);
  record('authentication', 'Unauthenticated request to student no-dues rejected', unauth3.status === 401, `Status: ${unauth3.status}`);

  // 1.2 Forged JWT Token signature
  const forgedToken = jwt.sign({ id: 1, role: 'admin', username: 'attacker' }, 'fake_secret_key_12345');
  const forgedRes = await request(`${API_URL}/no-dues/portals/overview`, {
    headers: { Authorization: `Bearer ${forgedToken}` }
  });
  record('authentication', 'Forged JWT signature rejected with 401', forgedRes.status === 401, `Status: ${forgedRes.status}`);

  // 1.3 JWT 'none' algorithm bypass attempt
  const noneAlgToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJpZCI6MSwicm9sZSI6ImFkbWluIn0.';
  const noneRes = await request(`${API_URL}/no-dues/portals/overview`, {
    headers: { Authorization: `Bearer ${noneAlgToken}` }
  });
  record('authentication', 'JWT "none" algorithm bypass attempt rejected with 401', noneRes.status === 401, `Status: ${noneRes.status}`);

  // 1.4 Valid Logins to obtain real tokens for RBAC tests
  const libLogin = await request(`${AUTH_URL}/officer-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'library@gbu.ac.in', password: 'TestPass@123', officeCode: 'LIB' })
  });
  const libToken = libLogin.data?.accessToken;
  record('authentication', 'Library Officer authentication successful', libLogin.status === 200 && !!libToken);

  const hstLogin = await request(`${AUTH_URL}/officer-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'hostel@gbu.ac.in', password: 'TestPass@123', officeCode: 'HST' })
  });
  const hstToken = hstLogin.data?.accessToken;
  record('authentication', 'Hostel Officer authentication successful', hstLogin.status === 200 && !!hstToken);

  const adminLogin = await request(`${AUTH_URL}/user-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'hod.cs@gbu.ac.in', password: 'TestPass@123' })
  });
  const adminToken = adminLogin.data?.accessToken;
  record('authentication', 'HOD Admin authentication successful', adminLogin.status === 200 && !!adminToken);

  const studentLogin = await request(`${AUTH_URL}/user-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: '235uai047', password: 'TestPass@123' })
  });
  const studentToken = studentLogin.data?.accessToken;
  record('authentication', 'Student authentication successful', studentLogin.status === 200 && !!studentToken);

  // ---------------------------------------------------------------------------
  // SECTION 2: AUTHORIZATION & STRICT RBAC ISOLATION
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Authorization & Departmental RBAC Isolation ---');

  // 2.1 Library Officer accessing Library Desk -> 200 OK
  const libDeskSelf = await request(`${API_URL}/no-dues/portal/library`, {
    headers: { Authorization: `Bearer ${libToken}` }
  });
  record('authorization_rbac', 'Library Officer allowed access to matching Library desk (LIB)', libDeskSelf.status === 200);

  // 2.2 Library Officer accessing Hostel Desk -> 403 FORBIDDEN_DESK
  const libDeskHostel = await request(`${API_URL}/no-dues/portal/hostel`, {
    headers: { Authorization: `Bearer ${libToken}` }
  });
  record('authorization_rbac', 'Library Officer blocked from Hostel desk with 403 FORBIDDEN_DESK', libDeskHostel.status === 403 && libDeskHostel.data?.error === 'FORBIDDEN_DESK');

  // 2.3 Library Officer accessing Sports Desk -> 403 FORBIDDEN_DESK
  const libDeskSports = await request(`${API_URL}/no-dues/portal/sports`, {
    headers: { Authorization: `Bearer ${libToken}` }
  });
  record('authorization_rbac', 'Library Officer blocked from Sports desk with 403 FORBIDDEN_DESK', libDeskSports.status === 403 && libDeskSports.data?.error === 'FORBIDDEN_DESK');

  // 2.4 Library Officer accessing Dean Desk -> 403 FORBIDDEN_DESK
  const libDeskDean = await request(`${API_URL}/no-dues/portal/dean`, {
    headers: { Authorization: `Bearer ${libToken}` }
  });
  record('authorization_rbac', 'Library Officer blocked from Dean desk with 403 FORBIDDEN_DESK', libDeskDean.status === 403 && libDeskDean.data?.error === 'FORBIDDEN_DESK');

  // 2.5 Library Officer accessing ICT Desk -> 403 FORBIDDEN_DESK
  const libDeskIct = await request(`${API_URL}/no-dues/portal/ict`, {
    headers: { Authorization: `Bearer ${libToken}` }
  });
  record('authorization_rbac', 'Library Officer blocked from ICT desk with 403 FORBIDDEN_DESK', libDeskIct.status === 403 && libDeskIct.data?.error === 'FORBIDDEN_DESK');

  // 2.6 Hostel Officer accessing Library Desk -> 403 FORBIDDEN_DESK
  const hstDeskLib = await request(`${API_URL}/no-dues/portal/library`, {
    headers: { Authorization: `Bearer ${hstToken}` }
  });
  record('authorization_rbac', 'Hostel Officer blocked from Library desk with 403 FORBIDDEN_DESK', hstDeskLib.status === 403 && hstDeskLib.data?.error === 'FORBIDDEN_DESK');

  // 2.7 Cross-Desk Action Protection: Library Officer attempting action on Hostel desk
  const libActionOnHst = await request(`${API_URL}/no-dues/portal/hostel/action/99999`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${libToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'approve', comments: 'Tampered cross-desk approval' })
  });
  record('authorization_rbac', 'Library Officer prohibited from executing approvals on Hostel desk (403)', libActionOnHst.status === 403);

  // 2.8 Cross-Desk Bulk Approve Protection
  const libBulkOnHst = await request(`${API_URL}/no-dues/portal/hostel/bulk-approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${libToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ stageIds: [1, 2, 3] })
  });
  record('authorization_rbac', 'Library Officer prohibited from bulk approving on Hostel desk (403)', libBulkOnHst.status === 403);

  // ---------------------------------------------------------------------------
  // SECTION 3: PRIVILEGE ESCALATION PROBING
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Privilege Escalation Probing ---');

  // 3.1 Student attempting to access Clearance Overview API -> 403 FORBIDDEN
  const studentToOverview = await request(`${API_URL}/no-dues/portals/overview`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  record('privilege_escalation', 'Student vertical escalation to clearance overview blocked (403)', studentToOverview.status === 403);

  // 3.2 Student attempting to access Admin Timetable Mappings -> 403 FORBIDDEN
  const studentToTimetableAdmin = await request(`${API_URL}/timetable/sections`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  record('privilege_escalation', 'Student vertical escalation to admin timetable mappings blocked (403)', studentToTimetableAdmin.status === 403);

  // 3.3 Officer attempting to access Admin Timetable Mappings -> 403 FORBIDDEN
  const officerToTimetableAdmin = await request(`${API_URL}/timetable/sections`, {
    headers: { Authorization: `Bearer ${libToken}` }
  });
  record('privilege_escalation', 'Officer vertical escalation to admin timetable mappings blocked (403)', officerToTimetableAdmin.status === 403);

  // 3.4 HOD Admin Boundary Restriction: HOD attempting to access Library Clearance Desk -> 403 FORBIDDEN_DESK
  const hodToLibDesk = await request(`${API_URL}/no-dues/portal/library`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  record('privilege_escalation', 'Central HOD Admin strictly blocked from Library Clearance Desk (403 FORBIDDEN_DESK)', hodToLibDesk.status === 403 && hodToLibDesk.data?.error === 'FORBIDDEN_DESK');

  // 3.5 HOD Admin Boundary Restriction: HOD attempting to access Hostel Clearance Desk -> 403 FORBIDDEN_DESK
  const hodToHstDesk = await request(`${API_URL}/no-dues/portal/hostel`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  record('privilege_escalation', 'Central HOD Admin strictly blocked from Hostel Clearance Desk (403 FORBIDDEN_DESK)', hodToHstDesk.status === 403 && hodToHstDesk.data?.error === 'FORBIDDEN_DESK');

  // 3.6 HOD Admin accessing Master Admin Endpoint -> 200 OK
  const hodToTimetable = await request(`${API_URL}/timetable/sections`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  record('privilege_escalation', 'Central HOD Admin retains legitimate access to Academic Admin endpoints (200 OK)', hodToTimetable.status === 200);

  // ---------------------------------------------------------------------------
  // SECTION 4: NO-DUES DAG STATE MACHINE & PIPELINE INTEGRITY
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. No-Dues DAG State Machine Pipeline Integrity ---');

  const studentNoDues = await request(`${API_URL}/no-dues/my`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });

  if (studentNoDues.data?.hasApplication && (studentNoDues.data?.stages || studentNoDues.data?.application?.stages)) {
    const stages = studentNoDues.data.stages || studentNoDues.data.application.stages;
    const stageCodes = stages.map(s => s.stageCode);

    // Invariant 1: All mandatory clearance stages present in DAG
    const hasLibrary = stageCodes.includes('LIB');
    const hasHostel = stageCodes.includes('HST');
    const hasSports = stageCodes.includes('SPT');
    const hasDean = stageCodes.includes('DEAN') || stageCodes.includes('DEAN_APPR');
    const hasIct = stageCodes.includes('ICT');

    record('state_machine_pipeline', 'Clearance DAG contains Central Library node', hasLibrary);
    record('state_machine_pipeline', 'Clearance DAG contains Hostel Office node', hasHostel);
    record('state_machine_pipeline', 'Clearance DAG contains Sports Council node', hasSports);
    record('state_machine_pipeline', 'Clearance DAG contains School Dean node', hasDean);
    record('state_machine_pipeline', 'Clearance DAG contains ICT Office node', hasIct);

    // Invariant 2: Topological ordering of DAG levels
    const levels = stages.map(s => s.sequenceOrder);
    const isSorted = levels.every((val, i, arr) => !i || arr[i - 1] <= val);
    record('state_machine_pipeline', 'DAG stages respect non-decreasing sequence order (level progression)', isSorted);

    // Invariant 3: Gate Status logic verification
    const currentOrder = studentNoDues.data.application.currentStageOrder || 1;
    const unlockedStages = stages.filter(s => s.sequenceOrder <= currentOrder);
    record('state_machine_pipeline', 'Active DAG level gates correctly unlock pending stages', unlockedStages.length > 0);
  } else {
    record('state_machine_pipeline', 'Student application exists for DAG audit', false, 'No active application found');
  }

  // ---------------------------------------------------------------------------
  // SECTION 5: FEES & DATA INTEGRITY INVARIANTS
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Fees & Data Integrity Invariants ---');

  // Verify non-negative dues amounts on active clearance stages
  const overviewRes = await request(`${API_URL}/no-dues/portals/overview`, {
    headers: { Authorization: `Bearer ${libToken}` }
  });

  if (overviewRes.ok && Array.isArray(overviewRes.data?.offices)) {
    const allNonNegative = overviewRes.data.offices.every(o => Number(o.stats?.totalDues || 0) >= 0);
    record('fees_and_data_integrity', 'Departmental ledger dues totals are strictly non-negative', allNonNegative);

    const validOfficeCodes = ['LIB', 'HST', 'SPT', 'DEAN', 'ICT'];
    const codesMatch = overviewRes.data.offices.every(o => validOfficeCodes.includes(o.code));
    record('fees_and_data_integrity', 'Overview returns exclusively valid institutional office codes', codesMatch);
  } else {
    record('fees_and_data_integrity', 'Departmental ledger overview accessible for audit', false);
  }

  // ---------------------------------------------------------------------------
  // SECTION 6: TIMETABLE SCRAPING & DYNAMIC FACULTY REASSIGNMENT ENGINE
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. Timetable Scraping & Faculty Reassignment Engine ---');

  // 6.1 Scrape live status check
  const scrapeStatus = await request(`${API_URL}/timetable/scrape-live-status`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  record('timetable_scraping_engine', 'Live scrape status endpoint responds with 200 OK', scrapeStatus.status === 200);

  const sources = scrapeStatus.data?.sources || [];
  const samaySource = sources.find(s => s.name?.includes('Samay'));
  const isSamayOnline = samaySource && samaySource.online && samaySource.status === 200;
  record('timetable_scraping_engine', 'Samay Live API (samay.mygbu.in) is online and responding', !!isSamayOnline, `Latency: ${samaySource?.latencyMs}ms, Records: ${samaySource?.recordCount}`);

  // 6.2 Faculty Sync Dry Run Test
  const dryRunSync = await request(`${API_URL}/timetable/sync-faculty`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ school: 'SOICT', department: 'CSE', dryRun: true })
  });
  record('timetable_scraping_engine', 'Faculty Sync Dry Run simulation succeeds (200 OK)', dryRunSync.status === 200 && dryRunSync.data?.success === true);
  record('timetable_scraping_engine', 'Dry Run returns structured summary and allocation count', typeof dryRunSync.data?.summary?.totalAllocationsParsed === 'number', `Allocations: ${dryRunSync.data?.summary?.totalAllocationsParsed}`);

  // 6.3 Faculty Audit Log Endpoint
  const auditLogsRes = await request(`${API_URL}/timetable/faculty-audit-log?limit=10`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  record('timetable_scraping_engine', 'Faculty transition audit log endpoint responds with 200 OK', auditLogsRes.status === 200 && Array.isArray(auditLogsRes.data?.logs));

  // ---------------------------------------------------------------------------
  // WRITE REPORT
  // ---------------------------------------------------------------------------
  fs.writeFileSync(REPORT_FILE, JSON.stringify(results, null, 2), 'utf8');

  console.log('\n========================================================================');
  console.log(`  SECURITY & PIPELINE AUDIT COMPLETE: ${results.summary.passed}/${results.summary.total} PASSED, ${results.summary.failed} FAILED`);
  console.log(`  Report saved to: ${REPORT_FILE}`);
  console.log('========================================================================\n');
}

runAudit();
