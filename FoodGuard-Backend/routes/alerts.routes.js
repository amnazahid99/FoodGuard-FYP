const router = require('express').Router();
const c = require('../controllers/alerts.controller');
const { protect } = require('../middleware/auth');
router.use(protect);
router.get('/', c.list);
router.patch('/:id/dismiss', c.dismiss);
module.exports = router;
