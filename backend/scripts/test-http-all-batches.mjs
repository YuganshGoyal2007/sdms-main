import jwt from 'jsonwebtoken';
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

const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;

async function testAllHttp() {
    const [students] = await sequelize.query(`
        SELECT u.id as userId, u.username, s.batch, s.specialization, s.school, s.department, s.program
        FROM Users u
        JOIN Students s ON s.userId = u.id
        WHERE u.username LIKE 'test_cse_%'
        ORDER BY s.batch ASC, s.specialization ASC
    `);

    console.log(`Testing HTTP GET /timetable/me for ${students.length} test student accounts across all batches...\n`);

    let passed = 0;
    let failed = 0;
    const failures = [];
    const batchesCovered = new Set();

    for (let i = 0; i < students.length; i++) {
        const st = students[i];
        batchesCovered.add(st.batch);

        const token = jwt.sign(
            { id: st.userId, username: st.username, role: 'student' },
            secret,
            { expiresIn: '1h' }
        );

        try {
            const res = await fetch('http://127.0.0.1:5000/timetable/me', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            const prefix = `[${i + 1}/${students.length}] Batch: ${st.batch.padEnd(8)} | Spec: ${st.specialization.padEnd(25)}`;

            if (res.status === 200 && data.success && data.timetable) {
                passed++;
                const subCount = data.timetable.subjects?.length || 0;
                const days = Object.keys(data.timetable.entries || {}).length;
                console.log(`${prefix} -> HTTP 200 PASS | Sec: ${(data.section?.label || 'N/A').padEnd(14)} | Subs: ${String(subCount).padEnd(2)} | Days: ${days}`);
            } else {
                failed++;
                console.error(`${prefix} -> HTTP ${res.status} FAIL | Error: ${data.error || res.statusText}`);
                failures.push({ student: st, status: res.status, data });
            }
        } catch (err) {
            failed++;
            console.error(`[${i + 1}/${students.length}] Network error for ${st.username}:`, err.message);
            failures.push({ student: st, error: err.message });
        }
    }

    console.log('\n======================================================');
    console.log(`HTTP TEST SUMMARY:`);
    console.log(`Total Accounts Tested Over HTTP: ${students.length}`);
    console.log(`Batches Covered: ${[...batchesCovered].sort().join(', ')} (${batchesCovered.size} batches)`);
    console.log(`HTTP 200 PASSED: ${passed}`);
    console.log(`FAILED:          ${failed}`);
    console.log(`SUCCESS RATE:    ${((passed / students.length) * 100).toFixed(1)}%`);
    console.log('======================================================\n');

    if (failures.length > 0) {
        console.error('Failures:', failures);
        process.exit(1);
    } else {
        console.log('100% SUCCESS ACROSS ALL CSE BATCHES OVER LIVE HTTP!');
        process.exit(0);
    }
}

testAllHttp().catch(console.error);
