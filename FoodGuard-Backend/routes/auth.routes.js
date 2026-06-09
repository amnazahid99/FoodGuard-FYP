const router = require('express').Router();
const c = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

router.post('/signup', c.signup);
router.post('/login', c.login);
router.post('/logout', c.logout);
router.post('/refresh', c.refresh);
router.get('/profile', protect, c.profile);
router.post('/forgot-password', c.forgotPassword);
router.post('/reset-password', c.resetPassword);

module.exports = router;
