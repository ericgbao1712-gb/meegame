import { getDb, sendJson, fail, parseBody, nowIso, ensureSiteStats } from './_db.js';

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
      await ensureSiteStats(db);
      // Đọc trực tiếp từ bảng site_stats: Chỉ đọc đúng 1 row duy nhất thay vì quét 50.000+ rows!
      const rs = await db.execute({ sql: "SELECT v as count FROM site_stats WHERE k = 'total_visitors'", args: [] });
      let count = rs.rows.length ? Number(rs.rows[0].count) : 0;
      if (!rs.rows.length) {
        const fall = await db.execute('SELECT count(*) as count FROM visitors');
        count = Number(fall.rows[0]?.count || 0);
        await db.execute({ sql: "INSERT OR REPLACE INTO site_stats (k, v) VALUES ('total_visitors', ?)", args: [count] });
      }
      return sendJson(res, 200, { count }, {
        'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=300'
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
      await ensureSiteStats(db);
      const now = nowIso();

      // Thử insert mới: nếu visitor_id chưa có thì tăng counter 1 lần
      const ins = await db.execute({
        sql: `INSERT OR IGNORE INTO visitors (visitor_id, first_seen, last_seen) VALUES (?, ?, ?)`,
        args: [vid, now, now]
      });

      const isNew = Number(ins.rowsAffected || 0) > 0;
      if (isNew) {
        // Khách mới: tăng biến đếm nguyên tử, không quét bảng (0 rows read)
        await db.execute({
          sql: "UPDATE site_stats SET v = v + 1 WHERE k = 'total_visitors'",
          args: []
        });
      } else {
        // Khách cũ: cập nhật thời điểm ghé gần nhất theo index
        await db.execute({
          sql: `UPDATE visitors SET last_seen = ? WHERE visitor_id = ?`,
          args: [now, vid]
        });
      }

      // Trả về số đếm hiện tại từ site_stats: chỉ đọc đúng 1 row!
      const rs = await db.execute({ sql: "SELECT v as count FROM site_stats WHERE k = 'total_visitors'", args: [] });
      const count = rs.rows.length ? Number(rs.rows[0].count) : 1;
      return sendJson(res, 200, { count }, { 'Cache-Control': 'no-store' });
    } catch (err) {
      return fail(res, 500, 'server_error', err.message);
    }
  }

  return fail(res, 405, 'method_not_allowed', 'Phương thức không được hỗ trợ');
}
