import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const { default: sequelize } = await import('../lib/db.js');

async function addMissingIndexes() {
  console.log('--- ADDING MISSING INDEXES WITH PRECISE PREFIXES ---');

  const createIdx = async (table, indexName, sqlDef) => {
    try {
      const [existing] = await sequelize.query(`
        SELECT 1 FROM information_schema.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = '${table}' 
          AND INDEX_NAME = '${indexName}'
      `);
      if (existing.length === 0) {
        await sequelize.query(`CREATE INDEX \`${indexName}\` ON \`${table}\` (${sqlDef})`);
        console.log(`  + Created index \`${indexName}\` on \`${table}\` (${sqlDef})`);
      } else {
        console.log(`  = Index \`${indexName}\` already exists on \`${table}\``);
      }
    } catch (err) {
      console.warn(`  ! Warning on \`${table}\`.\`${indexName}\`: ${err.message}`);
    }
  };

  // 1. Students composite class index
  await createIdx('students', 'idx_students_class', '`school`(50), `department`(50), `program`(50), `batch`(20), `specialization`(50)');

  // 2. ChairpersonClasses composite class index
  await createIdx('chairpersonclasses', 'idx_cpc_class', '`school`(50), `department`(50), `program`(50), `batch`(20), `specialization`(50)');

  // 3. Messages receiver index
  await createIdx('messages', 'idx_messages_receiver_created', '`receiverId`, `createdAt`');

  // 4. ChangeLogs entity index
  await createIdx('changelogs', 'idx_changelogs_entity', '`entity`(50), `entityId`(50)');

  console.log('\n--- VERIFYING ALL TABLE INDEX SIZES & STATUS ---');
  const [tables] = await sequelize.query(`
    SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE()
    ORDER BY TABLE_NAME
  `);
  console.table(tables.map(t => ({
    Table: t.TABLE_NAME,
    Rows: t.TABLE_ROWS,
    Data_KB: (t.DATA_LENGTH / 1024).toFixed(1),
    Index_KB: (t.INDEX_LENGTH / 1024).toFixed(1),
  })));

  process.exit(0);
}

addMissingIndexes();
