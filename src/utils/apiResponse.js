function success(res, { statusCode = 200, message = 'OK', data = null, pagination, requestId } = {}) {
  const body = { success: true, message, data };
  if (pagination) body.pagination = pagination;
  if (requestId) body.requestId = requestId;
  return res.status(statusCode).json(body);
}

function failure(res, { statusCode = 500, message = 'Internal server error', code = 'INTERNAL_ERROR', details, requestId } = {}) {
  const body = {
    success: false,
    message,
    error: { code }
  };
  if (details) body.error.details = details;
  if (requestId) body.requestId = requestId;
  return res.status(statusCode).json(body);
}

module.exports = { success, failure };