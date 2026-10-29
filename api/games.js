import { getDb, sendJson, fail, PUBLIC_COLS, ensureHorrorCategory } from './_db.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  if (req.method !== 'GET') {
    return fail(res, 405, 'method_not_allowed', 'Chỉ hỗ trợ phương thức GET');
  }

  try {
    const db = getDb();
    await ensureHorrorCategory(db);
    const rs = await db.execute(`SELECT ${PUBLIC_COLS.join(',')} FROM games WHERE hidden = 0 ORDER BY name COLLATE NOCASE`);
    const list = rs.rows.map(r => {
      const row = {};
      PUBLIC_COLS.forEach(col => row[col] = r[col]);
      return row;
    });
    return sendJson(res, 200, list, {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
    });
  } catch (err) {
    return fail(res, 500, 'server_error', err.message);
  }
}
