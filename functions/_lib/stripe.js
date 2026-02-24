/**
 * Minimal Stripe API wrapper using fetch.
 * Reads STRIPE_SECRET_KEY from Cloudflare env bindings.
 */

const STRIPE_API_BASE = 'https://api.stripe.com/v1';

function requireSecretKey(env) {
  const key = env?.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('Missing STRIPE_SECRET_KEY');
  }
  return key;
}

function toFormBody(payload = {}) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined && value !== null) {
      body.append(key, String(value));
    }
  }
  return body;
}

export function createStripeClient(env) {
  const secretKey = requireSecretKey(env);

  async function request(path, payload = {}, options = {}) {
    const method = options.method || 'POST';
    const query = method === 'GET' && payload ? `?${toFormBody(payload).toString()}` : '';

    const response = await fetch(`${STRIPE_API_BASE}${path}${query}`, {
      method,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        ...(method !== 'GET' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
        ...(options.headers || {}),
      },
      body: method === 'GET' ? undefined : toFormBody(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || 'Stripe request failed');
    }
    return data;
  }

  return { request };
}
