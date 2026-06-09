require('dotenv').config();
const validateEnv = require('./config/validateEnv');

// Fail fast with a clear message if critical config is missing.
validateEnv();

const app = require('./app');
const connectDB = require('./config/db');
const { startScheduler } = require('./utils/scheduler');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
    startScheduler();
    app.listen(PORT, () => console.log(`FoodGuard API running on :${PORT}`));
  } catch (err) {
    console.error('[startup] Failed to start server:', err.message);
    process.exit(1);
  }
})();
