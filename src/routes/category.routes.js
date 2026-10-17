const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const c = require('../controllers/category.controller');
const v = require('../validators/category.validator');

router.use(requireAuth);

// Semua user terautentikasi boleh melihat
router.get('/', c.list);
router.get('/:id', c.getById);

// Hanya ADMIN dan SUPPORT_ENGINEER yang boleh mengubah data
router.use(requireRole('ADMIN', 'SUPPORT_ENGINEER'));

router.post('/', v.createCategoryValidator, c.create);
router.patch('/:id', v.updateCategoryValidator, c.update);
router.delete('/:id', c.remove);

module.exports = router;