const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const c = require('../controllers/monitor.controller');

router.use(requireAuth);

router.get('/', c.list);
router.get('/:id/logs', c.getLogs);

// Hanya Admin/Support yang bisa menambah target monitoring
router.use(requireRole('ADMIN', 'SUPPORT_ENGINEER'));
router.post('/', c.create);

module.exports = router;