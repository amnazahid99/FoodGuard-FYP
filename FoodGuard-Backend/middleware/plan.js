/**
 * Plan-based limits: inventory item cap + weekly AI-recipe quota.
 * Paid plans (pro/family) are unlimited; only `free` is enforced.
 */
const asyncHandler = require('express-async-handler');
const Item = require('../models/InventoryItem');
const { PLAN_LIMITS } = require('../config/plans');

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function planOf(user) {
  const p = (user && user.plan) || 'free';
  if (p === 'free') return 'free';
  // Treat an elapsed paid plan as free so quotas re-apply after expiry.
  const end = user.subscription && user.subscription.currentPeriodEnd;
  if (end && new Date(end).getTime() < Date.now()) return 'free';
  return p;
}
const limitsOf = (user) => PLAN_LIMITS[planOf(user)] || PLAN_LIMITS.free;

// Reset the weekly counter if the 7-day window has elapsed. Mutates `user`
// (in memory) but does not persist — callers that consume quota call save().
function refreshWeek(user) {
  const now = Date.now();
  const start = user.aiUsage && user.aiUsage.weekStart
    ? new Date(user.aiUsage.weekStart).getTime()
    : 0;
  if (!start || now - start >= WEEK_MS) {
    user.aiUsage = { weekStart: new Date(now), recipeCount: 0 };
  }
}

/** Read-only snapshot of the user's recipe quota (no mutation persisted). */
function recipeQuota(user) {
  const limit = limitsOf(user).recipesPerWeek;
  refreshWeek(user);
  const used = (user.aiUsage && user.aiUsage.recipeCount) || 0;
  const unlimited = !isFinite(limit);
  return {
    plan: planOf(user),
    unlimited,
    limit: unlimited ? null : limit,
    used,
    remaining: unlimited ? null : Math.max(0, limit - used),
  };
}

/** Consume one recipe generation. Returns { ok, ...quota }. Persists on success. */
async function tryConsumeRecipe(user) {
  const q = recipeQuota(user);
  if (q.unlimited) return { ...q, ok: true };
  if (q.used >= q.limit) return { ...q, remaining: 0, ok: false };
  user.aiUsage.recipeCount = q.used + 1;
  await user.save();
  const used = user.aiUsage.recipeCount;
  return { plan: q.plan, unlimited: false, limit: q.limit, used, remaining: Math.max(0, q.limit - used), ok: true };
}

/**
 * Block inventory inserts that would push a free user past their item cap.
 * Works for both single create and bulk insert (counts incoming items).
 */
const enforceItemLimit = asyncHandler(async (req, res, next) => {
  const limit = limitsOf(req.user).items;
  if (!isFinite(limit)) return next();

  const incoming = Array.isArray(req.body && req.body.items)
    ? (req.body.items.filter((i) => i && i.name && i.expiry).length || req.body.items.length)
    : 1;

  const count = await Item.countDocuments({ user: req.user._id, status: { $nin: ['consumed', 'wasted'] } });
  if (count + incoming > limit) {
    res.status(403);
    throw new Error(
      `Your Free plan is limited to ${limit} inventory items (you have ${count}). Upgrade to Pro for unlimited items.`
    );
  }
  next();
});

module.exports = { enforceItemLimit, recipeQuota, tryConsumeRecipe, planOf, limitsOf };
