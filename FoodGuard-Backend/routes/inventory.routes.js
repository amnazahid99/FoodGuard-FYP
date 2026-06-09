const router = require('express').Router();
const c = require('../controllers/inventory.controller');
const { protect } = require('../middleware/auth');
const { enforceItemLimit } = require('../middleware/plan');
const upload = require('../middleware/upload');

router.use(protect);
router.get('/', c.list);
router.post('/', enforceItemLimit, c.create);
router.post('/bulk', enforceItemLimit, c.bulkCreate);
router.post('/scan-receipt', upload.single('image'), c.scanReceipt); // FEATURE 1
router.get('/wastage-report', c.wastageReport);                       // FEATURE 7
router.put('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;
