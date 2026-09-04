/**
 * Migration: add toUserId + scope + classKey columns to notifications table.
 * Idempotent — checks INFORMATION_SCHEMA before running each ALTER.
 *
 * Run with: node scripts/migrate-messages.js
 */
import sequelize from '../lib/db.js';
import logger from '../lib/logger.js';

const statements = [
    {
        column: 'toUserId',
        sql: `ALTER TABLE notifications ADD COLUMN toUserId INT NULL`,
    },
    {
        column: 'scope',
        sql: `ALTER TABLE notifications ADD COLUMN scope VARCHAR(64) NOT NULL DEFAULT 'direct'`,
    },
    {
        column: 'classKey',
        sql: `ALTER TABLE notifications ADD COLUMN classKey VARCHAR(255) NULL`,
    },
    {
        column: 'message TEXT',
        sql: `ALTER TABLE notifications MODIFY COLUMN message TEXT NULL`,
    },
    {
        column: 'idx_toUserId',
        sql: `CREATE INDEX idx_notifications_toUserId ON notifications (toUserId)`,
    },
    {
        column: 'idx_toRole',
        sql: `CREATE INDEX idx_notifications_toRole ON notifications (toRole)`,
    },
    {
        column: 'idx_scope',
        sql: `CREATE INDEX idx_notifications_scope ON notifications (scope)`,
    },
];

const safeAlter = async (label, sql) => {
    try {
        await sequelize.query(sql);
        logger.info({ statement: label }, 'Migration applied');
        return true;
    } catch (err) {
        if (err.parent?.code === 'ER_DUP_FIELDNAME' || err.parent?.code === 'ER_DUP_KEYNAME' || err.original?.code === 'ER_DUP_FIELDNAME') {
            logger.info({ statement: label }, 'Already applied, skipping');
            return false;
        }
        throw err;
    }
};

const run = async () => {
    try {
        for (const stmt of statements) {
            await safeAlter(stmt.column, stmt.sql);
        }
        logger.info('All migration statements completed');
        process.exit(0);
    } catch (err) {
        logger.error({ err: { name: err.name, message: err.message } }, 'Migration failed');
        process.exit(1);
    }
};

run();
