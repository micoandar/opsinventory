const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const c = require('../controllers/incident.controller');

router.use(requireAuth);
router.get('/', c.list);
router.get('/:id', c.getById);
router.post('/:id/updates', c.addNote);

// Hanya Admin & Support yang bisa buat/ubah insiden
router.use(requireRole('ADMIN', 'SUPPORT_ENGINEER'));
router.post('/', c.create);
router.patch('/:id', c.update);

module.exports = router;