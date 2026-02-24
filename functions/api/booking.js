import { first, run } from '../_lib/db';
import { error, json } from '../_lib/respond';
import { createStripeClient } from '../_lib/stripe';
import { getBookingDate } from '../_lib/time';

const BOOKING_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const cardId = body?.card_id;
    const bookingDate = body?.booking_date || getBookingDate();

    if (!cardId) {
      return error('card_id is required.');
    }

    if (!BOOKING_DATE_RE.test(bookingDate)) {
      return error('booking_date must be YYYY-MM-DD.');
    }

    const card = await first(context.env, 'SELECT id FROM cards WHERE id = ? LIMIT 1', [cardId]);
    if (!card) {
      return error('Unknown card_id.', 404);
    }

    let insertResult;
    try {
      insertResult = await run(
        context.env,
        'INSERT INTO bookings (id, card_id, booking_date) VALUES (?, ?, ?)',
        [crypto.randomUUID(), cardId, bookingDate]
      );
    } catch (insertErr) {
      const message = String(insertErr?.message || insertErr);
      if (message.includes('UNIQUE constraint failed: bookings.card_id, bookings.booking_date')) {
        return error('Booking already exists for this card and date.', 409);
      }
      throw insertErr;
    }

    if (!insertResult?.success) {
      return error('Could not create booking.', 500);
    }

    const meterEventName = context.env?.STRIPE_METER_EVENT_NAME;
    const priceId = context.env?.STRIPE_PRICE_ID_BOOKING;
    if (!meterEventName || !priceId) {
      return error('Missing metered billing configuration.', 500);
    }

    const stripe = createStripeClient(context.env);
    await stripe.request('/billing/meter_events', {
      event_name: meterEventName,
      identifier: crypto.randomUUID(),
      'payload[value]': 1,
      'payload[card_id]': cardId,
      'payload[booking_date]': bookingDate,
      'payload[price_id]': priceId,
    });

    return json({ ok: true });
  } catch (err) {
    console.error('booking error', err);
    return error('Unable to register booking.', 500);
  }
}
