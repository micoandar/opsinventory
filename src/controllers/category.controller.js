const { validationResult } = require('express-validator');
const categoryRepo = require('../repositories/category.repository');
const categoryService = require('../services/category.service');
const { success, failure } = require('../utils/apiResponse');

function getErrors(req) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return null;
  return errors.array().map((e) => ({ field: e.path, message: e.msg }));
}

function toPublic(cat) {
  return { id: cat.id, name: cat.name, description: cat.description, createdAt: cat.created_at };
}

async function list(req, res, next) {
  try {
    const categories = await categoryRepo.findAll();
    return success(res, { message: 'Categories retrieved', data: categories.map(toPublic), requestId: req.id });
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const cat = await categoryRepo.findById(req.params.id);
    if (!cat) return failure(res, { statusCode: 404, message: 'Category not found', code: 'CATEGORY_NOT_FOUND', requestId: req.id });
    return success(res, { message: 'Category retrieved', data: toPublic(cat), requestId: req.id });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  const errs = getErrors(req);
  if (errs) return failure(res, { statusCode: 422, message: 'Validation failed', code: 'VALIDATION_ERROR', details: errs, requestId: req.id });

  try {
    const id = await categoryService.createCategory(req.body);
    const newCat = await categoryRepo.findById(id);
    return success(res, { statusCode: 201, message: 'Category created', data: toPublic(newCat), requestId: req.id });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  const errs = getErrors(req);
  if (errs) return failure(res, { statusCode: 422, message: 'Validation failed', code: 'VALIDATION_ERROR', details: errs, requestId: req.id });

  try {
    await categoryService.updateCategory(req.params.id, req.body);
    const updated = await categoryRepo.findById(req.params.id);
    return success(res, { message: 'Category updated', data: toPublic(updated), requestId: req.id });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await categoryService.deleteCategory(req.params.id);
    return success(res, { message: 'Category deleted', data: null, requestId: req.id });
  } catch (err) { next(err); }
}

module.exports = { list, getById, create, update, remove };