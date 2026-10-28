// Đăng nhập người chơi bằng Google + lưu tiến trình game lên Turso (dùng chung cho các game của MeeGame).
//
// - Đăng nhập: trình duyệt lấy "ID token" từ Google Identity Services rồi gửi lên đây. Server kiểm tra chữ ký
//   của Google (khóa công khai JWKS), đúng Client ID (GOOGLE_CLIENT_ID), còn hạn, email đã xác minh.
// - Phiên đăng nhập: cookie httpOnly "mg_player" ký HMAC bằng SESSION_SECRET (không cần bảng sessions).
// - Bảng mới (chỉ THÊM, không đụng bảng cũ): players, game_saves, game_save_backups.
import crypto from 'node:crypto';

export const COOKIE = 'mg_player';
const SESSION_DAYS = 60;
const GOOGLE_ISS = new Set(['accounts.google.com', 'https://accounts.google.com']);
const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

// ───────────── schema (CREATE IF NOT EXISTS: chạy lại bao nhiêu lần cũng an toàn) ─────────────
let schemaReady = null;
export function ensureSchema(db) {
  if (!schemaReady) {
    schemaReady = (async () => {
      await db.execute(`CREATE TABLE IF NOT EXISTS players (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        google_sub  TEXT NOT NULL UNIQUE,
        email       TEXT,
        name        TEXT,
        picture     TEXT,
        hidden      INTEGER NOT NULL DEFAULT 0,
        created_at  TEXT NOT NULL,
        last_login  TEXT NOT NULL
      )`);
      await db.execute(`CREATE TABLE IF NOT EXISTS game_saves (
        player_id        INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        game             TEXT NOT NULL,
        data             TEXT NOT NULL,
        client_saved_at  INTEGER,
        updated_at       INTEGER NOT NULL,
        shop_name        TEXT,
        avatar           INTEGER,
        level            INTEGER,
        xp               REAL,
        money_earned     REAL,
        pots_sold        INTEGER,
        day              INTEGER,
        cheat            INTEGER NOT NULL DEFAULT 0,
        flagged          INTEGER NOT NULL DEFAULT 0,
        flag_reason      TEXT,
        PRIMARY KEY (player_id, game)
      )`);
      await db.execute(`CREATE TABLE IF NOT EXISTS game_save_backups (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id        INTEGER NOT NULL,
        game             TEXT NOT NULL,
        data             TEXT NOT NULL,
        client_saved_at  INTEGER,
        level            INTEGER,
        money_earned     REAL,
        created_at       INTEGER NOT NULL
      )`);
      await db.execute('CREATE INDEX IF NOT EXISTS game_save_backups_pg ON game_save_backups (player_id, game, id)');
      // v1.13 mã quà tặng (gift code): admin tạo mã, người chơi nhập trong Cài đặt → nhận tiền + XP, mỗi tài khoản 1 lần / mã
      await db.execute(`CREATE TABLE IF NOT EXISTS gift_codes (
        code        TEXT PRIMARY KEY,
        game        TEXT NOT NULL DEFAULT '*',
        money       REAL NOT NULL DEFAULT 0,
        xp          REAL NOT NULL DEFAULT 0,
        max_uses    INTEGER,
        uses        INTEGER NOT NULL DEFAULT 0,
        expires_at  INTEGER,
        disabled    INTEGER NOT NULL DEFAULT 0,
        note        TEXT,
        created_at  INTEGER NOT NULL
      )`);
      // v1.18 thẻ thành tích (Hộp mù Lẩu Ơi) hiện trên bảng xếp hạng — thêm cột cho bảng cũ (lỗi "duplicate column" = có rồi)
      try { await db.execute('ALTER TABLE game_saves ADD COLUMN badge TEXT'); } catch (e) { /* có rồi */ }
      try { await db.execute('ALTER TABLE players ADD COLUMN admin_pic TEXT'); } catch (e) { /* có rồi */ }   // v1.25b ảnh avatar riêng của admin
      try { await db.execute('ALTER TABLE gift_codes ADD COLUMN for_email TEXT'); } catch (e) { /* có rồi */ }   // v1.28 mã riêng cho 1 Gmail
      await db.execute(`CREATE TABLE IF NOT EXISTS gift_redemptions (
        code        TEXT NOT NULL,
        player_id   INTEGER NOT NULL,
        game        TEXT NOT NULL,
        money       REAL NOT NULL DEFAULT 0,
        xp          REAL NOT NULL DEFAULT 0,
        created_at  INTEGER NOT NULL,
        PRIMARY KEY (code, player_id, game)
      )`);
    })().catch((e) => { schemaReady = null; throw e; });
  }
  return schemaReady;
}

// ───────────── base64url / cookie ─────────────
const b64u = (buf) => Buffer.from(buf).toString('base64url');
const unb64u = (s) => Buffer.from(String(s), 'base64url');

export function readCookie(req, name) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

function secret() {
  const s = process.env.SESSION_SECRET || '';
  if (s.length < 32) throw Object.assign(new Error('Chưa thiết lập SESSION_SECRET (ít nhất 32 ký tự) trên Vercel.'), { code: 'config_error' });
  return s;
}
const sign = (payload) => crypto.createHmac('sha256', secret()).update(payload).digest('base64url');

export function makeSessionCookie(playerId) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400;
  const payload = b64u(JSON.stringify({ p: playerId, exp }));
  const value = `v1.${payload}.${sign(payload)}`;
  return `${COOKIE}=${value}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`;
}
export const clearSessionCookie = () => `${COOKIE}=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

/** Player id from the session cookie, or null (missing / tampered / expired). */
export function sessionPlayerId(req) {
  const v = readCookie(req, COOKIE);
  if (!v) return null;
  const [ver, payload, sig] = v.split('.');
  if (ver !== 'v1' || !payload || !sig) return null;
  const want = Buffer.from(sign(payload));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return null;
  try {
    const o = JSON.parse(unb64u(payload).toString('utf8'));
    if (!(o.exp > Date.now() / 1000) || !Number.isInteger(o.p)) return null;
    return o.p;
  } catch { return null; }
}

// ───────────── Google ID token ─────────────
let jwks = { keys: null, until: 0 };
async function googleKeys(force = false) {
  if (!force && jwks.keys && Date.now() < jwks.until) return jwks.keys;
  const r = await fetch(JWKS_URL);
  if (!r.ok) throw new Error('Không lấy được khóa của Google (' + r.status + ')');
  const body = await r.json();
  const m = /max-age=(\d+)/.exec(r.headers.get('cache-control') || '');
  jwks = { keys: body.keys || [], until: Date.now() + (m ? Number(m[1]) : 3600) * 1000 };
  return jwks.keys;
}

/** Verifies a Google ID token. Resolves to its claims; throws Error with .code on any problem. */
export async function verifyGoogleIdToken(token, { clientId = process.env.GOOGLE_CLIENT_ID, now = Date.now(), keys = null } = {}) {
  const bad = (code, msg) => Object.assign(new Error(msg), { code });
  if (!clientId) throw bad('config_error', 'Chưa thiết lập GOOGLE_CLIENT_ID trên Vercel.');
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw bad('bad_token', 'Mã đăng nhập Google không hợp lệ.');
  let header, claims;
  try { header = JSON.parse(unb64u(parts[0])); claims = JSON.parse(unb64u(parts[1])); } catch { throw bad('bad_token', 'Mã đăng nhập Google không hợp lệ.'); }
  if (header.alg !== 'RS256' || !header.kid) throw bad('bad_token', 'Mã đăng nhập Google không hợp lệ.');
  let list = keys || await googleKeys();
  let jwk = list.find((k) => k.kid === header.kid);
  if (!jwk && !keys) { list = await googleKeys(true); jwk = list.find((k) => k.kid === header.kid); }   // Google vừa đổi khóa
  if (!jwk) throw bad('bad_token', 'Mã đăng nhập Google không hợp lệ.');
  const pub = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const ok = crypto.verify('RSA-SHA256', Buffer.from(parts[0] + '.' + parts[1]), pub, unb64u(parts[2]));
  if (!ok) throw bad('bad_token', 'Chữ ký đăng nhập Google không đúng.');
  const t = now / 1000;
  if (!GOOGLE_ISS.has(claims.iss)) throw bad('bad_token', 'Mã đăng nhập không phải của Google.');
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!aud.includes(clientId)) throw bad('bad_token', 'Mã đăng nhập không dành cho MeeGame.');
  if (!(claims.exp > t - 60)) throw bad('expired', 'Phiên đăng nhập Google đã hết hạn, bấm đăng nhập lại nha.');
  if (claims.iat && claims.iat > t + 300) throw bad('bad_token', 'Đồng hồ máy bị lệch, thử lại nha.');
  if (!claims.sub) throw bad('bad_token', 'Mã đăng nhập Google không hợp lệ.');
  if (claims.email && claims.email_verified === false) throw bad('unverified', 'Email Google này chưa được xác minh.');
  return claims;
}

// ───────────── JSON responses (same-origin only: no CORS headers, never cached) ─────────────
export function send(res, status, data, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(data));
}
export function err(res, status, code, message, headers) { send(res, status, { error: code, message }, headers); }

// ───────────── khung / thẻ tên ADMIN (chỉ tài khoản admin) ─────────────
// Email admin không ghi thẳng trong mã: so khớp bằng SHA-256. Thêm / đổi admin qua biến môi trường
// ADMIN_PLAYER_EMAILS (cách nhau dấu phẩy) trên Vercel, không cần sửa mã.
const ADMIN_EMAIL_HASHES = new Set(['1b62f29880ec62480dec4264e4c4a639175fec9e57f07fc08522af74a5f29633']);
export function isAdminPlayerEmail(email) {
  const e = String(email || '').trim().toLowerCase();
  if (!e) return false;
  const env = String(process.env.ADMIN_PLAYER_EMAILS || '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean);
  if (env.includes(e)) return true;
  return ADMIN_EMAIL_HASHES.has(crypto.createHash('sha256').update(e).digest('hex'));
}
