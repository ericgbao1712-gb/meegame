import crypto from 'node:crypto';
import { createClient } from '@libsql/client/web';

const CATEGORY_NAMES = {
  food: 'Quán ăn, nấu ăn',
  drink: 'Trà, cà phê & bánh',
  shop: 'Tiệm & buôn bán',
  farm: 'Nông trại & xây làng',
  life: 'Đời sống & câu chuyện',
  brain: 'Cờ & trí tuệ',
};
const CATEGORIES = new Set(Object.keys(CATEGORY_NAMES));
const GAME_COLS = ['id', 'name', 'url', 'cover_url', 'title_en', 'aliases', 'added_at', 'category', 'hidden', 'created_at'];
const PUBLIC_COLS = ['name', 'url', 'cover_url', 'title_en', 'aliases', 'added_at', 'category'];

let _client = null;
function getDb() {
  if (!_client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) {
      throw new Error('Chưa thiết lập biến môi trường TURSO_DATABASE_URL trên Vercel!');
    }
    _client = createClient({ url, authToken });
  }
  return _client;
}

function nowIso() {
  return new Date().toISOString();
}

function urlKey(u) {
  try {
    const p = new URL(String(u || '').trim());
    return (p.protocol.toLowerCase() + '//' + p.host.toLowerCase() + p.pathname.replace(/\/+$/, '') + p.search);
  } catch {
    return '';
  }
}

function cleanUrl(u) {
  if (typeof u !== 'string') return null;
  const s = u.trim();
  if (s.length > 500) return null;
  try {
    const p = new URL(s);
    if (!['http:', 'https:'].includes(p.protocol) || !p.hostname.includes('.')) return null;
    return s;
  } catch {
    return null;
  }
}

export function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const dk = crypto.scryptSync(pw, Buffer.from(salt, 'hex'), 32, { N: 16384, r: 8, p: 1 }).toString('hex');
  return `scrypt$${salt}$${dk}`;
}

export function checkPassword(pw, stored) {
  try {
    const parts = stored.split('$');
    if (parts.length !== 3) return false;
    const [, salt, want] = parts;
    const dk = crypto.scryptSync(pw, Buffer.from(salt, 'hex'), 32, { N: 16384, r: 8, p: 1 }).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(dk, 'hex'), Buffer.from(want, 'hex'));
  } catch {
    return false;
  }
}

export function tokenHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function sendJson(res, status, data, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...extraHeaders
  });
  res.end(JSON.stringify(data));
}

function fail(res, status, code, message, field = null) {
  const err = { error: code, message };
  if (field) err.field = field;
  sendJson(res, status, err, { 'Cache-Control': 'no-store' });
}

async function getAdminEmail(db, req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  const th = tokenHash(token);
  const now = Math.floor(Date.now() / 1000);
  const rs = await db.execute({
    sql: 'SELECT email FROM sessions WHERE token_hash = ? AND expires_at > ?',
    args: [th, now]
  });
  return rs.rows.length ? String(rs.rows[0].email) : null;
}

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

  const parsedUrl = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const path = parsedUrl.pathname.replace(/\/+$/, '') || '/';
  const method = req.method;

  let body = {};
  if (['POST', 'PATCH', 'PUT'].includes(method)) {
    if (typeof req.body === 'object' && req.body !== null) {
      body = req.body;
    } else if (typeof req.body === 'string' && req.body) {
      try { body = JSON.parse(req.body); } catch { return fail(res, 400, 'invalid', 'Dữ liệu không phải JSON'); }
    } else {
      // đọc body thủ công nếu Vercel chưa parse
      try {
        const buffers = [];
        for await (const chunk of req) buffers.push(chunk);
        const raw = Buffer.concat(buffers).toString();
        if (raw) body = JSON.parse(raw);
      } catch {
        return fail(res, 400, 'invalid', 'Dữ liệu không hợp lệ');
      }
    }
  }

  let db;
  try {
    db = getDb();
  } catch (e) {
    return fail(res, 500, 'config_error', e.message);
  }

  try {
    // 1. Health check
    if (method === 'GET' && path === '/api/health') {
      await db.execute('SELECT 1');
      return sendJson(res, 200, { ok: true, database: 'turso' }, { 'Cache-Control': 'no-store' });
    }

    // 2. Danh sách game công khai
    if (method === 'GET' && path === '/api/games') {
      const rs = await db.execute(`SELECT ${PUBLIC_COLS.join(',')} FROM games WHERE hidden = 0 ORDER BY name COLLATE NOCASE`);
      const list = rs.rows.map(r => {
        const row = {};
        PUBLIC_COLS.forEach(col => row[col] = r[col]);
        return row;
      });
      return sendJson(res, 200, list, {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      });
    }

    // 3. Lấy lượt chơi
    if (method === 'GET' && path === '/api/plays') {
      const rs = await db.execute('SELECT game_url, play_count FROM plays');
      const map = {};
      rs.rows.forEach(r => { map[String(r.game_url)] = Number(r.play_count || 0); });
      return sendJson(res, 200, map, {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120'
      });
    }

    // 4. Bấm chơi game
    if (method === 'POST' && path === '/api/plays') {
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
    }

    // 5. Đếm khách ghé
    if (method === 'GET' && path === '/api/visitors') {
      const rs = await db.execute('SELECT count(*) as count FROM visitors');
      return sendJson(res, 200, { count: Number(rs.rows[0].count || 0) }, {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      });
    }

    // 6. Ghi nhận khách ghé
    if (method === 'POST' && path === '/api/visitors') {
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
    }

    // 7. Gợi ý AI (hoặc fallback)
    if (method === 'POST' && path === '/api/suggest') {
      const jevKey = process.env.JEV_API_KEY;
      if (!jevKey) {
        return fail(res, 503, 'ai_off', 'Chưa bật AI.');
      }
      return sendJson(res, 200, { results: [] });
    }

    // 8. Đăng nhập Admin
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
      const exp = now + 30 * 86400; // 30 ngày

      await db.execute({ sql: 'DELETE FROM sessions WHERE expires_at <= ?', args: [now] });
      await db.execute({
        sql: 'INSERT INTO sessions (token_hash, email, expires_at) VALUES (?, ?, ?)',
        args: [th, email, exp]
      });

      return sendJson(res, 200, { token, email }, { 'Cache-Control': 'no-store' });
    }

    // 9. Đăng xuất Admin
    if (method === 'POST' && path === '/api/admin/logout') {
      const auth = req.headers.authorization || '';
      if (auth.startsWith('Bearer ')) {
        const th = tokenHash(auth.slice(7).trim());
        await db.execute({ sql: 'DELETE FROM sessions WHERE token_hash = ?', args: [th] });
      }
      return sendJson(res, 200, { ok: true }, { 'Cache-Control': 'no-store' });
    }

    // 10. Thông tin phiên admin
    if (method === 'GET' && path === '/api/admin/me') {
      const email = await getAdminEmail(db, req);
      if (!email) return fail(res, 401, 'unauthorized', 'Phiên đăng nhập đã hết. Đăng nhập lại.');
      return sendJson(res, 200, { email }, { 'Cache-Control': 'no-store' });
    }

    // 11. Danh sách game trang Admin
    if (method === 'GET' && path === '/api/admin/games') {
      const email = await getAdminEmail(db, req);
      if (!email) return fail(res, 401, 'unauthorized', 'Phiên đăng nhập đã hết. Đăng nhập lại.');

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

    // 12. Thêm game mới (Admin)
    if (method === 'POST' && path === '/api/admin/games') {
      const email = await getAdminEmail(db, req);
      if (!email) return fail(res, 401, 'unauthorized', 'Phiên đăng nhập đã hết. Đăng nhập lại.');

      const name = String(body.name || '').replace(/\s+/g, ' ').trim();
      if (name.length < 1 || name.length > 120) return fail(res, 400, 'invalid', 'Chưa có tên game.', 'name');

      const url = cleanUrl(body.url);
      if (!url) return fail(res, 400, 'invalid', 'Link game chưa đúng. Phải bắt đầu bằng https:// hoặc http://', 'url');

      const cat = String(body.category || '');
      if (!CATEGORIES.has(cat)) return fail(res, 400, 'invalid', 'Chưa chọn thể loại.', 'category');

      // Check duplicate URL
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

    // 13. Sửa / Xóa game theo ID (Admin)
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
    console.error('API Error:', err);
    return fail(res, 500, 'server_error', 'Máy chủ gặp lỗi. Thử lại sau.');
  }
}
