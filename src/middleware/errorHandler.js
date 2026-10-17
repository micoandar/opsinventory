function errorHandler(err, req, res, next) {
  // Tangkap error spesifik dari express.json() (SyntaxError)
  let statusCode = Number(err.statusCode || err.status) || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'Internal server error';

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Malformed JSON payload';
  }

  const isServerError = statusCode >= 500;

  console.error(`[${req.id}] ${statusCode} ${code}: ${message}`);
  if (isServerError && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message: isServerError ? 'Internal server error' : message,
    error: { code },
    requestId: req.id
  });
}

module.exports = errorHandler;