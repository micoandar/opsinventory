const { validationResult } = require('express-validator');
const authService = require('../services/auth.service');
const userRepo = require('../repositories/user.repository');
const { success, failure } = require('../utils/apiResponse');

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
  });
}

function destroySession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => (err ? reject(err) : resolve()));
  });
}

async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return failure(res, {
        statusCode: 422,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
        requestId: req.id
      });
    }

    const { usernameOrEmail, password } = req.body;
    const result = await authService.authenticate({ identifier: usernameOrEmail, password });

    if (!result.ok) {
      return failure(res, {
        statusCode: 401,
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        requestId: req.id
      });
    }

    await regenerateSession(req);
    req.session.userId = result.user.id;
    req.session.role = result.user.role;

    await userRepo.updateLastLogin(result.user.id);

    return success(res, {
      message: 'Login successful',
      data: { user: authService.toPublicUser(result.user) },
      requestId: req.id
    });
  } catch (err) {
    return next(err);
  }
}

async function logout(req, res, next) {
  try {
    if (req.session && req.session.userId) {
      await destroySession(req);
    }
    res.clearCookie(process.env.SESSION_NAME || 'opsinv.sid');
    return success(res, {
      message: 'Logged out',
      data: null,
      requestId: req.id
    });
  } catch (err) {
    return next(err);
  }
}

async function me(req, res) {
  return success(res, {
    message: 'OK',
    data: { user: authService.toPublicUser(req.user) },
    requestId: req.id
  });
}

module.exports = { login, logout, me };