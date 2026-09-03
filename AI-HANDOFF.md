# GBU-SDSM — AI Handoff Document

**Repository:** https://github.com/YuganshGoyal2007/sdms-main
**Working folder:** `C:\Users\yugansh\Desktop\GBU-SDMS-main - DEBUG\GBU-SDMS-main - Copy`
**Production folder (running, port 5000 via PM2):** `C:\Users\yugansh\Desktop\GBU-SDMS-main - Copy - Copy\GBU-SDMS-main - Copy`
**Archive (old/broken copies + DB home zip):** `C:\Users\yugansh\Desktop\_gbu-sdsm-archive`

---

## 1. Folder Layout (after cleanup)

```
C:\Users\yugansh\Desktop\
├── GBU-SDMS-main - Copy - Copy\
│   └── GBU-SDMS-main - Copy\          ← PRODUCTION (PM2, port 5000)
│       ├── backend\
│       ├── frontend\
│       └── ...
├── GBU-SDMS-main - DEBUG\
│   └── GBU-SDMS-main - Copy\          ← DEBUG (dev only, port 5001)
│       ├── backend\
│       ├── frontend\
│       └── ...
└── _gbu-sdsm-archive\                 ← all old/broken copies + zips
    ├── GBU-SDMS-main\
    ├── GBU-SDMS-main - Copy\
    ├── GBU-SDMS-main - Copy (2)\
    ├── GBU-SDMS-sqlonlyma44in )\
    ├── GBU-SDMS-main.zip              ← 114 MB
    ├── GBU-SDMS-main (2).zip          ← 128 MB
    ├── GBU-SDMS-main - Copy.zip       ← 129 MB
    ├── GBU-SDMS-main - Copy - Copy.zip← 129 MB
    └── gbu_sdms_db_home_2026-09-03.zip ← 205 MB (DB dump for home use)
```

---

## 2. Stack

- **Backend:** Node.js (ESM), Express 5, Sequelize 6, MySQL 8 (utf8mb4), JWT auth (bcrypt), Pino logging, PM2, multer, xlsx, nodemailer
- **Frontend:** React 19, TypeScript 5, Vite 7, Tailwind v4, Redux Toolkit, react-router-dom 7, axios, sonner, framer-motion, recharts, lucide-react

---

## 3. Test users

- **Admin:** `hod.cs@gbu.ac.in` / `admin123`
- **Chairperson (Shiraz):** `shiraz.khurana@gbu.ac.in` (userId=38)
- **Coordinator:** `yadavshubhamsingh00@gmail.com` (userId=6)

---

## 4. Phase status

| Phase | Status | Notes |
|---|---|---|
| 0.1 DB inspection | ✅ DONE | `backend/scripts/inspect-db.js` |
| 1 Debug setup | ✅ DONE | git initialized |
| 2.1 `exportStudentsToExcel` | ✅ DONE | admin/coordinator/chairperson, class-filter |
| 2.2 `getCoordinatorClasses` | ✅ DONE | coordinator-only |
| 2.3 `getAdminDetails` (chair) | ✅ DONE | chairperson → own record + assignments |
| 2.4 rich `getChairpersonAssignments` | ✅ DONE | normalize, dedupe, sort |
| 2.5 `getChairpersonClasses` role check | ✅ DONE | 403 non-chair, 200 empty |
| 2.6 `getChairpersonLogs` own logs | ✅ DONE | ChangeLog by userId |
| 2.7 messages via Notification | ✅ DONE | toRole-based |
| 2.8 `getAdminDetails` role split | ✅ DONE | admin/chairperson/coordinator |
| 2.9 role-based notifications filter | ✅ DONE | admin=all, chair=toRole, coord=toRole |
| 2.10 transactions on add/delete chairperson | ✅ DONE | atomic ops |
| 2.11 student route permissions | ✅ DONE | chairperson added to update/get |
| 2.12 coordinator route permissions | ✅ DONE | chairperson added where needed |
| Sort_buffer OOM fix (ChangeLog) | ✅ DONE | select narrow cols, raw:true |
| Sort_buffer OOM fix (Notification) | ✅ DONE | same pattern |
| Chairperson dashboard | ✅ DONE | `/chairperson/dashboard` |
| Chairperson `/chairperson/*` routes | ✅ DONE | classes/records/logs/messages/student/category |
| Role-aware SideNav | ✅ DONE | chairperson sees `/chairperson/*` |
| SideNav `name.charAt(0)` crash | ✅ FIXED | safe fallback to username |
| **Phase 3 code review** | 🟡 PENDING | see §6 |
| **Phase 4 push to production** | 🟡 PENDING | see §7 |

---

## 5. Recent commits pushed to GitHub

```
18c931c Chairperson section: /chairperson/* routes + role-aware SideNav
56bb55a Fix Notification sort_buffer_size OOM
0c7ae21 Phase 2.10/2.11/UI: chairperson role on count endpoints + dashboard
935fca0 Update AI-HANDOFF.md
625d3de Phase 2.10: transactions on add/delete chairperson
d133590 Phase 2.9: role-based notifications filter
61feae1 Phase 2.8: getAdminDetails role split
c4d5232 Phase 2.7: messages via Notification model
04dea3a Phase 2.6: getChairpersonLogs queries own logs
3ee8367 Phase 2.5: getChairpersonClasses role check
4cdaa9d Phase 2.4: rich getChairpersonAssignments
7b8b285 Phase 2.3: getAdminDetails for chairperson
2c5e7de Fix ChangeLog 500 error + 12-hour logs
```

---

## 6. Phase 3 — Code Review (PENDING)

### 6.1 Critical issues found earlier (must fix before prod)

1. **`chairperson.route.js:14`** — `/chairperson/messages` allows `coordinator` (reference is chairperson-only). Info disclosure: coordinators see admin-targeted messages.
2. **`server.js:39-59`** — CORS allows any private LAN origin in production with `credentials: true`. CSRF risk.
3. **`requestLogger.js:7-12`** — accepts client-supplied `x-request-id`. Server should always generate.
4. **`excel.controller.js:194-307`** — exports full PII (Aadhaar, mobile, dob, email, address, father/mother name) to chairperson. GDPR/Aadhaar Act concern.
5. **`Notification.userId` semantics** — model has no `userId`, but old references filter by it. Messages are now broadcast by `toRole` only — confirm product wants broadcast semantics.

### 6.2 High priority

- `getMessages` (`chairperson.controller.js:229`) — no rate limit
- `sendMessage` (`chairperson.controller.js:247`) — accepts `receiverRole` from body, no validation
- `updateStudentPhoto` (`student.controller.js:380`) — verify class-scope guard for chairperson
- `db.js` `SET SESSION sort_buffer_size` — only applies to one pool connection, not all. Use `pool.afterConnect` hook.
- `student.route.js:17-30` `ALLOWED_MIMES` — includes `application/octet-stream`, too permissive
- `photo upload` (`excel.controller.js:60-68`) — 1000-row loop with no transaction wrapper
- `getChangeLogs` admin branch (`coordinator.controller.js:236-253`) — admin sees only coordinator logs, not chairperson logs at `/admin/changes`

### 6.3 Medium / Low

- Dead code: `Message` model still in `models/index.js`, unused
- Dead code: `classMatches` helper in `chairperson.controller.js`
- N+1 query in `getChairpersons` (`chairperson.controller.js:188`)
- `logger.js:83` `res.getHeader('content-length')` may be `undefined`
- `errorHandler.js:106-108` — `err.code` from libraries may leak query fragments in 4xx
- `student.controller.js:111` — `existingMobile` not normalized (whitespace bypass)
- `student.controller.js:88` — destructure of 28 fields, no schema validation

### 6.4 Frontend

- `ProtectedRoute.tsx:14-37` — `checkUser` swallows errors silently; downstream pages reading `state.admin` may crash
- `Dashboard.tsx` modal forms — no form-level error display

---

## 7. Phase 4 — Push to Production (PENDING)

**When ready (do NOT do until Phase 3 blockers are fixed):**

```powershell
# 1. Stop current production PM2
cd "C:\Users\yugansh\Desktop\GBU-SDMS-main - Copy - Copy\GBU-SDMS-main - Copy\backend"
npm run pm2:stop

# 2. Snapshot current production
Rename-Item "C:\Users\yugansh\Desktop\GBU-SDMS-main - Copy - Copy" `
  "C:\Users\yugansh\Desktop\GBU-SDMS-main - Copy - Copy - PRODUCTION-SNAPSHOT-2026-09-03"

# 3. Promote debug to production
Rename-Item "C:\Users\yugansh\Desktop\GBU-SDMS-main - DEBUG" `
  "C:\Users\yugansh\Desktop\GBU-SDMS-main - Copy - Copy"

# 4. Reinstall deps
cd "C:\Users\yugansh\Desktop\GBU-SDMS-main - Copy - Copy\GBU-SDMS-main - Copy\backend"
npm install
cd "..\frontend"
npm install

# 5. Copy real .env from snapshot
Copy-Item "C:\Users\yugansh\Desktop\GBU-SDMS-main - Copy - Copy - PRODUCTION-SNAPSHOT-2026-09-03\GBU-SDMS-main - Copy\backend\.env" `
  -Destination "C:\Users\yugansh\Desktop\GBU-SDMS-main - Copy - Copy\GBU-SDMS-main - Copy\backend\.env" -Force

# 6. Build frontend
npm run build

# 7. Start PM2
cd "C:\Users\yugansh\Desktop\GBU-SDMS-main - Copy - Copy\GBU-SDMS-main - Copy\backend"
npm run pm2:start

# 8. Verify
curl http://localhost:5000/health

# 9. Re-register backup
npm run backup:unregister
npm run backup:register
```

---

## 8. Quick reference — current state

### Running services

| Service | URL | PID | Status |
|---|---|---|---|
| Production backend (PM2) | http://localhost:5000 | 19088 | ✅ online |
| Debug backend (manual) | http://127.0.0.1:5001 | (none, stopped) | dormant |
| Debug frontend (Vite) | http://localhost:5175 | 20164 | ✅ online (HMR active) |

### Backup locations

- `C:\backups\gbu-sdsm\` — automated backups (last: 2026-09-03 17:06, 281 MB SQL + 17 MB code)
- `C:\Users\yugansh\Desktop\_gbu-sdsm-archive\gbu_sdms_db_home_2026-09-03.zip` — portable DB for home use

### Database credentials (in `backend\.env`)

- DB_HOST=localhost
- DB_PORT=3306
- DB_USER=root
- DB_NAME=gbu_sdms

---

## 9. Known limitations / future work

- Chairperson `/chairperson/records/:rollNo` and `/chairperson/records/:class` still wrap admin components — some inner links navigate to `/admin/*` and bounce. Drill-down UX can be improved later.
- No chairperson-specific student-detail page yet (wraps admin page).
- PWA installer/debugger components exist but aren't referenced in App.tsx.
- `fronend/src/components/Client/DashboardView.tsx` and `TimetableView.tsx` exist but are unused.
- `react-google-recaptcha` installed but unused.
- `redis` package installed but unused.
- `mint-jwt.js` is dev-only — must be removed before production.

---

## 10. Conventions

1. Wrap all controllers with `asyncHandler`
2. Use `logger.info/warn/error` — never `console.*`
3. `node --check <file>` after every edit
4. Commit after each phase: `git add -A && git commit -m "Phase X.Y: <description>"`
5. Push: `git push origin master`
6. Never touch the production folder while Phase 3/4 are pending
7. All hot queries: use `raw: true`, narrow `attributes`, and `LIMIT` to avoid sort_buffer OOM
