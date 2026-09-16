import mysql from 'mysql2/promise';
import { formatCanonicalRollNo, detectAndCorrectSwappedIdentifiers } from '../services/whitespace.service.js';

const isDryRun = process.argv.includes('--dry-run');

async function run() {
  console.log(`=== Starting Student Data Normalization (${isDryRun ? 'DRY RUN' : 'LIVE EXECUTION'}) ===`);

  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'A@eofyug2007',
    database: 'gbu_sdms'
  });

  try {
    // 1. Create backups if not dry run
    if (!isDryRun) {
      console.log('Creating safety backup tables...');
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      await conn.query(`CREATE TABLE IF NOT EXISTS students_backup_${dateStr} AS SELECT * FROM students`);
      await conn.query(`CREATE TABLE IF NOT EXISTS fee_records_backup_${dateStr} AS SELECT * FROM fee_records`);
      console.log(`Backup created: students_backup_${dateStr}, fee_records_backup_${dateStr}`);
    }

    const [[{ totalBefore }]] = await conn.query('SELECT COUNT(*) as totalBefore FROM students');
    console.log(`Total students before migration: ${totalBefore}`);

    await conn.beginTransaction();

    // 2. Fetch all students
    const [students] = await conn.query('SELECT id, rollNo, enrollmentNo, fullName, school, department, program, batch, specialization FROM students');

    let swappedFixed = 0;
    let formatNormalized = 0;
    let unchanged = 0;
    let collisions = 0;

    const existingRolls = new Set(students.map(s => s.rollNo));

    for (const student of students) {
      const oldRoll = student.rollNo;
      const oldEnroll = student.enrollmentNo;

      // Check swap
      const { rollNo: targetRoll, enrollmentNo: targetEnroll, wasSwapped } = detectAndCorrectSwappedIdentifiers(oldRoll, oldEnroll);

      let finalRoll = targetRoll;
      let finalEnroll = targetEnroll;

      if (!wasSwapped) {
        finalRoll = formatCanonicalRollNo(oldRoll);
        finalEnroll = oldEnroll ? oldEnroll.replace(/[\s\/\-_]+/g, '').toUpperCase() : oldEnroll;
      }

      if (finalRoll === oldRoll && finalEnroll === oldEnroll) {
        unchanged++;
        continue;
      }

      // Check if the newly formatted roll collision exists on another student
      if (finalRoll !== oldRoll && existingRolls.has(finalRoll)) {
        // If it's just a casing/slash change for the SAME student in case-insensitive DB, that's fine
        const [collisionRows] = await conn.query('SELECT id, rollNo FROM students WHERE rollNo = ? AND id != ?', [finalRoll, student.id]);
        if (collisionRows.length > 0) {
          console.warn(`[COLLISION SKIPPED] Student ID ${student.id} (${oldRoll}) -> ${finalRoll} already belongs to ID ${collisionRows[0].id}`);
          collisions++;
          continue;
        }
      }

      if (wasSwapped) {
        swappedFixed++;
        if (swappedFixed <= 5) {
          console.log(`[SWAP FIX] ID ${student.id} | Roll: ${oldRoll} -> ${finalRoll} | Enroll: ${oldEnroll} -> ${finalEnroll} | Name: ${student.fullName}`);
        }
      } else {
        formatNormalized++;
        if (formatNormalized <= 5) {
          console.log(`[NORMALIZE] ID ${student.id} | Roll: ${oldRoll} -> ${finalRoll} | Name: ${student.fullName}`);
        }
      }

      if (!isDryRun) {
        // Update students table
        await conn.query(
          'UPDATE students SET rollNo = ?, enrollmentNo = ? WHERE id = ?',
          [finalRoll, finalEnroll, student.id]
        );

        // Update fee_records referencing this student ID
        await conn.query(
          'UPDATE fee_records SET rollNo = ? WHERE studentId = ?',
          [finalRoll, student.id]
        );

        // Update no_dues_applications referencing old rollNo
        if (oldRoll) {
          await conn.query(
            'UPDATE no_dues_applications SET rollNo = ? WHERE rollNo = ?',
            [finalRoll, oldRoll]
          );
        }
      }
    }

    if (!isDryRun) {
      await conn.commit();
      console.log('Transaction COMMITTED successfully.');
    } else {
      await conn.rollback();
      console.log('Dry run complete. Transaction ROLLED BACK.');
    }

    console.log('\n=== MIGRATION SUMMARY ===');
    console.log(`Total students: ${totalBefore}`);
    console.log(`Swapped records fixed: ${swappedFixed}`);
    console.log(`Roll numbers normalized to canonical format: ${formatNormalized}`);
    console.log(`Unchanged records: ${unchanged}`);
    console.log(`Collisions skipped: ${collisions}`);

    // Post-verification checks
    const [[{ totalAfter }]] = await conn.query('SELECT COUNT(*) as totalAfter FROM students');
    const [[{ swappedAfter }]] = await conn.query("SELECT COUNT(*) as swappedAfter FROM students WHERE rollNo REGEXP '^[0-9]{8,12}$' AND enrollmentNo REGEXP '[A-Za-z]'");
    const [[{ slashAfter }]] = await conn.query("SELECT COUNT(*) as slashAfter FROM students WHERE rollNo LIKE '%/%'");
    const [[{ lowerAfter }]] = await conn.query("SELECT COUNT(*) as lowerAfter FROM students WHERE REGEXP_LIKE(rollNo, '[a-z]', 'c')");

    console.log('\n=== POST-VERIFICATION AUDIT ===');
    console.log(`Total students: ${totalAfter} (matches before: ${totalBefore === totalAfter})`);
    console.log(`Remaining swapped records: ${swappedAfter}`);
    console.log(`Remaining slashed roll numbers: ${slashAfter}`);
    console.log(`Remaining lowercase roll numbers: ${lowerAfter}`);

  } catch (err) {
    await conn.rollback();
    console.error('Migration failed, transaction rolled back:', err);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

run();
