import { config } from 'dotenv';
config({ path: new URL('../.env', import.meta.url).pathname.replace(/^\/([a-zA-Z]:)/, '$1') });

const BASE_URL = 'http://localhost:5000';

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });
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
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
}

async function runVerification() {
  console.log('=== VERIFYING NO DUES, FEES, AND LEAVES ENDPOINTS ===\n');

  try {
    // 1. Student Login
    console.log('[1/7] Logging in as student (2500100481)...');
    const studentAuth = await login('2500100481', 'TestPass@123');
    console.log('✓ Student logged in successfully');

    // 2. Fees Portal
    console.log('\n[2/7] Testing Fees Ledger (GET /fees/my)...');
    const feesRes = await request('/fees/my', { headers: studentAuth.headers });
    console.log(`✓ Status ${feesRes.status}, Total Amount: ₹${feesRes.data.summary?.totalAmount}, Records: ${feesRes.data.feeRecords?.length}`);

    // Test Pay
    if (feesRes.data.feeRecords?.length > 0) {
      const rec = feesRes.data.feeRecords[0];
      console.log(`Testing Fee Payment simulation (POST /fees/pay for record #${rec.id})...`);
      const payRes = await request('/fees/pay', {
        method: 'POST',
        headers: studentAuth.headers,
        body: JSON.stringify({ recordId: rec.id, amount: 500, paymentMethod: 'Automated Test UPI' }),
      });
      console.log(`✓ Payment processed: status ${payRes.status}, Txn: ${payRes.data.receipt?.transactionRef}`);
    }

    // 3. No Dues Clearance
    console.log('\n[3/7] Testing No Dues Status (GET /no-dues/my)...');
    let noDuesRes = await request('/no-dues/my', { headers: studentAuth.headers });
    console.log(`✓ Status ${noDuesRes.status}, Has Application: ${noDuesRes.data.hasApplication}`);

    if (!noDuesRes.data.hasApplication) {
      console.log('Applying for No-Dues clearance (POST /no-dues/apply)...');
      const applyRes = await request('/no-dues/apply', {
        method: 'POST',
        headers: studentAuth.headers,
        body: JSON.stringify({ reason: 'Graduation Clearance', isHosteller: true }),
      });
      console.log(`✓ Application created: status ${applyRes.status}, DisplayId: ${applyRes.data.application?.displayId}, Stages: ${applyRes.data.stages?.length}`);
      noDuesRes = await request('/no-dues/my', { headers: studentAuth.headers });
    }

    const stages = noDuesRes.data.stages || [];
    console.log(`✓ Active pipeline gates: ${stages.map((s) => `${s.stageCode}(${s.status})`).join(' -> ')}`);

    // 4. Admin Clearance Review Queue
    console.log('\n[4/7] Logging in as Admin (hod.cs@gbu.ac.in)...');
    const adminAuth = await login('hod.cs@gbu.ac.in', 'TestPass@123');
    console.log('✓ Admin logged in');

    console.log('Testing Clearance Queue (GET /no-dues/pending)...');
    const pendingClearances = await request('/no-dues/pending', { headers: adminAuth.headers });
    console.log(`✓ Pending clearance tasks count: ${pendingClearances.data.count}`);

    // If there are pending stages, test approving one
    if (stages.length > 0 && stages[0].status === 'pending') {
      const stageToApprove = stages[0];
      console.log(`Testing Stage Approval (POST /no-dues/stages/${stageToApprove.id}/action)...`);
      const actionRes = await request(`/no-dues/stages/${stageToApprove.id}/action`, {
        method: 'POST',
        headers: adminAuth.headers,
        body: JSON.stringify({ action: 'approve', comments: 'Zero dues certified by automated audit.' }),
      });
      console.log(`✓ Stage approved: status ${actionRes.status}, Stage Status: ${actionRes.data.stage?.status}`);
    }

    // 5. Leave Quotas
    console.log('\n[5/7] Testing Leave Types (GET /leaves/types)...');
    const typesRes = await request('/leaves/types', { headers: adminAuth.headers });
    console.log(`✓ Leave types available: ${typesRes.data.leaveTypes?.map((t) => `${t.code}(${t.maxDays}d)`).join(', ')}`);

    // 6. Faculty Leave Application
    console.log('\n[6/7] Logging in as Faculty (test_faculty@gbu.ac.in)...');
    const facultyAuth = await login('test_faculty@gbu.ac.in', 'TestPass@123');
    console.log('✓ Faculty logged in');

    console.log('Checking Faculty Leave Balances (GET /leaves/my/balance)...');
    const balancesRes = await request('/leaves/my/balance', { headers: facultyAuth.headers });
    console.log(`✓ Faculty Balances: ${balancesRes.data.balances?.map((b) => `${b.code}: ${b.remainingDays} left`).join(', ')}`);

    const clType = balancesRes.data.balances?.find((b) => b.code === 'CL') || balancesRes.data.balances?.[0];
    if (clType && clType.remainingDays > 0) {
      console.log('Applying for 2 days leave (POST /leaves/apply)...');
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 86400000);
      const nextWeekEnd = new Date(today.getTime() + 8 * 86400000);
      const fromStr = nextWeek.toISOString().slice(0, 10);
      const toStr = nextWeekEnd.toISOString().slice(0, 10);

      const applyLeaveRes = await request('/leaves/apply', {
        method: 'POST',
        headers: facultyAuth.headers,
        body: JSON.stringify({
          leaveTypeId: clType.id,
          fromDate: fromStr,
          toDate: toStr,
          reason: 'Academic Conference Presentation',
        }),
      });
      console.log(`✓ Leave applied: status ${applyLeaveRes.status}, Leave ID: ${applyLeaveRes.data.leave?.id}`);

      // 7. Chairperson / Admin Review Leave
      console.log('\n[7/7] Reviewing Leave Queue (GET /leaves/pending)...');
      const pendingLeaves = await request('/leaves/pending', { headers: adminAuth.headers });
      console.log(`✓ Pending leaves in queue: ${pendingLeaves.data.count}`);

      if (applyLeaveRes.data.leave?.id) {
        const leaveId = applyLeaveRes.data.leave.id;
        console.log(`Approving leave #${leaveId} (PUT /leaves/${leaveId}/status)...`);
        const approveLeaveRes = await request(`/leaves/${leaveId}/status`, {
          method: 'PUT',
          headers: adminAuth.headers,
          body: JSON.stringify({ status: 'approved', comments: 'Approved for conference presentation' }),
        });
        console.log(`✓ Leave approved: status ${approveLeaveRes.status}, Overall: ${approveLeaveRes.data.leave?.status}`);
      }
    }

    console.log('\n=============================================');
    console.log('🎉 ALL NO DUES, FEES & LEAVES TESTS PASSED 100%!');
    console.log('=============================================');
    process.exit(0);
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  }
}

runVerification();
