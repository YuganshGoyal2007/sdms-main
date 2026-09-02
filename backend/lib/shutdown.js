import sequelize from './db.js';
import logger from './logger.js';

let shuttingDown = false;

const flushLogsAndExit = async (code) => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 250));
  } catch (_) {}
  process.exit(code);
};

const gracefulShutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.warn({ signal, pid: process.pid, uptime: process.uptime() }, 'Graceful shutdown initiated');

  try {
    await sequelize.close();
    logger.info('Database pool closed');
  } catch (err) {
    logger.error({ err: { name: err.name, message: err.message, stack: err.stack } }, 'Error closing database');
  }

  await flushLogsAndExit(0);
};

const installProcessHandlers = () => {
  process.on('uncaughtException', (err, origin) => {
    logger.fatal(
      {
        err: { name: err?.name, message: err?.message, stack: err?.stack },
        origin,
        pid: process.pid,
        uptime: process.uptime(),
        mem: process.memoryUsage(),
      },
      'uncaughtException - process will exit'
    );
    flushLogsAndExit(1);
  });

  process.on('unhandledRejection', (reason) => {
    const err = reason instanceof Error
      ? { name: reason.name, message: reason.message, stack: reason.stack }
      : { message: String(reason) };
    logger.fatal(
      {
        err,
        pid: process.pid,
        uptime: process.uptime(),
        mem: process.memoryUsage(),
      },
      'unhandledRejection - process will exit'
    );
    flushLogsAndExit(1);
  });

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('warning', (warning) => {
    logger.warn(
      { name: warning.name, message: warning.message, code: warning.code, stack: warning.stack },
      'Process warning'
    );
  });
};

export { gracefulShutdown, installProcessHandlers };
export default installProcessHandlers;
