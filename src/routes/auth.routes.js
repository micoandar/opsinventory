const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { login, logout, me } = require('../controllers/auth.controller');
const { loginValidator } = require('../validators/auth.validator');
const { requireAuth } = require('../middleware/auth');
const { failure } = require('../utils/apiResponse');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) =>
    failure(res, {
      statusCode: 429,
      message: 'Too many login attempts. Try again later.',
      code: 'LOGIN_RATE_LIMITED',
      requestId: req.id
    })
});

router.post('/login', loginLimiter, loginValidator, login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

module.exports = router;