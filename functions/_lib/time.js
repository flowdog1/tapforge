/**
 * Computes a booking date string (YYYY-MM-DD).
 * If timezone is provided, that timezone is used; otherwise UTC is used.
 */

export function getBookingDate(dateInput = new Date(), timezone) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date input.');
  }

  const format = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone || 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return format.format(date);
}
