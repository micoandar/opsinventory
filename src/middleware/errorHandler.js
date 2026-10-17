const logger = require('../config/logger');
const { logToDb } = require('../utils/dbLogger');

function errorHandler(err, req, res, next) {
  let statusCode = Number(err.statusCode || err.status) || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'Internal server error';

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Malformed JSON payload';
  }

  const isServerError = statusCode >= 500;

  // 1. Catat ke Winston (File Log)
  logger.error(`${statusCode} ${code}: ${message}`, { requestId: req.id, stack: err.stack });

  // 2. Jika error 500 (Server Error), simpan ke Database
  if (isServerError) {
    logToDb({
      level: 'ERROR',
      message: message,
      context: { code, originalUrl: req.originalUrl },
      requestId: req.id,
      method: req.method,
      endpoint: req.originalUrl,
      statusCode: statusCode,
      userId: req.user ? req.user.id : null
    });
  }

  res.status(statusCode).json({
    success: false,
    message: isServerError ? 'Internal server error' : message,
    error: { code },
    requestId: req.id
  });
}

module.exports = errorHandler;