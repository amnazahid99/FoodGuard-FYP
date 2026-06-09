const router = require('express').Router();
const { overview } = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth');
router.get('/', protect, overview);
module.exports = router;
