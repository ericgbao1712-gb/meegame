import { getDb, sendJson, fail, parseBody, nowIso } from './_db.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  const db = getDb();

  if (req.method === 'GET') {
    try {
      const rs = await db.execute('SELECT count(*) as count FROM visitors');
      return sendJson(res, 200, { count: Number(rs.rows[0].count || 0) }, {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      });
    } catch (err) {
      return fail(res, 500, 'server_error', err.message);
    }
  }

  if (req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const vid = String(body.visitor_id || '');
      if (!/^[A-Za-z0-9-]{8,80}$/.test(vid)) {
        return fail(res, 400, 'invalid', 'Mã khách không hợp lệ.');
      }
      const now = nowIso();
      await db.execute({
        sql: `INSERT INTO visitors (visitor_id, first_seen, last_seen) VALUES (?, ?, ?)
              ON CONFLICT(visitor_id) DO UPDATE SET last_seen = excluded.last_seen`,
        args: [vid, now, now]
      });
      const rs = await db.execute('SELECT count(*) as count FROM visitors');
      return sendJson(res, 200, { count: Number(rs.rows[0].count || 0) }, { 'Cache-Control': 'no-store' });
    } catch (err) {
      return fail(res, 500, 'server_error', err.message);
    }
  }

  return fail(res, 405, 'method_not_allowed', 'Phương thức không được hỗ trợ');
}
