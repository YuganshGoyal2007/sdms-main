// Attendance module migration.
// Safe to re-run: only creates tables that do not exist yet (CREATE TABLE IF NOT
// EXISTS semantics via Model.sync()). Never drops or alters existing data.
// On MySQL it also widens users.role to include 'faculty'; SQLite stores enums
// as TEXT so no ALTER is needed there.
//
// Run:  node scripts/migrate-attendance.mjs

import sequelize from '../lib/db.js';
import Subject from '../models/subject.model.js';
import FacultyAssignment from '../models/facultyAssignment.model.js';
import AttendanceSession from '../models/attendanceSession.model.js';
import AttendanceRecord from '../models/attendanceRecord.model.js';

const models = [
  ['subjects', Subject],
  ['faculty_assignments', FacultyAssignment],
  ['attendance_sessions', AttendanceSession],
  ['attendance_records', AttendanceRecord],
];

const tableNameFor = (model) => model.getTableName().tableName ?? model.getTableName();

// Repairs a leftover from an earlier failed run of THIS migration: a table
// created by it that predates the classKey column. Such a table can only have
// been produced by migrate-attendance itself (feature is new), so it holds no
// user data and is dropped before recreation. Real user tables are untouched.
async function repairLeftover(model) {
  const t = tableNameFor(model);
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'classKey'`,
    { replacements: [t] }
  );
  const [existsRows] = await sequelize.query(
    `SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    { replacements: [t] }
  );
  if (existsRows[0].n > 0 && rows[0].n === 0) {
    await sequelize.query(`DROP TABLE IF EXISTS \`${t}\``);
    console.log(`REPAIR dropped pre-classKey leftover table ${t}`);
  }
}

try {
  await sequelize.authenticate();
  console.log(`DB connected (${sequelize.getDialect()})`);

  for (const [name, model] of models) {
    if (sequelize.getDialect() === 'mysql') await repairLeftover(model);
    await model.sync(); // creates table only when missing
    console.log(`OK  ${name}`);
  }

  if (sequelize.getDialect() === 'mysql') {
    try {
      await sequelize.query(
        "ALTER TABLE users MODIFY COLUMN role ENUM('admin','student','coordinator','chairperson','faculty') NOT NULL DEFAULT 'student'"
      );
      console.log('OK  users.role extended with faculty (mysql)');
    } catch (err) {
      console.warn('WARN users.role ALTER skipped:', err.message);
    }
  }

  console.log('Attendance migration complete.');
  process.exit(0);
} catch (err) {
  console.error('Migration failed:', err);
  process.exit(1);
}
