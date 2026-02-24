/**
 * Computes a booking date string (YYYY-MM-DD).
 * Uses UTC when no date input is provided.
 */

export function getBookingDate(dateInput = new Date()) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date input.');
  }

  return date.toISOString().slice(0, 10);
}
