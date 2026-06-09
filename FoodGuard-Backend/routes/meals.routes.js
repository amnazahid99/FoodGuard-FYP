const router = require('express').Router();
const c = require('../controllers/meals.controller');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);
router.get('/recommendations', c.recommend);  // FEATURE 2 (fetched on page load)
router.post('/recommend', c.recommend);        // back-compat alias
router.get('/meal-plan', c.getMealPlan);       // FEATURE 4 (latest saved plan)
router.post('/meal-plan', c.mealPlan);         // FEATURE 4 (generate)
router.get('/recipe/:id', c.recipe);
router.post('/saved/:id', c.save);
router.post('/upload', upload.single('image'), c.upload);

module.exports = router;
