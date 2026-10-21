// v1.8 Đăng nhập Google + lưu tiến trình lên mạng + bảng xếp hạng.
// v1.8b: BẮT BUỘC đăng nhập để chơi (màn chắn cl-gate). Chỉ khi máy chủ / mạng hỏng mới cho chơi tạm.
//
// - Đăng nhập: Google Identity Services trả về "ID token" → POST /api/lau/auth/google → server đặt cookie phiên.
// - Lúc bấm đăng nhập: quán đang chơi dở được GIỮ NGUYÊN, chơi tiếp và bắt đầu sao lưu lên mạng ngay.
//   (Chỉ khi máy này chưa có quán nào — màn mở đầu — mới lấy quán từ mạng về.) Nếu quán trên mạng cao hơn quán đang
//   chơi quá CLOUD.levelSlack cấp thì hỏi một lần, nút mặc định vẫn là "chơi tiếp quán này".
// - Sau đó mỗi máy nhớ phiên bản trên mạng nó đồng bộ lần cuối (base). Máy khác lưu lên sau đó → mở game lần sau
//   tự lấy bản mới hơn về (nếu máy này không chơi gì thêm từ lần đồng bộ cuối); cả hai cùng có thay đổi → hỏi.
//   Bản bị thay luôn được giữ lại: trên máy (lau-oi/save/prev) và trên server (game_save_backups, 10 bản).
import * as C from '../config.js';
import { h, div, span, ico } from './dom.js';
import { ctx, S, sfx } from './ctx.js';
import { frame } from './modals.js';
import { writeSave } from '../storage.js';
import { fmtShort } from '../core/format.js';

const CL = C.CLOUD;
const GIS_SRC = 'https://accounts.google.com/gsi/client';
const SEEN_KEY = 'lau-oi/cloud/seen';     // máy này từng đăng nhập → kiểm tra phiên ngay khi mở game
const PREV_KEY = 'lau-oi/save/prev';
const SYNC_KEY = 'lau-oi/cloud/sync';   // { pid, base (updatedAt trên mạng), sig (quán lúc đồng bộ) }

const st = {
  ready: false, offline: false, player: null, cloud: null,
  busy: false, lastUpload: 0, lastSig: '', lastErr: '', listeners: new Set(),
};
const emit = () => { for (const f of st.listeners) { try { f(); } catch (e) { /* ignore */ } } };
const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* ignore */ } };

async function api(method, path, body, opts = {}) {
  const init = { method, credentials: 'same-origin', headers: {}, keepalive: !!opts.keepalive };
  if (method !== 'GET') { init.headers['X-MeeGame'] = '1'; init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(body || {}); }
  let r;
  const [route, query] = path.replace(/^\//, '').split('?');
  const href = CL.api + '?r=' + encodeURIComponent(route) + (query ? '&' + query : '');   // một function duy nhất: /api/lau?r=…
  try { r = await fetch(href, init); } catch (e) { return { status: 0, json: null }; }
  let json = null;
  try { json = await r.json(); } catch (e) { /* not json: no API here */ }
  return { status: r.status, json };
}

// ───────────── Google button ─────────────
let gisP = null;
function loadGis() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (!gisP) {
    gisP = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = GIS_SRC; s.async = true; s.defer = true;
      s.onload = () => (window.google?.accounts?.id ? res(window.google) : rej(new Error('gis')));
      s.onerror = () => { gisP = null; rej(new Error('gis')); };
      document.head.appendChild(s);
    });
  }
  return gisP;
}
let gisInit = false;
async function renderGoogleButton(box, { big = false } = {}) {
  try {
    const g = await loadGis();
    if (!gisInit) {
      g.accounts.id.initialize({
        client_id: CL.clientId, callback: (resp) => signIn(resp && resp.credential),
        ux_mode: 'popup', auto_select: false, cancel_on_tap_outside: true, context: 'signin', itp_support: true,
      });
      gisInit = true;
    }
    box.textContent = '';
    g.accounts.id.renderButton(box, { type: 'standard', theme: big ? 'filled_blue' : 'outline', size: 'large', text: big ? 'continue_with' : 'signin_with', shape: 'pill', locale: 'vi', logo_alignment: 'left', width: Math.min(big ? 340 : 280, Math.max(200, box.clientWidth || 260)) });
  } catch (e) {
    box.textContent = '';
    box.appendChild(span('muted sm', 'Chưa tải được nút Google. Kiểm tra mạng rồi tải lại trang nha.'));
  }
}

// ───────────── session ─────────────
export async function signIn(credential) {
  if (!credential) return;
  st.busy = true; emit();
  const r = await api('POST', '/auth/google', { credential });
  st.busy = false;
  if (r.status !== 200 || !r.json?.player) {
    st.lastErr = r.json?.message || ('Đăng nhập chưa được (mã lỗi ' + r.status + '), thử lại nha.');
    ctx.toast(st.lastErr, 'bad'); emit(); return;
  }
  st.player = r.json.player; st.cloud = r.json.cloud; st.lastErr = '';
  lsSet(SEEN_KEY, '1');
  closeGate();
  sfx('confirm');
  ctx.toast('Đã đăng nhập ' + (st.player.email || st.player.name) + '!', 'good', 'ui_check');
  emit();
  await reconcile('login');
}

export async function signOut() {
  await syncNow('logout');
  await api('POST', '/auth/logout', {});
  try { window.google?.accounts?.id?.disableAutoSelect?.(); } catch (e) { /* ignore */ }
  st.player = null; st.cloud = null; lsSet(SEEN_KEY, null);
  ctx.toast('Đã đăng xuất. Đăng nhập lại để chơi tiếp nha.', 'info', 'ui_info');
  emit();
  ctx.closeModals?.(); ctx.closeSheet?.();
  openGate();
}

// ───────────── màn chắn: phải đăng nhập mới chơi tiếp ─────────────
let gateEl = null;
export function openGate({ offline = false } = {}) {
  if (gateEl || st.player) return;
  try { ctx.pauseFor('gate'); } catch (e) { /* ignore */ }
  const started = !!S().started;
  const gbtn = div('cl-gate-g', span('muted sm', 'Đang tải nút Google…'));
  const errEl = span('bk-err', '');
  const small = (label, fn) => h('button', { class: 'cl-gate-alt', type: 'button', onclick: () => { sfx('click'); fn(); } }, label);
  const alts = div('cl-gate-alts',
    small('Có mã sao lưu? Khôi phục quán cũ ▸', () => {
      import('./backup.js').then((m) => {
        const coach = document.getElementById('coach-root');
        const back = (on) => { gateEl && gateEl.classList.toggle('behind', on); coach && coach.classList.toggle('behind', on); };
        back(true);
        if (!m.openRestore({ onClose: () => back(false) })) back(false);
      });
    }),
    offline ? small('Mất mạng? Chơi tạm, đăng nhập sau ▸', () => closeGate()) : null,
    h('a', { class: 'cl-gate-alt', href: '/privacy', target: '_blank', rel: 'noopener' }, 'Chính sách bảo mật'));
  const card = div('cl-gate-card',
    h('b', { class: 'cl-gate-t' }, 'Lẩu Ơi!'),
    span('cl-gate-s', started
      ? 'Đăng nhập Google để chơi tiếp. Quán đang chơi được giữ nguyên và tự sao lưu lên mạng.'
      : 'Đăng nhập Google để bắt đầu. Quán được lưu trên mạng, đổi máy vẫn chơi tiếp.'),
    gbtn, errEl,
    offline ? span('bk-err', 'Chưa kết nối được máy chủ MeeGame.') : null,
    span('muted xs cl-gate-note', 'Game chỉ lấy tên, email, ảnh đại diện để nhận ra bạn. Bảng xếp hạng chỉ hiện tên quán.'),
    alts);
  const upd = () => { if (!gateEl) { st.listeners.delete(upd); return; } errEl.textContent = st.busy ? 'Đang đăng nhập…' : (st.lastErr || ''); };
  st.listeners.add(upd);
  gateEl = div('cl-gate', card);
  (document.getElementById('app') || document.body).appendChild(gateEl);
  requestAnimationFrame(() => renderGoogleButton(gbtn, { big: true }));
}
function closeGate() {
  if (!gateEl) return;
  gateEl.remove(); gateEl = null;
  try { ctx.resumeFor('gate'); } catch (e) { /* ignore */ }
}

// ───────────── sync ─────────────
// "Có chơi thêm không": chỉ tính tiến trình thật — tiền chi nhánh tự chảy về khi để máy mở không tính là đã chơi.
const sum = (o) => Object.values(o || {}).reduce((a, v) => a + (Number(v) || 0), 0);
const sigOf = (s) => [s.day, s.phase, s.level, Math.floor(s.xp || 0), s.tier, s.stats?.potsSold, s.stats?.served, s.shopName,
  sum(s.upgrades), (s.deco?.owned || []).length, sum(s.branches), s.location, (s.staff || []).length].join('|');
function syncRec() { try { const o = JSON.parse(lsGet(SYNC_KEY) || 'null'); return o && st.player && o.pid === st.player.id ? o : null; } catch (e) { return null; } }
function setSync(base, sig) { if (st.player) lsSet(SYNC_KEY, JSON.stringify({ pid: st.player.id, base, sig })); }
const localSummary = (s) => ({ level: s.level || 1, day: s.day || 1, money: s.money || 0, savedAt: s.savedAt || 0, shopName: s.shopName });

function applyCloudSave(save, why) {
  try { const cur = ctx.game.serialize(); if (cur && cur.started) lsSet(PREV_KEY, JSON.stringify(cur)); } catch (e) { /* ignore */ }
  try { ctx.game.serialize = () => save; } catch (e) { /* ignore */ }   // autosave / pagehide must not write the old game back
  writeSave(save).then((ok) => {
    if (!ok) { ctx.toast('Trình duyệt đang chặn lưu dữ liệu nên chưa lấy được quán từ mạng.', 'bad'); return; }
    ctx.toast(why || 'Đã lấy quán từ mạng! Đang mở lại…', 'good', 'ui_check');
    setTimeout(() => { try { location.reload(); } catch (e) { /* ignore */ } }, 800);
  });
}

async function download(why) {
  const r = await api('GET', '/save');
  if (r.status !== 200 || !r.json?.save) { ctx.toast('Chưa tải được quán trên mạng, thử lại sau nha.', 'bad'); return; }
  setSync(r.json.cloud && r.json.cloud.updatedAt, sigOf(r.json.save));
  applyCloudSave(r.json.save, why);
}

/** Upload now (force = the player chose this copy over the cloud one). */
export async function upload({ force = false, keepalive = false } = {}) {
  const s = S();
  if (!st.player || !s.started || st.busy) return false;
  const save = ctx.game.serialize();
  if (!save) return false;
  st.busy = !keepalive;
  const rec = syncRec();
  const r = await api('PUT', '/save', { save, force, base: rec ? rec.base : null }, { keepalive });
  st.busy = false;
  if (r.status === 200) {
    st.cloud = r.json.cloud; st.lastUpload = Date.now(); st.lastSig = sigOf(s); st.lastErr = '';
    setSync(st.cloud.updatedAt, st.lastSig);
    st.listed = r.json.listed;
    emit(); return true;
  }
  if (r.status === 401) { st.player = null; lsSet(SEEN_KEY, null); emit(); return false; }
  if (r.status === 409) { st.cloud = r.json?.cloud || st.cloud; emit(); await reconcile('conflict'); return false; }
  if (r.status === 429) return false;
  st.lastErr = r.status === 0 ? 'Mất mạng, sẽ lưu lại sau.' : (r.json?.message || 'Chưa lưu lên mạng được.');
  emit(); return false;
}

export async function syncNow(why) {
  if (!st.player) return false;
  return upload({ keepalive: why === 'hidden' || why === 'logout' });
}

function askPick(local, cloud) {
  ctx.confirm({
    title: 'Trên mạng có quán khác', icon: 'ui_chest_gold', yes: 'Chơi tiếp quán này', no: 'Lấy quán trên mạng',
    text: `Đang chơi: ${local.shopName || 'Quán'}, cấp ${local.level}, ngày ${local.day}. Trên mạng: ${cloud.shopName || 'Quán'}, cấp ${cloud.level}, ngày ${cloud.day}. `
      + 'Chọn "Chơi tiếp" thì quán đang chơi được sao lưu lên mạng; quán cũ trên mạng vẫn được cất lại để khôi phục khi cần.',
    onYes: () => upload({ force: true }),
    onNo: () => download('Đã lấy quán từ mạng! Đang mở lại…'),
  });
}

/** Which copy wins: at login the game being played is kept; later, the cloud copy wins only if this device
 *  has not played since its last sync (otherwise ask). */
export async function reconcile(why) {
  const s = S();
  if (!st.player) return;
  if (why !== 'login') {
    const me = await api('GET', '/auth/me');
    if (me.status !== 200) { if (me.status === 401) { st.player = null; emit(); } return; }
    st.cloud = me.json.cloud;
  }
  const cloud = st.cloud;
  if (!s.started) { if (cloud) download('Đã lấy quán ' + (cloud.shopName || '') + ' từ mạng! Đang mở…'); return; }
  const local = localSummary(ctx.game.serialize() || s);
  const slack = CL.levelSlack;
  if (!cloud) {
    if (await upload({ force: true })) ctx.toast('Đã sao lưu quán lên mạng! Cứ chơi tiếp, game tự lưu.', 'good', 'ui_check');
    return;
  }
  const rec = syncRec();
  if (why === 'login' || !rec) {
    // Vừa đăng nhập: giữ quán đang chơi, sao lưu luôn. Chỉ hỏi khi quán trên mạng cao hơn hẳn.
    if (cloud.level > local.level + slack) { askPick(local, cloud); return; }
    if (await upload({ force: true })) ctx.toast('Đã sao lưu quán lên mạng! Cứ chơi tiếp, game tự lưu.', 'good', 'ui_check');
    return;
  }
  const cloudMoved = (cloud.updatedAt || 0) > (rec.base || 0);
  const localMoved = sigOf(s) !== rec.sig;
  if (!cloudMoved) { if (localMoved) upload(); else st.lastSig = sigOf(s); return; }
  if (!localMoved) { download(`Máy khác vừa lưu quán (cấp ${cloud.level}). Đang lấy bản mới nhất…`); return; }
  // cả hai cùng có thay đổi: bản lưu sau thắng, trừ khi nó thấp cấp hơn hẳn → hỏi
  const cloudAt = cloud.savedAt || cloud.updatedAt || 0;
  if (cloudAt > local.savedAt && cloud.level >= local.level - slack) download(`Lấy bản mới hơn trên mạng (cấp ${cloud.level}). Đang mở lại…`);
  else if (cloudAt <= local.savedAt && local.level >= cloud.level - slack) upload({ force: true });
  else askPick(local, cloud);
}

// ───────────── boot / timers ─────────────
export function initCloud(game) {
  const tick = () => {
    if (!st.player || st.busy || document.hidden) return;
    const s = S();
    if (!s.started) return;
    if (sigOf(s) !== st.lastSig && Date.now() - st.lastUpload > CL.syncSec * 1000) upload();
  };
  setInterval(tick, 15000);
  const soon = () => { if (st.player) setTimeout(() => upload(), 1500); };
  game.on('dayEnd', soon);
  game.on('tierUp', soon);
  document.addEventListener('visibilitychange', () => { if (document.hidden && st.player && sigOf(S()) !== st.lastSig) syncNow('hidden'); });
  // Phiên đăng nhập nằm trong cookie httpOnly (JS không đọc được) → hỏi server. Chưa đăng nhập → màn chắn.
  api('GET', '/auth/me').then((r) => {
    st.ready = true;
    if (r.status === 200 && r.json?.player) { st.player = r.json.player; st.cloud = r.json.cloud; lsSet(SEEN_KEY, '1'); emit(); reconcile('boot'); return; }
    if (r.status === 401) { lsSet(SEEN_KEY, null); emit(); openGate(); return; }
    st.offline = true; emit(); openGate({ offline: true });   // mất mạng / máy chủ lỗi: không khóa người chơi lại
  });
}

// ───────────── UI: account panel (Cài đặt + màn mở đầu) ─────────────
const timeAgo = (ms) => {
  if (!ms) return '';
  const d = Math.round((Date.now() - ms) / 60000);
  return d < 1 ? 'vừa xong' : d < 60 ? d + ' phút trước' : d < 1440 ? Math.round(d / 60) + ' giờ trước' : new Date(ms).toLocaleDateString('vi-VN');
};

export function accountPanel({ compact = false, gate = false } = {}) {
  const box = div('cl-acc');
  const add = (...k) => box.append(...k.filter(Boolean));
  const draw = () => {
    box.textContent = '';
    if (!st.player) {
      const gbtn = div('cl-gbtn', span('muted sm', 'Đang tải nút Google…'));
      add(
        gate ? null : div('set-row', ico('ui_heart', 32), div('grow', span('sl-l', 'Tài khoản Google'),
          span('muted sm', 'Đăng nhập để chơi tiếp, đổi máy vẫn giữ quán và lên bảng xếp hạng.'))),
        gbtn,
        st.lastErr ? span('bk-err', st.lastErr) : null,
        compact ? null : span('muted xs', 'Game chỉ lấy tên, email, ảnh đại diện để nhận ra bạn. Bảng xếp hạng chỉ hiện tên quán. '),
        compact ? null : h('a', { class: 'cl-link', href: '/privacy', target: '_blank', rel: 'noopener' }, 'Chính sách bảo mật'));
      requestAnimationFrame(() => renderGoogleButton(gbtn));
      return;
    }
    const p = st.player, c = st.cloud;
    const pic = p.picture ? h('img', { class: 'cl-pic', src: p.picture, alt: '', referrerpolicy: 'no-referrer', width: 40, height: 40 }) : ico('ui_heart', 32);
    const saveBtn = h('button', { class: 'btn jade sm', onclick: async () => { sfx('click'); saveBtn.disabled = true; const ok = await upload({ force: false }); saveBtn.disabled = false; ctx.toast(ok ? 'Đã lưu lên mạng!' : (st.lastErr || 'Vừa lưu rồi, đợi chút nha.'), ok ? 'good' : 'info', ok ? 'ui_check' : 'ui_info'); } }, 'Lưu ngay');
    add(
      div('set-row', pic, div('grow', h('b', null, p.name || p.email), span('muted sm', p.email || ''))),
      span('muted sm cl-stat', st.busy ? 'Đang lưu…' : c ? `Trên mạng: ${c.shopName || 'Quán'} · cấp ${c.level} · lưu ${timeAgo(c.updatedAt)}` : 'Chưa có bản trên mạng.'),
      st.lastErr ? span('bk-err', st.lastErr) : null,
      div('set-bk', saveBtn,
        h('button', { class: 'btn paper sm', onclick: () => { sfx('click'); ctx.closeModals?.(); ctx.openSheet('shop', 'rank'); } }, ico('ui_trophy', 16), 'Xếp hạng'),
        h('button', { class: 'btn paper sm', onclick: () => { sfx('click'); signOut(); } }, 'Đăng xuất')));
  };
  let shown = false;
  const fn = () => { if (shown && !box.isConnected) { st.listeners.delete(fn); return; } draw(); };
  st.listeners.add(fn);
  requestAnimationFrame(() => { shown = true; });
  draw();
  return box;
}

export function openAccount({ onClose } = {}) {
  return ctx.modal({
    id: 'account', cls: 'backup', queue: false, priority: 30, onClose,
    build: (m) => frame('Tài khoản Google', { icon: 'ui_heart', onClose: () => m.close('x') }, div('card set-card', accountPanel())),
  });
}

// ───────────── UI: bảng xếp hạng (Quán ▸ Xếp hạng) ─────────────
const BOARD = [
  { id: 'level', label: 'Cấp độ', fmt: (v) => 'Cấp ' + v },
  { id: 'money', label: 'Tiền kiếm', fmt: (v) => fmtShort(v) },
  { id: 'pots', label: 'Nồi lẩu', fmt: (v) => Math.round(v).toLocaleString('vi-VN') + ' nồi' },
];
const boardCache = {};
let boardBy = 'level';

export function leaderboardView(body, api2) {
  const seg = div('cl-seg', BOARD.map((b) => {
    const btn = h('button', { class: 'seg' + (b.id === boardBy ? ' on' : '') }, b.label);
    btn.addEventListener('click', () => { sfx('click'); boardBy = b.id; api2.rerender(); });
    return btn;
  }));
  const list = div('cl-board', span('muted sm', 'Đang tải bảng xếp hạng…'));
  body.append(seg, list);
  if (!st.player) {
    body.appendChild(div('card cl-join', div('grow', h('b', null, 'Muốn quán mình lên bảng?'), span('muted sm', 'Đăng nhập Google trong Cài đặt là quán được xếp hạng.')),
      h('button', { class: 'btn jade sm', onclick: () => { sfx('click'); openAccount(); } }, 'Đăng nhập')));
  }
  const B = BOARD.find((b) => b.id === boardBy);
  const show = (data) => {
    list.textContent = '';
    if (!data) { list.appendChild(span('muted sm', 'Chưa tải được bảng xếp hạng (cần mạng).')); return; }
    if (!data.rows.length) list.appendChild(span('muted sm', 'Chưa có quán nào trên bảng. Hãy là người đầu tiên!'));
    for (const r of data.rows) {
      list.appendChild(div('cl-row' + (r.me ? ' me' : '') + (r.rank <= 3 ? ' top' + r.rank : ''),
        span('cl-rank num', String(r.rank)),
        div('grow', h('b', null, r.shopName), boardBy !== 'level' ? span('muted sm', 'Cấp ' + r.level) : null),
        span('num cl-val', B.fmt(r.value))));
    }
    const me = data.me;
    if (me) {
      let txt;
      if (me.listed && me.rank > data.rows.length) txt = `Quán bạn đang hạng ${me.rank} (${B.fmt(me.value)}).`;
      else if (me.cheat) txt = 'Quán bạn từng dùng chế độ thử (#debug) nên không lên bảng.';
      else if (me.flagged) txt = 'Quán bạn đang chờ kiểm tra vì số liệu tăng bất thường. Liên hệ MeeGame nếu cần nha.';
      if (txt) list.appendChild(div('cl-mine', span('muted sm', txt)));
    }
  };
  const hit = boardCache[boardBy];
  if (hit && Date.now() - hit.at < 30000) { show(hit.data); return; }
  api('GET', '/leaderboard?by=' + boardBy).then((r) => {
    const data = r.status === 200 ? r.json : null;
    if (data) boardCache[boardBy] = { at: Date.now(), data };
    if (list.isConnected) show(data);
  });
}

export const cloudState = st;
