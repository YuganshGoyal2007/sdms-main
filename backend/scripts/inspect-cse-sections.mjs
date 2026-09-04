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

async function main() {
    const [sections] = await sequelize.query("SELECT id, school, department, program, batch, specialization, mygbuSectionId, label, active FROM TimetableSections WHERE department = 'cse' ORDER BY batch ASC, specialization ASC");
    console.log(`Total CSE TimetableSections in DB: ${sections.length}`);
    
    const byBatch = {};
    for (const s of sections) {
        byBatch[s.batch] = byBatch[s.batch] || [];
        byBatch[s.batch].push(s);
    }

    for (const [batch, list] of Object.entries(byBatch)) {
        console.log(`\nBatch ${batch} (${list.length} sections):`);
        for (const item of list) {
            console.log(`  id=${String(item.id).padEnd(3)} spec='${item.specialization.padEnd(20)}' mygbuSectionId=${String(item.mygbuSectionId).padEnd(6)} label='${item.label}'`);
        }
    }

    // Check all distinct batches and specializations in Students table
    const [students] = await sequelize.query("SELECT batch, specialization, COUNT(*) as count FROM Students WHERE department = 'cse' OR department = 'CSE' GROUP BY batch, specialization ORDER BY batch ASC, specialization ASC");
    console.log(`\nExisting Students in DB by batch & specialization (${students.length} groups):`);
    for (const st of students) {
        console.log(`  batch=${st.batch.padEnd(10)} spec='${st.specialization.padEnd(20)}' count=${st.count}`);
    }

    await sequelize.close();
}

main().catch(console.error);
