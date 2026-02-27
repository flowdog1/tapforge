import { run } from '../_lib/db';
import { error, json } from '../_lib/respond';

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function verifyStripeSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;

  const pairs = signatureHeader.split(',');
  const ts = pairs.find((p) => p.startsWith('t='))?.slice(2);
  const v1 = pairs.find((p) => p.startsWith('v1='))?.slice(3);
  if (!ts || !v1) return false;

  const payload = `${ts}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const expected = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return timingSafeEqual(expected, v1);
}

export async function onRequestPost(context) {
  const secret = context.env?.STRIPE_WEBHOOK_SECRET;
  const rawBody = await context.request.text();
  const signature = context.request.headers.get('stripe-signature');

  const verified = await verifyStripeSignature(rawBody, signature, secret);
  if (!verified) return error('Invalid webhook signature.', 400);

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return error('Invalid webhook payload.', 400);
  }

  context.waitUntil(
    (async () => {
      try {
        // idempotency
        await run(
          context.env,
          'INSERT OR IGNORE INTO billing_events (id, stripe_event_id, type) VALUES (?, ?, ?)',
          [crypto.randomUUID(), event.id || null, event.type || 'unknown']
        );

        if (event.type === 'checkout.session.completed') {
          const session = event.data?.object || {};

          // Prefer the richer customer_details.email when present
          const email =
            session.customer_details?.email ||
            session.customer_email ||
            null;

          const stripeCustomerId = session.customer || null;

          // If we have an email, upsert by email so we can fill stripe_customer_id later
          if (email) {
            await run(
              context.env,
              `
              INSERT INTO customers (id, email, stripe_customer_id)
              VALUES (?, ?, ?)
              ON CONFLICT(email) DO UPDATE SET
                stripe_customer_id = COALESCE(customers.stripe_customer_id, excluded.stripe_customer_id)
              `,
              [crypto.randomUUID(), email, stripeCustomerId]
            );
          } else if (stripeCustomerId) {
            // Edge case: no email, but we do have customer id.
            // Since email is missing, we can't match existing rows reliably.
            // Store it anyway (email will be NULL).
            await run(
              context.env,
              'INSERT OR IGNORE INTO customers (id, email, stripe_customer_id) VALUES (?, ?, ?)',
              [crypto.randomUUID(), null, stripeCustomerId]
            );
          }
        }
      } catch (err) {
        console.error('webhook async handler failed', err);
      }
    })()
  );

  return json({ received: true });
}