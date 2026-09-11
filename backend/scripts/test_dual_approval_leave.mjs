import { config } from 'dotenv';
config({ path: new URL('../.env', import.meta.url).pathname.replace(/^\/([a-zA-Z]:)/, '$1') });

const BASE_URL = 'http://localhost:5000';

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, headers: res.headers };
}

async function login(username, password) {
  const res = await request('/auth/user-login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  const token = res.data.accessToken || res.data.token || '';
  if (!token) {
    throw new Error(`Login failed for ${username}: ${JSON.stringify(res.data)}`);
  }
  return {
    token,
    role: res.data.role,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  };
}

async function runDualApprovalLeaveSuite() {
  console.log('========================================================================');
  console.log('   DUAL APPROVAL LEAVE MANAGEMENT & TEACHER TIMETABLE E2E TEST SUITE   ');
  console.log('========================================================================\n');

  try {
    // 1. Authenticate Personas
    console.log('[Step 1] Authenticating Test Personas...');
    const hod = await login('hod.cs@gbu.ac.in', 'admin123');
    console.log('✓ HOD Admin authenticated (hod.cs@gbu.ac.in)');

    const dean = await login('dean.soict@gbu.ac.in', 'TestPass@123');
    console.log('✓ Dean SOICT Officer authenticated (dean.soict@gbu.ac.in)');

    const coord = await login('test_coord@gbu.ac.in', 'TestPass@123');
    console.log('✓ Coordinator authenticated (test_coord@gbu.ac.in)');

    const chair = await login('test_chair@gbu.ac.in', 'TestPass@123');
    console.log('✓ Chairperson authenticated (test_chair@gbu.ac.in)');

    const faculty = await login('test_faculty@gbu.ac.in', 'TestPass@123');
    console.log('✓ Faculty authenticated (test_faculty@gbu.ac.in)');

    // 2. Fetch Active Leave Types
    console.log('\n[Step 2] Fetching Leave Types...');
    const typesRes = await request('/leaves/types', { headers: hod.headers });
    if (!typesRes.data.leaveTypes?.length) {
      throw new Error('No active leave types found.');
    }
    const leaveType = typesRes.data.leaveTypes[0];
    console.log(`✓ Active Leave Type selected: ${leaveType.name} (Code: ${leaveType.code}, ID: ${leaveType.id})`);

    // 3. Coordinator Applies with Remarks
    console.log('\n[Step 3] Coordinator Applying for Leave with Remarks...');
    const coordLeaveRes = await request('/leaves/apply', {
      method: 'POST',
      headers: coord.headers,
      body: JSON.stringify({
        leaveTypeId: leaveType.id,
        fromDate: '2026-10-05',
        toDate: '2026-10-06',
        reason: 'Curriculum development workshop',
        remarks: 'Class lectures rescheduled to Saturday morning.',
      }),
    });
    if (coordLeaveRes.status !== 201 && coordLeaveRes.status !== 200) {
      throw new Error(`Coordinator apply failed: ${JSON.stringify(coordLeaveRes.data)}`);
    }
    const coordLeaveId = coordLeaveRes.data.leave.id;
    console.log(`✓ Coordinator Leave #${coordLeaveId} created: status=${coordLeaveRes.data.leave.status}, remarks="${coordLeaveRes.data.leave.remarks}"`);

    // 4. Chairperson Applies with Remarks
    console.log('\n[Step 4] Chairperson Applying for Leave with Remarks...');
    const chairLeaveRes = await request('/leaves/apply', {
      method: 'POST',
      headers: chair.headers,
      body: JSON.stringify({
        leaveTypeId: leaveType.id,
        fromDate: '2026-10-12',
        toDate: '2026-10-13',
        reason: 'Board of Studies external meeting',
        remarks: 'Emergency contact available via university email.',
      }),
    });
    const chairLeaveId = chairLeaveRes.data.leave.id;
    console.log(`✓ Chairperson Leave #${chairLeaveId} created: status=${chairLeaveRes.data.leave.status}`);

    // 5. Test Teacher Timetable Access for HOD & Dean
    console.log('\n[Step 5] Testing Teacher Timetable inspection by HOD & Dean for Leave #' + coordLeaveId + '...');
    const ttRes = await request(`/leaves/${coordLeaveId}/teacher-timetable`, { headers: hod.headers });
    if (ttRes.status !== 200 || !ttRes.data.success) {
      throw new Error(`Failed to fetch timetable for leave: ${JSON.stringify(ttRes.data)}`);
    }
    console.log(`✓ Teacher Timetable retrieved for ${ttRes.data.teacher.name} (${ttRes.data.teacher.role}):`);
    console.log(`   Assigned Classes: ${ttRes.data.assignedClasses.length}, Candidate Codes: ${ttRes.data.candidateCodes.join(', ') || 'N/A'}`);

    // 6. Test Dual Approval Workflow on Coordinator Leave
    console.log('\n[Step 6] Testing Dual Approval (Stage 1: HOD approves with remarks)...');
    const hodApproveRes = await request(`/leaves/${coordLeaveId}/status`, {
      method: 'PUT',
      headers: hod.headers,
      body: JSON.stringify({
        status: 'approved',
        comments: 'HOD verified class schedule with no conflicts.',
        asRole: 'hod',
      }),
    });
    console.log(`✓ HOD approval status: ${hodApproveRes.status}, hodStatus=${hodApproveRes.data.leave.hodStatus}, overallStatus=${hodApproveRes.data.leave.status}`);
    if (hodApproveRes.data.leave.status !== 'pending') {
      throw new Error(`Expected overallStatus to remain 'pending' until Dean approves, got: ${hodApproveRes.data.leave.status}`);
    }

    console.log('\n[Step 6b] Testing Dual Approval (Stage 2: Dean approves with remarks)...');
    const deanApproveRes = await request(`/leaves/${coordLeaveId}/status`, {
      method: 'PUT',
      headers: dean.headers,
      body: JSON.stringify({
        status: 'approved',
        comments: 'Dean sanction granted for curriculum workshop.',
      }),
    });
    console.log(`✓ Dean approval status: ${deanApproveRes.status}, deanStatus=${deanApproveRes.data.leave.deanStatus}, overallStatus=${deanApproveRes.data.leave.status}`);
    if (deanApproveRes.data.leave.status !== 'approved') {
      throw new Error(`Expected overallStatus to become 'approved' after both HOD and Dean approved, got: ${deanApproveRes.data.leave.status}`);
    }

    // 7. Test Single Rejection Short-Circuit on Chairperson Leave
    console.log('\n[Step 7] Testing Single Rejection Short-Circuit (HOD rejects Chairperson leave #' + chairLeaveId + ')...');
    const hodRejectRes = await request(`/leaves/${chairLeaveId}/status`, {
      method: 'PUT',
      headers: hod.headers,
      body: JSON.stringify({
        status: 'rejected',
        comments: 'Critical mid-semester examination duty scheduled on these dates.',
        asRole: 'hod',
      }),
    });
    console.log(`✓ HOD rejection status: ${hodRejectRes.status}, hodStatus=${hodRejectRes.data.leave.hodStatus}, overallStatus=${hodRejectRes.data.leave.status}`);
    if (hodRejectRes.data.leave.status !== 'rejected') {
      throw new Error(`Expected overallStatus to become 'rejected' immediately upon HOD rejection, got: ${hodRejectRes.data.leave.status}`);
    }

    // 8. Verify Remarks Visibility in Teacher History
    console.log('\n[Step 8] Verifying Remarks Visibility in Coordinator Leave History...');
    const myLeavesRes = await request('/leaves/my', { headers: coord.headers });
    const targetLeave = myLeavesRes.data.leaves.find(l => l.id === coordLeaveId);
    if (!targetLeave) throw new Error('Could not find leave application in user history');
    console.log(`✓ Verified Coordinator Leave Record:`);
    console.log(`   Applicant Remarks: "${targetLeave.remarks}"`);
    console.log(`   HOD Comments: "${targetLeave.hodComments}"`);
    console.log(`   Dean Comments: "${targetLeave.deanComments}"`);
    console.log(`   Overall Status: "${targetLeave.status}"`);

    console.log('\n========================================================================');
    console.log('🎉 ALL DUAL-APPROVAL LEAVE & TIMETABLE TESTS PASSED 100%!');
    console.log('========================================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test Suite Failed:', err.message || err);
    process.exit(1);
  }
}

runDualApprovalLeaveSuite();
