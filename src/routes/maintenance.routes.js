const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const c = require('../controllers/maintenance.controller');
const v = require('../validators/maintenance.validator');

router.use(requireAuth);

router.get('/asset/:assetId', c.listByAsset);

// Hanya Admin & Support yang bisa mencatat perawatan
router.use(requireRole('ADMIN', 'SUPPORT_ENGINEER'));

router.post('/', v.createMaintenanceValidator, c.create);
router.patch('/:id/complete', c.complete);

module.exports = router;