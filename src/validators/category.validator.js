const { body, param } = require('express-validator');

const createCategoryValidator = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name 1-100 characters'),
  body('description').optional().trim().isLength({ max: 500 })
];

const updateCategoryValidator = [
  param('id').isInt({ min: 1 }),
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name 1-100 characters'),
  body('description').optional().trim().isLength({ max: 500 })
];

module.exports = { createCategoryValidator, updateCategoryValidator };