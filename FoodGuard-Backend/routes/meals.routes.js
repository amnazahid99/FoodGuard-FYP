const router = require('express').Router();
const c = require('../controllers/meals.controller');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);
router.get('/recommendations', c.recommend);
router.post('/recommend', c.recommend);
router.get('/meal-plan', c.getMealPlan);
router.post('/meal-plan', c.mealPlan);
router.get('/recipe/:id', c.recipe);
router.post('/saved/:id', c.save);
router.post('/upload', upload.single('image'), c.upload);
router.post('/chat-with-chef', c.chatWithChef);

module.exports = router;
