import { config } from 'dotenv';
import './lib/logger.js';
import logger from './lib/logger.js';
import { connectDB } from './lib/db.js';
import { installProcessHandlers } from './lib/shutdown.js';
import app from './server.js';
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
