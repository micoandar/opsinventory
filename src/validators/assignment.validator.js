const { body, param } = require('express-validator');

const createAssignmentValidator = [
  body('assetId').isInt({ min: 1 }).withMessage('Valid assetId required'),
  body('userId').isInt({ min: 1 }).withMessage('Valid userId required'),
  body('notes').optional().trim()
];

module.exports = { createAssignmentValidator };