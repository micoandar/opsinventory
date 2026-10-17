const { validationResult } = require('express-validator');
const assignmentRepo = require('../repositories/assignment.repository');
const assignmentService = require('../services/assignment.service');
const { success, failure } = require('../utils/apiResponse');

function getErrors(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return errors.array().map((e) => ({ field: e.path, message: e.msg }));
  return null;
}

async function listByAsset(req, res, next) {
  try {
    const list = await assignmentRepo.findByAssetId(req.params.assetId);
    return success(res, { message: 'Assignments retrieved', data: list, requestId: req.id });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  const errs = getErrors(req);
  if (errs) return failure(res, { statusCode: 422, message: 'Validation failed', code: 'VALIDATION_ERROR', details: errs, requestId: req.id });

  try {
    const id = await assignmentService.assignAsset({ ...req.body, assignedBy: req.user.id });
    return success(res, { statusCode: 201, message: 'Asset assigned successfully', data: { assignmentId: id }, requestId: req.id });
  } catch (err) { next(err); }
}

async function returnAsset(req, res, next) {
  try {
    const assetId = await assignmentService.returnAsset(req.params.id);
    return success(res, { message: 'Asset returned successfully', data: { assetId }, requestId: req.id });
  } catch (err) { next(err); }
}

module.exports = { listByAsset, create, returnAsset };