import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Sequelize from 'sequelize';
import { fetchSection } from '../services/timetable.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: 'mysql',
    logging: false
});

async function testAllSections() {
    const [sections] = await sequelize.query("SELECT id, school, department, program, batch, specialization, mygbuSectionId, label FROM TimetableSections WHERE department = 'cse' ORDER BY batch ASC, specialization ASC");
    console.log(`Testing fetchSection for all ${sections.length} CSE sections...`);

    let passed = 0;
    let failed = 0;
    const failures = [];

    for (const s of sections) {
        const res = await fetchSection({
            id: s.id,
            mygbuSchool: s.school.toUpperCase(),
            mygbuDepartment: s.department.toUpperCase(),
            mygbuSectionId: s.mygbuSectionId
        });

        if (res.ok) {
            passed++;
            const daysCount = Object.keys(res.entries || {}).length;
            const subCount = res.subjects?.length || 0;
            console.log(`[PASS] Batch ${s.batch.padEnd(8)} | Spec: ${s.specialization.padEnd(20)} | ID: ${String(s.mygbuSectionId).padEnd(5)} | Label: ${(res.label || s.label).padEnd(20)} | Subjects: ${subCount}`);
        } else {
            failed++;
            console.log(`[FAIL] Batch ${s.batch.padEnd(8)} | Spec: ${s.specialization.padEnd(20)} | ID: ${String(s.mygbuSectionId).padEnd(5)} | Error: ${res.error}`);
            failures.push({ section: s, error: res.error });
        }
    }

    console.log(`\n========================================`);
    console.log(`Total: ${sections.length}, Passed: ${passed}, Failed: ${failed}`);
    if (failures.length > 0) {
        console.log(`Failures:`, failures);
    }
    console.log(`========================================\n`);

    await sequelize.close();
}

testAllSections().catch(console.error);
