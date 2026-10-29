import crypto from 'node:crypto';
import {
  getDb, sendJson, fail, parseBody, checkPassword, tokenHash, getAdminEmail,
  cleanUrl, urlKey, nowIso, CATEGORIES, GAME_COLS, ensureHorrorCategory
} from '../_db.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    });
    return res.end();
  }

  const db = getDb();
  const parsedUrl = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const path = parsedUrl.pathname.replace(/\/+$/, '') || '/';
  const method = req.method;
  const body = await parseBody(req);

  try {
    // 1. POST /api/admin/login
    if (method === 'POST' && path === '/api/admin/login') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');

      const rs = await db.execute({ sql: 'SELECT pw_hash FROM admins WHERE email = ?', args: [email] });
      const row = rs.rows[0];
      const ok = row && checkPassword(password, String(row.pw_hash));
      if (!ok) {
        return fail(res, 401, 'bad_login', 'Sai email hoặc mật khẩu.');
      }

      const token = crypto.randomBytes(24).toString('base64url');
      const th = tokenHash(token);
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 30 * 86400;

      await db.execute({ sql: 'DELETE FROM sessions WHERE expires_at <= ?', args: [now] });
      await db.execute({
        sql: 'INSERT INTO sessions (token_hash, email, expires_at) VALUES (?, ?, ?)',
        args: [th, email, exp]
      });

      return sendJson(res, 200, { token, email }, { 'Cache-Control': 'no-store' });
    }

    // 2. POST /api/admin/logout
    if (method === 'POST' && path === '/api/admin/logout') {
      const auth = req.headers.authorization || '';
      if (auth.startsWith('Bearer ')) {
        const th = tokenHash(auth.slice(7).trim());
        await db.execute({ sql: 'DELETE FROM sessions WHERE token_hash = ?', args: [th] });
      }
      return sendJson(res, 200, { ok: true }, { 'Cache-Control': 'no-store' });
    }

    // 3. GET /api/admin/me
    if (method === 'GET' && path === '/api/admin/me') {
      const email = await getAdminEmail(db, req);
      if (!email) return fail(res, 401, 'unauthorized', 'Phiên đăng nhập đã hết. Đăng nhập lại.');
      return sendJson(res, 200, { email }, { 'Cache-Control': 'no-store' });
    }

    // 4. GET /api/admin/games
    if (method === 'GET' && path === '/api/admin/games') {
      const email = await getAdminEmail(db, req);
      if (!email) return fail(res, 401, 'unauthorized', 'Phiên đăng nhập đã hết. Đăng nhập lại.');

      await ensureHorrorCategory(db);
      const rs = await db.execute(`SELECT ${GAME_COLS.join(',')} FROM games ORDER BY added_at IS NULL, added_at DESC, name COLLATE NOCASE`);
      const games = rs.rows.map(r => {
        const row = {};
        GAME_COLS.forEach(col => row[col] = r[col]);
        row.hidden = Boolean(row.hidden);
        return row;
      });

      const playsRs = await db.execute('SELECT game_url, play_count FROM plays');
      const plays = {};
      playsRs.rows.forEach(r => { plays[String(r.game_url)] = Number(r.play_count || 0); });

      return sendJson(res, 200, { games, plays }, { 'Cache-Control': 'no-store' });
    }

    // 5. POST /api/admin/games
    if (method === 'POST' && path === '/api/admin/games') {
      const email = await getAdminEmail(db, req);
      if (!email) return fail(res, 401, 'unauthorized', 'Phiên đăng nhập đã hết. Đăng nhập lại.');

      const name = String(body.name || '').replace(/\s+/g, ' ').trim();
      if (name.length < 1 || name.length > 120) return fail(res, 400, 'invalid', 'Chưa có tên game.', 'name');

      const url = cleanUrl(body.url);
      if (!url) return fail(res, 400, 'invalid', 'Link game chưa đúng. Phải bắt đầu bằng https:// hoặc http://', 'url');

      const cat = String(body.category || '');
      if (!CATEGORIES.has(cat)) return fail(res, 400, 'invalid', 'Chưa chọn thể loại.', 'category');

      const key = urlKey(url);
      const allGames = await db.execute('SELECT id, name, hidden, url FROM games');
      const dup = allGames.rows.find(r => urlKey(String(r.url)) === key);
      if (dup) {
        return fail(res, 409, 'duplicate_url', `Link này đã có trong danh sách: “${dup.name}”${dup.hidden ? ' (đang ẩn)' : ''}.`, 'url');
      }

      const cover_url = cleanUrl(body.cover_url);
      const title_en = body.title_en ? String(body.title_en).trim().slice(0, 120) : null;
      const aliases = body.aliases ? String(body.aliases).trim().slice(0, 300) : null;
      const added_at = body.added_at ? String(body.added_at).slice(0, 10) : new Date().toISOString().slice(0, 10);
      const hidden = body.hidden ? 1 : 0;
      const now = nowIso();

      const ins = await db.execute({
        sql: `INSERT INTO games (name, url, cover_url, title_en, aliases, added_at, category, hidden, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [name, url, cover_url, title_en, aliases, added_at, cat, hidden, now, now]
      });

      const newId = Number(ins.lastInsertRowid);
      const created = await db.execute({ sql: `SELECT ${GAME_COLS.join(',')} FROM games WHERE id = ?`, args: [newId] });
      const row = {};
      GAME_COLS.forEach(col => row[col] = created.rows[0][col]);
      row.hidden = Boolean(row.hidden);

      return sendJson(res, 201, row, { 'Cache-Control': 'no-store' });
    }

    // 6. PATCH / DELETE /api/admin/games/:id
    const matchId = path.match(/^\/api\/admin\/games\/(\d+)$/);
    if (matchId) {
      const email = await getAdminEmail(db, req);
      if (!email) return fail(res, 401, 'unauthorized', 'Phiên đăng nhập đã hết. Đăng nhập lại.');

      const gid = parseInt(matchId[1], 10);

      if (method === 'PATCH') {
        const exist = await db.execute({ sql: 'SELECT * FROM games WHERE id = ?', args: [gid] });
        if (!exist.rows.length) return fail(res, 404, 'not_found', 'Game này không còn trong danh sách.');

        const updates = {};
        if ('name' in body) {
          const name = String(body.name || '').replace(/\s+/g, ' ').trim();
          if (name.length < 1 || name.length > 120) return fail(res, 400, 'invalid', 'Chưa có tên game.', 'name');
          updates.name = name;
        }
        if ('url' in body) {
          const url = cleanUrl(body.url);
          if (!url) return fail(res, 400, 'invalid', 'Link game chưa đúng.', 'url');
          const key = urlKey(url);
          const allGames = await db.execute('SELECT id, name, hidden, url FROM games');
          const dup = allGames.rows.find(r => Number(r.id) !== gid && urlKey(String(r.url)) === key);
          if (dup) return fail(res, 409, 'duplicate_url', `Link này đã có trong danh sách: “${dup.name}”.`, 'url');
          updates.url = url;
        }
        if ('cover_url' in body) updates.cover_url = cleanUrl(body.cover_url);
        if ('title_en' in body) updates.title_en = body.title_en ? String(body.title_en).trim().slice(0, 120) : null;
        if ('aliases' in body) updates.aliases = body.aliases ? String(body.aliases).trim().slice(0, 300) : null;
        if ('added_at' in body) updates.added_at = body.added_at ? String(body.added_at).slice(0, 10) : null;
        if ('category' in body) {
          if (!CATEGORIES.has(body.category)) return fail(res, 400, 'invalid', 'Chưa chọn thể loại.', 'category');
          updates.category = body.category;
        }
        if ('hidden' in body) updates.hidden = body.hidden ? 1 : 0;

        if (Object.keys(updates).length > 0) {
          updates.updated_at = nowIso();
          const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ');
          const args = [...Object.values(updates), gid];
          await db.execute({ sql: `UPDATE games SET ${sets} WHERE id = ?`, args });
        }

        const updated = await db.execute({ sql: `SELECT ${GAME_COLS.join(',')} FROM games WHERE id = ?`, args: [gid] });
        const row = {};
        GAME_COLS.forEach(col => row[col] = updated.rows[0][col]);
        row.hidden = Boolean(row.hidden);
        return sendJson(res, 200, row, { 'Cache-Control': 'no-store' });
      }

      if (method === 'DELETE') {
        const del = await db.execute({ sql: 'DELETE FROM games WHERE id = ?', args: [gid] });
        if (del.rowsAffected === 0) return fail(res, 404, 'not_found', 'Game này không còn trong danh sách.');
        return sendJson(res, 200, { ok: true }, { 'Cache-Control': 'no-store' });
      }
    }

    return fail(res, 404, 'not_found', 'Không có địa chỉ này.');
  } catch (err) {
    console.error('Admin API Error:', err);
    return fail(res, 500, 'server_error', 'Máy chủ gặp lỗi. Thử lại sau.');
  }
}
