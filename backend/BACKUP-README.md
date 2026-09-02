# Backup Guide

## What gets backed up

Every day at **02:00 AM**, two files are created in `C:\backups\gbu-sdsm\`:

1. **`db-YYYY-MM-DD-HHMMSS.sql`** — full MySQL dump of the `gbu_sdms` database (use this to restore data after a crash)
2. **`code-YYYY-MM-DD-HHMMSS.zip`** — zipped copy of the entire project (backend + frontend) excluding `node_modules`, `logs`, and build artifacts

After 14 days, files are **automatically deleted** to save disk space.

## Files

| File | Purpose |
|---|---|
| `backend/scripts/backup.js` | The backup script (run by Task Scheduler and manually) |
| `backend/scripts/register-backup-task.ps1` | Registers the daily 02:00 scheduled task |
| `backend/scripts/unregister-backup-task.ps1` | Removes the scheduled task |
| `backend/logs/backup.log` | Per-run log: timestamp, sizes, cleanup summary |
| `C:\backups\gbu-sdsm\` | Where backup files are stored |

## Commands

```powershell
cd "C:\Users\yugansh\Desktop\GBU-SDMS-main - Copy - Copy\GBU-SDMS-main - Copy\backend"

# Run a backup manually (any time)
npm run backup

# Register the daily 02:00 schedule (asks for admin via UAC the first time)
npm run backup:register

# Unregister the schedule
npm run backup:unregister

# Check the schedule
Get-ScheduledTask -TaskName "GBU-SDMS-Daily-Backup"

# View past runs / next run time
Get-ScheduledTask -TaskName "GBU-SDMS-Daily-Backup" | Get-ScheduledTaskInfo
```

## How to restore after a crash

### Scenario 1: Database is corrupted / wiped, code is fine
```powershell
# Find a recent .sql file in C:\backups\gbu-sdsm\
# Restore it (will overwrite current DB)
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" --user=root --password=A@eofyug2007 gbu_sdms < "C:\backups\gbu-sdsm\db-2026-09-02-020000.sql"
```
(Adjust path to match your MySQL install.)

### Scenario 2: Code is corrupted, database is fine
1. Extract `C:\backups\gbu-sdsm\code-YYYY-MM-DD-HHMMSS.zip` over your project folder
2. `cd backend && npm install`
3. Restart PM2: `npm run pm2:restart`

### Scenario 3: Both are gone (full disaster)
1. Restore database from the `.sql` file (see Scenario 1)
2. Extract the code `.zip` (see Scenario 2)
3. Start PM2: `npm run pm2:start`

## Configuration (env vars)

Add to `backend\.env` if you want to override defaults:

```env
BACKUP_DIR=C:\backups\gbu-sdsm
BACKUP_RETENTION_DAYS=14
MYSQLDUMP_PATH=C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqldump.exe
```

## Checking that backups are running

```powershell
# Last 20 lines of the backup log
Get-Content "C:\Users\yugansh\Desktop\GBU-SDMS-main - Copy - Copy\GBU-SDMS-main - Copy\backend\logs\backup.log" -Tail 20

# Files in backup folder
Get-ChildItem C:\backups\gbu-sdsm | Sort-Object LastWriteTime -Descending
```

If the folder has files dated today/yesterday, backups are working. If empty for > 2 days, the scheduled task isn't running — open `taskschd.msc` and check.

## Manual restore commands (copy-paste)

```powershell
# 1. List available backups
Get-ChildItem C:\backups\gbu-sdsm\*.sql | Sort-Object LastWriteTime -Descending

# 2. Restore the most recent database dump
$latest = Get-ChildItem C:\backups\gbu-sdsm\*.sql | Sort-Object LastWriteTime -Descending | Select-Object -First 1
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" --user=root --password="A@eofyug2007" gbu_sdms < $latest.FullName

# 3. Restore the most recent code
$latestZip = Get-ChildItem C:\backups\gbu-sdsm\code-*.zip | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Expand-Archive -Path $latestZip.FullName -DestinationPath "C:\Users\yugansh\Desktop\GBU-SDMS-main - Copy - Copy" -Force
```
