import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import Sequelize from 'sequelize';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import User from '../models/user.model.js';
import Student from '../models/student.model.js';
import TimetableSection from '../models/timetableSection.model.js';
import Timetable from '../models/timetable.model.js';
import { getTimetableForStudent, refreshTimetable } from '../services/timetable.service.js';

const additionalSections = [
    // Fix empty 2022-26 C and D
    {
        school: 'soict', department: 'cse', program: 'B.Tech', batch: '2022-26', specialization: 'Core Sec- C',
        mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1283', label: 'BCS-IV-A'
    },
    {
        school: 'soict', department: 'cse', program: 'B.Tech', batch: '2022-26', specialization: 'Core Sec- D',
        mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1406', label: 'BCS-IV-B'
    },

    // 2021-26 (Integrated 5-Year)
    {
        school: 'soict', department: 'cse', program: 'Integrated B.Tech-M.Tech', batch: '2021-26', specialization: 'AIR',
        mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1333', label: 'MT-AIR-II-A'
    },
    {
        school: 'soict', department: 'cse', program: 'Integrated B.Tech-M.Tech', batch: '2021-26', specialization: 'Data Science',
        mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1377', label: 'MT-DS-II'
    },
    {
        school: 'soict', department: 'cse', program: 'Integrated B.Tech-M.Tech', batch: '2021-26', specialization: 'SE',
        mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '31', label: 'MT-SE-II'
    },

    // 2022-27 (Integrated 5-Year)
    {
        school: 'soict', department: 'cse', program: 'Integrated B.Tech-M.Tech', batch: '2022-27', specialization: 'Core',
        mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '2433', label: 'CS-IV-A'
    },

    // 2023-28 (Integrated 5-Year)
    {
        school: 'soict', department: 'cse', program: 'Integrated B.Tech-M.Tech', batch: '2023-28', specialization: 'Core',
        mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '19', label: 'CS-III-A'
    },

    // 2024-26 (M.Tech 2-Year)
    {
        school: 'soict', department: 'cse', program: 'M.Tech', batch: '2024-26', specialization: 'AIR',
        mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1333', label: 'MT-AIR-II-A'
    },
    {
        school: 'soict', department: 'cse', program: 'M.Tech', batch: '2024-26', specialization: 'Data Science',
        mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1377', label: 'MT-DS-II'
    },

    // 2024-28 additions
    {
        school: 'soict', department: 'cse', program: 'B.Tech', batch: '2024-28', specialization: 'AI Sec-A',
        mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1278', label: 'BAI-III'
    },
    {
        school: 'soict', department: 'cse', program: 'B.Tech', batch: '2024-28', specialization: 'AI Sec-B',
        mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '2586', label: 'BAI-III-B'
    },

    // 2024-29 (Integrated 5-Year)
    {
        school: 'soict', department: 'cse', program: 'Integrated B.Tech-M.Tech', batch: '2024-29', specialization: 'Core',
        mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '21', label: 'CS-II-A'
    },

    // 2025-27 (M.Tech 2-Year)
    {
        school: 'soict', department: 'cse', program: 'M.Tech', batch: '2025-27', specialization: 'Core',
        mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1308', label: 'MT-SE-I'
    },

    // 2025-29 additions
    {
        school: 'soict', department: 'cse', program: 'B.Tech', batch: '2025-29', specialization: 'AI Sec-A',
        mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1277', label: 'BAI-II'
    },
    {
        school: 'soict', department: 'cse', program: 'B.Tech', batch: '2025-29', specialization: 'AI Sec-B',
        mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '2541', label: 'BAI-II-B'
    },
    {
        school: 'soict', department: 'cse', program: 'B.Tech', batch: '2025-29', specialization: 'Core Sec- E',
        mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '2536', label: 'BCS-II D'
    },

    // 2025-30 (Integrated 5-Year)
    {
        school: 'soict', department: 'cse', program: 'Integrated B.Tech-M.Tech', batch: '2025-30', specialization: 'Core Sec- A',
        mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1311', label: 'CS-I-A'
    },

    // 2026-30 additions
    {
        school: 'soict', department: 'cse', program: 'B.Tech', batch: '2026-30', specialization: 'AI Sec - B',
        mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '2461', label: 'BAI-I-B'
    },
    {
        school: 'soict', department: 'cse', program: 'B.Tech', batch: '2026-30', specialization: 'Cyber Security Sec - A',
        mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1337', label: 'CSE-CS-I'
    },
    {
        school: 'soict', department: 'cse', program: 'B.Tech', batch: '2026-30', specialization: 'Data Science Sec - A',
        mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1339', label: 'CSE-DS-I'
    },
    {
        school: 'soict', department: 'cse', program: 'B.Tech', batch: '2026-30', specialization: 'Core Sec - B',
        mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '21', label: 'CS-II-A'
    },
    {
        school: 'soict', department: 'cse', program: 'B.Tech', batch: '2026-30', specialization: 'Core Sec - C',
        mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '19', label: 'CS-III-A'
    }
];

async function setupAndTestAll() {
    console.log('=== Step 1: Updating TimetableSections ===');
    for (const sec of additionalSections) {
        const [existing] = await TimetableSection.findOrCreate({
            where: {
                school: sec.school,
                department: sec.department,
                program: sec.program,
                batch: sec.batch,
                specialization: sec.specialization
            },
            defaults: {
                ...sec,
                active: true,
                academicYear: '2026-27',
                semester: 'Odd'
            }
        });
        if (existing) {
            existing.mygbuSectionId = sec.mygbuSectionId;
            existing.label = sec.label;
            existing.active = true;
            await existing.save();
        }
    }
    console.log('TimetableSections updated successfully.');

    // Fetch all active sections for CSE
    const allSections = await TimetableSection.findAll({
        where: { department: 'cse', active: true },
        order: [['batch', 'ASC'], ['specialization', 'ASC']]
    });
    console.log(`Total CSE TimetableSections available: ${allSections.length}`);

    console.log('\n=== Step 2: Creating Test Student Accounts For Every Section and Batch ===');
    const hashedPassword = await bcrypt.hash('TestStudent@123', 10);
    const testStudents = [];

    for (const sec of allSections) {
        const safeBatch = sec.batch.replace(/[^a-zA-Z0-9]/g, '');
        const safeSpec = sec.specialization.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const username = `test_cse_${sec.id}_${safeBatch}_${safeSpec}`;
        const rollNo = `TEST_${sec.id}_${safeBatch}_${safeSpec}`;
        const enrollmentNo = `EN_${sec.id}_${safeBatch}_${safeSpec}`;

        // Find or create User
        let user = await User.findOne({ where: { username } });
        if (!user) {
            user = await User.create({
                name: `Test CSE ${sec.batch} ${sec.specialization}`,
                username,
                password: hashedPassword,
                role: 'student'
            });
        }

        // Find or create Student
        let student = await Student.findOne({ where: { userId: user.id } });
        if (!student) {
            student = await Student.create({
                userId: user.id,
                rollNo,
                enrollmentNo,
                fullName: `Test Student (${sec.batch} ${sec.specialization})`,
                school: sec.school,
                department: sec.department,
                program: sec.program,
                batch: sec.batch,
                specialization: sec.specialization,
                fatherName: 'Father Name',
                motherName: 'Mother Name',
                gender: 'Other',
                category: 'General',
                mobile: '9999999999',
                email: `${username}@gbu.ac.in`,
                hosteller: 'Day Scholar',
                admissionType: 'Regular',
                twelfthCompartment: 'No',
                internshipStatus: 'Not Started',
                placementStatus: 'Eligible',
                status: 'active',
                createdBy: 1
            });
        } else {
            student.school = sec.school;
            student.department = sec.department;
            student.program = sec.program;
            student.batch = sec.batch;
            student.specialization = sec.specialization;
            await student.save();
        }

        testStudents.push({ user, student, section: sec });
    }

    console.log(`Created/verified ${testStudents.length} test student accounts.`);

    console.log('\n=== Step 3: Testing Timetable Retrieval For EVERY Student Account ===');
    let passCount = 0;
    let failCount = 0;
    const failureDetails = [];

    const batchesTested = new Set();

    for (let i = 0; i < testStudents.length; i++) {
        const { user, student, section } = testStudents[i];
        batchesTested.add(student.batch);

        const res = await getTimetableForStudent(user.id);
        const prefix = `[${i + 1}/${testStudents.length}] Batch ${student.batch.padEnd(8)} | Spec: ${student.specialization.padEnd(25)}`;

        if (res.ok) {
            passCount++;
            const days = Object.keys(res.timetable?.entries || {}).length;
            const subCount = res.timetable?.subjects?.length || 0;
            const label = res.section?.label || 'N/A';
            console.log(`${prefix} -> PASS | SectionId: ${String(res.section?.mygbuSectionId).padEnd(5)} | Label: ${label.padEnd(16)} | Subjects: ${subCount} | Days: ${days}`);
        } else {
            failCount++;
            console.error(`${prefix} -> FAIL | Error: ${res.error}`);
            failureDetails.push({
                user: user.username,
                batch: student.batch,
                specialization: student.specialization,
                error: res.error
            });
        }
    }

    console.log('\n======================================================');
    console.log(`TEST SUMMARY:`);
    console.log(`Total Student Accounts Tested: ${testStudents.length}`);
    console.log(`Batches Covered: ${[...batchesTested].sort().join(', ')} (${batchesTested.size} batches)`);
    console.log(`SUCCESS: ${passCount}`);
    console.log(`FAILED:  ${failCount}`);
    console.log(`SUCCESS RATE: ${((passCount / testStudents.length) * 100).toFixed(1)}%`);
    console.log('======================================================\n');

    if (failureDetails.length > 0) {
        console.log('Failed Accounts:', failureDetails);
        process.exit(1);
    } else {
        console.log('ALL CSE BATCHES AND SECTIONS PASSED 100%! SUCCESS!');
        process.exit(0);
    }
}

setupAndTestAll().catch((err) => {
    console.error('Fatal execution error:', err);
    process.exit(1);
});
