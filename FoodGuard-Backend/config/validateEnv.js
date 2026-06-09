/**
 * Validate environment configuration at startup so problems surface as a clear
 * boot-time message instead of a confusing 500 on the first login / API call.
 *
 * - Required vars missing  -> log + throw (server refuses to start).
 * - Optional vars missing  -> warn only (feature degrades gracefully).
 */
const REQUIRED = ['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const OPTIONAL = ['FASTAPI_URL', 'STRIPE_SECRET_KEY', 'CLIENT_URL'];

const INSECURE_DEFAULTS = new Set([
  'change_me_access_secret',
  'change_me_refresh_secret',
]);

module.exports = function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key]);

  if (missing.length) {
    console.error(
      `\n[config] Missing required environment variable(s): ${missing.join(', ')}\n` +
      `         Copy FoodGuard-Backend/.env.example to FoodGuard-Backend/.env and fill them in.\n` +
      `         (JWT_SECRET in particular MUST be set, or sign-in returns HTTP 500.)\n`
    );
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }

  // Warn (don't fail) on weak placeholder secrets so dev still works but it's loud.
  for (const key of ['JWT_SECRET', 'JWT_REFRESH_SECRET']) {
    if (INSECURE_DEFAULTS.has(process.env[key])) {
      console.warn(`[config] ${key} is using a placeholder value — set a strong random string before deploying.`);
    }
  }

  const missingOptional = OPTIONAL.filter((key) => !process.env[key]);
  if (missingOptional.length) {
    console.warn(
      `[config] Optional env var(s) not set: ${missingOptional.join(', ')} ` +
      `(related features degrade gracefully).`
    );
  }
};
