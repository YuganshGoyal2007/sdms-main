import { config } from 'dotenv';
config({ path: new URL('../.env', import.meta.url).pathname.replace(/^\/([a-zA-Z]:)/, '$1') });
import sequelize from '../lib/db.js';
import {
  FeeRecord,
  NoDuesApplication,
  NoDuesStage,
  LeaveType,
  LeaveApplication,
  Student,
} from '../models/index.js';
import logger from '../lib/logger.js';

async function syncAndSeed() {
  try {
    console.log('--- SYNCING NO DUES, FEES, AND LEAVE TABLES ---');

    await FeeRecord.sync({ alter: false });
    console.log('✓ FeeRecord table verified/created');

    await NoDuesApplication.sync({ alter: false });
    console.log('✓ NoDuesApplication table verified/created');

    await NoDuesStage.sync({ alter: false });
    console.log('✓ NoDuesStage table verified/created');

    await LeaveType.sync({ alter: false });
    console.log('✓ LeaveType table verified/created');

    await LeaveApplication.sync({ alter: false });
    console.log('✓ LeaveApplication table verified/created');

    // Seed default Leave Types if none exist
    const leaveTypesCount = await LeaveType.count();
    if (leaveTypesCount === 0) {
      console.log('Seeding initial Leave Types...');
      await LeaveType.bulkCreate([
        {
          name: 'Casual Leave (CL)',
          code: 'CL',
          description: 'Short term leave for personal matters or unforeseen emergencies',
          maxDays: 12,
          requiresAttachment: false,
          isActive: true,
        },
        {
          name: 'Medical Leave (ML)',
          code: 'ML',
          description: 'Leave for illness or medical treatments requiring medical certificate',
          maxDays: 15,
          requiresAttachment: true,
          isActive: true,
        },
        {
          name: 'Duty / Academic Leave (DL)',
          code: 'DL',
          description: 'Leave for attending conferences, seminars, university duties, or workshops',
          maxDays: 10,
          requiresAttachment: true,
          isActive: true,
        },
        {
          name: 'Special Casual Leave (SCL)',
          code: 'SCL',
          description: 'Special leave approved for university representations or sports events',
          maxDays: 6,
          requiresAttachment: false,
          isActive: true,
        },
        {
          name: 'Restricted Holiday (RH)',
          code: 'RH',
          description: 'Optional festival holidays from the approved university calendar',
          maxDays: 2,
          requiresAttachment: false,
          isActive: true,
        },
      ]);
      console.log('✓ Default Leave Types successfully seeded');
    }

    // Seed sample Fee Records for active test students if none exist
    const feeRecordsCount = await FeeRecord.count();
    if (feeRecordsCount === 0) {
      console.log('Seeding sample Fee Records for student testing...');
      const sampleStudents = await Student.findAll({ limit: 5 });
      for (const st of sampleStudents) {
        await FeeRecord.bulkCreate([
          {
            studentId: st.id,
            rollNo: st.rollNo,
            academicYear: '2025-2026',
            semester: 5,
            feeType: 'Tuition Fee',
            amount: 60000.0,
            paidAmount: 60000.0,
            dueAmount: 0.0,
            status: 'paid',
            dueDate: '2025-08-15',
            paidDate: '2025-08-10',
            transactionRef: `TXN${st.rollNo}01`,
            remarks: 'Paid via Net Banking',
          },
          {
            studentId: st.id,
            rollNo: st.rollNo,
            academicYear: '2025-2026',
            semester: 5,
            feeType: 'Hostel & Mess Fee',
            amount: 35000.0,
            paidAmount: 35000.0,
            dueAmount: 0.0,
            status: 'paid',
            dueDate: '2025-08-15',
            paidDate: '2025-08-12',
            transactionRef: `TXN${st.rollNo}02`,
            remarks: 'Paid via UPI',
          },
          {
            studentId: st.id,
            rollNo: st.rollNo,
            academicYear: '2025-2026',
            semester: 5,
            feeType: 'Examination Fee',
            amount: 2500.0,
            paidAmount: 2500.0,
            dueAmount: 0.0,
            status: 'paid',
            dueDate: '2025-11-01',
            paidDate: '2025-10-28',
            transactionRef: `TXN${st.rollNo}03`,
            remarks: 'Semester Exam Clearance',
          },
          {
            studentId: st.id,
            rollNo: st.rollNo,
            academicYear: '2025-2026',
            semester: 5,
            feeType: 'Library Dues & Security',
            amount: 1000.0,
            paidAmount: 1000.0,
            dueAmount: 0.0,
            status: 'paid',
            dueDate: '2025-09-01',
            paidDate: '2025-08-20',
            transactionRef: `TXN${st.rollNo}04`,
            remarks: 'No overdue library books',
          },
        ]);
      }
      console.log(`✓ Sample Fee Records seeded for ${sampleStudents.length} students`);
    }

    console.log('=== SYNC COMPLETED SUCCESSFULLY ===');
    process.exit(0);
  } catch (err) {
    console.error('❌ Sync failed:', err);
    process.exit(1);
  }
}

syncAndSeed();
