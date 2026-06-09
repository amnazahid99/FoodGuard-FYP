const router = require('express').Router();
const c = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/bmi', c.saveBmi);  // FEATURE 6
router.get('/bmi', c.getBmi);

module.exports = router;
