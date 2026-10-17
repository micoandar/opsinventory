const { body, param, query } = require('express-validator');

const createAssetValidator = [
  body('assetCode').trim().isLength({ min: 1, max: 50 }).withMessage('Asset code 1-50 characters'),
  body('name').trim().isLength({ min: 1, max: 150 }).withMessage('Name 1-150 characters'),
  body('categoryId').isInt({ min: 1 }).withMessage('Valid category ID required'),
  body('brand').optional().trim().isLength({ max: 100 }),
  body('model').optional().trim().isLength({ max: 100 }),
  body('serialNumber').optional().trim().isLength({ max: 150 }),
  body('location').optional().trim().isLength({ max: 150 }),
  body('purchaseDate').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Valid date required'),
  body('status').optional().isIn(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED']).withMessage('Invalid status'),
  body('notes').optional().trim()
];

const updateAssetValidator = [
  param('id').isInt({ min: 1 }),
  body('assetCode').trim().isLength({ min: 1, max: 50 }),
  body('name').trim().isLength({ min: 1, max: 150 }),
  body('categoryId').isInt({ min: 1 }),
  body('brand').optional().trim().isLength({ max: 100 }),
  body('model').optional().trim().isLength({ max: 100 }),
  body('serialNumber').optional().trim().isLength({ max: 150 }),
  body('location').optional().trim().isLength({ max: 150 }),
  body('purchaseDate').optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body('status').isIn(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED']),
  body('notes').optional().trim()
];

const listAssetValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('categoryId').optional().isInt({ min: 1 }).toInt(),
  query('status').optional().isIn(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED']),
  query('sortBy').optional().isIn(['created_at', 'name', 'asset_code', 'purchase_date', 'status']),
  query('sortOrder').optional().isIn(['ASC', 'DESC', 'asc', 'desc'])
];

module.exports = { createAssetValidator, updateAssetValidator, listAssetValidator };