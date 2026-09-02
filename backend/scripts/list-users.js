import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(BACKEND_ROOT, '.env') });

const sequelize = new Sequelize(
  process.env.DB_NAME || 'gbu_sdms',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    dialect: 'mysql',
    logging: false,
  }
);

const main = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected. Listing users, coordinators, chairpersons:\n');

    const [users] = await sequelize.query(`
      SELECT id, username, role, name FROM Users ORDER BY role, id LIMIT 30;
    `);
    console.log('=== USERS ===');
    for (const u of users) {
      console.log(`  id=${u.id} role=${(u.role||'').padEnd(12)} username=${u.username} name=${u.name || ''}`);
    }

    const [coords] = await sequelize.query(`
      SELECT id, userId, name, email, school, department, program, batch, specialization, role
      FROM Coordinators ORDER BY id LIMIT 10;
    `);
    console.log('\n=== COORDINATORS (first 10) ===');
    for (const c of coords) {
      console.log(`  id=${c.id} userId=${c.userId} role=${c.role} ${c.school}/${c.department}/${c.program}/${c.batch}/${c.specialization}  email=${c.email}`);
    }

    const [chairs] = await sequelize.query(`
      SELECT id, userId, name, email, phone, chairpersonId FROM Chairpersons ORDER BY id LIMIT 10;
    `);
    console.log('\n=== CHAIRPERSONS (first 10) ===');
    for (const c of chairs) {
      console.log(`  id=${c.id} userId=${c.userId} name=${c.name} email=${c.email}`);
    }

  } catch (err) {
    console.error('ERR:', err.message);
  } finally {
    await sequelize.close();
  }
};

main();
