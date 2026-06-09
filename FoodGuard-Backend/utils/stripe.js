/**
 * Lazily-constructed Stripe client.
 *
 * The app must boot even when Stripe isn't configured yet (e.g. before the
 * keys are added), so we don't throw at require-time. Billing endpoints call
 * getStripe() and surface a clean 503 if STRIPE_SECRET_KEY is missing.
 */
const Stripe = require('stripe');

const apiKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = apiKey ? new Stripe(apiKey) : null;

function getStripe() {
  if (!stripe) {
    const err = new Error('Stripe is not configured — set STRIPE_SECRET_KEY in FoodGuard-Backend/.env');
    err.statusCode = 503;
    throw err;
  }
  return stripe;
}

module.exports = { getStripe, isConfigured: !!stripe };
