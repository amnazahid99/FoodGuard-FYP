import api from './api';

/**
 * Stripe billing (one-time payments). The backend creates a hosted Checkout
 * session and returns its `url`; we redirect the browser to it. On return,
 * `confirmCheckout` activates the plan (so a webhook isn't required).
 */
export const billingService = {
  // plan: 'pro' | 'family', billing: 'monthly' | 'yearly'
  async startCheckout({ plan, billing = 'monthly' }) {
    const { data } = await api.post('/billing/checkout', { plan, billing });
    if (data?.url) window.location.href = data.url;
    return data;
  },

  // Called on the success redirect (?session_id=…) to activate the plan.
  async confirmCheckout(sessionId) {
    const { data } = await api.post('/billing/confirm', { sessionId });
    return data;
  },
};

export default billingService;
