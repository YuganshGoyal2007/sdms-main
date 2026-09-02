# GBU-SDSM - DEBUG Branch

## What is this?

This is a **debug / integration branch** of the GBU-SDSM backend. It contains:

1. All production code (as of `C:\Users\yugansh\Desktop\GBU-SDMS-main - Copy - Copy\GBU-SDMS-main - Copy`)
2. New features ported from the original `C:\Users\yugansh\Desktop\GBU-SDMS-main`

## DO NOT point production users at this folder.

This branch is for local testing only. After all features pass tests, this folder replaces the current production folder via the "push to production" procedure in `INTEGRATION-PLAN.md`.

## Features being integrated

See the todos in the chat for the full list. Key ones:

- `exportStudentsToExcel` (Excel export of student records, role-aware)
- `getCoordinatorClasses` (coordinator "My Classes" endpoint)
- Chairperson "My Details" endpoint
- Improved `getChairpersonAssignments` with normalization + dedup
- `Notification`-based messaging (drop `Message` model usage)
- Role-based notification filtering
- Transactions on chairperson add/delete
- Chairperson role added to several student routes

## How to run locally

```bash
cd "C:\Users\yugansh\Desktop\GBU-SDMS-main - DEBUG\GBU-SDMS-main - Copy\backend"
npm install            # already done
node scripts/inspect-db.js   # verify DB connection
npm run pm2:start      # launches on port 5000
```

## After integration completes

When all features pass tests, run the "push to production" procedure (currently: rename this folder to replace `GBU-SDMS-main - Copy - Copy`, restart PM2, verify).
