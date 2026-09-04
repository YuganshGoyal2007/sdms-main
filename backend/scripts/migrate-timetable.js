/**
 * Migration: add Timetable + TimetableSection tables.
 * Idempotent — checks INFORMATION_SCHEMA before each CREATE.
 *
 * Run with: node scripts/migrate-timetable.js
 */
import sequelize from '../lib/db.js';
import logger from '../lib/logger.js';

const statements = [
    {
        name: 'create TimetableSections',
        sql: `CREATE TABLE TimetableSections (
            id INT AUTO_INCREMENT PRIMARY KEY,
            school VARCHAR(64) NOT NULL,
            department VARCHAR(64) NOT NULL,
            program VARCHAR(64) NOT NULL,
            batch VARCHAR(64) NOT NULL,
            specialization VARCHAR(128) NOT NULL,
            mygbuSchool VARCHAR(32) NOT NULL DEFAULT 'SOICT',
            mygbuDepartment VARCHAR(32) NOT NULL DEFAULT 'CSE',
            mygbuSectionId VARCHAR(32) NOT NULL,
            label VARCHAR(128) NULL,
            academicYear VARCHAR(32) NULL,
            semester VARCHAR(32) NULL,
            active TINYINT(1) NOT NULL DEFAULT 1,
            createdAt DATETIME NOT NULL,
            updatedAt DATETIME NOT NULL,
            UNIQUE KEY uq_tt_section (school, department, program, batch, specialization, academicYear, semester)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    },
    {
        name: 'create Timetables',
        sql: `CREATE TABLE Timetables (
            id INT AUTO_INCREMENT PRIMARY KEY,
            school VARCHAR(64) NOT NULL,
            department VARCHAR(64) NOT NULL,
            program VARCHAR(64) NOT NULL,
            batch VARCHAR(64) NOT NULL,
            specialization VARCHAR(128) NOT NULL,
            entries JSON NOT NULL,
            subjects JSON NULL,
            semester VARCHAR(32) NULL,
            academicYear VARCHAR(32) NULL,
            sourceUrl VARCHAR(500) NULL,
            contentHash VARCHAR(64) NULL,
            lastFetchedAt DATETIME NULL,
            lastChangedAt DATETIME NULL,
            fetchStatus VARCHAR(64) NULL DEFAULT 'pending',
            fetchError TEXT NULL,
            isStale TINYINT(1) NOT NULL DEFAULT 0,
            manuallyEdited TINYINT(1) NOT NULL DEFAULT 0,
            createdAt DATETIME NOT NULL,
            updatedAt DATETIME NOT NULL,
            UNIQUE KEY uq_tt (school, department, program, batch, specialization)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    },
    {
        name: 'add idx_tt_hash',
        sql: `CREATE INDEX idx_tt_hash ON Timetables (contentHash)`,
    },
    {
        name: 'add idx_tt_lastFetched',
        sql: `CREATE INDEX idx_tt_lastFetched ON Timetables (lastFetchedAt)`,
    },
    {
        name: 'add idx_tt_lastChanged',
        sql: `CREATE INDEX idx_tt_lastChanged ON Timetables (lastChangedAt)`,
    },
];

const safe = async (label, sql) => {
    try {
        await sequelize.query(sql);
        logger.info({ statement: label }, 'Migration applied');
    } catch (err) {
        if (err.parent?.code === 'ER_TABLE_EXISTS_ERROR' || err.original?.code === 'ER_TABLE_EXISTS_ERROR') {
            logger.info({ statement: label }, 'Already exists, skipping');
            return;
        }
        if (err.parent?.code === 'ER_DUP_KEYNAME' || err.original?.code === 'ER_DUP_KEYNAME') {
            logger.info({ statement: label }, 'Index already exists, skipping');
            return;
        }
        throw err;
    }
};

const run = async () => {
    try {
        for (const stmt of statements) {
            await safe(stmt.name, stmt.sql);
        }
        logger.info('Timetable migration complete');
        process.exit(0);
    } catch (err) {
        logger.error({ err: { name: err.name, message: err.message } }, 'Migration failed');
        process.exit(1);
    }
};

run();
