const { body } = require('express-validator');

const createMaintenanceValidator = [
  body('assetId').isInt({ min: 1 }).withMessage('Valid assetId required'),
  body('description').trim().isLength({ min: 1, max: 1000 }).withMessage('Description required'),
  body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be positive number')
];

module.exports = { createMaintenanceValidator };