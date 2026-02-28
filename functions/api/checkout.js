import { createStripeClient } from '../_lib/stripe';
import { error, json } from '../_lib/respond';

const SKU_PRICE_ENV = {
  card_25: 'STRIPE_PRICE_ID_CARD_25',
  card_50: 'STRIPE_PRICE_ID_CARD_50',
  card_150: 'STRIPE_PRICE_ID_CARD_150',
  card_200: 'STRIPE_PRICE_ID_CARD_200',
  card_500: 'STRIPE_PRICE_ID_CARD_500',
  stand: 'STRIPE_PRICE_ID_STAND',
};

// CORS helper (only for /api/checkout)
function corsHeaders(requestOrigin, allowedOrigin) {
  if (!allowedOrigin) return {};

  if (requestOrigin && requestOrigin === allowedOrigin) {
    return {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Vary': 'Origin',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
  }

  return {};
}

function withCors(response, requestOrigin, allowedOrigin) {
  const headers = corsHeaders(requestOrigin, allowedOrigin);
  if (!headers || Object.keys(headers).length === 0) return response;

  const newHeaders = new Headers(response.headers);
  for (const [k, v] of Object.entries(headers)) newHeaders.set(k, v);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

export async function onRequestOptions(context) {
  const requestOrigin = context.request.headers.get('Origin');
  const allowedOrigin = context.env.ALLOWED_ORIGIN;

  const headers = corsHeaders(requestOrigin, allowedOrigin);

  // If you configured an allowed origin and it's not matching, reject preflight.
  if (allowedOrigin && requestOrigin && requestOrigin !== allowedOrigin) {
    return new Response('Forbidden', { status: 403 });
  }

  return new Response(null, { status: 204, headers });
}

export async function onRequestPost(context) {
  const requestOrigin = context.request.headers.get('Origin');
  const allowedOrigin = context.env.ALLOWED_ORIGIN;

  try {
    // Enforce origin only when Origin is present (more forgiving)
    if (allowedOrigin && requestOrigin && requestOrigin !== allowedOrigin) {
      return error('Invalid origin.', 403);
    }

    const body = await context.request.json();
    const sku = body?.sku;
    const quantity = Number(body?.quantity || 1);

    if (!SKU_PRICE_ENV[sku]) {
      const resp = error('Invalid sku.');
      return withCors(resp, requestOrigin, allowedOrigin);
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      const resp = error('quantity must be an integer between 1 and 100.');
      return withCors(resp, requestOrigin, allowedOrigin);
    }

    const priceId = context.env?.[SKU_PRICE_ENV[sku]];
    if (!priceId) {
      const resp = error(`Missing ${SKU_PRICE_ENV[sku]} environment variable.`, 500);
      return withCors(resp, requestOrigin, allowedOrigin);
    }

    const stripe = createStripeClient(context.env);

    // Use canonical site URL for redirects (avoids preview hostname issues)
    const siteOrigin = context.env.SITE_ORIGIN || 'https://tapforgenfc.com';

    const session = await stripe.request('/checkout/sessions', {
      mode: 'payment',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': quantity,

      success_url: `${siteOrigin}/buy.html?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteOrigin}/buy.html?checkout=cancelled`,

      // ✅ ensures session.customer becomes cus_...
      customer_creation: 'always',

      // Session-level metadata (fine since you sell 1 SKU per checkout today)
      'metadata[sku]': sku,
      'metadata[quantity]': String(quantity),
    });

    const resp = json({ url: session.url });
    return withCors(resp, requestOrigin, allowedOrigin);
  } catch (err) {
    // Server-side logs (don’t expose details to client)
    console.error('checkout error', {
      message: err?.message,
      status: err?.status,
      type: err?.type,
      body: err?.body,
      raw: err,
    });

    const resp = error('Unable to create checkout session.', 500);
    return withCors(resp, requestOrigin, allowedOrigin);
  }
}