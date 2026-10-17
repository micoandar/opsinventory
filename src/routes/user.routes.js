const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const c = require('../controllers/user.controller');
const v = require('../validators/user.validator');

// Wajib login untuk semua route di bawah ini
router.use(requireAuth);

// Rute untuk diri sendiri (boleh diakses semua role)
router.patch('/me/password', v.updatePasswordValidator, c.changeMyPassword);

// Rute khusus ADMIN (requireRole mencegat SEBELUM controller)
router.use(requireRole('ADMIN'));

router.get('/', v.listUserValidator, c.list);
router.get('/:id', c.getById);
router.post('/', v.createUserValidator, c.create);
router.patch('/:id', v.updateUserValidator, c.update);
router.patch('/:id/status', v.updateStatusValidator, c.changeStatus);
router.patch('/:id/password', v.updatePasswordValidator, c.changePasswordAdmin);

module.exports = router;