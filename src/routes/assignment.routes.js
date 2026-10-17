const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const c = require('../controllers/assignment.controller');
const v = require('../validators/assignment.validator');

router.use(requireAuth);

router.get('/asset/:assetId', c.listByAsset);

// Hanya Admin & Support yang bisa menugaskan/mengembalikan
router.use(requireRole('ADMIN', 'SUPPORT_ENGINEER'));

router.post('/', v.createAssignmentValidator, c.create);
router.patch('/:id/return', c.returnAsset);

module.exports = router;