const { body, param, query } = require('express-validator');

const createUserValidator = [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username 3-50 characters'),
  body('email').trim().isEmail().withMessage('Valid email required').isLength({ max: 255 }),
  body('password').isLength({ min: 8, max: 100 }).withMessage('Password min 8 characters'),
  body('fullName').trim().isLength({ min: 1, max: 100 }).withMessage('Full name required'),
  body('role').isIn(['ADMIN', 'SUPPORT_ENGINEER', 'VIEWER']).withMessage('Invalid role')
];

const updateUserValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid user ID'),
  body('email').trim().isEmail().withMessage('Valid email required'),
  body('fullName').trim().isLength({ min: 1, max: 100 }).withMessage('Full name required'),
  body('role').isIn(['ADMIN', 'SUPPORT_ENGINEER', 'VIEWER']).withMessage('Invalid role')
];

const updateStatusValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid user ID'),
  body('isActive').isBoolean().withMessage('isActive must be boolean')
];

const updatePasswordValidator = [
  param('id').optional().isInt({ min: 1 }).withMessage('Invalid user ID'),
  body('password').isLength({ min: 8, max: 100 }).withMessage('Password min 8 characters')
];

const listUserValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('isActive').optional().isBoolean().toBoolean()
];

module.exports = {
  createUserValidator,
  updateUserValidator,
  updateStatusValidator,
  updatePasswordValidator,
  listUserValidator
};