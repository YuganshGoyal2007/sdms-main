import { randomUUID } from 'crypto';
import pinoHttp from 'pino-http';
import logger, { runWithRequestContext } from './logger.js';

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
  customSuccessMessage: (req, res) => {
    const time = new Date().toLocaleTimeString('en-IN', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `${time} ${req.method} ${req.originalUrl || req.url} -> ${res.statusCode}`;
  },
  customErrorMessage: (req, res, err) => {
    const time = new Date().toLocaleTimeString('en-IN', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `${time} ${req.method} ${req.originalUrl || req.url} -> ${res.statusCode} ERROR: ${err.message}`;
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.originalUrl || req.url,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
  customAttributeKeys: {
    req: 'req',
    res: 'res',
    responseTime: 'took_ms',
    reqId: 'id',
  },
  autoLogging: {
    ignore: (req) => {
      const url = req.originalUrl || req.url || '';
      return url === '/health' || url === '/favicon.ico' || url.startsWith('/static/');
    },
  },
  wrapSerializers: false,
});

const wrapped = (req, res, next) => {
  runWithRequestContext(req, res, () => requestLogger(req, res, next));
};

export default wrapped;
