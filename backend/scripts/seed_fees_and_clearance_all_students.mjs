import sequelize from '../lib/db.js';
import {
  Student,
  FeeRecord,
  NoDuesApplication,
  NoDuesStage,
} from '../models/index.js';

function generateDisplayId(rollNo) {
  const clean = String(rollNo || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 2; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ND${clean}${suffix}`;
}

async function seedAll() {
  console.log('=== SEEDING FEES & CLEARANCE FOR ALL STUDENTS ===');
  
  const students = await Student.findAll({
    attributes: ['id', 'rollNo', 'enrollmentNo', 'fullName', 'school', 'department', 'program', 'batch', 'hosteller'],
    raw: true,
  });

  console.log(`Found ${students.length} students in the database.`);

  const existingFeeRolls = new Set(
    (await FeeRecord.findAll({ attributes: ['rollNo'], raw: true })).map((f) => f.rollNo)
  );

  console.log(`Students already with fee records: ${existingFeeRolls.size}`);

  const newFeeRecords = [];
  const appsToCreate = [];

  const existingAppStudents = new Set(
    (await NoDuesApplication.findAll({ attributes: ['studentId'], raw: true })).map((a) => a.studentId)
  );

  let appCounter = 0;

  for (let idx = 0; idx < students.length; idx++) {
    const s = students[idx];

    // 1. Fee records
    if (!existingFeeRolls.has(s.rollNo)) {
      const isPendingStudent = idx % 5 === 0; // ~20% have dues pending
      const tuitionDue = isPendingStudent ? 15000 : 0;
      const tuitionPaid = 60000 - tuitionDue;

      newFeeRecords.push({
        studentId: s.id,
        rollNo: s.rollNo,
        academicYear: '2025-2026',
        semester: 5,
        feeType: 'Tuition Fee',
        amount: 60000.0,
        paidAmount: tuitionPaid,
        dueAmount: tuitionDue,
        status: tuitionDue === 0 ? 'paid' : tuitionPaid > 0 ? 'partial' : 'pending',
        dueDate: '2025-08-15',
        paidDate: tuitionPaid > 0 ? '2025-08-10' : null,
        transactionRef: tuitionPaid > 0 ? `TXN-${s.rollNo}-01` : null,
        remarks: tuitionDue === 0 ? 'NetBanking Payment Verified' : 'Outstanding installment',
      });

      newFeeRecords.push({
        studentId: s.id,
        rollNo: s.rollNo,
        academicYear: '2025-2026',
        semester: 5,
        feeType: 'Examination Fee',
        amount: 2500.0,
        paidAmount: 2500.0,
        dueAmount: 0.0,
        status: 'paid',
        dueDate: '2025-11-01',
        paidDate: '2025-10-25',
        transactionRef: `TXN-${s.rollNo}-02`,
        remarks: 'Exam Hall Ticket Cleared',
      });

      newFeeRecords.push({
        studentId: s.id,
        rollNo: s.rollNo,
        academicYear: '2025-2026',
        semester: 5,
        feeType: 'Library & Security Deposit',
        amount: 1000.0,
        paidAmount: 1000.0,
        dueAmount: 0.0,
        status: 'paid',
        dueDate: '2025-09-01',
        paidDate: '2025-08-20',
        transactionRef: `TXN-${s.rollNo}-03`,
        remarks: 'Security deposit held',
      });

      const isHosteller = s.hosteller === true || s.hosteller === 'yes' || s.hosteller === 1 || idx % 2 === 0;
      if (isHosteller) {
        const messDue = isPendingStudent ? 5000 : 0;
        const messPaid = 35000 - messDue;
        newFeeRecords.push({
          studentId: s.id,
          rollNo: s.rollNo,
          academicYear: '2025-2026',
          semester: 5,
          feeType: 'Hostel & Mess Fee',
          amount: 35000.0,
          paidAmount: messPaid,
          dueAmount: messDue,
          status: messDue === 0 ? 'paid' : 'partial',
          dueDate: '2025-08-15',
          paidDate: '2025-08-12',
          transactionRef: `TXN-${s.rollNo}-04`,
          remarks: 'Hostel allotment verified',
        });
      }
    }

    // 2. Sample No-Dues Applications for ~35 students across batches
    if (!existingAppStudents.has(s.id) && appCounter < 35 && idx % 25 === 0) {
      appsToCreate.push({
        studentId: s.id,
        rollNo: s.rollNo,
        displayId: generateDisplayId(s.rollNo),
        academicYear: '2025-2026',
        school: s.school || 'SOICT',
        department: s.department || 'CSE',
        program: s.program || 'B.Tech',
        batch: s.batch || '2025-29',
        reason: idx % 2 === 0 ? 'Final Graduation & Degree Award' : 'Internship NOC & Semester Clearance',
        status: 'in_progress',
        isHosteller: idx % 2 === 0,
      });
      appCounter++;
    }
  }

  // Insert Fee Records in chunks
  if (newFeeRecords.length > 0) {
    console.log(`Inserting ${newFeeRecords.length} fee records...`);
    const chunkSize = 500;
    for (let i = 0; i < newFeeRecords.length; i += chunkSize) {
      const chunk = newFeeRecords.slice(i, i + chunkSize);
      await FeeRecord.bulkCreate(chunk);
      console.log(`  Inserted fee chunk ${i + 1} to ${Math.min(i + chunkSize, newFeeRecords.length)}`);
    }
  }

  // Insert Sample No-Dues Applications
  if (appsToCreate.length > 0) {
    console.log(`Creating ${appsToCreate.length} No-Dues clearance applications...`);
    for (const appData of appsToCreate) {
      const app = await NoDuesApplication.create(appData);
      
      const stages = [
        {
          applicationId: app.id,
          stageCode: 'SCHOOL_OFFICE',
          stageName: 'School Administrative Office',
          verifierRole: 'coordinator',
          status: 'approved',
          comments: 'Academic records in order.',
          duesAmount: 0.0,
          sequenceOrder: 1,
          verifiedAt: new Date(),
          verifiedBy: 1,
        },
        {
          applicationId: app.id,
          stageCode: 'HOD',
          stageName: 'Head of Department (CSE)',
          verifierRole: 'chairperson',
          status: 'pending',
          duesAmount: 0.0,
          sequenceOrder: 2,
        },
        {
          applicationId: app.id,
          stageCode: 'DEAN',
          stageName: 'School Dean',
          verifierRole: 'admin',
          status: 'pending',
          duesAmount: 0.0,
          sequenceOrder: 3,
        },
        {
          applicationId: app.id,
          stageCode: 'LIB',
          stageName: 'Central Bodhisattva Library',
          verifierRole: 'staff',
          status: 'pending',
          duesAmount: 0.0,
          sequenceOrder: 4,
        },
        {
          applicationId: app.id,
          stageCode: 'SPORTS_LAB',
          stageName: 'Department Labs & Sports Council',
          verifierRole: 'staff',
          status: 'pending',
          duesAmount: 0.0,
          sequenceOrder: 4,
        },
        {
          applicationId: app.id,
          stageCode: 'ACC',
          stageName: 'Finance & Accounts Branch',
          verifierRole: 'admin',
          status: 'pending',
          duesAmount: 0.0,
          sequenceOrder: 5,
        },
      ];

      if (appData.isHosteller) {
        stages.push({
          applicationId: app.id,
          stageCode: 'HST',
          stageName: 'Hostel Warden & Mess Office',
          verifierRole: 'staff',
          status: 'pending',
          duesAmount: 0.0,
          sequenceOrder: 4,
        });
      }

      await NoDuesStage.bulkCreate(stages);
    }
  }

  const finalFeeCount = await FeeRecord.count();
  const finalAppCount = await NoDuesApplication.count();
  const finalStageCount = await NoDuesStage.count();

  console.log('\n=== SEEDING COMPLETE ===');
  console.log(`Total Students: ${students.length}`);
  console.log(`Total Fee Records in DB: ${finalFeeCount}`);
  console.log(`Total No-Dues Applications: ${finalAppCount}`);
  console.log(`Total Clearance Stages: ${finalStageCount}`);

  process.exit(0);
}

seedAll().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
