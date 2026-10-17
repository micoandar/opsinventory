const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const c = require('../controllers/report.controller');

router.use(requireAuth);
router.use(requireRole('ADMIN', 'SUPPORT_ENGINEER')); // Hanya staf internal yang bisa unduh

router.get('/summary', c.getSummary);
router.get('/assets/csv', c.exportAssetsCSV);

module.exports = router;