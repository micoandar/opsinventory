const userRepo = require('../repositories/user.repository');
const { failure } = require('../utils/apiResponse');

async function requireAuth(req, res, next) {
  try {
    if (!req.session || !req.session.userId) {
      return failure(res, {
        statusCode: 401,
        message: 'Authentication required',
        code: 'UNAUTHENTICATED',
        requestId: req.id
      });
    }

    const user = await userRepo.findById(req.session.userId);
    if (!user || !user.is_active) {
      // Sesi yatim / user dinonaktifkan → bersihkan sesi
      req.session.destroy(() => {});
      return failure(res, {
        statusCode: 401,
        message: 'Authentication required',
        code: 'UNAUTHENTICATED',
        requestId: req.id
      });
    }

    req.user = user;
    req.session.role = user.role; // refresh role di sesi
    return next();
  } catch (err) {
    return next(err);
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return failure(res, {
        statusCode: 401,
        message: 'Authentication required',
        code: 'UNAUTHENTICATED',
        requestId: req.id
      });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return failure(res, {
        statusCode: 403,
        message: 'Insufficient permissions',
        code: 'FORBIDDEN',
        requestId: req.id
      });
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };