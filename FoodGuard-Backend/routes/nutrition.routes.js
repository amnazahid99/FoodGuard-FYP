const router = require('express').Router();
const c = require('../controllers/nutrition.controller');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/analyze', c.analyze);  // FEATURE 3
router.get('/today', c.today);       // FEATURE 3 (today's log)
router.get('/report', c.report);

module.exports = router;
