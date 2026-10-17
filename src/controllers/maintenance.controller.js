const { validationResult } = require('express-validator');
const maintenanceRepo = require('../repositories/maintenance.repository');
const maintenanceService = require('../services/maintenance.service');
const { success, failure } = require('../utils/apiResponse');

function getErrors(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return errors.array().map((e) => ({ field: e.path, message: e.msg }));
  return null;
}

async function listByAsset(req, res, next) {
  try {
    const list = await maintenanceRepo.findByAssetId(req.params.assetId);
    return success(res, { message: 'Maintenance records retrieved', data: list, requestId: req.id });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  const errs = getErrors(req);
  if (errs) return failure(res, { statusCode: 422, message: 'Validation failed', code: 'VALIDATION_ERROR', details: errs, requestId: req.id });

  try {
    const id = await maintenanceService.createMaintenance({ ...req.body, performedBy: req.user.id });
    return success(res, { statusCode: 201, message: 'Maintenance recorded', data: { maintenanceId: id }, requestId: req.id });
  } catch (err) { next(err); }
}

async function complete(req, res, next) {
  try {
    const assetId = await maintenanceService.completeMaintenance(req.params.id);
    return success(res, { message: 'Maintenance completed', data: { assetId }, requestId: req.id });
  } catch (err) { next(err); }
}

module.exports = { listByAsset, create, complete };