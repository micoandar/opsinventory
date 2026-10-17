const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { list } = require('../controllers/log.controller');

router.use(requireAuth);
router.use(requireRole('ADMIN')); // Logs hanya untuk Admin

router.get('/', list);

module.exports = router;