const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const c = require('../controllers/asset.controller');
const v = require('../validators/asset.validator');

router.use(requireAuth);

// Semua user terautentikasi boleh melihat
router.get('/', v.listAssetValidator, c.list);
router.get('/:id', c.getById);

// Hanya ADMIN dan SUPPORT_ENGINEER yang boleh mengubah data
router.use(requireRole('ADMIN', 'SUPPORT_ENGINEER'));

router.post('/', v.createAssetValidator, c.create);
router.patch('/:id', v.updateAssetValidator, c.update);
router.delete('/:id', c.remove);

module.exports = router;