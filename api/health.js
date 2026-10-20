import { getDb, sendJson, fail } from './_db.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  try {
    const db = getDb();
    await db.execute('SELECT 1');
    return sendJson(res, 200, { ok: true, database: 'turso' }, { 'Cache-Control': 'no-store' });
  } catch (err) {
    return fail(res, 500, 'database_error', err.message);
  }
}
