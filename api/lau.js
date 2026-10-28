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
//   POST /api/lau/code/redeem   { code }                → đổi mã quà tặng: { money, xp } (mỗi tài khoản 1 lần / mã / game)
//   GET  /api/lau/admin/codes              (admin)      → danh sách mã quà tặng
//   POST /api/lau/admin/codes              (admin)      { code, game, money, xp, maxUses, expiresAt, note } → tạo mã
//   POST /api/lau/admin/codes/:code        (admin)      { disabled } | { delete: true } → khóa / mở / xóa mã
//   GET  /api/lau/leaderboard?by=level|money|pots       → top 50 + hạng của mình
//   GET  /api/lau/codes/active                          → mã quà tặng còn hạn (+ redeemed nếu đã đăng nhập)
//   Thêm &g=xoailac để dùng cho game Xoài Lắc, &g=tiramee cho Tiệm TiraMee, &g=banhtrang cho Bánh Tráng Nhà Mee, &g=tiranho cho Tira Xe Đẩy (cùng bảng players, bản lưu tách theo game).
//   GET  /api/lau/admin/stats              (admin)      → số liệu tổng quan của game (&g=…)
//   GET  /api/lau/admin/players            (admin)      ?q=&filter=all|flagged|hidden|cheat&sort=recent|money|level|pots|new&limit=&offset=
//   GET  /api/lau/admin/players/:id        (admin)      → chi tiết: bản lưu từng game, bản sao lưu, mã đã nhận
//   POST /api/lau/admin/players/:id        (admin)      { hidden?, flagged?, cheat?, restoreBackup?: id, deleteSave?, deleteAccount? }
//   GET  /api/lau/admin/codes/:code        (admin)      → ai đã nhận mã này
//
// Ghi (POST/PUT) phải có header "X-MeeGame: 1": trình duyệt chỉ gửi header lạ từ trang khác sau một lần hỏi CORS,
// mà API này không trả header CORS nào → trang lạ không giả mạo được yêu cầu (chống CSRF), thêm cookie SameSite=Lax.
import { getDb, parseBody, getAdminEmail, nowIso } from './_db.js';
import {
  ensureSchema, verifyGoogleIdToken, makeSessionCookie, clearSessionCookie, sessionPlayerId, send, err, isAdminPlayerEmail,
} from './_player.js';

// Các game dùng chung API này (chọn bằng &g=…, mặc định Lẩu Ơi). Cùng tài khoản / cookie MeeGame cho mọi game.
const GAMES = new Set(['quanlau', 'xoailac', 'tiramee', 'banhtrang', 'tiranho']);
const DEFAULT_GAME = 'quanlau';
const DEFAULT_SHOP = { quanlau: 'Quán Lẩu', xoailac: 'Xe Xoài Lắc', tiramee: 'Tiệm TiraMee', banhtrang: 'Bánh Tráng Nhà Mee', tiranho: 'Tira Xe Đẩy' };
const MAX_SAVE_BYTES = 400 * 1024;
const MIN_PUT_GAP_MS = 8 * 1000;          // chống spam: tối đa ~1 lần lưu / 8 giây
const KEEP_BACKUPS = 10;
// Chống gian lận (mức hợp lý, không tuyệt đối — save nằm trong trình duyệt):
const RATE_K_PER_SEC = 2500;              // tiền kiếm được tối đa ~2,5 triệu đồng / giây thật (gồm cả 8 chi nhánh cấp tối đa)
const GRACE_SEC = 15 * 60;
const FIRST_UPLOAD_PER_DAY = 1.5e6;       // lần đầu đưa lên: tối đa ~1,5 tỷ / ngày trong game đã chơi
const POTS_PER_SEC = 3;
const FAILS = new Map();                  // v1.13: đếm lần nhập sai mã quà tặng (theo instance function)
const BOARDS = { level: 'level DESC, xp DESC', money: 'money_earned DESC', pots: 'pots_sold DESC' };
const BOARD_VALUE = { level: 'level', money: 'money_earned', pots: 'pots_sold' };

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const cleanCode = (c) => String(c || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'D').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 32);
const CODE_MAX = 1e15;   // chủ game 21/10: không giới hạn tiền / XP của mã (chỉ chặn số vô nghĩa vượt khả năng lưu)
const codeRow = (r) => ({ code: r.code, game: r.game, money: num(r.money), xp: num(r.xp), maxUses: r.max_uses == null ? null : num(r.max_uses),
  uses: num(r.uses), expiresAt: r.expires_at == null ? null : num(r.expires_at), disabled: !!num(r.disabled), note: r.note || '', createdAt: num(r.created_at), forEmail: r.for_email || null });
const cleanName = (s, def = 'Quán Lẩu') => String(s || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24) || def;

/** Pulls the leaderboard columns out of a save; null when it is not a playable save (same shape for every game). */
export function saveSummary(save, game = DEFAULT_GAME) {
  if (!save || typeof save !== 'object' || Array.isArray(save) || !save.started) return null;
  const level = Math.floor(num(save.level));
  // Tiệm TiraMee lưu tiền theo ĐỒNG; Lẩu Ơi / Xoài Lắc theo NGHÌN đồng → đổi về nghìn để xếp hạng & chống gian lận dùng chung một thang
  const K = game === 'tiramee' || game === 'tiranho' ? 1000 : 1;   // Tira Xe Đẩy cũng lưu tiền theo ĐỒNG
  const money = num(save.money, -1) / K;
  if (!(level >= 1 && level <= 100000) || !(money >= 0) || !Number.isFinite(money)) return null;   // Xoài Lắc không có cấp tối đa (mã quà có thể tặng rất nhiều XP)
  const stats = save.stats && typeof save.stats === 'object' ? save.stats : {};
  return {
    shop_name: cleanName(save.shopName, DEFAULT_SHOP[game] || 'Quán Lẩu'),
    avatar: Math.max(0, Math.min(99, Math.floor(num(save.avatar ?? save.owner?.look?.avatar)))),
    level,
    xp: Math.max(0, num(save.xp)),
    // Bánh Tráng: xếp hạng theo TỔNG DOANH THU (tiền bán + giao hàng + chi nhánh), không lấy tiền đang có (tránh tiền quà / admin đẩy hạng)
    money_earned: game === 'banhtrang' ? Math.max(0, num(stats.moneyEarned)) : Math.max(money, num(stats.moneyEarned) / K),
    pots_sold: Math.max(0, Math.floor(num(stats.potsSold))),
    day: Math.max(1, Math.floor(num(save.day, 1))),
    days_played: Math.max(0, Math.floor(num(stats.daysPlayed))),
    client_saved_at: Math.floor(num(save.savedAt)) || null,
    cheat: save.flags && save.flags.ui && save.flags.ui.cheat ? 1 : 0,
    badge: badgeOf(save),
  };
}
/** v1.18 thẻ thành tích đang đeo (id món Hộp mù dạng bx_b_xxx, phải có trong bộ sưu tập). */
function badgeOf(save) {
  const b = save && save.box && typeof save.box === 'object' ? save.box : null;
  const id = b && typeof b.badge === 'string' ? b.badge : '';
  return /^bx_b_[a-z0-9_]{1,24}$/.test(id) && b.got && num(b.got[id]) > 0 ? id : null;
}

/** Anti-cheat: is the jump from the previous cloud save (or from nothing) believable? → reason string or null. */
export function suspicious(prev, next, nowMs, gift = 0) {
  // gift = tiền nhận từ mã quà tặng kể từ lần lưu trước: hợp lệ, không tính là tăng bất thường
  if (!prev) {
    if (next.money_earned - gift > (next.days_played + 1) * FIRST_UPLOAD_PER_DAY) return 'Tiền nhiều bất thường so với số ngày đã chơi';
    return null;
  }
  const dt = Math.max(0, (nowMs - num(prev.updated_at)) / 1000) + GRACE_SEC;
  if (next.money_earned - num(prev.money_earned) - gift > dt * RATE_K_PER_SEC) return 'Tiền tăng nhanh bất thường';
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
  let rs;
  try { rs = await db.execute({ sql: 'SELECT id, email, name, picture, hidden, admin_pic FROM players WHERE id = ?', args: [id] }); }
  catch (e) { rs = await db.execute({ sql: 'SELECT id, email, name, picture, hidden FROM players WHERE id = ?', args: [id] }); }
  return rs.rows[0] || null;
}
const publicPlayer = (p) => { const admin = isAdminPlayerEmail(p.email); return { id: Number(p.id), name: p.name || '', email: p.email || '', picture: p.picture || '', admin, adminPic: admin ? (p.admin_pic || '') : undefined }; };   // admin: khung + thẻ tên hoàng gia, ảnh riêng

async function cloudRow(db, pid, GAME, full = false) {
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
  const GAME = GAMES.has(url.searchParams.get('g')) ? url.searchParams.get('g') : DEFAULT_GAME;

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
      let rs;
      try { rs = await db.execute({ sql: 'SELECT id, email, name, picture, admin_pic FROM players WHERE google_sub = ?', args: [String(claims.sub)] }); }
      catch (e) { rs = await db.execute({ sql: 'SELECT id, email, name, picture FROM players WHERE google_sub = ?', args: [String(claims.sub)] }); }
      const p = rs.rows[0];
      let cookie;
      try { cookie = makeSessionCookie(Number(p.id)); } catch (e) { console.error('[lau] session', e.message); return err(res, 503, 'config_error', 'Đăng nhập chưa được cấu hình xong.'); }
      return send(res, 200, { player: publicPlayer(p), cloud: meta(await cloudRow(db, Number(p.id), GAME)) }, { 'Set-Cookie': cookie });
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
        sql: `SELECT g.player_id, g.shop_name, g.avatar, g.level, g.money_earned, g.pots_sold, g.badge, p.email, p.admin_pic FROM game_saves g
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
        value: num(r[col]), me: pid != null && num(r.player_id) === pid, badge: r.badge || null, admin: isAdminPlayerEmail(r.email) || undefined, adminPic: isAdminPlayerEmail(r.email) ? (r.admin_pic || undefined) : undefined,   // không trả email ra ngoài
      }));
      return send(res, 200, { by, rows, me });
    }

    // ── v1.26 mã quà tặng đang dùng được (ai cũng xem; đã đăng nhập thì đánh dấu mã mình đã nhận) ──
    if (method === 'GET' && path === '/codes/active') {
      const now = Date.now();
      const rs = await db.execute({ sql: `SELECT * FROM gift_codes WHERE disabled = 0 AND (game = '*' OR game = ?) AND (expires_at IS NULL OR expires_at > ?)
              AND (max_uses IS NULL OR uses < max_uses) ORDER BY created_at DESC LIMIT 30`, args: [GAME, now] });
      const pid = sessionPlayerId(req);
      let mine = new Set(), myEmail = '';
      if (pid) {
        const pe = await db.execute({ sql: 'SELECT email FROM players WHERE id = ?', args: [pid] });
        myEmail = String(pe.rows[0]?.email || '').toLowerCase();
        const r2 = await db.execute({ sql: 'SELECT code FROM gift_redemptions WHERE player_id = ? AND game = ?', args: [pid, GAME] });
        mine = new Set(r2.rows.map((r) => r.code));
      }
      const codes = rs.rows.filter((r) => !r.for_email || (myEmail && r.for_email === myEmail)).map((r) => ({ code: r.code, forMe: !!r.for_email, money: num(r.money), xp: num(r.xp), note: r.note || '',
        expiresAt: r.expires_at == null ? null : num(r.expires_at), left: r.max_uses == null ? null : Math.max(0, num(r.max_uses) - num(r.uses)),
        createdAt: num(r.created_at), redeemed: mine.has(r.code) }));
      return send(res, 200, { codes });
    }

    // ── admin: mã quà tặng ──
    if (path === '/admin/codes' || path.startsWith('/admin/codes/')) {
      const admin = await getAdminEmail(db, req);
      if (!admin) return err(res, 401, 'unauthorized', 'Phiên đăng nhập admin đã hết.');
      if (method === 'GET' && path === '/admin/codes') {
        const rs = await db.execute('SELECT * FROM gift_codes ORDER BY created_at DESC LIMIT 500');
        return send(res, 200, { codes: rs.rows.map(codeRow) });
      }
      if (method === 'POST' && path === '/admin/codes') {
        const b = await parseBody(req);
        const code = cleanCode(b.code);
        if (code.length < 3) return err(res, 400, 'invalid', 'Mã cần ít nhất 3 ký tự (chữ không dấu, số, - hoặc _).', {}, 'code');
        const game = GAMES.has(b.game) || b.game === '*' ? b.game : '*';
        const money = Math.max(0, num(b.money)), xp = Math.max(0, Math.round(num(b.xp)));
        if (!(money > 0 || xp > 0)) return err(res, 400, 'invalid', 'Mã phải tặng tiền hoặc XP.', {}, 'money');
        if (!Number.isFinite(money) || !Number.isFinite(xp) || money > CODE_MAX || xp > CODE_MAX) return err(res, 400, 'invalid', 'Số tiền / XP không hợp lệ.', {}, 'money');
        const maxUses = b.maxUses == null || b.maxUses === '' ? null : Math.max(1, Math.floor(num(b.maxUses, 1)));
        const expiresAt = b.expiresAt ? Math.floor(num(b.expiresAt)) || null : null;
        const forEmail = String(b.forEmail || '').trim().toLowerCase() || null;   // v1.28 mã riêng: chỉ Gmail này nhập được
        if (forEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forEmail)) return err(res, 400, 'invalid', 'Gmail không hợp lệ.', {}, 'forEmail');
        const dup = await db.execute({ sql: 'SELECT code FROM gift_codes WHERE code = ?', args: [code] });
        if (dup.rows.length) return err(res, 409, 'exists', 'Mã này đã có rồi.', {}, 'code');
        await db.execute({
          sql: 'INSERT INTO gift_codes (code, game, money, xp, max_uses, uses, expires_at, disabled, note, created_at, for_email) VALUES (?, ?, ?, ?, ?, 0, ?, 0, ?, ?, ?)',
          args: [code, game, money, xp, maxUses, expiresAt, String(b.note || '').slice(0, 120) || null, Date.now(), forEmail],
        });
        const rs = await db.execute({ sql: 'SELECT * FROM gift_codes WHERE code = ?', args: [code] });
        return send(res, 200, { code: codeRow(rs.rows[0]) });
      }
      const m = path.match(/^\/admin\/codes\/([A-Za-z0-9_-]{1,32})$/);
      if (method === 'GET' && m) {
        const rs = await db.execute({ sql: `SELECT r.player_id, r.game, r.money, r.xp, r.created_at, p.email, p.name FROM gift_redemptions r
            LEFT JOIN players p ON p.id = r.player_id WHERE r.code = ? ORDER BY r.created_at DESC LIMIT 500`, args: [cleanCode(m[1])] });
        return send(res, 200, { redemptions: rs.rows.map((r) => ({ playerId: num(r.player_id), email: r.email || '(đã xoá)', name: r.name || '', game: r.game, money: num(r.money), xp: num(r.xp), createdAt: num(r.created_at) })) });
      }
      if (method === 'POST' && m) {
        const b = await parseBody(req);
        const code = cleanCode(m[1]);
        if (b.delete) { await db.execute({ sql: 'DELETE FROM gift_codes WHERE code = ?', args: [code] }); return send(res, 200, { ok: true }); }
        if ('disabled' in b) await db.execute({ sql: 'UPDATE gift_codes SET disabled = ? WHERE code = ?', args: [b.disabled ? 1 : 0, code] });
        const rs = await db.execute({ sql: 'SELECT * FROM gift_codes WHERE code = ?', args: [code] });
        if (!rs.rows.length) return err(res, 404, 'not_found', 'Không có mã này.');
        return send(res, 200, { code: codeRow(rs.rows[0]) });
      }
      return err(res, 404, 'not_found', 'Không có địa chỉ này.');
    }

    // ── admin: quản lý người chơi (trang /admin/games) ──
    if (path === '/admin/stats' || path === '/admin/players' || path.startsWith('/admin/players/')) {
      const admin = await getAdminEmail(db, req);
      if (!admin) return err(res, 401, 'unauthorized', 'Phiên đăng nhập admin đã hết.');
      const nowMs = Date.now();
      const one = async (sql, args = []) => { const r = await db.execute({ sql, args }); return r.rows[0] || {}; };

      if (method === 'GET' && path === '/admin/stats') {
        const a = await one(`SELECT count(*) AS saves, sum(CASE WHEN updated_at > ? THEN 1 ELSE 0 END) AS d1, sum(CASE WHEN updated_at > ? THEN 1 ELSE 0 END) AS d7,
            sum(flagged) AS flagged, sum(cheat) AS cheat, avg(level) AS avg_level, max(level) AS max_level, sum(money_earned) AS money, sum(pots_sold) AS pots
            FROM game_saves WHERE game = ?`, [nowMs - 864e5, nowMs - 7 * 864e5, GAME]);
        const h = await one(`SELECT count(*) AS n FROM players p JOIN game_saves g ON g.player_id = p.id AND g.game = ? WHERE p.hidden = 1`, [GAME]);
        const acc = await one('SELECT count(*) AS n FROM players');
        const lv = await db.execute({ sql: `SELECT CASE WHEN level <= 5 THEN '1–5' WHEN level <= 10 THEN '6–10' WHEN level <= 15 THEN '11–15' WHEN level <= 20 THEN '16–20'
            WHEN level <= 30 THEN '21–30' ELSE '31+' END AS b, count(*) AS n FROM game_saves WHERE game = ? GROUP BY b`, args: [GAME] });
        const order = ['1–5', '6–10', '11–15', '16–20', '21–30', '31+'];
        const codes = await one(`SELECT count(*) AS n, sum(CASE WHEN disabled = 0 AND (expires_at IS NULL OR expires_at > ?) AND (max_uses IS NULL OR uses < max_uses) THEN 1 ELSE 0 END) AS live
            FROM gift_codes WHERE game IN (?, '*')`, [nowMs, GAME]);
        const red = await one(`SELECT count(*) AS n, sum(CASE WHEN created_at > ? THEN 1 ELSE 0 END) AS d7 FROM gift_redemptions WHERE game = ?`, [nowMs - 7 * 864e5, GAME]);
        return send(res, 200, {
          game: GAME, accounts: num(acc.n), saves: num(a.saves), active1d: num(a.d1), active7d: num(a.d7), flagged: num(a.flagged), cheat: num(a.cheat), hidden: num(h.n),
          avgLevel: Math.round(num(a.avg_level) * 10) / 10, maxLevel: num(a.max_level), moneyEarned: num(a.money), potsSold: num(a.pots),
          levels: order.map((b) => ({ band: b, n: num((lv.rows.find((r) => r.b === b) || {}).n) })),
          codes: num(codes.n), codesLive: num(codes.live), redemptions: num(red.n), redemptions7d: num(red.d7),
        });
      }

      if (method === 'GET' && path === '/admin/players') {
        const q = String(url.searchParams.get('q') || '').trim().toLowerCase().slice(0, 60);
        const filter = String(url.searchParams.get('filter') || 'all');
        const SORT = { money: 'g.money_earned DESC', level: 'g.level DESC, g.xp DESC', recent: 'g.updated_at DESC', pots: 'g.pots_sold DESC', new: 'p.id DESC' };
        const sort = SORT[url.searchParams.get('sort')] || SORT.recent;
        const limit = Math.max(1, Math.min(200, Math.floor(num(url.searchParams.get('limit'), 50))));
        const offset = Math.max(0, Math.floor(num(url.searchParams.get('offset'), 0)));
        const where = ['1 = 1'], args = [GAME];
        if (q) { where.push('(lower(p.email) LIKE ? OR lower(p.name) LIKE ? OR lower(g.shop_name) LIKE ? OR CAST(p.id AS TEXT) = ?)'); args.push('%' + q + '%', '%' + q + '%', '%' + q + '%', q); }
        if (filter === 'flagged') where.push('g.flagged = 1');
        else if (filter === 'hidden') where.push('p.hidden = 1');
        else if (filter === 'cheat') where.push('g.cheat = 1');
        const base = `FROM players p JOIN game_saves g ON g.player_id = p.id AND g.game = ? WHERE ${where.join(' AND ')}`;
        const total = await one('SELECT count(*) AS n ' + base, args);
        const rs = await db.execute({
          sql: `SELECT p.id, p.email, p.name, p.picture, p.hidden, p.created_at, p.last_login, g.shop_name, g.level, g.xp, g.day, g.money_earned, g.pots_sold,
                       g.cheat, g.flagged, g.flag_reason, g.updated_at ${base} ORDER BY ${sort} LIMIT ${limit} OFFSET ${offset}`,
          args,
        });
        return send(res, 200, { total: num(total.n), players: rs.rows.map((r) => ({
          id: num(r.id), email: r.email || '', name: r.name || '', picture: r.picture || '', hidden: !!num(r.hidden), createdAt: r.created_at, lastLogin: r.last_login,
          shopName: r.shop_name, level: num(r.level), xp: num(r.xp), day: num(r.day), moneyEarned: num(r.money_earned), potsSold: num(r.pots_sold),
          cheat: !!num(r.cheat), flagged: !!num(r.flagged), flagReason: r.flag_reason || '', updatedAt: num(r.updated_at),
        })) });
      }

      const m = path.match(/^\/admin\/players\/(\d+)$/);
      if (!m) return err(res, 404, 'not_found', 'Không có địa chỉ này.');
      const id = Number(m[1]);
      const pl = await one('SELECT id, email, name, picture, hidden, created_at, last_login FROM players WHERE id = ?', [id]);
      if (!pl.id) return err(res, 404, 'not_found', 'Không tìm thấy người chơi này.');

      if (method === 'GET') {
        const saves = await db.execute({ sql: `SELECT game, shop_name, level, xp, day, money_earned, pots_sold, cheat, flagged, flag_reason, updated_at, client_saved_at
            FROM game_saves WHERE player_id = ?`, args: [id] });
        const backups = await db.execute({ sql: `SELECT id, game, level, money_earned, client_saved_at, created_at FROM game_save_backups WHERE player_id = ? ORDER BY id DESC LIMIT 40`, args: [id] });
        const reds = await db.execute({ sql: 'SELECT code, game, money, xp, created_at FROM gift_redemptions WHERE player_id = ? ORDER BY created_at DESC LIMIT 100', args: [id] });
        return send(res, 200, {
          player: { id: num(pl.id), email: pl.email || '', name: pl.name || '', picture: pl.picture || '', hidden: !!num(pl.hidden), createdAt: pl.created_at, lastLogin: pl.last_login },
          saves: saves.rows.map((r) => ({ game: r.game, shopName: r.shop_name, level: num(r.level), xp: num(r.xp), day: num(r.day), moneyEarned: num(r.money_earned),
            potsSold: num(r.pots_sold), cheat: !!num(r.cheat), flagged: !!num(r.flagged), flagReason: r.flag_reason || '', updatedAt: num(r.updated_at), savedAt: num(r.client_saved_at) || null })),
          backups: backups.rows.map((r) => ({ id: num(r.id), game: r.game, level: num(r.level), moneyEarned: num(r.money_earned), savedAt: num(r.client_saved_at) || null, createdAt: num(r.created_at) })),
          redemptions: reds.rows.map((r) => ({ code: r.code, game: r.game, money: num(r.money), xp: num(r.xp), createdAt: num(r.created_at) })),
        });
      }

      if (method === 'POST') {
        const body = await parseBody(req);
        if ('hidden' in body) await db.execute({ sql: 'UPDATE players SET hidden = ? WHERE id = ?', args: [body.hidden ? 1 : 0, id] });
        if ('flagged' in body) await db.execute({ sql: 'UPDATE game_saves SET flagged = ?, flag_reason = CASE WHEN ? = 1 THEN COALESCE(flag_reason, ?) ELSE NULL END WHERE player_id = ? AND game = ?', args: [body.flagged ? 1 : 0, body.flagged ? 1 : 0, 'Admin đánh dấu', id, GAME] });
        if ('cheat' in body) await db.execute({ sql: 'UPDATE game_saves SET cheat = ? WHERE player_id = ? AND game = ?', args: [body.cheat ? 1 : 0, id, GAME] });
        if (body.restoreBackup != null) {
          // Lấy bản sao lưu cũ làm bản trên mạng. Bản hiện tại được cất vào sao lưu trước, nên làm lại được.
          const b = await one('SELECT * FROM game_save_backups WHERE id = ? AND player_id = ? AND game = ?', [Math.floor(num(body.restoreBackup)), id, GAME]);
          if (!b.id) return err(res, 404, 'not_found', 'Không có bản sao lưu này.');
          let save = null;
          try { save = JSON.parse(String(b.data)); } catch { save = null; }
          const sum = saveSummary(save, GAME);
          if (!sum) return err(res, 400, 'invalid', 'Bản sao lưu này bị hỏng, không khôi phục được.');
          const cur = await one('SELECT data, client_saved_at, level, money_earned FROM game_saves WHERE player_id = ? AND game = ?', [id, GAME]);
          if (cur.data) {
            await db.execute({ sql: 'INSERT INTO game_save_backups (player_id, game, data, client_saved_at, level, money_earned, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
              args: [id, GAME, String(cur.data), cur.client_saved_at, cur.level, cur.money_earned, nowMs] });
          }
          await db.execute({
            sql: `INSERT INTO game_saves (player_id, game, data, client_saved_at, updated_at, shop_name, avatar, level, xp, money_earned, pots_sold, day, cheat, flagged, flag_reason)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL)
                  ON CONFLICT(player_id, game) DO UPDATE SET data = excluded.data, client_saved_at = excluded.client_saved_at, updated_at = excluded.updated_at,
                    shop_name = excluded.shop_name, avatar = excluded.avatar, level = excluded.level, xp = excluded.xp, money_earned = excluded.money_earned,
                    pots_sold = excluded.pots_sold, day = excluded.day, cheat = excluded.cheat`,
            args: [id, GAME, String(b.data), sum.client_saved_at, nowMs, sum.shop_name, sum.avatar, sum.level, sum.xp, sum.money_earned, sum.pots_sold, sum.day, sum.cheat],
          });
        }
        if (body.deleteSave) {
          await db.execute({ sql: 'DELETE FROM game_save_backups WHERE player_id = ? AND game = ?', args: [id, GAME] });
          await db.execute({ sql: 'DELETE FROM game_saves WHERE player_id = ? AND game = ?', args: [id, GAME] });
        }
        if (body.deleteAccount) {
          for (const t of ['game_save_backups', 'game_saves', 'gift_redemptions']) await db.execute({ sql: `DELETE FROM ${t} WHERE player_id = ?`, args: [id] });
          await db.execute({ sql: 'DELETE FROM players WHERE id = ?', args: [id] });
        }
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

    // v1.25b admin đổi ảnh avatar (ảnh vuông nhỏ đã nén ở máy, data:image/...;base64). image = null → bỏ ảnh riêng
    if (method === 'POST' && path === '/admin-pic') {
      if (!isAdminPlayerEmail(p.email)) return err(res, 403, 'forbidden', 'Chỉ tài khoản admin mới đổi được ảnh này.');
      const b = await parseBody(req);
      const img = b && b.image == null ? null : String((b && b.image) || '');
      if (img !== null && (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(img) || img.length > 1500000)) return err(res, 400, 'bad_image', 'Ảnh không hợp lệ hoặc quá lớn (tối đa ~1MB sau khi nén).');   // v1.25d nâng giới hạn ~100KB → ~1MB
      await db.execute({ sql: 'UPDATE players SET admin_pic = ? WHERE id = ?', args: [img, pid] });
      return send(res, 200, { ok: true, adminPic: img || '' });
    }

    if (method === 'GET' && path === '/auth/me') {
      return send(res, 200, { player: publicPlayer(p), cloud: meta(await cloudRow(db, pid, GAME)) });
    }

    // ── v1.13: đổi mã quà tặng ──
    if (method === 'POST' && path === '/code/redeem') {
      const b = await parseBody(req);
      const code = cleanCode(b.code);
      if (code.length < 3) return err(res, 400, 'invalid', 'Mã chưa đúng, kiểm tra lại nha.');
      // chống dò mã: tối đa 10 lần nhập sai / 10 phút / tài khoản (đếm trong bảng giới hạn nhẹ trong bộ nhớ function)
      const key = pid + ':' + GAME, now = Date.now();
      const tries = (FAILS.get(key) || []).filter((t) => now - t < 10 * 60e3);
      if (tries.length >= 10) return err(res, 429, 'too_many', 'Nhập sai nhiều quá, đợi 10 phút rồi thử lại nha.');
      const fail = (status, code2, msg) => { tries.push(now); FAILS.set(key, tries); return err(res, status, code2, msg); };
      const rs = await db.execute({ sql: 'SELECT * FROM gift_codes WHERE code = ?', args: [code] });
      const c = rs.rows[0];
      if (!c || num(c.disabled) || (c.game !== '*' && c.game !== GAME)) return fail(404, 'not_found', 'Mã không đúng hoặc không dùng được cho game này.');
      if (c.for_email && c.for_email !== String(p.email || '').toLowerCase()) return fail(403, 'not_yours', 'Mã này là quà riêng cho một tài khoản khác nha.');   // v1.28
      const had = await db.execute({ sql: 'SELECT 1 FROM gift_redemptions WHERE code = ? AND player_id = ? AND game = ?', args: [code, pid, GAME] });
      if (had.rows.length) return err(res, 409, 'redeemed', 'Bạn đã nhận quà của mã này rồi nha.');
      if (c.expires_at != null && num(c.expires_at) < now) return fail(410, 'expired', 'Mã này hết hạn rồi.');
      if (c.max_uses != null && num(c.uses) >= num(c.max_uses)) return fail(410, 'used_up', 'Mã này đã hết lượt dùng.');
      const upd = await db.execute({
        sql: 'UPDATE gift_codes SET uses = uses + 1 WHERE code = ? AND disabled = 0 AND (max_uses IS NULL OR uses < max_uses)',
        args: [code],
      });
      if (upd.rowsAffected === 0) return fail(410, 'used_up', 'Mã này đã hết lượt dùng.');
      try {
        await db.execute({
          sql: 'INSERT INTO gift_redemptions (code, player_id, game, money, xp, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          args: [code, pid, GAME, num(c.money), num(c.xp), now],
        });
      } catch (e) {   // nhập 2 lần cùng lúc: lần sau trả lại lượt dùng
        await db.execute({ sql: 'UPDATE gift_codes SET uses = uses - 1 WHERE code = ?', args: [code] });
        return err(res, 409, 'redeemed', 'Bạn đã nhận quà của mã này rồi nha.');
      }
      return send(res, 200, { ok: true, code, money: num(c.money), xp: num(c.xp), note: c.note || '' });
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
      const row = await cloudRow(db, pid, GAME, true);
      if (!row) return send(res, 200, { save: null, cloud: null });
      let save = null;
      try { save = JSON.parse(String(row.data)); } catch { save = null; }
      return send(res, 200, { save, cloud: meta(row) });
    }

    if (method === 'PUT' && path === '/save') {
      const body = await parseBody(req);
      const save = body && body.save;
      const sum = saveSummary(save, GAME);
      if (!sum) return err(res, 400, 'invalid', 'Tiến trình không hợp lệ.');
      const data = JSON.stringify(save);
      if (Buffer.byteLength(data) > MAX_SAVE_BYTES) return err(res, 413, 'too_big', 'Tiến trình quá lớn.');
      const nowMs = Date.now();
      const prev = await cloudRow(db, pid, GAME, true);
      if (prev && !body.force && nowMs - num(prev.updated_at) < MIN_PUT_GAP_MS) {
        return err(res, 429, 'too_fast', 'Vừa lưu xong, đợi chút nha.');
      }
      // Máy khác đã lưu lên sau lần đồng bộ cuối của máy này (base) → không ghi đè, để trò chơi xử lý.
      if (prev && !body.force && body.base != null && num(prev.updated_at) > num(body.base)) {
        return send(res, 409, { error: 'conflict', message: 'Trên mạng có bản mới hơn.', cloud: meta(prev) });
      }
      const giftRow = await db.execute({
        sql: 'SELECT COALESCE(sum(money), 0) AS m FROM gift_redemptions WHERE player_id = ? AND game = ? AND created_at > ?',
        args: [pid, GAME, prev ? num(prev.updated_at) - 60e3 : 0],
      });
      // Tài khoản admin được tự chỉnh cấp / tiền để thử tính năng → không đánh dấu nghi gian lận, vẫn hiện trên bảng xếp hạng (kèm chữ ADMIN)
      const adminAcct = isAdminPlayerEmail(p.email);
      const reason = adminAcct || num(prev && prev.flagged) ? null : suspicious(prev, sum, nowMs, num(giftRow.rows[0] && giftRow.rows[0].m));
      const flagged = !adminAcct && (num(prev && prev.flagged) || reason) ? 1 : 0;
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
      try { await db.execute({ sql: 'UPDATE game_saves SET badge = ? WHERE player_id = ? AND game = ?', args: [sum.badge, pid, GAME] }); } catch (e) { /* cột cũ chưa có: bỏ qua */ }   // v1.18
      return send(res, 200, { ok: true, cloud: meta({ ...sum, updated_at: nowMs }), listed: !flagged && !sum.cheat && !num(p.hidden) });
    }

    return err(res, 404, 'not_found', 'Không có địa chỉ này.');
  } catch (e) {
    console.error('[lau] error', e);
    return err(res, 500, 'server_error', 'Máy chủ gặp lỗi. Thử lại sau nha.');
  }
}
