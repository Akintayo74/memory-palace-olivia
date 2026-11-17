// Sync endpoint for the Memory Palace Trainer.
//
// The static files in ./public are served by Cloudflare before this code runs.
// This Worker only handles /api/state: one JSON document per sync code, kept in KV.
//
//   GET /api/state   -> the stored document, or 404 if none
//   PUT /api/state   -> replace the stored document
//
// The sync code travels in the Authorization header: "Bearer <code>".
// There are no accounts. The code is the only key, so it is long and random.

const CODE = /^[a-hjkmnp-z2-9]{20}$/; // 20 characters, no look-alikes (i, l, o, 0, 1)
const MAX_BYTES = 200 * 1024;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/state') return new Response('Not found', { status: 404 });

    const header = request.headers.get('Authorization') || '';
    const code = header.replace(/^Bearer\s+/i, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!CODE.test(code)) return json({ error: 'bad_code' }, 401);

    // Optional lock: set the SYNC_CODES secret to a comma-separated list of codes
    // and every other code is refused. See the README.
    if (env.SYNC_CODES) {
      const allowed = env.SYNC_CODES.toLowerCase().replace(/[^a-z0-9,]/g, '').split(',');
      if (!allowed.includes(code)) return json({ error: 'not_allowed' }, 403);
    }

    const key = 'state:' + code;

    if (request.method === 'GET') {
      const stored = await env.STATE.get(key);
      if (stored === null) return json({ error: 'not_found' }, 404);
      return new Response(stored, {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    if (request.method === 'PUT') {
      if (Number(request.headers.get('Content-Length') || 0) > MAX_BYTES) return json({ error: 'too_large' }, 413);
      const text = await request.text();
      if (text.length > MAX_BYTES) return json({ error: 'too_large' }, 413);

      let doc;
      try { doc = JSON.parse(text); } catch { return json({ error: 'bad_json' }, 400); }
      const ok = doc && typeof doc === 'object' && !Array.isArray(doc) && doc.v === 1 && Array.isArray(doc.sessions);
      if (!ok) return json({ error: 'bad_shape' }, 400);

      await env.STATE.put(key, text);
      return json({ ok: true });
    }

    return json({ error: 'method_not_allowed' }, 405);
  },
};
