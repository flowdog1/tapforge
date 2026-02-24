# Billing Backend Foundations (Pass 1)

This repository now includes backend scaffolding for Cloudflare Pages Functions and D1.

## Required environment variables

Set these variables in your Cloudflare Pages project:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_BOOKING`
- `STRIPE_METER_EVENT_NAME`

## Required D1 binding

Bind your D1 database to Pages Functions with the binding name:

- `DB`

## One-booking-per-day rule

The `bookings` table has a composite unique constraint on `(card_id, booking_date)`.

Conceptually, this means:

- A single card can only have one booking record for the same date.
- Attempting to insert another booking with the same `card_id` and `booking_date` will fail at the database level.
- This guarantees the rule even if multiple requests race each other.

`booking_date` should be stored as `YYYY-MM-DD`, using a card timezone when available, otherwise UTC.
