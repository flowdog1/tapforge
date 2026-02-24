# Billing Backend (Cloudflare Pages Functions + D1)

This project now includes backend routes in `/functions/api` for checkout, webhook processing, and booking usage metering.

## Environment variables

Set these in Cloudflare Pages project settings:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_BOOKING`
- `STRIPE_METER_EVENT_NAME`
- `STRIPE_PRICE_ID_CARD_25`
- `STRIPE_PRICE_ID_CARD_50`
- `STRIPE_PRICE_ID_CARD_150`
- `STRIPE_PRICE_ID_CARD_200`
- `STRIPE_PRICE_ID_CARD_500`
- `STRIPE_PRICE_ID_STAND`

## D1 binding

Bind your D1 database as:

- `DB`

Functions read it from `context.env.DB`.

## One booking per card per day

The `bookings` table includes this constraint:

- `UNIQUE(card_id, booking_date)`

That means only one row can exist for the same card on the same day. If a second insert is attempted, the DB rejects it and the API returns `409 Conflict`.

## Routes

- `POST /api/checkout` → creates Stripe Checkout session for a SKU.
- `POST /api/webhook` → verifies Stripe signature and records event idempotently.
- `POST /api/booking` → inserts one booking per card/day and emits a Stripe meter event.
