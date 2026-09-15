/**
 * IMPORTANT: RUN THIS SCRIPT BEFORE EVERY DEPLOYMENT
 * 
 * Usage: node backend/scripts/smoke_test.mjs
 * 
 * Tests critical paths:
 * - Health check
 * - HOD login
 * - Leave endpoints (types, pending, balances)
 * - Timetable endpoints
 * - Student CRUD
 * - Photo upload
 * - Roll number normalization
 * - Role restrictions (Student 403 on leave routes)
 * - Excel export
 * - No dues endpoints
 */

import http from 'http';
import https from 'https';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '../.env') });

const API_BASE = 'http://localhost:5000';
let passCount = 0;
let failCount = 0;
let hodToken = '';
let studentToken = '';

const colorRed = '\x1b[31m';
const colorGreen = '\x1b[32m';
const colorReset = '\x1b[0m';

function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        let parsed = data;
        if (res.headers['content-type']?.includes('application/json')) {
          try { parsed = JSON.parse(data); } catch (e) {}
        }
        resolve({ status: res.statusCode, headers: res.headers, data: parsed });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTest(name, testFn) {
  process.stdout.write(`Testing: ${name}... `);
  try {
    await testFn();
    console.log(`${colorGreen}PASS${colorReset}`);
    passCount++;
  } catch (error) {
    console.log(`${colorRed}FAIL${colorReset}`);
    console.error(`  => ${error.message}`);
    failCount++;
  }
}

async function runAll() {
  console.log('--- Starting Smoke Tests ---\n');

  await runTest('Health Check', async () => {
    const res = await request(`${API_BASE}/health`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  await runTest('HOD login (hod.cs@gbu.ac.in / admin123)', async () => {
    const res = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: 'hod.cs@gbu.ac.in', password: 'admin123' });
    
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status} ${JSON.stringify(res.data)}`);
    if (!res.data?.accessToken) throw new Error('No access token returned');
    hodToken = res.data.accessToken;
  });

  const testRollNumber = '888/UCS/300';
  const testEnrollment = 'EN2025/8885';
  await runTest('Student CRUD (Create basic record)', async () => {
    const res = await request(`${API_BASE}/admin/add-student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hodToken}`
      }
    }, {
      name: 'Smoke Test Student',
      fullName: 'Smoke Test Student',
      email: 'smoke888@example.com',
      rollNo: testRollNumber,
      enrollmentNo: 'EN2025/8885',
      program: 'B.Tech',
      batch: '2025',
      mobile: '9999999888',
      school: 'SOICT',
      department: 'CSE',
      specialization: 'None',
      fatherName: 'Test Father',
      motherName: 'Test Mother',
      gender: 'Male',
      dob: '2000-01-01',
      category: 'General',
      hosteller: false,
      admissionType: 'Regular',
      twelfthCompartment: false,
      internshipStatus: 'None',
      placementStatus: 'None',
      address: 'Test Address',
      semesters: [
        { semesterName: 1, gpa: 8, credits: 20 },
        { semesterName: 2, gpa: 8.5, credits: 20 },
        { semesterName: 3, gpa: 8, credits: 20 },
        { semesterName: 4, gpa: 8.5, credits: 20 },
        { semesterName: 5, gpa: 8, credits: 20 },
        { semesterName: 6, gpa: 8.5, credits: 20 },
        { semesterName: 7, gpa: 8, credits: 20 },
        { semesterName: 8, gpa: 8.5, credits: 20 }
      ],
      yearCGPA: [
        { yearName: 1, cgpa: 8.25 },
        { yearName: 2, cgpa: 8.25 },
        { yearName: 3, cgpa: 8.25 },
        { yearName: 4, cgpa: 8.25 }
      ]
    });
    
    if (res.status !== 201 && res.status !== 409) {
      throw new Error(`Expected 201 or 409, got ${res.status} ${JSON.stringify(res.data)}`);
    }
  });

  await runTest('Register and login Student (for token)', async () => {
    const regRes = await request(`${API_BASE}/auth/user-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: 'EN2025/8885', password: 'student123' });

    if (regRes.status !== 201 && regRes.status !== 409) {
      throw new Error(`Register: Expected 201 or 409, got ${regRes.status} ${JSON.stringify(regRes.data)}`);
    }

    const loginRes = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: 'EN2025/8885', password: 'student123' });

    if (loginRes.status !== 200) throw new Error(`Login: Expected 200, got ${loginRes.status}`);
    studentToken = loginRes.data.accessToken;
  });

  await runTest('Leave types, pending, balances endpoints', async () => {
    const typesRes = await request(`${API_BASE}/leaves/types`, { headers: { Authorization: `Bearer ${hodToken}` } });
    if (typesRes.status !== 200) throw new Error(`Leave types: Expected 200, got ${typesRes.status}`);
    const pendRes = await request(`${API_BASE}/leaves/pending`, { headers: { Authorization: `Bearer ${hodToken}` } });
    if (pendRes.status !== 200) throw new Error(`Leave pending: Expected 200, got ${pendRes.status}`);
    const balRes = await request(`${API_BASE}/leaves/my/balance`, { headers: { Authorization: `Bearer ${hodToken}` } });
    if (balRes.status !== 200) throw new Error(`Leave balance: Expected 200, got ${balRes.status}`);
  });

  await runTest('Timetable endpoints', async () => {
    const res = await request(`${API_BASE}/timetable/sections`, {
      headers: { Authorization: `Bearer ${hodToken}` }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  await runTest('Roll number normalization (verify "888/UCS/300" -> "888UCS300")', async () => {
    const res = await request(`${API_BASE}/admin/get-student-profile/888UCS300`, {
      headers: { Authorization: `Bearer ${hodToken}` }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.data?.student?.rollNo !== '888UCS300') {
      throw new Error(`Expected roll number '888UCS300', got '${res.data?.student?.rollNo}'`);
    }
  });

  await runTest('Student CRUD (Update)', async () => {
    const res = await request(`${API_BASE}/admin/update-student/888UCS300`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hodToken}`
      }
    }, {
      fullName: 'Smoke Test Student Updated'
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  await runTest('Photo upload pipeline (base64 PNG conversion)', async () => {
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const body = JSON.stringify({ photo: `data:image/png;base64,${pngBase64}` });
    const res = await request(`${API_BASE}/admin/update-student-photo/888UCS300`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hodToken}`
      }
    }, body);
    
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  await runTest('Student 403 on leave routes', async () => {
    const res = await request(`${API_BASE}/leaves/pending`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  await runTest('Excel export endpoint', async () => {
    const res = await request(`${API_BASE}/admin/export-students`, {
      headers: { Authorization: `Bearer ${hodToken}` }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  await runTest('No dues endpoints', async () => {
    const res = await request(`${API_BASE}/no-dues/my`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    // In our app, no-dues might be /my, returning 200.
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  console.log('\n--- Summary ---');
  console.log(`Total: ${passCount + failCount}`);
  console.log(`${colorGreen}Passed: ${passCount}${colorReset}`);
  if (failCount > 0) {
    console.log(`${colorRed}Failed: ${failCount}${colorReset}`);
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAll().catch(err => {
  console.error('Fatal error running smoke tests:', err);
  process.exit(1);
});
