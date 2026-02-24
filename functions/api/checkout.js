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

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const sku = body?.sku;
    const quantity = Number(body?.quantity || 1);

    if (!SKU_PRICE_ENV[sku]) {
      return error('Invalid sku.');
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return error('quantity must be an integer between 1 and 100.');
    }

    const priceId = context.env?.[SKU_PRICE_ENV[sku]];
    if (!priceId) {
      return error(`Missing ${SKU_PRICE_ENV[sku]} environment variable.`, 500);
    }

    const origin = new URL(context.request.url).origin;
    const stripe = createStripeClient(context.env);
    const session = await stripe.request('/checkout/sessions', {
      mode: 'payment',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': quantity,
      success_url: `${origin}/buy.html?checkout=success`,
      cancel_url: `${origin}/buy.html?checkout=cancelled`,
      'metadata[sku]': sku,
    });

    return json({ url: session.url });
  } catch (err) {
    console.error('checkout error', err);
    return error('Unable to create checkout session.', 500);
  }
}
