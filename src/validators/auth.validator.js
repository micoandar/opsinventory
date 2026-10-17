const { body } = require('express-validator');

const loginValidator = [
  body('usernameOrEmail')
    .isString().withMessage('usernameOrEmail must be a string')
    .trim()
    .isLength({ min: 3, max: 255 }).withMessage('usernameOrEmail must be 3-255 characters'),
  body('password')
    .isString().withMessage('password must be a string')
    .isLength({ min: 8, max: 100 }).withMessage('password must be 8-100 characters')
];

module.exports = { loginValidator };