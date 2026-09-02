import { config } from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoute from './routes/auth.route.js';
import specializationRoute from "./routes/specialization.route.js";
import studentRoute from './routes/student.route.js';
import coordinatorRoute from './routes/coordinator.route.js'
import chairpersonRoute from './routes/chairperson.route.js'

import requestLogger from './lib/requestLogger.js';
import securityHeaders from './lib/security.js';
import logger from './lib/logger.js';
import { errorHandler, notFoundHandler } from './lib/errorHandler.js';

if (process.env.NODE_ENV !== 'production') {
  config({
    path: '.env',
  })
}

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(requestLogger);

app.use(securityHeaders);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5174',
      'http://localhost:5175',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175',
      'http://10.12.9.222:5174',
      'http://10.12.9.222:5175',
      'http://192.168.56.1:5174',
      'http://192.168.56.1:5175',
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    const localhostMatch = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
    const privateLanMatch = /^http:\/\/(10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/i;
    if (localhostMatch.test(origin) || privateLanMatch.test(origin)) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use((err, req, res, next) => {
  if (err && err.message === 'Not allowed by CORS') {
    logger.warn({ origin: req.headers.origin, ip: req.ip }, 'CORS blocked');
    return res.status(403).json({ success: false, error: 'CORS_BLOCKED', message: 'Origin not allowed.' });
  }
  next(err);
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    pid: process.pid,
  });
});

app.use('/auth', authRoute)
app.use('/admin', specializationRoute);
app.use('/admin', studentRoute)
app.use('/admin', coordinatorRoute)
app.use('/chairperson', chairpersonRoute)

app.get("/", (req, res) => {
    res.send("GBU-SDSM server is working normally!");
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
