/**
 * Shared JSON response helpers for Cloudflare Pages Functions.
 */

export function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json; charset=utf-8');
  }

  return new Response(JSON.stringify(data), {
    ...init,
    headers,
  });
}

export function error(message, status = 400, extra = {}) {
  return json({ error: message, ...extra }, { status });
}

export function notImplemented(feature = 'Endpoint') {
  return error(`${feature} is not implemented yet.`, 501);
}
