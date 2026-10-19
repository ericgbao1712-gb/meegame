import { getDb, sendJson, fail, parseBody, cleanUrl, urlKey, nowIso } from './_db.js';

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
      const rs = await db.execute('SELECT game_url, play_count FROM plays');
      const map = {};
      rs.rows.forEach(r => { map[String(r.game_url)] = Number(r.play_count || 0); });
      return sendJson(res, 200, map, {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120'
      });
    } catch (err) {
      return fail(res, 500, 'server_error', err.message);
    }
  }

  if (req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const rawUrl = cleanUrl(body.url);
      if (!rawUrl) return fail(res, 400, 'invalid', 'Link game chưa đúng.');
      const key = urlKey(rawUrl);

      const gamesRs = await db.execute('SELECT name, url FROM games WHERE hidden = 0');
      const game = gamesRs.rows.find(r => urlKey(String(r.url)) === key);
      if (!game) return fail(res, 404, 'not_found', 'Không có game này.');

      const gameName = String(game.name);
      const url = String(game.url);
      const now = nowIso();

      await db.execute({
        sql: `INSERT INTO plays (game_url, game_name, play_count, updated_at) VALUES (?, ?, 1, ?)
              ON CONFLICT(game_url) DO UPDATE SET play_count = play_count + 1, game_name = excluded.game_name, updated_at = excluded.updated_at`,
        args: [url, gameName, now]
      });

      const row = await db.execute({ sql: 'SELECT play_count FROM plays WHERE game_url = ?', args: [url] });
      const count = row.rows.length ? Number(row.rows[0].play_count) : 1;
      return sendJson(res, 200, { url, play_count: count }, { 'Cache-Control': 'no-store' });
    } catch (err) {
      return fail(res, 500, 'server_error', err.message);
    }
  }

  return fail(res, 405, 'method_not_allowed', 'Phương thức không được hỗ trợ');
}
