function errorHandler(err, req, res, next) {
  const statusCode = Number(err.statusCode) || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const isServerError = statusCode >= 500;

  // Untuk sementara, log ke console. Diganti Winston di Phase 5.
  console.error(`[${req.id}] ${err.message}`);
  if (isServerError && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message: isServerError ? 'Internal server error' : err.message,
    error: { code },
    requestId: req.id
  });
}

module.exports = errorHandler;