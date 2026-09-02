import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const sequelize = new Sequelize(
  process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql', logging: false,
  }
);

(async () => {
  await sequelize.authenticate();
  const [rows] = await sequelize.query(`
    SELECT userId, COUNT(*) AS cnt
    FROM Coordinators WHERE role='coordinator'
    GROUP BY userId HAVING cnt > 1
    ORDER BY cnt DESC LIMIT 10;
  `);
  console.log('Coordinators with multiple class records:');
  for (const r of rows) {
    const [details] = await sequelize.query(`SELECT id, school, department, program, batch, specialization, email FROM Coordinators WHERE userId=${r.userId}`);
    console.log(`\n  userId=${r.userId} (${r.cnt} records):`);
    details.forEach(d => console.log(`    id=${d.id} ${d.school}/${d.department}/${d.program}/${d.batch}/${d.specialization}`));
  }
  await sequelize.close();
})();
