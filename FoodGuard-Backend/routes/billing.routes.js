const router = require('express').Router();
const c = require('../controllers/billing.controller');
const { protect } = require('../middleware/auth');

// NOTE: POST /webhook is mounted directly in app.js (it needs the raw body,
// before express.json()), so it is intentionally not declared here.
router.post('/checkout', protect, c.createCheckoutSession);
router.post('/confirm', protect, c.confirmCheckout);

module.exports = router;
