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

const TABLES = ['Notifications', 'Messages', 'ChangeLogs'];

const main = async () => {
  try {
    await sequelize.authenticate();
    console.log('=== DB CONNECTION OK ===');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`DB:   ${process.env.DB_NAME}\n`);

    for (const table of TABLES) {
      try {
        const [rows] = await sequelize.query(`SELECT COUNT(*) AS cnt FROM \`${table}\`;`);
        const count = rows[0]?.cnt ?? '?';
        console.log(`[${table}] row count: ${count}`);

        if (Number(count) > 0) {
          const [sample] = await sequelize.query(`SELECT * FROM \`${table}\` ORDER BY \`id\` DESC LIMIT 3;`);
          console.log(`  Sample (latest 3):`);
          for (const r of sample) {
            const truncated = {};
            for (const [k, v] of Object.entries(r)) {
              let s = String(v ?? 'NULL');
              if (s.length > 100) s = s.slice(0, 100) + '...';
              truncated[k] = s;
            }
            console.log('   ', JSON.stringify(truncated));
          }
        }
        console.log('');
      } catch (e) {
        console.log(`[${table}] ERROR: ${e.message}\n`);
      }
    }

    console.log('=== COLUMN STRUCTURE ===');
    for (const table of TABLES) {
      try {
        const [cols] = await sequelize.query(`SHOW COLUMNS FROM \`${table}\`;`);
        console.log(`\n[${table}] columns:`);
        for (const c of cols) {
          console.log(`  ${c.Field.padEnd(28)} ${String(c.Type).padEnd(40)} null=${c.Null} key=${c.Key}`);
        }
      } catch (e) {
        console.log(`[${table}] column check error: ${e.message}`);
      }
    }
  } catch (err) {
    console.error('CONNECTION FAILED:', err.message);
  } finally {
    await sequelize.close();
  }
};

main();
