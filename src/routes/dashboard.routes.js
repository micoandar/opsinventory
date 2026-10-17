const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { getStats } = require('../controllers/dashboard.controller');

router.use(requireAuth);
router.get('/stats', getStats);

module.exports = router;