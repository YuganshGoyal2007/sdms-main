import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const s = new Sequelize(
  process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql', logging: false,
  }
);

(async () => {
  await s.authenticate();
  const [c] = await s.query('SELECT id, userId, name, email, chairpersonId FROM chairpeople LIMIT 5');
  console.log('Chairpeople count:', c.length);
  console.log(JSON.stringify(c, null, 2));
  const [u] = await s.query("SELECT id, username, role, name FROM Users WHERE role='chairperson' LIMIT 5");
  console.log('Chairperson Users count:', u.length);
  console.log(JSON.stringify(u, null, 2));
  await s.close();
})();
