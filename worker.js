/**
 * Cloudflare Worker — WA Kunjungan Template API
 * Menggunakan 2 D1 database:
 *   - DB_AEON    (binding name: DB_AEON)
 *   - DB_WATSONS (binding name: DB_WATSONS)
 *
 * Endpoints:
 *   GET  /api/template?store=AEON|WATSONS        → { key, text }
 *   POST /api/template                            → body: { store, key, text }  → { ok: true }
 *   OPTIONS /*                                    → CORS preflight
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function getDB(env, store) {
  if (store === 'AEON') return env.DB_AEON;
  if (store === 'WATSONS') return env.DB_WATSONS;
  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    // GET /api/template?store=AEON
    if (request.method === 'GET' && url.pathname === '/api/template') {
      const store = (url.searchParams.get('store') || '').toUpperCase();
      const db = getDB(env, store);
      if (!db) return json({ error: 'store tidak valid' }, 400);

      const key = store === 'AEON' ? 'aeon_kunjungan' : 'watsons_kunjungan';
      const row = await db
        .prepare('SELECT text FROM wa_templates WHERE key = ?')
        .bind(key)
        .first();

      return json({ key, text: row ? row.text : null });
    }

    // POST /api/template  body: { store, key, text }
    if (request.method === 'POST' && url.pathname === '/api/template') {
      let body;
      try { body = await request.json(); } catch { return json({ error: 'body JSON tidak valid' }, 400); }

      const store = (body.store || '').toUpperCase();
      const db = getDB(env, store);
      if (!db) return json({ error: 'store tidak valid' }, 400);

      const key = store === 'AEON' ? 'aeon_kunjungan' : 'watsons_kunjungan';
      const text = typeof body.text === 'string' ? body.text : '';

      await db
        .prepare(
          'INSERT INTO wa_templates (key, text) VALUES (?, ?) ' +
          'ON CONFLICT(key) DO UPDATE SET text = excluded.text, updated_at = CURRENT_TIMESTAMP'
        )
        .bind(key, text)
        .run();

      return json({ ok: true });
    }

    return json({ error: 'not found' }, 404);
  },
};
