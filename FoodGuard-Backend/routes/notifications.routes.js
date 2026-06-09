const router = require('express').Router();
const c = require('../controllers/notifications.controller');
const { protect } = require('../middleware/auth');
router.use(protect);
router.get('/', c.list);
router.patch('/:id/read', c.markRead);
router.delete('/', c.clearAll);
module.exports = router;
