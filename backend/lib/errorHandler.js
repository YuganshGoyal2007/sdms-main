import multer from 'multer';
import { ValidationError, UniqueConstraintError, ForeignKeyConstraintError, DatabaseError } from 'sequelize';
import logger from './logger.js';

const isProd = process.env.NODE_ENV === 'production';

const classifyError = (err) => {
  if (err instanceof multer.MulterError) {
    const map = {
      LIMIT_FILE_SIZE: { status: 413, code: 'FILE_TOO_LARGE', message: 'Uploaded file exceeds the maximum allowed size.' },
      LIMIT_FILE_COUNT: { status: 400, code: 'TOO_MANY_FILES', message: 'Too many files uploaded.' },
      LIMIT_FIELD_KEY: { status: 400, code: 'INVALID_FIELD_NAME', message: 'Invalid field name.' },
      LIMIT_FIELD_VALUE: { status: 400, code: 'INVALID_FIELD_VALUE', message: 'Invalid field value.' },
      LIMIT_FIELD_COUNT: { status: 400, code: 'TOO_MANY_FIELDS', message: 'Too many fields.' },
      LIMIT_UNEXPECTED_FILE: { status: 400, code: 'UNEXPECTED_FILE', message: 'Unexpected file field. Use the correct field name.' },
    };
    return map[err.code] || { status: 400, code: `MULTER_${err.code || 'ERROR'}`, message: err.message };
  }

  if (err instanceof UniqueConstraintError) {
    return { status: 409, code: 'DUPLICATE_ENTRY', message: 'A record with these values already exists.' };
  }

  if (err instanceof ForeignKeyConstraintError) {
    return { status: 400, code: 'INVALID_REFERENCE', message: 'Referenced record does not exist.' };
  }

  if (err instanceof ValidationError) {
    return { status: 400, code: 'VALIDATION_ERROR', message: err.errors?.map((e) => e.message).join('; ') || 'Validation failed.' };
  }

  if (err instanceof DatabaseError) {
    return { status: 500, code: 'DATABASE_ERROR', message: 'Database operation failed.' };
  }

  if (err && err.type === 'entity.too.large') {
    return { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'Request body exceeds the maximum allowed size.' };
  }

  if (err instanceof SyntaxError && 'body' in (err || {})) {
    return { status: 400, code: 'INVALID_JSON', message: 'Request body is not valid JSON.' };
  }

  if (err && err.name === 'TokenExpiredError') {
    return { status: 401, code: 'TOKEN_EXPIRED', message: 'Authentication token has expired.' };
  }
  if (err && err.name === 'JsonWebTokenError') {
    return { status: 401, code: 'INVALID_TOKEN', message: 'Authentication token is invalid.' };
  }

  if (err && err.statusCode && Number.isInteger(err.statusCode) && err.statusCode >= 400 && err.statusCode < 600) {
    return { status: err.statusCode, code: err.code || 'CLIENT_ERROR', message: err.message || 'Request failed.' };
  }

  return { status: 500, code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' };
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
};

const shortenStack = (stack, maxLines = 8) => {
  if (!stack) return undefined;
  const lines = stack.split('\n');
  const trimmed = lines.slice(0, maxLines).join('\n');
  return trimmed;
};

const errorHandler = (err, req, res, _next) => {
  const { status, code, message } = classifyError(err);
  const requestId = req.id || req.headers['x-request-id'];
  const isServerError = status >= 500;
  const logMeta = {
    requestId,
    err: {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: isServerError ? shortenStack(err.stack) : undefined,
    },
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    user: req.user ? `${req.user.id}/${req.user.role}` : 'anon',
    status,
    code,
  };

  if (isServerError) {
    logger.error(logMeta, `Unhandled error: ${message}`);
  } else {
    logger.warn({ ...logMeta, err: { name: err.name, message: err.message, code: err.code } }, `Request failed: ${message}`);
  }

  const body = {
    success: false,
    error: code,
    message,
  };
  if (requestId) body.requestId = requestId;

  if (!isProd && isServerError) {
    body.debug = { stack: err.stack };
  }

  res.status(status).json(body);
};

export { errorHandler, notFoundHandler, classifyError };
export default errorHandler;
