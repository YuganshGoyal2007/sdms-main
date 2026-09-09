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
