const { validationResult } = require('express-validator');
const assetRepo = require('../repositories/asset.repository');
const assetService = require('../services/asset.service');
const { success, failure } = require('../utils/apiResponse');

function getErrors(req) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return null;
  return errors.array().map((e) => ({ field: e.path, message: e.msg }));
}

function toPublic(asset) {
  return {
    id: asset.id,
    assetCode: asset.asset_code,
    name: asset.name,
    categoryId: asset.category_id,
    categoryName: asset.category_name,
    brand: asset.brand,
    model: asset.model,
    serialNumber: asset.serial_number,
    location: asset.location,
    purchaseDate: asset.purchase_date,
    status: asset.status,
    notes: asset.notes,
    createdAt: asset.created_at,
    updatedAt: asset.updated_at
  };
}

async function list(req, res, next) {
  try {
    const { page = 1, limit = 10, search, categoryId, status, sortBy, sortOrder } = req.query;
    const { rows, total } = await assetRepo.findAll({ page, limit, search, categoryId, status, sortBy, sortOrder });

    return success(res, {
      message: 'Assets retrieved',
      data: rows.map(toPublic),
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit)
      },
      requestId: req.id
    });
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const asset = await assetRepo.findById(req.params.id);
    if (!asset) return failure(res, { statusCode: 404, message: 'Asset not found', code: 'ASSET_NOT_FOUND', requestId: req.id });
    return success(res, { message: 'Asset retrieved', data: toPublic(asset), requestId: req.id });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  const errs = getErrors(req);
  if (errs) return failure(res, { statusCode: 422, message: 'Validation failed', code: 'VALIDATION_ERROR', details: errs, requestId: req.id });

  try {
    const id = await assetService.createAsset(req.body);
    const newAsset = await assetRepo.findById(id);
    return success(res, { statusCode: 201, message: 'Asset created', data: toPublic(newAsset), requestId: req.id });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  const errs = getErrors(req);
  if (errs) return failure(res, { statusCode: 422, message: 'Validation failed', code: 'VALIDATION_ERROR', details: errs, requestId: req.id });

  try {
    await assetService.updateAsset(req.params.id, req.body);
    const updated = await assetRepo.findById(req.params.id);
    return success(res, { message: 'Asset updated', data: toPublic(updated), requestId: req.id });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await assetService.deleteAsset(req.params.id);
    return success(res, { message: 'Asset deleted', data: null, requestId: req.id });
  } catch (err) { next(err); }
}

module.exports = { list, getById, create, update, remove };