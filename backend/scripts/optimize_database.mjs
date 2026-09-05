import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const { default: sequelize } = await import('../lib/db.js');

async function optimize() {
  console.log('--- STARTING DATABASE PURGE & OPTIMIZATION ---');

  try {
    // 1. CLEANUP DUPLICATE FOREIGN KEYS IN STUDENTS
    console.log('\n[1/6] Cleaning duplicate Foreign Keys in `students`...');
    const [studentFks] = await sequelize.query(`
      SELECT CONSTRAINT_NAME, COLUMN_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'students' 
        AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY CONSTRAINT_NAME
    `);
    
    const seenStudentCols = new Set();
    let droppedStudentFks = 0;
    for (const fk of studentFks) {
      if (!seenStudentCols.has(fk.COLUMN_NAME)) {
        seenStudentCols.add(fk.COLUMN_NAME);
        console.log(`  Keeping primary FK for students.${fk.COLUMN_NAME}: ${fk.CONSTRAINT_NAME}`);
      } else {
        await sequelize.query(`ALTER TABLE students DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
        droppedStudentFks++;
      }
    }
    console.log(`  -> Dropped ${droppedStudentFks} redundant FK constraints from students.`);

    // 2. CLEANUP DUPLICATE FOREIGN KEYS IN COORDINATORS
    console.log('\n[2/6] Cleaning duplicate Foreign Keys in `coordinators`...');
    const [coordFks] = await sequelize.query(`
      SELECT CONSTRAINT_NAME, COLUMN_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'coordinators' 
        AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY CONSTRAINT_NAME
    `);

    const seenCoordCols = new Set();
    let droppedCoordFks = 0;
    for (const fk of coordFks) {
      if (!seenCoordCols.has(fk.COLUMN_NAME)) {
        seenCoordCols.add(fk.COLUMN_NAME);
        console.log(`  Keeping primary FK for coordinators.${fk.COLUMN_NAME}: ${fk.CONSTRAINT_NAME}`);
      } else {
        await sequelize.query(`ALTER TABLE coordinators DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
        droppedCoordFks++;
      }
    }
    console.log(`  -> Dropped ${droppedCoordFks} redundant FK constraints from coordinators.`);

    // 3. CLEANUP DUPLICATE INDEXES ON USERS
    console.log('\n[3/6] Cleaning duplicate indexes on `users`...');
    const [userIndexes] = await sequelize.query(`SHOW INDEX FROM users`);
    const seenUserCols = new Set(['id']);
    let droppedUserIdx = 0;
    for (const idx of userIndexes) {
      if (idx.Key_name === 'PRIMARY') continue;
      if (!seenUserCols.has(idx.Column_name)) {
        seenUserCols.add(idx.Column_name);
        console.log(`  Keeping primary index for users.${idx.Column_name}: ${idx.Key_name}`);
      } else {
        try {
          await sequelize.query(`ALTER TABLE users DROP INDEX \`${idx.Key_name}\``);
          droppedUserIdx++;
        } catch (e) {
          console.warn(`  Could not drop index ${idx.Key_name}: ${e.message}`);
        }
      }
    }
    console.log(`  -> Dropped ${droppedUserIdx} duplicate indexes from users.`);

    // 4. CLEANUP DUPLICATE INDEXES ON COORDINATORS & CHAIRPEOPLE
    console.log('\n[4/6] Cleaning duplicate indexes on `coordinators` and `chairpeople`...');
    const [coordIndexes] = await sequelize.query(`SHOW INDEX FROM coordinators`);
    const seenCoordIdx = new Set(['id', 'userId', 'createdBy', 'updatedBy']);
    let droppedCoordIdx = 0;
    for (const idx of coordIndexes) {
      if (idx.Key_name === 'PRIMARY' || idx.Key_name === 'userId' || idx.Key_name === 'createdBy' || idx.Key_name === 'updatedBy') continue;
      if (!seenCoordIdx.has(idx.Column_name)) {
        seenCoordIdx.add(idx.Column_name);
        console.log(`  Keeping primary index for coordinators.${idx.Column_name}: ${idx.Key_name}`);
      } else {
        try {
          await sequelize.query(`ALTER TABLE coordinators DROP INDEX \`${idx.Key_name}\``);
          droppedCoordIdx++;
        } catch (e) {
          console.warn(`  Could not drop index ${idx.Key_name}: ${e.message}`);
        }
      }
    }
    console.log(`  -> Dropped ${droppedCoordIdx} duplicate indexes from coordinators.`);

    const [chairIndexes] = await sequelize.query(`SHOW INDEX FROM chairpeople`);
    const seenChairIdx = new Set(['id']);
    let droppedChairIdx = 0;
    for (const idx of chairIndexes) {
      if (idx.Key_name === 'PRIMARY') continue;
      if (!seenChairIdx.has(idx.Column_name)) {
        seenChairIdx.add(idx.Column_name);
        console.log(`  Keeping primary index for chairpeople.${idx.Column_name}: ${idx.Key_name}`);
      } else {
        try {
          await sequelize.query(`ALTER TABLE chairpeople DROP INDEX \`${idx.Key_name}\``);
          droppedChairIdx++;
        } catch (e) {
          console.warn(`  Could not drop index ${idx.Key_name}: ${e.message}`);
        }
      }
    }
    console.log(`  -> Dropped ${droppedChairIdx} duplicate indexes from chairpeople.`);

    // 5. ADD MISSING HIGH-PERFORMANCE INDEXES
    console.log('\n[5/6] Adding missing compound & high-frequency indexes...');

    const createIndexSafely = async (table, indexName, columnsDef) => {
      try {
        const [existing] = await sequelize.query(`
          SELECT 1 FROM information_schema.STATISTICS 
          WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = '${table}' 
            AND INDEX_NAME = '${indexName}'
        `);
        if (existing.length === 0) {
          await sequelize.query(`CREATE INDEX \`${indexName}\` ON \`${table}\` (${columnsDef})`);
          console.log(`  + Created index \`${indexName}\` on \`${table}\` (${columnsDef})`);
        } else {
          console.log(`  = Index \`${indexName}\` already exists on \`${table}\``);
        }
      } catch (err) {
        console.warn(`  ! Warning on \`${table}\`.\`${indexName}\`: ${err.message}`);
      }
    };

    // students class filter
    await createIndexSafely('students', 'idx_students_class', '`school`, `department`, `program`, `batch`, `specialization`');
    // messages
    await createIndexSafely('messages', 'idx_messages_recipient_created', '`recipientId`, `createdAt`');
    await createIndexSafely('messages', 'idx_messages_sender_created', '`senderId`, `createdAt`');
    await createIndexSafely('messages', 'idx_messages_scope', '`scope`');
    // changelogs
    await createIndexSafely('changelogs', 'idx_changelogs_target', '`targetModel`, `targetId`');
    await createIndexSafely('changelogs', 'idx_changelogs_user_created', '`userId`, `createdAt`');
    // chairpersonclasses
    await createIndexSafely('chairpersonclasses', 'idx_cpc_chairpersonId', '`chairpersonId`');
    await createIndexSafely('chairpersonclasses', 'idx_cpc_class', '`school`, `department`, `program`, `batch`, `specialization`');
    // faculty_assignments
    await createIndexSafely('faculty_assignments', 'idx_fa_class', '`school`, `department`, `program`, `batch`, `specialization`');
    await createIndexSafely('faculty_assignments', 'idx_fa_faculty_active', '`facultyId`, `isActive`');

    // 6. DROP DEAD LEGACY PHANTOM TABLE IF UNUSED
    console.log('\n[6/6] Cleaning legacy tables...');
    try {
      const [t] = await sequelize.query(`
        SELECT TABLE_NAME FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'facultyassignments'
      `);
      if (t.length > 0) {
        await sequelize.query(`DROP TABLE \`facultyassignments\``);
        console.log('  + Dropped dead legacy table `facultyassignments`');
      }
    } catch (err) {
      console.warn('  ! Legacy table check failed:', err.message);
    }

    console.log('\n=== DATABASE OPTIMIZATION COMPLETED SUCCESSFULLY ===');
    process.exit(0);
  } catch (err) {
    console.error('Optimization failed:', err);
    process.exit(1);
  }
}

optimize();
