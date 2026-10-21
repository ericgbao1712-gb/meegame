// Lẩu Ơi! — đăng nhập Google, lưu tiến trình lên mạng, bảng xếp hạng.
// Gọi bằng /api/lau?r=<đường dẫn>, ví dụ /api/lau?r=auth/google (vercel.json cũng chuyển /api/lau/<đường dẫn> về đây).
//
//   POST /api/lau/auth/google   { credential }          → đăng nhập, đặt cookie phiên
//   GET  /api/lau/auth/me                               → người chơi + thông tin bản lưu trên mạng
//   POST /api/lau/auth/logout                           → xóa cookie
//   GET  /api/lau/save                                  → bản lưu trên mạng (đầy đủ)
//   PUT  /api/lau/save          { save, base, force }   → lưu lên mạng (bản cũ được giữ trong game_save_backups)
//                                base = updatedAt của bản trên mạng mà máy này đồng bộ lần cuối; khác → 409
//   POST /api/lau/save/delete                           → xóa quán trên mạng (+ các bản sao lưu) để chơi lại từ đầu
//   POST /api/lau/auth/unlink                           → hủy liên kết Gmail: xóa quán + bản sao lưu + tài khoản, xóa cookie
//   GET  /api/lau/leaderboard?by=level|money|pots       → top 50 + hạng của mình
//   GET  /api/lau/admin/players            (admin)      → danh sách người chơi để kiểm tra gian lận
//   POST /api/lau/admin/players/:id        (admin)      { hidden?, flagged? } → ẩn / bỏ đánh dấu
//
// Ghi (POST/PUT) phải có header "X-MeeGame: 1": trình duyệt chỉ gửi header lạ từ trang khác sau một lần hỏi CORS,
// mà API này không trả header CORS nào → trang lạ không giả mạo được yêu cầu (chống CSRF), thêm cookie SameSite=Lax.
import { getDb, parseBody, getAdminEmail, nowIso } from './_db.js';
import {
  ensureSchema, verifyGoogleIdToken, makeSessionCookie, clearSessionCookie, sessionPlayerId, send, err,
} from './_player.js';

const GAME = 'quanlau';
const MAX_SAVE_BYTES = 400 * 1024;
const MIN_PUT_GAP_MS = 8 * 1000;          // chống spam: tối đa ~1 lần lưu / 8 giây
const KEEP_BACKUPS = 10;
// Chống gian lận (mức hợp lý, không tuyệt đối — save nằm trong trình duyệt):
const RATE_K_PER_SEC = 2500;              // tiền kiếm được tối đa ~2,5 triệu đồng / giây thật (gồm cả 8 chi nhánh cấp tối đa)
const GRACE_SEC = 15 * 60;
const FIRST_UPLOAD_PER_DAY = 1.5e6;       // lần đầu đưa lên: tối đa ~1,5 tỷ / ngày trong game đã chơi
const POTS_PER_SEC = 3;
const BOARDS = { level: 'level DESC, xp DESC', money: 'money_earned DESC', pots: 'pots_sold DESC' };
const BOARD_VALUE = { level: 'level', money: 'money_earned', pots: 'pots_sold' };

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const cleanName = (s) => String(s || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24) || 'Quán Lẩu';

/** Pulls the leaderboard columns out of a save; null when it is not a playable Lẩu Ơi! save. */
export function saveSummary(save) {
  if (!save || typeof save !== 'object' || Array.isArray(save) || !save.started) return null;
  const level = Math.floor(num(save.level));
  const money = num(save.money, -1);
  if (!(level >= 1 && level <= 99) || !(money >= 0) || !Number.isFinite(money)) return null;
  const stats = save.stats && typeof save.stats === 'object' ? save.stats : {};
  return {
    shop_name: cleanName(save.shopName),
    avatar: Math.max(0, Math.min(99, Math.floor(num(save.avatar)))),
    level,
    xp: Math.max(0, num(save.xp)),
    money_earned: Math.max(money, num(stats.moneyEarned)),
    pots_sold: Math.max(0, Math.floor(num(stats.potsSold))),
    day: Math.max(1, Math.floor(num(save.day, 1))),
    days_played: Math.max(0, Math.floor(num(stats.daysPlayed))),
    client_saved_at: Math.floor(num(save.savedAt)) || null,
    cheat: save.flags && save.flags.ui && save.flags.ui.cheat ? 1 : 0,
  };
}

/** Anti-cheat: is the jump from the previous cloud save (or from nothing) believable? → reason string or null. */
export function suspicious(prev, next, nowMs) {
  if (!prev) {
    if (next.money_earned > (next.days_played + 1) * FIRST_UPLOAD_PER_DAY) return 'Tiền nhiều bất thường so với số ngày đã chơi';
    return null;
  }
  const dt = Math.max(0, (nowMs - num(prev.updated_at)) / 1000) + GRACE_SEC;
  if (next.money_earned - num(prev.money_earned) > dt * RATE_K_PER_SEC) return 'Tiền tăng nhanh bất thường';
  if (next.pots_sold - num(prev.pots_sold) > dt * POTS_PER_SEC) return 'Số nồi bán tăng nhanh bất thường';
  return null;
}

const meta = (row) => (row ? {
  savedAt: num(row.client_saved_at) || null, updatedAt: num(row.updated_at), shopName: row.shop_name,
  level: num(row.level), moneyEarned: num(row.money_earned), potsSold: num(row.pots_sold), day: num(row.day),
} : null);

async function playerOf(db, req) {
  const id = sessionPlayerId(req);
  if (!id) return null;
  const rs = await db.execute({ sql: 'SELECT id, email, name, picture, hidden FROM players WHERE id = ?', args: [id] });
  return rs.rows[0] || null;
}
const publicPlayer = (p) => ({ id: Number(p.id), name: p.name || '', email: p.email || '', picture: p.picture || '' });

async function cloudRow(db, pid, full = false) {
  const rs = await db.execute({
    sql: `SELECT ${full ? 'data, ' : ''}client_saved_at, updated_at, shop_name, level, xp, money_earned, pots_sold, day, flagged, cheat
          FROM game_saves WHERE player_id = ? AND game = ?`,
    args: [pid, GAME],
  });
  return rs.rows[0] || null;
}

export default async function handler(req, res) {
  const url = new URL(req.url, 'https://' + (req.headers.host || 'localhost'));
  // Một file duy nhất (/api/lau?r=auth/google …): Vercel không chạy file catch-all [...slug].js lồng trong thư mục
  // với dự án không dùng Next.js → trước đây /api/lau/auth/google trả 404 dạng HTML (lỗi "Đăng nhập chưa được").
  const r = String(url.searchParams.get('r') || '').replace(/^\/+|\/+$/g, '');
  const path = r ? '/' + r : (url.pathname.replace(/\/+$/, '').replace(/^\/api\/lau/, '') || '/');
  const method = req.method;

  if (method === 'OPTIONS') { res.writeHead(204); return res.end(); }   // không mở CORS cho trang khác
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && req.headers['x-meegame'] !== '1') {
    return err(res, 403, 'forbidden', 'Yêu cầu không hợp lệ.');
  }

  let db;
  try { db = getDb(); await ensureSchema(db); } catch (e) {
    console.error('[lau] db', e);
    return err(res, 503, 'db_error', 'Máy chủ chưa sẵn sàng, thử lại sau nha.');
  }

  try {
    // ── đăng nhập ──
    if (method === 'POST' && path === '/auth/google') {
      const body = await parseBody(req);
      let claims;
      try { claims = await verifyGoogleIdToken(body.credential); } catch (e) {
        if (e.code === 'config_error') { console.error('[lau] auth config', e.message); return err(res, 503, 'config_error', 'Đăng nhập chưa được cấu hình xong.'); }
        return err(res, 401, e.code || 'bad_token', e.message || 'Đăng nhập không thành công.');
      }
      const now = nowIso();
      await db.execute({
        sql: `INSERT INTO players (google_sub, email, name, picture, created_at, last_login) VALUES (?, ?, ?, ?, ?, ?)
              ON CONFLICT(google_sub) DO UPDATE SET email = excluded.email, name = excluded.name, picture = excluded.picture, last_login = excluded.last_login`,
        args: [String(claims.sub), claims.email || null, String(claims.name || '').slice(0, 80) || null, claims.picture || null, now, now],
      });
      const rs = await db.execute({ sql: 'SELECT id, email, name, picture FROM players WHERE google_sub = ?', args: [String(claims.sub)] });
      const p = rs.rows[0];
      let cookie;
      try { cookie = makeSessionCookie(Number(p.id)); } catch (e) { console.error('[lau] session', e.message); return err(res, 503, 'config_error', 'Đăng nhập chưa được cấu hình xong.'); }
      return send(res, 200, { player: publicPlayer(p), cloud: meta(await cloudRow(db, Number(p.id))) }, { 'Set-Cookie': cookie });
    }
    if (method === 'POST' && path === '/auth/logout') {
      return send(res, 200, { ok: true }, { 'Set-Cookie': clearSessionCookie() });
    }

    // ── bảng xếp hạng (ai cũng xem được) ──
    if (method === 'GET' && path === '/leaderboard') {
      const by = BOARDS[url.searchParams.get('by')] ? url.searchParams.get('by') : 'level';
      const col = BOARD_VALUE[by];
      const where = 'g.game = ? AND g.cheat = 0 AND g.flagged = 0 AND p.hidden = 0';
      const rs = await db.execute({
        sql: `SELECT g.player_id, g.shop_name, g.avatar, g.level, g.money_earned, g.pots_sold FROM game_saves g
              JOIN players p ON p.id = g.player_id WHERE ${where} ORDER BY ${BOARDS[by]}, g.updated_at ASC LIMIT 50`,
        args: [GAME],
      });
      let me = null;
      const pid = sessionPlayerId(req);
      if (pid) {
        const mine = await db.execute({ sql: `SELECT g.level, g.xp, g.money_earned, g.pots_sold, g.shop_name, g.cheat, g.flagged, p.hidden FROM game_saves g JOIN players p ON p.id = g.player_id WHERE g.player_id = ? AND g.game = ?`, args: [pid, GAME] });
        const m = mine.rows[0];
        if (m) {
          const listed = !num(m.cheat) && !num(m.flagged) && !num(m.hidden);
          let rank = null;
          if (listed) {
            const cond = by === 'level' ? '(g.level > ? OR (g.level = ? AND g.xp > ?))' : `g.${col} > ?`;
            const args = by === 'level' ? [GAME, m.level, m.level, m.xp] : [GAME, m[col]];
            const r = await db.execute({ sql: `SELECT count(*) AS n FROM game_saves g JOIN players p ON p.id = g.player_id WHERE ${where} AND ${cond}`, args });
            rank = num(r.rows[0].n) + 1;
          }
          me = { rank, listed, cheat: !!num(m.cheat), flagged: !!num(m.flagged), shopName: m.shop_name, value: num(m[col]) };
        }
      }
      const rows = rs.rows.map((r, i) => ({
        rank: i + 1, shopName: r.shop_name, avatar: num(r.avatar), level: num(r.level),
        value: num(r[col]), me: pid != null && num(r.player_id) === pid,
      }));
      return send(res, 200, { by, rows, me });
    }

    // ── admin: kiểm tra / ẩn người chơi gian lận ──
    if (path === '/admin/players' || path.startsWith('/admin/players/')) {
      const admin = await getAdminEmail(db, req);
      if (!admin) return err(res, 401, 'unauthorized', 'Phiên đăng nhập admin đã hết.');
      if (method === 'GET' && path === '/admin/players') {
        const rs = await db.execute({
          sql: `SELECT p.id, p.email, p.name, p.hidden, p.created_at, p.last_login, g.shop_name, g.level, g.money_earned, g.pots_sold,
                       g.cheat, g.flagged, g.flag_reason, g.updated_at
                FROM players p LEFT JOIN game_saves g ON g.player_id = p.id AND g.game = ? ORDER BY g.money_earned DESC LIMIT 500`,
          args: [GAME],
        });
        return send(res, 200, { players: rs.rows.map((r) => ({ ...r, id: num(r.id) })) });
      }
      const m = path.match(/^\/admin\/players\/(\d+)$/);
      if (method === 'POST' && m) {
        const body = await parseBody(req);
        const id = Number(m[1]);
        if ('hidden' in body) await db.execute({ sql: 'UPDATE players SET hidden = ? WHERE id = ?', args: [body.hidden ? 1 : 0, id] });
        if ('flagged' in body) await db.execute({ sql: 'UPDATE game_saves SET flagged = ?, flag_reason = CASE WHEN ? = 1 THEN flag_reason ELSE NULL END WHERE player_id = ? AND game = ?', args: [body.flagged ? 1 : 0, body.flagged ? 1 : 0, id, GAME] });
        return send(res, 200, { ok: true });
      }
      return err(res, 404, 'not_found', 'Không có địa chỉ này.');
    }

    // ── từ đây phải đăng nhập ──
    const p = await playerOf(db, req);
    if (!p) {
      return err(res, 401, 'unauthorized', 'Chưa đăng nhập.', path.startsWith('/auth') || path === '/save' ? { 'Set-Cookie': clearSessionCookie() } : {});
    }
    const pid = Number(p.id);

    if (method === 'GET' && path === '/auth/me') {
      return send(res, 200, { player: publicPlayer(p), cloud: meta(await cloudRow(db, pid)) });
    }

    // ── v1.10: xóa dữ liệu / hủy liên kết Gmail ──
    if (method === 'POST' && (path === '/save/delete' || path === '/auth/unlink')) {
      await db.execute({ sql: 'DELETE FROM game_save_backups WHERE player_id = ? AND game = ?', args: [pid, GAME] });
      await db.execute({ sql: 'DELETE FROM game_saves WHERE player_id = ? AND game = ?', args: [pid, GAME] });
      if (path === '/save/delete') return send(res, 200, { ok: true, cloud: null });
      // Bảng players dùng chung cho các game MeeGame: chỉ xóa tài khoản khi không còn game nào khác lưu tiến trình.
      const other = await db.execute({ sql: 'SELECT count(*) AS n FROM game_saves WHERE player_id = ?', args: [pid] });
      const removed = num(other.rows[0] && other.rows[0].n) === 0;
      if (removed) {
        await db.execute({ sql: 'DELETE FROM game_save_backups WHERE player_id = ?', args: [pid] });
        await db.execute({ sql: 'DELETE FROM players WHERE id = ?', args: [pid] });
      }
      return send(res, 200, { ok: true, removed }, { 'Set-Cookie': clearSessionCookie() });
    }

    if (method === 'GET' && path === '/save') {
      const row = await cloudRow(db, pid, true);
      if (!row) return send(res, 200, { save: null, cloud: null });
      let save = null;
      try { save = JSON.parse(String(row.data)); } catch { save = null; }
      return send(res, 200, { save, cloud: meta(row) });
    }

    if (method === 'PUT' && path === '/save') {
      const body = await parseBody(req);
      const save = body && body.save;
      const sum = saveSummary(save);
      if (!sum) return err(res, 400, 'invalid', 'Tiến trình không hợp lệ.');
      const data = JSON.stringify(save);
      if (Buffer.byteLength(data) > MAX_SAVE_BYTES) return err(res, 413, 'too_big', 'Tiến trình quá lớn.');
      const nowMs = Date.now();
      const prev = await cloudRow(db, pid, true);
      if (prev && !body.force && nowMs - num(prev.updated_at) < MIN_PUT_GAP_MS) {
        return err(res, 429, 'too_fast', 'Vừa lưu xong, đợi chút nha.');
      }
      // Máy khác đã lưu lên sau lần đồng bộ cuối của máy này (base) → không ghi đè, để trò chơi xử lý.
      if (prev && !body.force && body.base != null && num(prev.updated_at) > num(body.base)) {
        return send(res, 409, { error: 'conflict', message: 'Trên mạng có bản mới hơn.', cloud: meta(prev) });
      }
      const reason = num(prev && prev.flagged) ? null : suspicious(prev, sum, nowMs);
      const flagged = num(prev && prev.flagged) || reason ? 1 : 0;
      if (prev) {
        await db.execute({
          sql: 'INSERT INTO game_save_backups (player_id, game, data, client_saved_at, level, money_earned, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          args: [pid, GAME, String(prev.data), prev.client_saved_at, prev.level, prev.money_earned, nowMs],
        });
        await db.execute({
          sql: `DELETE FROM game_save_backups WHERE player_id = ? AND game = ? AND id NOT IN
                (SELECT id FROM game_save_backups WHERE player_id = ? AND game = ? ORDER BY id DESC LIMIT ${KEEP_BACKUPS})`,
          args: [pid, GAME, pid, GAME],
        });
      }
      await db.execute({
        sql: `INSERT INTO game_saves (player_id, game, data, client_saved_at, updated_at, shop_name, avatar, level, xp, money_earned, pots_sold, day, cheat, flagged, flag_reason)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(player_id, game) DO UPDATE SET data = excluded.data, client_saved_at = excluded.client_saved_at,
                updated_at = excluded.updated_at, shop_name = excluded.shop_name, avatar = excluded.avatar, level = excluded.level,
                xp = excluded.xp, money_earned = excluded.money_earned, pots_sold = excluded.pots_sold, day = excluded.day,
                cheat = MAX(game_saves.cheat, excluded.cheat), flagged = excluded.flagged,
                flag_reason = COALESCE(excluded.flag_reason, game_saves.flag_reason)`,
        args: [pid, GAME, data, sum.client_saved_at, nowMs, sum.shop_name, sum.avatar, sum.level, sum.xp, sum.money_earned,
          sum.pots_sold, sum.day, sum.cheat, flagged, reason],
      });
      return send(res, 200, { ok: true, cloud: meta({ ...sum, updated_at: nowMs }), listed: !flagged && !sum.cheat && !num(p.hidden) });
    }

    return err(res, 404, 'not_found', 'Không có địa chỉ này.');
  } catch (e) {
    console.error('[lau] error', e);
    return err(res, 500, 'server_error', 'Máy chủ gặp lỗi. Thử lại sau nha.');
  }
}
