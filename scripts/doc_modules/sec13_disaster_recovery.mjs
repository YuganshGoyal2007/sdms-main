export function getSection13() {
  return `
---

# SECTION 13: Database Backup, Disaster Recovery, Performance Tuning & Codebase Migration Playbooks

This section provides comprehensive infrastructure runbooks for operational resilience, database lifecycle management, zero-downtime migrations, performance optimization, and autonomous disaster recovery for GBU-SDSM.

---

## 13.1 Database Backup & Automated Snapshot Architecture

Data persistence in GBU-SDSM mandates rigorous, automated backup policies to protect institutional records, attendance histories, and student identities against infrastructure failures, accidental deletions, or storage corruption.

\`\`\`mermaid
flowchart TD
    subgraph Scheduler["Automated Backup Scheduler (Cron / Task Scheduler)"]
        DailyCron["Daily Snapshot (02:00 UTC)"]
        WeeklyCron["Weekly Consolidated Archive"]
    end

    subgraph BackupEngine["Backup Execution Engine"]
        Dump["mysqldump --single-transaction --quick"]
        Gzip["gzip --best Stream Compression"]
        Hash["sha256sum Checksum Verification"]
    end

    subgraph StorageTiers["Segmented Storage Targets"]
        LocalSnap["Local Volume Snapshot (/var/backups/sdms)"]
        OffsiteCloud["Offsite Encrypted Object Store (S3 / Cold Storage)"]
        Rotation["30-Day Retention & Pruning Engine"]
    end

    DailyCron --> Dump
    WeeklyCron --> Dump
    Dump --> Gzip
    Gzip --> Hash
    Hash --> LocalSnap
    LocalSnap --> OffsiteCloud
    OffsiteCloud --> Rotation
\`\`\`

### 13.1.1 Production Logical Backup Script (Linux Bash)
The following automated backup script (\`/usr/local/bin/sdms-backup.sh\`) executes transactional logical dumps without interrupting active user traffic:
\`\`\`bash
#!/usr/bin/env bash
set -eo pipefail

# Configuration Parameters
BACKUP_DIR="/var/backups/sdms/mysql"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="\${DB_NAME:-gbu_sdms_db}"
DB_USER="\${DB_USER:-sdms_user}"
DB_PASS="\${DB_PASS}"
RETENTION_DAYS=30
BACKUP_FILE="\${BACKUP_DIR}/\${DB_NAME}_\${TIMESTAMP}.sql.gz"
CHECKSUM_FILE="\${BACKUP_FILE}.sha256"

# Ensure target directory exists
mkdir -p "\${BACKUP_DIR}"

echo "[$(date -u)] Starting transactional MySQL backup for database: \${DB_NAME}..."

# Execute mysqldump with single-transaction to ensure ACID consistency without table locking
mysqldump \\
  --host="127.0.0.1" \\
  --port=3306 \\
  --user="\${DB_USER}" \\
  --password="\${DB_PASS}" \\
  --single-transaction \\
  --quick \\
  --routines \\
  --triggers \\
  --events \\
  --hex-blob \\
  --default-character-set=utf8mb4 \\
  "\${DB_NAME}" | gzip -9 > "\${BACKUP_FILE}"

# Compute SHA256 integrity hash
sha256sum "\${BACKUP_FILE}" > "\${CHECKSUM_FILE}"

echo "[$(date -u)] Backup completed successfully: \${BACKUP_FILE}"
echo "[$(date -u)] Checksum: $(cat \${CHECKSUM_FILE})"

# Prune snapshots older than retention threshold
find "\${BACKUP_DIR}" -type f -name "*.sql.gz" -mtime +\${RETENTION_DAYS} -delete
find "\${BACKUP_DIR}" -type f -name "*.sha256" -mtime +\${RETENTION_DAYS} -delete

echo "[$(date -u)] Retention pruning completed. Retaining latest \${RETENTION_DAYS} days."
\`\`\`

### 13.1.2 Windows Server Automated Backup Script (PowerShell)
For deployment environments running on Windows Server:
\`\`\`powershell
# SDMS-Backup.ps1
$BackupRoot = "C:\\Backups\\SDMS"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$DbName = "gbu_sdms_db"
$DbUser = "sdms_user"
$DbPass = $env:DB_PASS
$OutputFile = "$BackupRoot\\\${DbName}_\${Timestamp}.sql"
$ZipFile = "$OutputFile.zip"

New-Item -ItemType Directory -Force -Path $BackupRoot | Out-Null

Write-Host "Starting mysqldump for $DbName..."
& "mysqldump.exe" --host=127.0.0.1 --port=3306 --user=$DbUser --password=$DbPass --single-transaction --quick --routines --triggers --hex-blob --default-character-set=utf8mb4 $DbName > $OutputFile

Write-Host "Compressing dump archive..."
Compress-Archive -Path $OutputFile -DestinationPath $ZipFile -CompressionLevel Optimal
Remove-Item -Path $OutputFile

Write-Host "Backup finalized: $ZipFile"
Get-ChildItem -Path $BackupRoot -Filter "*.zip" | Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-30) } | Remove-Item
\`\`\`

---

## 13.2 Disaster Recovery Runbooks & Point-In-Time Recovery (PITR)

In the event of total server hardware failure, storage corruption, or catastrophic operator error (such as an accidental table drop), engineering teams and AI agents must follow this recovery sequence.

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Admin as SysAdmin / DevOps Agent
    participant Storage as Backup Archive
    participant MySQL as MySQL Database Server
    participant Binlog as MySQL Binary Log Engine
    participant App as Express Backend Application

    Note over Admin,App: Disaster Declared (Data Loss / Hardware Failure)
    Admin->>App: Stop Node.js Processes (pm2 stop all)
    Admin->>Storage: Retrieve Latest Full Snapshot (e.g. gbu_sdms_db_20260905.sql.gz)
    Admin->>Admin: Verify SHA256 Checksum
    Admin->>MySQL: Restore Base State (gunzip < dump.sql.gz | mysql gbu_sdms_db)
    Note over MySQL: Base Relational Tables Restored to 02:00 UTC
    Admin->>Binlog: Query Binary Logs from 02:00 UTC to Incident Time
    Admin->>MySQL: Replay Transactions (mysqlbinlog binlog.000042 | mysql gbu_sdms_db)
    Note over MySQL: All Delta Transactions Replayed to Point-of-Failure
    Admin->>MySQL: Execute Integrity Verification Queries
    Admin->>App: Restart Backend Processes (pm2 start all)
    App-->>Admin: Health Check HTTP 200 OK
\`\`\`

### 13.2.1 Step-by-Step Restoration Protocol
1. **Quarantine Application**: Terminate all application listeners to prevent inconsistent concurrent writes during restoration:
   \`\`\`bash
   pm2 stop gbu-sdms-api
   \`\`\`
2. **Recreate Clean Schema**:
   \`\`\`sql
   DROP DATABASE IF EXISTS gbu_sdms_db;
   CREATE DATABASE gbu_sdms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   \`\`\`
3. **Stream Restore Base Backup**:
   \`\`\`bash
   gunzip -c /var/backups/sdms/mysql/gbu_sdms_db_latest.sql.gz | mysql -u sdms_user -p gbu_sdms_db
   \`\`\`
4. **Point-In-Time Binary Log Replay**:
   To recover transactions committed between the 02:00 UTC dump and the incident timestamp (e.g., 10:45:00 UTC):
   \`\`\`bash
   mysqlbinlog --start-datetime="2026-09-05 02:00:00" \\
               --stop-datetime="2026-09-05 10:45:00" \\
               /var/log/mysql/binlog.0000* | mysql -u sdms_user -p gbu_sdms_db
   \`\`\`
5. **Data Consistency Audit**: Verify that key counts match expected values:
   \`\`\`sql
   SELECT COUNT(*) AS total_students FROM students;
   SELECT COUNT(*) AS total_users FROM users;
   SELECT COUNT(*) AS total_attendance_sessions FROM attendance_sessions;
   \`\`\`
6. **Resume Service**:
   \`\`\`bash
   pm2 restart gbu-sdms-api
   curl -I http://localhost:5000/api/health
   \`\`\`

---

## 13.3 Zero-Downtime Schema Migration Architecture

GBU-SDSM handles relational database evolution using the **Expand and Contract (Parallel Run)** migration pattern, ensuring that schema updates never cause application downtime or API incompatibilities.

\`\`\`mermaid
flowchart TD
    subgraph Phase1["Phase 1: Expand (Non-Breaking Additions)"]
        A[Add New Columns with NULL / Defaults] --> B[Deploy Code Supporting Both Schemas]
    end

    subgraph Phase2["Phase 2: Transition (Dual-Writing)"]
        B --> C[Backend Reads New Column, Falls Back to Old]
        C --> D[Backend Writes Synchronously to Both Columns]
    end

    subgraph Phase3["Phase 3: Backfill (Background Data Migration)"]
        D --> E[Batch Script Migrates Legacy Rows]
        E --> F[Verify 100% Data Equivalence]
    end

    subgraph Phase4["Phase 4: Contract (Retire Legacy Columns)"]
        F --> G[Deploy Code Reading Exclusively from New Columns]
        G --> H[Drop Obsolete Columns via ALTER TABLE DROP]
    end
\`\`\`

### 13.3.1 Sequelize Migration Example: Adding Internship & Placement Columns
The migration script below illustrates how the 8 career timeline columns were integrated without locking the database:
\`\`\`javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn('students', 'internshipCompany', {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null
      }, { transaction });

      await queryInterface.addColumn('students', 'internshipDoj', {
        type: Sequelize.DATEONLY,
        allowNull: true,
        defaultValue: null
      }, { transaction });

      await queryInterface.addColumn('students', 'internshipDoe', {
        type: Sequelize.DATEONLY,
        allowNull: true,
        defaultValue: null
      }, { transaction });

      await queryInterface.addColumn('students', 'internshipIsPaid', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }, { transaction });

      await queryInterface.addColumn('students', 'internshipStipend', {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null
      }, { transaction });

      await queryInterface.addColumn('students', 'placementCompany', {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null
      }, { transaction });

      await queryInterface.addColumn('students', 'placementDoj', {
        type: Sequelize.DATEONLY,
        allowNull: true,
        defaultValue: null
      }, { transaction });

      await queryInterface.addColumn('students', 'placementIsPaid', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }, { transaction });

      // Add performance index on placement status for placement analytics
      await queryInterface.addIndex('students', ['placed', 'placementCompany'], {
        name: 'idx_students_placement_status',
        transaction
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeIndex('students', 'idx_students_placement_status', { transaction });
      await queryInterface.removeColumn('students', 'internshipCompany', { transaction });
      await queryInterface.removeColumn('students', 'internshipDoj', { transaction });
      await queryInterface.removeColumn('students', 'internshipDoe', { transaction });
      await queryInterface.removeColumn('students', 'internshipIsPaid', { transaction });
      await queryInterface.removeColumn('students', 'internshipStipend', { transaction });
      await queryInterface.removeColumn('students', 'placementCompany', { transaction });
      await queryInterface.removeColumn('students', 'placementDoj', { transaction });
      await queryInterface.removeColumn('students', 'placementIsPaid', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
\`\`\`

---

## 13.4 MySQL Database Engine Performance Tuning (\`my.cnf\`)

For production workloads supporting thousands of concurrent students, faculty, and administrative staff, the default MySQL 8.0 configuration must be tuned for optimal memory utilization, cache hit ratios, and concurrency throughput.

\`\`\`ini
[mysqld]
# Network & General
bind-address                   = 127.0.0.1
port                           = 3306
default_storage_engine         = InnoDB
character-set-server           = utf8mb4
collation-server               = utf8mb4_unicode_ci
max_connections                = 500
max_connect_errors             = 10000
wait_timeout                   = 600
interactive_timeout            = 600

# InnoDB Buffer Pool Tuning (Crucial for high performance)
# Dedicated server: Set to 70-80% of total physical RAM
innodb_buffer_pool_size        = 4G
innodb_buffer_pool_instances  = 4
innodb_log_file_size           = 512M
innodb_log_buffer_size         = 64M
innodb_flush_log_at_trx_commit = 2       # Optimal performance for ACID write spikes
innodb_flush_method            = O_DIRECT
innodb_file_per_table          = 1
innodb_stats_on_metadata       = 0

# Threading & Memory Optimization
thread_cache_size              = 64
table_open_cache               = 4096
table_definition_cache         = 2048
sort_buffer_size               = 4M
read_rnd_buffer_size           = 8M
join_buffer_size               = 4M
tmp_table_size                 = 64M
max_heap_table_size            = 64M

# Binary Logging & Disaster Recovery
log_bin                        = /var/log/mysql/mysql-bin.log
binlog_format                  = ROW
binlog_expire_logs_seconds     = 604800  # 7-day binary log retention
max_binlog_size                = 256M

# Slow Query Diagnostics
slow_query_log                 = 1
slow_query_log_file            = /var/log/mysql/mysql-slow.log
long_query_time                = 1.0     # Log queries exceeding 1 second
log_queries_not_using_indexes  = 0
\`\`\`

---

## 13.5 Autonomous AI Troubleshooting & Diagnostics Playbook

When an autonomous AI agent encounters operational anomalies during monitoring or self-healing routines, it must execute the diagnostic decision trees outlined below.

### 13.5.1 Diagnostic Playbook 1: Backend Latency Spike / Process Unresponsiveness
1. **Inspect System Resources**:
   - Check CPU and Memory utilization via \`top\` or \`pm2 monit\`.
   - If Node process memory exceeds 1 GB: Trigger PM2 graceful reload (\`pm2 reload gbu-sdms-api\`).
2. **Inspect Slow Query Logs**:
   - Run: \`tail -n 100 /var/log/mysql/mysql-slow.log\`.
   - Identify unindexed queries. If full table scans occur on \`students\`, verify that composite index \`(program, branch, section)\` is active.

### 13.5.2 Diagnostic Playbook 2: Sequelize Connection Pool Exhaustion
- **Symptom**: Error log reports \`SequelizeConnectionAcquireTimeoutError: Operation timeout\`.
- **Root Cause**: Database connections held open by uncommitted transactions or slow blocking queries.
- **Remedy**:
  1. Inspect active MySQL threads:
     \`\`\`sql
     SHOW FULL PROCESSLIST;
     \`\`\`
  2. Kill runaway queries blocking table locks.
  3. Increase \`DB_POOL_MAX\` in \`backend/.env\` from \`10\` to \`25\`.
  4. Ensure all controller code wraps database transactions in managed transaction callbacks (\`sequelize.transaction(async t => { ... })\`) so rollbacks execute automatically on errors.

### 13.5.3 Diagnostic Playbook 3: Cross-Origin Resource Sharing (CORS) Rejection
- **Symptom**: Browser console displays *"Access to XMLHttpRequest blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present"*.
- **Root Cause**: Client request sent from an origin not registered in \`CLIENT_URL\` or reverse proxy stripping headers.
- **Remedy**:
  1. Inspect \`Origin\` header in incoming request.
  2. Append client origin to \`corsOptions.origin\` array in \`backend/server.js\`.
  3. Verify Nginx configuration forwards \`Host\` and \`X-Forwarded-Proto\` correctly.
`;
}
