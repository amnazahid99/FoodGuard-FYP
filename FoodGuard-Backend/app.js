const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const alertsRoutes = require('./routes/alerts.routes');
const mealsRoutes = require('./routes/meals.routes');
const nutritionRoutes = require('./routes/nutrition.routes');
const settingsRoutes = require('./routes/settings.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const contactRoutes = require('./routes/contact.routes');
const userRoutes = require('./routes/user.routes');
const billingRoutes = require('./routes/billing.routes');
const billingController = require('./controllers/billing.controller');

const app = express();

app.use(cors({
  origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(','),
  credentials: true,
}));

// Stripe webhook needs the RAW request body for signature verification, so it
// must be registered BEFORE express.json() (which would otherwise consume it).
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), billingController.webhook);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'foodguard-api' }));

app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/meals', mealsRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/user', userRoutes);
app.use('/api/billing', billingRoutes);

app.use((req, res) => res.status(404).json({ message: `Route ${req.originalUrl} not found` }));
app.use(errorHandler);

module.exports = app;
