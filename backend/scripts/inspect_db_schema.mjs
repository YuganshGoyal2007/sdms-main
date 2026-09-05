import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const { default: sequelize } = await import('../lib/db.js');

async function inspect() {
  try {
    // 1. Students FK details
    const [studentFks] = await sequelize.query(`
      SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'students' 
        AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY CONSTRAINT_NAME
    `);
    console.log(`Students total FK count: ${studentFks.length}`);
    const studentCols = {};
    for (const fk of studentFks) {
      if (!studentCols[fk.COLUMN_NAME]) studentCols[fk.COLUMN_NAME] = [];
      studentCols[fk.COLUMN_NAME].push(fk.CONSTRAINT_NAME);
    }
    for (const [col, constraints] of Object.entries(studentCols)) {
      console.log(`  Column '${col}': ${constraints.length} constraints. Keep 1st: '${constraints[0]}'`);
    }

    // 2. Coordinators FK details
    const [coordFks] = await sequelize.query(`
      SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'coordinators' 
        AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY CONSTRAINT_NAME
    `);
    console.log(`\nCoordinators total FK count: ${coordFks.length}`);
    const coordCols = {};
    for (const fk of coordFks) {
      if (!coordCols[fk.COLUMN_NAME]) coordCols[fk.COLUMN_NAME] = [];
      coordCols[fk.COLUMN_NAME].push(fk.CONSTRAINT_NAME);
    }
    for (const [col, constraints] of Object.entries(coordCols)) {
      console.log(`  Column '${col}': ${constraints.length} constraints. Keep 1st: '${constraints[0]}'`);
    }

    // 3. Duplicate indexes in users
    const [userIndexes] = await sequelize.query(`SHOW INDEX FROM users`);
    const userIdxMap = {};
    for (const idx of userIndexes) {
      if (!userIdxMap[idx.Column_name]) userIdxMap[idx.Column_name] = [];
      if (!userIdxMap[idx.Column_name].includes(idx.Key_name)) {
        userIdxMap[idx.Column_name].push(idx.Key_name);
      }
    }
    console.log('\nUsers indexes:');
    for (const [col, idxs] of Object.entries(userIdxMap)) {
      console.log(`  Column '${col}': ${idxs.length} indexes (${idxs.slice(0, 5).join(', ')}...)`);
    }

    // 4. Duplicate indexes in coordinators
    const [coordIndexes] = await sequelize.query(`SHOW INDEX FROM coordinators`);
    const coordIdxMap = {};
    for (const idx of coordIndexes) {
      if (!coordIdxMap[idx.Column_name]) coordIdxMap[idx.Column_name] = [];
      if (!coordIdxMap[idx.Column_name].includes(idx.Key_name)) {
        coordIdxMap[idx.Column_name].push(idx.Key_name);
      }
    }
    console.log('\nCoordinators indexes:');
    for (const [col, idxs] of Object.entries(coordIdxMap)) {
      console.log(`  Column '${col}': ${idxs.length} indexes (${idxs.slice(0, 5).join(', ')}...)`);
    }

    // 5. Duplicate indexes in chairpeople
    const [chairIndexes] = await sequelize.query(`SHOW INDEX FROM chairpeople`);
    const chairIdxMap = {};
    for (const idx of chairIndexes) {
      if (!chairIdxMap[idx.Column_name]) chairIdxMap[idx.Column_name] = [];
      if (!chairIdxMap[idx.Column_name].includes(idx.Key_name)) {
        chairIdxMap[idx.Column_name].push(idx.Key_name);
      }
    }
    console.log('\nChairpeople indexes:');
    for (const [col, idxs] of Object.entries(chairIdxMap)) {
      console.log(`  Column '${col}': ${idxs.length} indexes (${idxs.join(', ')})`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Inspection failed:', err);
    process.exit(1);
  }
}

inspect();
