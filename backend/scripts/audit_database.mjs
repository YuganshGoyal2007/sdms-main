import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const { default: sequelize } = await import('../lib/db.js');

async function audit() {
  try {
    const report = {};

    // 1. MySQL Server Variables
    const [variables] = await sequelize.query(`
      SHOW VARIABLES WHERE Variable_name IN (
        'version', 'version_comment', 'sql_mode', 
        'character_set_database', 'collation_database', 
        'character_set_server', 'collation_server', 
        'max_connections', 'wait_timeout', 'interactive_timeout', 
        'innodb_buffer_pool_size', 'innodb_flush_log_at_trx_commit', 
        'transaction_isolation', 'tx_isolation',
        'autocommit', 'foreign_key_checks'
      )
    `);
    report.variables = Object.fromEntries(variables.map(v => [v.Variable_name, v.Value]));

    // 2. Tables & Storage Engines
    const [tables] = await sequelize.query(`
      SELECT 
        TABLE_NAME, 
        ENGINE, 
        TABLE_COLLATION, 
        TABLE_ROWS, 
        DATA_LENGTH, 
        INDEX_LENGTH
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `);
    report.tables = tables;

    // 3. Foreign Key Constraints
    const [fks] = await sequelize.query(`
      SELECT 
        k.TABLE_NAME, 
        k.COLUMN_NAME, 
        k.CONSTRAINT_NAME, 
        k.REFERENCED_TABLE_NAME, 
        k.REFERENCED_COLUMN_NAME,
        rc.UPDATE_RULE,
        rc.DELETE_RULE
      FROM information_schema.KEY_COLUMN_USAGE k
      JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
        ON k.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
        AND k.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
      WHERE k.TABLE_SCHEMA = DATABASE() 
        AND k.REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY k.TABLE_NAME, k.CONSTRAINT_NAME
    `);
    report.foreignKeys = fks;

    // 4. Duplicate or redundant indexes
    const [indexes] = await sequelize.query(`
      SELECT 
        TABLE_NAME, 
        INDEX_NAME, 
        NON_UNIQUE, 
        COLUMN_NAME, 
        SEQ_IN_INDEX
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
      ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
    `);
    report.indexes = indexes;

    // Group indexes by table and column set to find exact duplicates
    const tableIndexMap = {};
    for (const idx of indexes) {
      if (!tableIndexMap[idx.TABLE_NAME]) tableIndexMap[idx.TABLE_NAME] = {};
      if (!tableIndexMap[idx.TABLE_NAME][idx.INDEX_NAME]) {
        tableIndexMap[idx.TABLE_NAME][idx.INDEX_NAME] = {
          nonUnique: idx.NON_UNIQUE,
          columns: []
        };
      }
      tableIndexMap[idx.TABLE_NAME][idx.INDEX_NAME].columns.push(idx.COLUMN_NAME);
    }

    const duplicates = [];
    for (const [tableName, idxs] of Object.entries(tableIndexMap)) {
      const seen = {};
      for (const [idxName, meta] of Object.entries(idxs)) {
        const signature = `${meta.nonUnique}:${meta.columns.join(',')}`;
        if (seen[signature]) {
          duplicates.push({
            table: tableName,
            duplicateIndex: idxName,
            originalIndex: seen[signature],
            columns: meta.columns,
            isUnique: meta.nonUnique === 0
          });
        } else {
          seen[signature] = idxName;
        }
      }
    }
    report.duplicateIndexes = duplicates;

    // 5. Driver & Connection Pool Analysis
    report.sequelizeConfig = {
      dialect: sequelize.options.dialect,
      pool: sequelize.options.pool,
      dialectOptions: sequelize.options.dialectOptions,
      logging: typeof sequelize.options.logging === 'function' ? 'enabled' : false
    };

    fs.writeFileSync(path.join(__dirname, 'db_audit_report.json'), JSON.stringify(report, null, 2));
    console.log('Audit completed successfully. Report written to backend/scripts/db_audit_report.json');
    console.log(`Found ${duplicates.length} redundant/duplicate indexes across tables!`);
    console.log('MySQL Engine variables:', report.variables);

    process.exit(0);
  } catch (err) {
    console.error('Audit failed:', err);
    process.exit(1);
  }
}

audit();
