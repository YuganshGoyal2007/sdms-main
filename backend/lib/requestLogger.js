import { randomUUID } from 'crypto';
import pinoHttp from 'pino-http';
import logger from './logger.js';

const requestLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const incoming = req.headers['x-request-id'];
    const id = (typeof incoming === 'string' && incoming) || randomUUID();
    res.setHeader('x-request-id', id);
    return id;
  },
  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) => `${req.method} ${req.url} -> ${res.statusCode}`,
  customErrorMessage: (req, res, err) => `${req.method} ${req.url} -> ${res.statusCode} (${err.message})`,
  customProps: (req, res) => ({
    requestId: req.id,
    userId: req.user?.id,
    userRole: req.user?.role,
    contentLength: res.getHeader('content-length'),
    userAgent: req.headers['user-agent'],
  }),
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      remoteAddress: req.remoteAddress,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
  autoLogging: {
    ignore: (req) => {
      const url = req.url || '';
      return url === '/health' || url === '/favicon.ico' || url.startsWith('/static/');
    },
  },
});

export default requestLogger;
