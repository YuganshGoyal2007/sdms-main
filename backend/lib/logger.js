import { pino } from 'pino';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_DIR = path.resolve(__dirname, '..', 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const OUTPUT_LOG = path.join(LOG_DIR, 'output.log');
const ERROR_LOG = path.join(LOG_DIR, 'error.log');

const isProd = process.env.NODE_ENV === 'production';

const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body.password',
  'req.body.otp',
  'req.body.token',
  'req.body.accessToken',
  'req.body.refreshToken',
  'req.body.nationalId',
  'req.body.aadhaar',
  'req.body.aadhar',
  'req.body.mobile',
  'req.body.dob',
  'req.body.photo',
  'req.body.photoData',
  'res.headers["set-cookie"]',
  '*.password',
  '*.token',
  '*.accessToken',
  '*.refreshToken',
  '*.nationalId',
  '*.aadhaar',
  '*.mobile',
  '*.dob',
  '*.photo',
  '*.photoData',
  '*.otp',
];

const baseOptions = {
  level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  redact: { paths: REDACT_PATHS, censor: '[REDACTED]', remove: false },
  base: {
    pid: process.pid,
    service: 'gbu-sdsm-backend',
    env: process.env.NODE_ENV || 'development',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
};

let logger;

if (isProd) {
  logger = pino(baseOptions, pino.multistream([
    { level: 'info', stream: pino.destination({ dest: OUTPUT_LOG, sync: false, mkdir: true, append: true }) },
    { level: 'error', stream: pino.destination({ dest: ERROR_LOG, sync: false, mkdir: true, append: true }) },
  ]));
} else {
  logger = pino(baseOptions, pino.transport({
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname,service,env',
      singleLine: false,
      hideObject: false,
    },
  }));
}

logger.info({
  logDir: LOG_DIR,
  outputLog: OUTPUT_LOG,
  errorLog: ERROR_LOG,
  level: baseOptions.level,
  pretty: !isProd,
}, 'Logger initialized');

export { logger, LOG_DIR, OUTPUT_LOG, ERROR_LOG };
export default logger;
