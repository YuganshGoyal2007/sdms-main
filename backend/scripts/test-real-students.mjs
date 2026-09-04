import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Sequelize from 'sequelize';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: 'mysql',
    logging: false
});

import { getTimetableForStudent } from '../services/timetable.service.js';

async function testRealStudents() {
    // Find all real students in the database that have a User account
    const [students] = await sequelize.query(`
        SELECT s.id, s.userId, u.username, s.rollNo, s.fullName, s.batch, s.specialization
        FROM Students s
        JOIN Users u ON s.userId = u.id
        WHERE (s.department = 'cse' OR s.department = 'CSE')
          AND u.username NOT LIKE 'test_%'
          AND u.username NOT LIKE 'student20%'
        ORDER BY s.batch ASC, s.specialization ASC
    `);

    console.log(`Found ${students.length} real CSE students with active accounts in database:\n`);

    let passed = 0;
    let failed = 0;
    const failures = [];

    for (let i = 0; i < students.length; i++) {
        const st = students[i];
        const res = await getTimetableForStudent(st.userId);
        const prefix = `[${i + 1}/${students.length}] User: ${st.username.padEnd(14)} (${st.fullName.slice(0, 16).padEnd(16)}) | Batch: ${st.batch.padEnd(8)} | Spec: ${st.specialization.padEnd(25)}`;

        if (res.ok) {
            passed++;
            const subCount = res.timetable?.subjects?.length || 0;
            const days = Object.keys(res.timetable?.entries || {}).length;
            const sectionLabel = res.section?.label || 'N/A';
            console.log(`${prefix} -> PASS | Section: ${sectionLabel.padEnd(14)} | Subjects: ${String(subCount).padEnd(2)} | Days: ${days}`);
        } else {
            failed++;
            console.error(`${prefix} -> FAIL | Error: ${res.error}`);
            failures.push({ student: st, error: res.error });
        }
    }

    console.log('\n======================================================');
    console.log(`REAL STUDENT DATA TEST SUMMARY:`);
    console.log(`Total Real Students Tested: ${students.length}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    if (students.length > 0) {
        console.log(`SUCCESS RATE: ${((passed / students.length) * 100).toFixed(1)}%`);
    }
    console.log('======================================================\n');

    if (failures.length > 0) {
        console.error('Failed Real Students:', failures);
        process.exit(1);
    } else {
        console.log('ALL REAL STUDENT ACCOUNTS PASSED 100%!');
        process.exit(0);
    }
}

testRealStudents().catch(console.error);
