const router = require('express').Router();
const c = require('../controllers/settings.controller');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/profile', c.getProfile);
router.put('/profile', c.updateProfile);
router.put('/password', c.updatePassword);
router.get('/preferences', c.getPreferences);
router.put('/preferences', c.updatePreferences);
router.put('/notifications', c.updateNotifications);
router.get('/health-profile', c.getHealthProfile);
router.put('/health-profile', c.updateHealthProfile);
router.delete('/account', c.deleteAccount);

module.exports = router;
