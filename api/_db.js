import crypto from 'node:crypto';
import { createClient } from '@libsql/client/web';

export const CATEGORY_NAMES = {
  food: 'Quán ăn, nấu ăn',
  drink: 'Trà, cà phê & bánh',
  shop: 'Tiệm & buôn bán',
  farm: 'Nông trại & xây làng',
  life: 'Đời sống & câu chuyện',
  brain: 'Cờ & trí tuệ',
  horror: 'Kinh dị',
};
export const CATEGORIES = new Set(Object.keys(CATEGORY_NAMES));
export const GAME_COLS = ['id', 'name', 'url', 'cover_url', 'title_en', 'aliases', 'added_at', 'category', 'hidden', 'created_at'];
export const PUBLIC_COLS = ['name', 'url', 'cover_url', 'title_en', 'aliases', 'added_at', 'category'];

export const HORROR_SEED_URLS = [
  'https://catruccuoi.canyoutry.com/',
  'http://play.theuntolds.com/',
  'https://dilo.com.vn/games/nhatapthe/play',
  'https://minhmacg.itch.io/nguoi-o-lai-ngay-tet?utm_source=zalo&utm_medium=zalo&utm_campaign=zalo&zarsrc=31',
  'https://minhmacg.itch.io/nguoi-o-lai-ngay-tet',
  'https://redbuttonthegame.up.railway.app/studio',
  'https://phoanh2.com/pho-anh-hai/?',
  'https://gatherplay.games/games/werewolf',
  'http://www.hem47.asia/',
  'https://thamtubanphim.netlify.app/',
];

let _horrorMigrated = false;
export async function ensureHorrorCategory(db) {
  if (_horrorMigrated) return;
  _horrorMigrated = true;
  try {
    await db.execute('CREATE TABLE IF NOT EXISTS app_meta (k TEXT PRIMARY KEY, v TEXT)');
    const chk = await db.execute({ sql: "SELECT v FROM app_meta WHERE k = 'horror_cat_v1'", args: [] });
    if (chk.rows.length > 0) return;
    const placeholders = HORROR_SEED_URLS.map(() => '?').join(',');
    await db.execute({
      sql: `UPDATE games SET category = 'horror' WHERE url IN (${placeholders})`,
      args: HORROR_SEED_URLS,
    });
    await db.execute({ sql: "INSERT OR REPLACE INTO app_meta (k, v) VALUES ('horror_cat_v1', '1')", args: [] });
  } catch {
    // ignore if table not writable
  }
}

let _client = null;
export function getDb() {
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

export function nowIso() {
  return new Date().toISOString();
}

export function urlKey(u) {
  try {
    const p = new URL(String(u || '').trim());
    return (p.protocol.toLowerCase() + '//' + p.host.toLowerCase() + p.pathname.replace(/\/+$/, '') + p.search);
  } catch {
    return '';
  }
}

export function cleanUrl(u) {
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

export function sendJson(res, status, data, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...extraHeaders
  });
  res.end(JSON.stringify(data));
}

export function fail(res, status, code, message, field = null) {
  const err = { error: code, message };
  if (field) err.field = field;
  sendJson(res, status, err, { 'Cache-Control': 'no-store' });
}

export async function parseBody(req) {
  if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
    if (typeof req.body === 'object' && req.body !== null) {
      return req.body;
    }
    if (typeof req.body === 'string' && req.body) {
      try { return JSON.parse(req.body); } catch { return {}; }
    }
    try {
      const buffers = [];
      for await (const chunk of req) buffers.push(chunk);
      const raw = Buffer.concat(buffers).toString();
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
  return {};
}

export async function getAdminEmail(db, req) {
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
