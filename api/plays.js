import { getDb, sendJson, fail, parseBody, cleanUrl, urlKey, nowIso, ensureSiteStats } from './_db.js';

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
        'Cache-Control': 'public, max-age=60, s-maxage=180, stale-while-revalidate=300'
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

      await ensureSiteStats(db);

      // Tối ưu #1: Tìm game trực tiếp theo URL (Index Seek 1 row) thay vì đọc toàn bộ bảng games
      const u1 = rawUrl;
      const u2 = rawUrl.replace(/\/+$/, '');
      const u3 = u2 + '/';
      let gameRs = await db.execute({
        sql: 'SELECT name, url FROM games WHERE (url = ? OR url = ? OR url = ?) AND hidden = 0 LIMIT 1',
        args: [u1, u2, u3]
      });

      let game = gameRs.rows[0];
      if (!game) {
        // Fallback nhẹ nếu URL có query parameters khác: chỉ lọc các game có URL tương ứng
        const fallbackRs = await db.execute('SELECT name, url FROM games WHERE hidden = 0');
        game = fallbackRs.rows.find(r => urlKey(String(r.url)) === key);
      }
      if (!game) return fail(res, 404, 'not_found', 'Không có game này.');

      const gameName = String(game.name);
      const url = String(game.url);
      const now = nowIso();

      // Tối ưu #2: Thêm RETURNING play_count để lấy luôn kết quả trong 1 câu SQL duy nhất (0 thêm lượt đọc)
      const insRs = await db.execute({
        sql: `INSERT INTO plays (game_url, game_name, play_count, updated_at) VALUES (?, ?, 1, ?)
              ON CONFLICT(game_url) DO UPDATE SET play_count = play_count + 1, game_name = excluded.game_name, updated_at = excluded.updated_at
              RETURNING play_count`,
        args: [url, gameName, now]
      });

      let count = 1;
      if (insRs.rows && insRs.rows.length) {
        count = Number(insRs.rows[0].play_count || 1);
      } else {
        const row = await db.execute({ sql: 'SELECT play_count FROM plays WHERE game_url = ?', args: [url] });
        count = row.rows.length ? Number(row.rows[0].play_count) : 1;
      }

      // Cập nhật counter tổng lượt chơi nguyên tử
      await db.execute({
        sql: "UPDATE site_stats SET v = v + 1 WHERE k = 'total_plays'",
        args: []
      }).catch(() => {});

      return sendJson(res, 200, { url, play_count: count }, { 'Cache-Control': 'no-store' });
    } catch (err) {
      return fail(res, 500, 'server_error', err.message);
    }
  }

  return fail(res, 405, 'method_not_allowed', 'Phương thức không được hỗ trợ');
}
