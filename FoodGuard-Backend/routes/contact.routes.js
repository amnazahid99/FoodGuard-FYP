const router = require('express').Router();
const { submit } = require('../controllers/contact.controller');
router.post('/', submit);
module.exports = router;
