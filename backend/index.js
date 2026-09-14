import { config } from 'dotenv';
import './lib/logger.js';
import logger from './lib/logger.js';
import { connectDB } from './lib/db.js';
import { installProcessHandlers } from './lib/shutdown.js';
import app from './server.js';
import { syncFacultyAssignments } from './services/timetableSync.service.js';
import os from 'os';

config({ path: '.env' });

installProcessHandlers();

const PLACEHOLDER_SECRETS = new Set([
  'your_jwt_secret',
  'your_secret_key',
  'change_me',
  'default_jwt_secret',
  'secret',
  '',
]);

const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
if (!secret || PLACEHOLDER_SECRETS.has(secret)) {
  logger.fatal(
    {
      hasJwtAccessSecret: Boolean(process.env.JWT_ACCESS_SECRET),
      hasJwtSecret: Boolean(process.env.JWT_SECRET),
    },
    'JWT_ACCESS_SECRET / JWT_SECRET is missing or still a placeholder. Refusing to start.'
  );
  setTimeout(() => process.exit(1), 500);
  throw new Error('Invalid JWT secret');
}

import('./models/index.js');

const startTime = Date.now();
logger.info(
  {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    hostname: os.hostname(),
    cpus: os.cpus().length,
    memTotal: os.totalmem(),
    env: process.env.NODE_ENV || 'development',
  },
  'Process starting'
);

connectDB().then((ok) => {
  if (!ok) {
    logger.fatal('Refusing to start HTTP server because database is not reachable');
    setTimeout(() => process.exit(1), 500);
    return;
  }

  const PORT = process.env.PORT || 5000;
  const HOST = process.env.HOST || '0.0.0.0';

  const server = app.listen(PORT, HOST, () => {
    const bindText = HOST === '0.0.0.0' ? '0.0.0.0 (all interfaces)' : HOST;
    const lanIp = getLanIp();
    logger.info(
      {
        port: PORT,
        host: bindText,
        lanIp,
        bootTimeMs: Date.now() - startTime,
      },
      `Backend listening on ${bindText}:${PORT}`
    );

    // ── Automatic Faculty Reassignment Sync ──────────────────────────
    // Runs syncFacultyAssignments every 30 minutes so that when the
    // university changes a teacher assignment on samay.mygbu.in, the
    // SDMS system picks it up automatically without admin clicking Sync.
    const SYNC_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

    const runAutoSync = async () => {
      try {
        logger.info('Auto-sync: starting scheduled faculty reassignment check');
        const result = await syncFacultyAssignments({
          school: 'SOICT',
          department: 'CSE',
          dryRun: false,
          triggeredById: null, // system-triggered, no user
        });
        if (result.success) {
          const s = result.summary;
          logger.info(
            { reassigned: s.reassignedCount, newAssignments: s.newAssignmentCount, unchanged: s.unchangedCount },
            'Auto-sync: faculty reassignment check complete'
          );
        } else {
          logger.warn({ error: result.error || result.message }, 'Auto-sync: faculty reassignment check failed');
        }
      } catch (err) {
        logger.error({ error: err.message }, 'Auto-sync: unhandled error during faculty reassignment');
      }
    };

    // First run 60 seconds after boot (let DB models finish syncing)
    setTimeout(runAutoSync, 60 * 1000);
    // Then repeat every 30 minutes
    setInterval(runAutoSync, SYNC_INTERVAL_MS);
    logger.info({ intervalMinutes: 30 }, 'Auto-sync: faculty reassignment background job scheduled');

    // ── Semester Boundary Timetable Snapshot Trigger ────────────────
    // Milestone boundaries:
    // 1. Odd Term Start: August 1
    // 2. Odd Term End: Nov 30 / Dec 1
    // 3. Even Term Start: Jan 15
    // 4. Even Term End: April 30 / May 1
    const runSemesterSnapshotCheck = async () => {
      try {
        const now = new Date();
        const month = now.getMonth();
        const date = now.getDate();

        let triggerType = null;
        let semesterTerm = null;

        if (month === 7 && date === 1) { // August 1
          triggerType = 'term_start';
          semesterTerm = 'odd';
        } else if ((month === 10 && date === 30) || (month === 11 && date === 1)) { // Nov 30 / Dec 1
          triggerType = 'term_end';
          semesterTerm = 'odd';
        } else if (month === 0 && date === 15) { // Jan 15
          triggerType = 'term_start';
          semesterTerm = 'even';
        } else if ((month === 3 && date === 30) || (month === 4 && date === 1)) { // Apr 30 / May 1
          triggerType = 'term_end';
          semesterTerm = 'even';
        }

        if (triggerType) {
          logger.info({ triggerType, semesterTerm }, 'Semester boundary reached: Triggering automated timetable snapshots');
          const TimetableSnapshot = (await import('./models/timetableSnapshot.model.js')).default;
          const Timetable = (await import('./models/timetable.model.js')).default;
          const FacultyAssignment = (await import('./models/facultyAssignment.model.js')).default;

          const year = now.getFullYear();
          const academicYear = semesterTerm === 'odd' ? `${year}-${year + 1}` : `${year - 1}-${year}`;

          const activeTimetables = await Timetable.findAll();
          const facultyAssignments = await FacultyAssignment.findAll({ raw: true }).catch(() => []);

          let capturedCount = 0;
          for (const tt of activeTimetables) {
            const existing = await TimetableSnapshot.findOne({
              where: {
                academicYear,
                semesterTerm,
                snapshotType: triggerType,
                school: tt.school,
                department: tt.department,
                program: tt.program,
                batch: tt.batch,
                specialization: tt.specialization,
              },
            });
            if (!existing) {
              const matchingAssignments = facultyAssignments.filter(
                (fa) => (!fa.program || fa.program === tt.program) && (!fa.batch || fa.batch === tt.batch)
              );
              await TimetableSnapshot.create({
                academicYear,
                semesterTerm,
                snapshotType: triggerType,
                school: tt.school,
                department: tt.department,
                program: tt.program,
                batch: tt.batch,
                specialization: tt.specialization || 'None',
                timetableData: tt.entries || {},
                facultyAssignments: matchingAssignments,
                capturedAt: new Date(),
                capturedBy: 'system-cron',
                remarks: `Automated semester milestone snapshot (${triggerType})`,
              });
              capturedCount++;
            }
          }
          logger.info({ capturedCount, triggerType, semesterTerm }, 'Automated semester snapshot trigger complete');
        }
      } catch (err) {
        logger.error({ err: err.message }, 'Error in automated semester snapshot trigger');
      }
    };

    setTimeout(runSemesterSnapshotCheck, 90 * 1000);
    setInterval(runSemesterSnapshotCheck, 24 * 60 * 60 * 1000);
    logger.info('Auto-snapshot: semester boundary timetable scheduler initialized');
  });

  server.on('error', (err) => {
    logger.fatal(
      { err: { name: err.name, message: err.message, code: err.code } },
      'HTTP server error'
    );
    setTimeout(() => process.exit(1), 500);
  });
});

function getLanIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}
