# GBU-SDSM Debug Branch — AI Handoff Document

**Repository:** https://github.com/YuganshGoyal2007/sdms-main
**Working folder:** `C:\Users\yugansh\Desktop\GBU-SDMS-main - DEBUG\GBU-SDMS-main - Copy`
**Production folder (current, do NOT touch):** `C:\Users\yugansh\Desktop\GBU-SDMS-main - Copy - Copy\GBU-SDMS-main - Copy`
**Original (do NOT touch):** `C:\Users\yugansh\Desktop\GBU-SDMS-main`

---

## 1. Context

GBU-SDSM is a Student Data Management System for Gautam Buddha University. The user had:
- Original codebase in `GBU-SDMS-main` (no git history, just files)
- A "Copy - Copy" folder that became the **production** (running on port 5000 via PM2, 41m uptime)
- Recently asked to integrate features from the original into the Copy, but **without touching the production server**
- Strategy: copy production files to a new "DEBUG" folder, integrate features there, test, then push to production

The work in this debug branch integrates the following improvements from the original `GBU-SDMS-main` (which were missing in the Copy) into the debug folder.

---

## 2. What's been done (completed)

### Phase 0.1 — DB inspection
Script: `backend/scripts/inspect-db.js` (read-only)

Findings:
- `Notifications` table: **24 rows** — used in production
- `Messages` table: **0 rows** — empty, never used
- `ChangeLogs` table: 60 rows

**Decision:** Use `Notification` model for messaging (drop `Message` model usage).

### Phase 1 — Debug setup
- Created `C:\Users\yugansh\Desktop\GBU-SDMS-main - DEBUG\` and copied production into it (excluding `node_modules`, `logs`, `.env`)
- Ran `npm install` (445 packages installed)
- Initialized git, made first commit `e990fc4` "snapshot from production"
- Created `DEBUG-README.md` describing the branch

### Phase 2.1 — `exportStudentsToExcel` (commit `1225bff`)
**File:** `backend/controllers/excel.controller.js`
- Added `exportStudentsToExcel` (admin/coordinator/chairperson, class-filterable)
- Added helper functions: `classFields`, `normalizeClass`, `exactClassMatch`, `buildExportRow`, `sendWorkbook`
- Uses `XLSX` to write `.xlsx` buffers with two sheets: "Student Records" + "Export Info"
- Wrapped with `asyncHandler`, uses `logger.info` for entry/complete
- Filename variants: `all-student-records.xlsx`, `all-student-records-class.xlsx`, `coordinator-assigned-records.xlsx`, `chairperson-assigned-records.xlsx`

**File:** `backend/routes/student.route.js`
- Imported `exportStudentsToExcel` from excel controller
- Added route: `GET /admin/export-students` (admin/coordinator/chairperson)
- Updated `update-student/:id` to allow chairperson
- Updated `update-student-photo/:rollNo` to allow coordinator + chairperson
- Updated `get-student-profile/:rollNo` to allow chairperson

**Test results (verified with `verify-xlsx.mjs`):**
- Admin export all: 1745 rows, 3.3 MB xlsx
- Admin export with filter (soict/cse/B.Tech/2022-26/AI): 13 rows, 45 KB
- Filename correctly uses `-class` suffix when filter present

### Phase 2.2 — `getCoordinatorClasses` (commit `9936dc2`)
**File:** `backend/controllers/coordinator.controller.js`
- Added `getCoordinatorClasses` after `getAdmins`
- Returns coordinator's own class assignments (deduplicated by class key)
- Includes both `userId` and `email/username` matching for backward compatibility
- Sorted by school/department/program/batch/specialization
- Wrapped with `asyncHandler`

**File:** `backend/routes/coordinator.route.js`
- Imported `getCoordinatorClasses`
- Added route: `GET /admin/classes` (coordinator role only)
- Updated `get-admins` to allow chairperson
- Updated `notifications` to allow chairperson

**Test results:**
- Unauthenticated → 401
- Admin → 403 (correctly blocked, only coordinator role allowed)
- Coordinator id=6 → 200 with 1 class (soict/cse/B.Tech/2024-28/Core Sec-D)

### Helper scripts created (in `backend/scripts/`)
- `inspect-db.js` — read-only DB inspector (works in both copy & debug)
- `list-users.js` — lists users, coordinators, chairpersons
- `find-multi-class.js` — finds coordinators with multiple class records
- `mint-jwt.js` — mints a JWT for any userId/role (for testing) — **REMOVE before production**
- `verify-xlsx.mjs` — verifies a saved .xlsx file is valid

---

## 3. What still needs to be done (in order)

### Phase 2.3 — Add `getAdminDetails` to chairperson controller ✅ DONE
**File:** `backend/controllers/chairperson.controller.js`
- ✅ Add function that returns `chairperson` + `assignments` when role is `chairperson`
- ✅ 403 if not a chairperson
- ✅ 404 if chairperson profile not found
- ✅ 200 with `user` and `assignments` on success
- **Reference source:** `C:\Users\yugansh\Desktop\GBU-SDMS-main\backend\controllers\chairperson.controller.js` lines 472-515 (the `getAdminDetails` function)

**File:** `backend/routes/chairperson.route.js`
- ✅ Imported `getAdminDetails` from chairperson controller
- ✅ Added route: `GET /chairperson/get-admin-details` (chairperson role only)

**Test results:**
- ✅ As admin: returns minimal user info (`{id, role, username}`)
- ✅ As coordinator: returns full coordinator records
- ✅ As chairperson: returns chairperson record with 3 class assignments
- ✅ Log: `who: "38/chairperson"`, 12-hour time, `took_ms`

### Phase 2.4 — Replace `getChairpersonAssignments` with rich version from main ✅ DONE
**File:** `backend/controllers/chairperson.controller.js`
- ✅ Replaced the 7-line version (lines 19-26) with main's 165-line version
- ✅ Main's version: normalizes, dedupes by class key, falls back to direct class assignment, sorts
- **Reference source:** `C:\Users\yugansh\Desktop\GBU-SDMS-main\backend\controllers\chairperson.controller.js` lines 9-165

**Test results:**
- ✅ As chairperson with 3 classes: returns all 3 unique classes sorted

### Phase 2.5 — Fix `getChairpersonClasses` role check ✅ DONE
**File:** `backend/controllers/chairperson.controller.js` 
- ✅ Added 403 if not chairperson
- ✅ Returns 200 with empty `classes` array if no assignments
- ✅ Route changed from `chairperson`,`admin` to only `chairperson`
- **Reference source:** `C:\Users\yugansh\Desktop\GBU-SDMS-main\backend\controllers\chairperson.controller.js` lines 413-464

**Test results:**
- ✅ As admin: 403
- ✅ As chairperson: 200 with 3 classes

### Phase 2.6 — Port `getChairpersonLogs` to use `Notification` model ✅ DONE
**File:** `backend/controllers/chairperson.controller.js`
- ✅ Replaced current implementation
- ✅ New version: queries `ChangeLog` by `userId: req.user.id` (own logs)
- ✅ Limited to 200 records, no `details` JSON column

**Test results:**
- ✅ As chairperson: returns 200 (empty for test chair with no own logs)

### Phase 2.7 — Port `getMessages` / `sendMessage` to use `Notification` model ✅ DONE
**File:** `backend/controllers/chairperson.controller.js`
- ✅ Replaced `Message` model usage with `Notification` model
- ✅ `getMessages`: query `Notification` by `toRole === req.user.role` OR `toRole === 'admin'`
- ✅ `sendMessage`: insert into `Notification` with `toRole`, `message`, `data` (no `userId` since that column doesn't exist)
- ✅ Limited to 50 records, removed unused `Message` import and `coordinatorUsersForAssignments` helper
- **Reference source:** `C:\Users\yugansh\Desktop\GBU-SDMS-main\backend\controllers\chairperson.controller.js` lines 564-648

**Test results:**
- ✅ As chairperson GET messages: 200, 47 notifications (all admin-targeted)
- ✅ As chairperson POST message: 201 created with `toRole: admin`

### Phase 2.8 — Update `getAdminDetails` in coordinator controller for role split ✅ DONE
**File:** `backend/controllers/coordinator.controller.js`
- ✅ Handle `admin` role: return minimal user info (id, username, email, role)
- ✅ Handle `chairperson` role: return chairperson record
- ✅ Handle `coordinator` role: existing logic
- **Reference source:** `C:\Users\yugansh\Desktop\GBU-SDMS-main\backend\controllers\coordinator.controller.js` lines 166-270

**Test results:**
- ✅ As admin: 200, minimal user info
- ✅ As coordinator: 200, full coordinator records
- ✅ As chairperson: 200, chairperson record

### Phase 2.9 — Update `getNotifications` with role-based filter ✅ DONE
**File:** `backend/controllers/coordinator.controller.js`
- ✅ Replaced current implementation (admin sees all, others see all)
- ✅ Added role-based filter:
  - `admin`: see all
  - `chairperson`: see `toRole === 'chairperson'` OR `toRole === 'admin'`
  - `coordinator`: see only `toRole === 'coordinator'`
- ✅ Route updated to allow all 3 roles

**Test results:**
- ✅ As admin: 48 notifications (all)
- ✅ As coordinator: 0 (no coordinator-targeted notifications exist)
- ✅ As chairperson: 48 (sees admin + chairperson)

### Phase 2.10 — Add transactions to addChairperson / deleteChairperson ✅ DONE
**File:** `backend/controllers/chairperson.controller.js`
- ✅ Wrapped `addChairperson` in `sequelize.transaction()` with rollback on error
- ✅ Wrapped `deleteChairperson` in transaction (User + ChairpersonClass + Chairperson)
- ✅ Used `bulkCreate` with `transaction` option
- ✅ Used `Map` for deduplication before bulkCreate

**Test results:**
- ✅ Add test chairperson: 201 (created with 1 class)
- ✅ Delete test chairperson: 200 (deleted with all related data)

### Phase 2.11 — Update role permissions on student routes ✅ DONE in Phase 2.1
**File:** `backend/routes/student.route.js`
- ✅ `update-student/:id` — add chairperson (DONE in Phase 2.1)
- ✅ `update-student-photo/:rollNo` — add coordinator + chairperson (DONE in Phase 2.1)
- ✅ `get-student-profile/:rollNo` — add chairperson (DONE in Phase 2.1)

### Phase 2.12 — Update role permissions on coordinator routes ✅ DONE
**File:** `backend/routes/coordinator.route.js`
- ✅ `get-admins` — add chairperson (DONE in Phase 2.2)
- ✅ `notifications` — add chairperson (DONE in Phase 2.9)
- `changes` — already allows chairperson

### Phase 3 — Code review ⏳ NOT YET DONE
- Re-read every modified file end-to-end
- Diff against main's version for each function
- Verify logging is consistent (all errors go through `logger.error`)
- Verify all route handlers are wrapped with `asyncHandler`
- Verify no new `try/catch + console.error` patterns
- Verify redaction list still covers Aadhaar, mobile, dob, photo, password, OTP
- Verify role permissions match main's intent

### Phase 4 — Push to production ⏳ NOT YET DONE
**Do this ONLY after Phases 2 and 3 are complete and all tests pass.**

1. Stop current production PM2:
   ```powershell
   cd "C:\Users\yugansh\Desktop\GBU-SDMS-main - Copy - Copy\GBU-SDMS-main - Copy\backend"
   npm run pm2:stop
   ```
2. Rename current production folder (keep forever for rollback):
   ```powershell
   Rename-Item "C:\Users\yugansh\Desktop\GBU-SDMS-main - Copy - Copy" "C:\Users\yugansh\Desktop\GBU-SDMS-main - Copy - Copy - PRODUCTION-SNAPSHOT-2026-09-03"
   ```
3. Rename debug folder to become production:
   ```powershell
   Rename-Item "C:\Users\yugansh\Desktop\GBU-SDMS-main - DEBUG" "C:\Users\yugansh\Desktop\GBU-SDMS-main - Copy - Copy"
   ```
4. Reinstall dependencies in new production:
   ```powershell
   cd "C:\Users\yugansh\Desktop\GBU-SDMS-main - Copy - Copy\GBU-SDMS-main - Copy\backend"
   npm install
   ```
5. Copy the real .env from the snapshot folder
6. Start PM2:
   ```powershell
   npm run pm2:start
   ```
7. Verify:
   ```powershell
   curl http://localhost:5000/health
   curl http://10.12.9.222:5000/auth/user-login  # should return 422 with bad creds
   ```
8. Re-register backup scheduled task:
   ```powershell
   npm run backup:unregister
   npm run backup:register
   ```
2. Rename current production folder (keep forever for rollback):
   ```powershell
   Rename-Item "C:\Users\yugansh\Desktop\GBU-SDMS-main - Copy - Copy" "C:\Users\yugansh\Desktop\GBU-SDMS-main - Copy - Copy - PRODUCTION-SNAPSHOT-2026-09-02"
   ```
3. Rename debug folder to become production:
   ```powershell
   Rename-Item "C:\Users\yugansh\Desktop\GBU-SDMS-main - DEBUG" "C:\Users\yugansh\Desktop\GBU-SDMS-main - Copy - Copy"
   ```
4. Reinstall dependencies in new production:
   ```powershell
   cd "C:\Users\yugansh\Desktop\GBU-SDMS-main - Copy - Copy\GBU-SDMS-main - Copy\backend"
   npm install
   ```
5. Copy the real .env from the snapshot folder
6. Start PM2:
   ```powershell
   npm run pm2:start
   ```
7. Verify:
   ```powershell
   curl http://localhost:5000/health
   curl http://10.12.9.222:5000/auth/user-login  # should return 422 with bad creds
   ```
8. Re-register backup scheduled task:
   ```powershell
   npm run backup:unregister
   npm run backup:register
   ```

---

## 4. Test infrastructure (already set up)

### Running the debug server
```powershell
$env:NODE_ENV='production'
$env:PORT='5001'           # Use a different port to avoid conflicting with production
$env:HOST='127.0.0.1'
cd "C:\Users\yugansh\Desktop\GBU-SDMS-main - DEBUG\GBU-SDMS-main - Copy\backend"
node index.js
```

The production server is on port 5000. Debug server is on port 5001.

### Getting a JWT for testing
```powershell
# Admin
$body = '{"username":"hod.cs@gbu.ac.in","password":"admin123"}'
$r = Invoke-WebRequest -Uri "http://127.0.0.1:5001/auth/user-login" -Method POST -Body $body -Headers @{ 'Content-Type' = 'application/json' } -UseBasicParsing
$admin_jwt = ($r.Content | ConvertFrom-Json).accessToken

# Or mint a JWT for any user/role (DEV ONLY)
cd "C:\Users\yugansh\Desktop\GBU-SDMS-main - DEBUG\GBU-SDMS-main - Copy\backend"
$jwt = node scripts/mint-jwt.js 6 yadavshubhamsingh00@gmail.com coordinator
$jwt = ($jwt.Split("`n")[-1]).Trim()
```

### Available test users (from DB)
- **Admin:** `hod.cs@gbu.ac.in` / `admin123`
- **Coordinators:** `yadavshubhamsingh00@gmail.com` (id=6, has 1 class), many others
- **Chairpersons:** need to check DB for actual chairperson records

### Test commands
```powershell
# Health check
curl http://127.0.0.1:5001/health

# Login
$body = '{"username":"hod.cs@gbu.ac.in","password":"admin123"}'
$headers = @{ 'Content-Type' = 'application/json' }
$r = Invoke-WebRequest -Uri "http://127.0.0.1:5001/auth/user-login" -Method POST -Body $body -Headers $headers -UseBasicParsing
$admin_jwt = ($r.Content | ConvertFrom-Json).accessToken

# With auth
$headers = @{ 'Authorization' = "Bearer $admin_jwt" }
Invoke-WebRequest -Uri "http://127.0.0.1:5001/admin/get-admin-details" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "http://127.0.0.1:5001/admin/export-students" -Headers $headers -UseBasicParsing
```

---

## 5. Key file paths (for quick reference)

### Reference (read-only, do NOT modify)
- `C:\Users\yugansh\Desktop\GBU-SDMS-main\backend\controllers\chairperson.controller.js` — has the rich `getChairpersonAssignments` and the correct `getChairpersonClasses`
- `C:\Users\yugansh\Desktop\GBU-SDMS-main\backend\controllers\coordinator.controller.js` — has the role-split `getAdminDetails` and role-based `getNotifications`
- `C:\Users\yugansh\Desktop\GBU-SDMS-main\backend\controllers\excel.controller.js` — has `exportStudentsToExcel` (already ported)

### Working (debug branch)
- `C:\Users\yugansh\Desktop\GBU-SDMS-main - DEBUG\GBU-SDMS-main - Copy\backend\controllers\chairperson.controller.js`
- `C:\Users\yugansh\Desktop\GBU-SDMS-main - DEBUG\GBU-SDMS-main - Copy\backend\controllers\coordinator.controller.js`
- `C:\Users\yugansh\Desktop\GBU-SDMS-main - DEBUG\GBU-SDMS-main - Copy\backend\controllers\excel.controller.js` (Phase 2.1 done)
- `C:\Users\yugansh\Desktop\GBU-SDMS-main - DEBUG\GBU-SDMS-main - Copy\backend\routes\chairperson.route.js`
- `C:\Users\yugansh\Desktop\GBU-SDMS-main - DEBUG\GBU-SDMS-main - Copy\backend\routes\coordinator.route.js` (Phase 2.2 done)
- `C:\Users\yugansh\Desktop\GBU-SDMS-main - DEBUG\GBU-SDMS-main - Copy\backend\routes\student.route.js` (Phase 2.1 done)

### Production (running, do NOT modify)
- `C:\Users\yugansh\Desktop\GBU-SDMS-main - Copy - Copy\GBU-SDMS-main - Copy\`

---

## 6. Conventions to follow

1. **Wrap all controllers with `asyncHandler`** — see `backend/lib/asyncHandler.js`
2. **Use `logger.info/warn/error/fatal` instead of `console.*`** — see `backend/lib/logger.js`
3. **Don't break the existing production behavior** — the production server is running and serving users
4. **Run `node --check <file>` after every edit** — to catch syntax errors
5. **Restart debug server after every change** (Stop-Process + Start-Process)
6. **Test after every change** — use the curl/PowerShell commands above
7. **Commit after every phase** with a descriptive message: `git add -A && git commit -m "Phase X.Y: <description>"`
8. **Never delete or modify the original `GBU-SDMS-main` folder**
9. **Never modify the current production `Copy - Copy` folder** until Phase 4

---

## 7. Git workflow

```powershell
cd "C:\Users\yugansh\Desktop\GBU-SDMS-main - DEBUG\GBU-SDMS-main - Copy"

# Status
git status

# Stage and commit
git add -A
git commit -m "Phase X.Y: description"

# View history
git log --oneline

# Push to GitHub
git push origin master
```

Remote: `https://github.com/YuganshGoyal2007/sdms-main`

---

## 8. Current commit history

```
625d3de  Phase 2.10: add transactions to addChairperson + deleteChairperson (atomic ops, rollback on error)
d133590  Phase 2.9: update getNotifications with role-based filter
61feae1  Phase 2.8: update getAdminDetails in coordinator controller for admin/chairperson/coordinator role split
c4d5232  Phase 2.7: port getMessages/sendMessage to use Notification model (no userId col, select cols, limit 50)
04dea3a  Phase 2.6: port getChairpersonLogs to query own ChangeLog (userId filter, 200 limit, no details)
3ee8367  Phase 2.5: fix getChairpersonClasses role check (403 for non-chairperson, 200 empty for no classes)
4cdaa9d  Phase 2.4: replace getChairpersonAssignments with main's rich version (normalize, dedupe, sort, fallback)
7b8b285  Phase 2.3: add getAdminDetails to chairperson controller + /chairperson/get-admin-details route
2c5e7de  Fix ChangeLog 500 error: MySQL sort_buffer + smaller query. Fix logs: 12-hour time, dedupe fields
6e3fe9f  Add AI-HANDOFF.md (detailed step-by-step plan for remaining work)
9936dc2  Phase 2.2: port getCoordinatorClasses + add /admin/classes route (coordinator role)
1225bff  Phase 2.1: port exportStudentsToExcel (admin/coordinator/chairperson, role-based, class-filter)
e990fc4  snapshot from production
```

---

## 9. Critical bug fix (after AI-HANDOFF was created)

**Root cause of "yesterday's crash"**: The `GET /admin/changes` (Change Logs page) was returning HTTP 500 because MySQL ran out of `sort_buffer_size` when trying to `ORDER BY createdAt DESC` on a table with a large JSON `details` column. 10 errors in production `error.log` between 2026-09-02 10:10 and 10:11.

**Fixes applied (commits will be added next):**
- `lib/db.js` — Added `SET SESSION sort_buffer_size=4MB, tmp_table_size=64MB, max_heap_table_size=64MB` on connect
- `controllers/coordinator.controller.js` — `getChangeLogs` now selects only 6 small columns (no `details` JSON), `raw: true`, `LIMIT 200`
- `lib/logger.js` — 12-hour human-readable time (`03 Sept 2026 02:02:18 pm`), AsyncLocalStorage + pino `mixin` for per-request context (`who`, `from`, `in`, `out`, `warn`)
- `lib/requestLogger.js` — Uses `runWithRequestContext` wrapper; renamed `responseTime` → `took_ms`
- `lib/errorHandler.js` — Stack traces trimmed to 8 lines max in production

**Verified in debug**: `/admin/changes` returns 200, all log lines are human-readable, no duplicates, no errors.

---

## 9. Logging convention

All logs go to `backend/logs/output.log` and `backend/logs/error.log` (separate streams via pino multistream).

To view logs:
```powershell
Get-Content "C:\Users\yugansh\Desktop\GBU-SDMS-main - DEBUG\GBU-SDMS-main - Copy\backend\logs\output.log" -Tail 20
Get-Content "C:\Users\yugansh\Desktop\GBU-SDMS-main - DEBUG\GBU-SDMS-main - Copy\backend\logs\error.log" -Tail 20
```

In dev mode (NODE_ENV !== 'production'), pino-pretty outputs to stdout. In production mode, all logs go to files only.

---

## 10. Troubleshooting

### Debug server not starting
- Check that port 5001 is free: `netstat -ano | Select-String ":5001"`
- Check that the previous node process was killed: `Get-Process -Name node`
- Read the error log: `Get-Content "backend\logs\debug-out.log"`

### Auth fails with 401
- Get a fresh JWT (they expire in 1 hour)
- Use the `mint-jwt.js` script for testing
- Make sure the Authorization header is exactly: `Authorization: Bearer <token>`

### DB connection errors
- Verify `.env` has correct `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- Test connection: `node scripts/inspect-db.js`

### Routes return 404
- Make sure the route is registered in the correct `*.route.js` file
- Make sure the server was restarted after adding the route
- Check the file with `node --check <file>`

---

## 11. Final notes

- The user (Yugansh Goyal) wants this pushed to https://github.com/YuganshGoyal2007/sdms-main
- Production is currently running. Do NOT touch it until Phase 4.
- All code review should be thorough — this is going to production.
- Be defensive with error handling. Wrap everything with `asyncHandler`. Use `logger.error` for all caught exceptions.
- After all phases complete, do a final smoke test of all routes before pushing to production.
