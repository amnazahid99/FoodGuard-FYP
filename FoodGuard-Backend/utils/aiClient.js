const axios = require('axios');

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

const aiClient = axios.create({
  baseURL: FASTAPI_URL,
  timeout: 15000, // 15 second timeout for faster failure
  headers: { 'Content-Type': 'application/json' },
});

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// User-facing message when the AI service is unreachable or failing. We never
// surface raw stack traces or fake/mock data to the client — just a clean 503.
const AI_UNAVAILABLE_MESSAGE =
  'The AI service is temporarily unavailable. Please try again in a moment.';

/**
 * POST to the FastAPI AI service with retry + backoff and a hard timeout.
 * Returns the parsed JSON body. On failure throws an Error carrying a 503
 * `statusCode` and a friendly `message` so Express returns a clean response
 * (no stack trace, no placeholder/mock data).
 */
async function aiPost(path, body, opts = {}) {
  const maxRetries = Number(opts.retries ?? 3);
  const timeout = Number(opts.timeout ?? 15000);
  let attempt = 0;
  let lastDetail = '';

  while (attempt <= maxRetries) {
    try {
      attempt += 1;
      const { data } = await aiClient.post(path, body, { timeout });
      return data;
    } catch (err) {
      const status = err.response?.status;
      lastDetail =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        err.response?.statusText ||
        err.code ||
        err.message ||
        `Request failed for ${FASTAPI_URL}${path}`;

      const isNetworkErr = ['ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNABORTED'].includes(err.code);
      const isServerError = status >= 500;

      // Retry network errors and 5xx with linear backoff.
      if ((isNetworkErr || isServerError) && attempt <= maxRetries) {
        const backoff = 500 * attempt;
        console.warn(`[aiClient] ${path} error (${err.code || status}). Retrying ${attempt}/${maxRetries} after ${backoff}ms...`);
        await sleep(backoff);
        continue;
      }

      // Rate limit — back off harder, then retry.
      if (status === 429 && attempt <= maxRetries) {
        const backoff = 2000 * attempt;
        console.warn(`[aiClient] ${path} rate limited. Retrying ${attempt}/${maxRetries} after ${backoff}ms...`);
        await sleep(backoff);
        continue;
      }

      break; // out of retries (or non-retryable) — fall through to a clean 503
    }
  }

  console.error('[aiClient] AI service unavailable:', { path, detail: lastDetail });
  const e = new Error(AI_UNAVAILABLE_MESSAGE);
  e.statusCode = 503;
  e.detail = lastDetail;
  throw e;
}

module.exports = { aiClient, aiPost, FASTAPI_URL };
