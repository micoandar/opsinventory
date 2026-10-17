const { validationResult } = require('express-validator');
const userRepo = require('../repositories/user.repository');
const userService = require('../services/user.service');
const { success, failure } = require('../utils/apiResponse');

// Helper to extract validation errors
function getErrors(req) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return null;
  return errors.array().map((e) => ({ field: e.path, message: e.msg }));
}

async function list(req, res, next) {
  try {
    const { page = 1, limit = 10, search, role, isActive } = req.query;
    const { rows, total } = await userRepo.findAll({ page, limit, search, role, isActive });

    return success(res, {
      message: 'Users retrieved',
      data: rows.map(userService.toPublicUser),
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit)
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const user = await userRepo.findById(req.params.id);
    if (!user) {
      return failure(res, { statusCode: 404, message: 'User not found', code: 'USER_NOT_FOUND', requestId: req.id });
    }
    return success(res, { message: 'User retrieved', data: userService.toPublicUser(user), requestId: req.id });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  const errs = getErrors(req);
  if (errs) return failure(res, { statusCode: 422, message: 'Validation failed', code: 'VALIDATION_ERROR', details: errs, requestId: req.id });

  try {
    const id = await userService.createUser(req.body);
    const newUser = await userRepo.findById(id);
    return success(res, { statusCode: 201, message: 'User created', data: userService.toPublicUser(newUser), requestId: req.id });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  const errs = getErrors(req);
  if (errs) return failure(res, { statusCode: 422, message: 'Validation failed', code: 'VALIDATION_ERROR', details: errs, requestId: req.id });

  try {
    await userService.updateUser(req.params.id, req.body);
    const updated = await userRepo.findById(req.params.id);
    return success(res, { message: 'User updated', data: userService.toPublicUser(updated), requestId: req.id });
  } catch (err) {
    next(err);
  }
}

async function changeStatus(req, res, next) {
  const errs = getErrors(req);
  if (errs) return failure(res, { statusCode: 422, message: 'Validation failed', code: 'VALIDATION_ERROR', details: errs, requestId: req.id });

  try {
    await userService.setStatus(req.params.id, req.body.isActive);
    return success(res, { message: 'User status updated', data: null, requestId: req.id });
  } catch (err) {
    next(err);
  }
}

// Dua fungsi ganti password (admin ubah user lain, atau user ubah sendiri)
async function changePasswordAdmin(req, res, next) {
  const errs = getErrors(req);
  if (errs) return failure(res, { statusCode: 422, message: 'Validation failed', code: 'VALIDATION_ERROR', details: errs, requestId: req.id });

  try {
    await userService.changePassword(req.params.id, req.body.password);
    return success(res, { message: 'Password updated', data: null, requestId: req.id });
  } catch (err) {
    next(err);
  }
}

async function changeMyPassword(req, res, next) {
  const errs = getErrors(req);
  if (errs) return failure(res, { statusCode: 422, message: 'Validation failed', code: 'VALIDATION_ERROR', details: errs, requestId: req.id });

  try {
    await userService.changePassword(req.user.id, req.body.password);
    return success(res, { message: 'Password updated', data: null, requestId: req.id });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, changeStatus, changePasswordAdmin, changeMyPassword };