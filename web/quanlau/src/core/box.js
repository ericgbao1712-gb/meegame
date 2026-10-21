// v1.18 Hộp mù (tab Quán ▸ Giải trí). Rút → 1 món sưu tầm theo độ hiếm (C.BOX). v1.18e: Túi mù gộp vào đây.
// Món mới: mở luôn. Món trùng: ra mảnh. Gom mảnh đổi món còn thiếu.
import * as C from '../config.js';
import { fmtMoney } from './format.js';
import { spend, featureUnlocked } from './economy.js';

const fail = (reason, msg) => ({ ok: false, reason, msg });
const B = () => C.BOX;

export function boxState(s) {
  if (!s.box || typeof s.box !== 'object') s.box = {};
  const b = s.box;
  if (!b.got || typeof b.got !== 'object') b.got = {};   // id → số lần có
  if (!(b.shards >= 0)) b.shards = 0;
  if (!(b.opened >= 0)) b.opened = 0;
  if (!(b.sinceRare >= 0)) b.sinceRare = 0;               // số hộp liên tiếp chưa ra Hiếm+
  if (!(b.sinceMyst >= 0)) b.sinceMyst = 0;               // số hộp liên tiếp chưa ra Bí ẩn
  if (!(b.sinceEpic >= 0)) b.sinceEpic = 0;               // số hộp liên tiếp chưa ra Cực hiếm+
  if (!(b.freeDay >= 0)) b.freeDay = 0;                   // ngày (s.day) đã mở hộp miễn phí
  if (!(b.spent >= 0)) b.spent = 0;
  if (b.badge && !C.badgeOf(b.badge)) b.badge = null;
  if (b.pot && !C.POT_SKINS[b.pot]) b.pot = null;           // kiểu nồi đang dùng (ref trong C.POT_SKINS)
  if (b.table && !C.TABLE_SKINS[b.table]) b.table = null;   // kiểu bàn đang dùng
  if (b.chair && !C.CHAIR_SKINS[b.chair]) b.chair = null;   // v1.18h kiểu ghế đang dùng
  if (b.tform && !C.TABLE_SHAPES[b.tform]) b.tform = null;  // v1.18i dáng bàn / dáng ghế
  if (b.cform && !C.CHAIR_SHAPES[b.cform]) b.cform = null;
  if (!Array.isArray(b.log)) b.log = [];                  // 20 món gần nhất
  // v1.18e gộp Túi mù vào Hộp mù: số túi đã mở / tiền đã chi cộng dồn vào Hộp mù (một lần)
  if (b.tui && typeof b.tui === 'object') {
    b.opened += Math.max(0, b.tui.opened | 0);
    b.spent += Math.max(0, +b.tui.spent || 0);
    delete b.tui;
  }
  return b;
}
const setOf = () => 'hop';   // v1.18e chỉ còn Hộp mù
/** bộ đếm (opened, since*, freeDay, spent) của một dòng */
const ctr = (b) => b;
const SET = (set) => C.boxSet(setOf(set));

export const boxPrice = (G, set) => { const p = SET(set).price; return p[Math.max(0, Math.min(p.length - 1, (G.state.tier || 1) - 1))]; };

function rollRarity(G, b, set) {
  const P = SET(set);
  if (b.sinceMyst + 1 >= P.pityMyst) return 4;
  if (P.pityEpic && b.sinceEpic + 1 >= P.pityEpic) {
    const r = G.rng.weighted(B().rar.filter((x) => x.id >= 3), (x) => x.rate);
    return r ? r.id : 3;
  }
  if (b.sinceRare + 1 >= P.pityRare) {   // bảo hiểm: Hiếm trở lên (giữ tỉ lệ tương đối giữa Hiếm / Cực hiếm / Bí ẩn)
    const r = G.rng.weighted(B().rar.filter((x) => x.id >= 2), (x) => x.rate);
    return r ? r.id : 2;
  }
  const r = G.rng.weighted(B().rar, (x) => x.rate);
  return r ? r.id : 1;
}

function grant(G, item) {
  const s = G.state, b = boxState(s);
  const dup = (b.got[item.id] || 0) > 0;
  b.got[item.id] = (b.got[item.id] || 0) + 1;
  let shards = 0;
  if (dup) { shards = B().rar[item.r - 1].shard; b.shards += shards; }
  else {
    if (item.kind === 'food') { G.modsDirty = true; if (s.menu) s.menu[item.ref] = true; }
    if (item.kind === 'drink') G.modsDirty = true;
    if (item.kind === 'badge' && !b.badge) b.badge = item.id;   // thẻ đầu tiên tự đeo luôn
    if (item.kind === 'pot' && !b.pot) b.pot = item.ref;          // kiểu nồi / bàn đầu tiên tự dùng luôn
    if (item.kind === 'table' && !b.table) b.table = item.ref;
    if (item.kind === 'chair' && !b.chair) b.chair = item.ref;
    if (item.kind === 'tform' && !b.tform) b.tform = item.ref;
    if (item.kind === 'cform' && !b.cform) b.cform = item.ref;
    if (item.kind === 'deco' && s.deco && Array.isArray(s.deco.owned) && !s.deco.owned.includes(item.ref)) s.deco.owned.push(item.ref);
  }
  return { id: item.id, r: item.r, dup, shards };
}

function rollOne(G, set) {
  const b = ctr(boxState(G.state), set);
  const r = rollRarity(G, b, set);
  const pool = B().items.filter((x) => x.r === r && x.set === setOf(set));
  const item = G.rng.pick(pool);
  b.opened++;
  b.sinceRare = r >= 2 ? 0 : b.sinceRare + 1;
  b.sinceMyst = r >= 4 ? 0 : b.sinceMyst + 1;
  b.sinceEpic = r >= 3 ? 0 : b.sinceEpic + 1;
  return grant(G, item);
}

/** Mở n hộp (1 hoặc 10). free = hộp miễn phí trong ngày. */
export function openBox(G, n = 1, free = false, set = 'hop') {
  const s = G.state, all = boxState(s), b = ctr(all, set), P = SET(set), unit = 'hộp';
  if (!featureUnlocked(G, P.feature)) return fail('locked', `${P.name} mở ở Lv ${C.FEATURES[P.feature]} nha!`);
  n = n === 10 ? 10 : 1;
  let cost = 0;
  if (free) {
    if (n !== 1) return fail('free', `${P.name} miễn phí chỉ 1 ${unit} thôi nha.`);
    if (b.freeDay === s.day) return fail('freeUsed', `Hôm nay mở ${unit} miễn phí rồi, mai quay lại nha!`);
  } else {
    cost = boxPrice(G, set) * (n === 10 ? B().tenMult : 1);
    if (s.money + 1e-9 < cost) return fail('money', `Cần ${fmtMoney(cost)} để mở ${n} ${unit}, chưa đủ tiền nha.`);
  }
  if (free) b.freeDay = s.day;
  else { spend(G, 'box', cost, 'box'); b.spent += cost; }
  const got = [];
  for (let i = 0; i < n; i++) got.push(rollOne(G, set));
  all.log = got.map((x) => x.id).concat(all.log).slice(0, 20);
  G.counter('boxOpened', n);
  G.emit('boxOpened', { got, cost, free, set: setOf(set) });
  return { ok: true, got, cost, free, set: setOf(set), shards: all.shards };
}

/** Đổi mảnh lấy một món còn thiếu. */
export function exchangeBox(G, id) {
  const b = boxState(G.state), it = C.BOX_ITEM[id];
  if (!it) return fail('unknown', 'Không có món này.');
  if ((b.got[id] || 0) > 0) return fail('owned', 'Món này có rồi nha.');
  const cost = B().rar[it.r - 1].cost;
  if (b.shards < cost) return fail('shards', `Cần ${cost} mảnh, bạn đang có ${b.shards}.`);
  b.shards -= cost;
  const g = grant(G, it);
  G.emit('boxOpened', { got: [g], cost: 0, exchange: true });
  return { ok: true, got: [g], shards: b.shards };
}

/** Dùng / bỏ một món đeo được: thẻ thành tích (bảng xếp hạng), kiểu nồi, kiểu bàn. on=false để bỏ. */
export function equipBox(G, id, on = true) {
  const b = boxState(G.state), it = C.BOX_ITEM[id];
  if (!it || !['badge', 'pot', 'table', 'chair', 'tform', 'cform'].includes(it.kind)) return fail('unknown', 'Món này không đeo được.');
  if (!(b.got[id] > 0)) return fail('locked', 'Chưa có món này, rút Hộp mù để nhận nha.');
  const key = it.kind === 'badge' ? 'badge' : it.kind, val = it.kind === 'badge' ? id : it.ref;
  b[key] = on ? val : null;
  G.emit('boxEquip', { kind: it.kind, id, on });
  return { ok: true, kind: it.kind, on };
}
export const setBadge = (G, id) => (id == null ? (boxState(G.state).badge = null, { ok: true }) : equipBox(G, id, true));

export function boxInfo(G, set = 'hop') {
  const s = G.state, all = boxState(s), b = ctr(all, set), P = SET(set);
  const items = B().items.filter((x) => x.set === setOf(set));
  const total = items.length, owned = items.filter((x) => all.got[x.id] > 0).length;
  return {
    set: setOf(set), name: P.name, icon: P.icon, unlockLv: C.FEATURES[P.feature],
    unlocked: featureUnlocked(G, P.feature), price: boxPrice(G, set), price10: boxPrice(G, set) * B().tenMult,
    pityRare: P.pityRare, pityEpic: P.pityEpic, pityMyst: P.pityMyst,
    freeLeft: b.freeDay === s.day ? 0 : 1, shards: all.shards, opened: b.opened, owned, total,
    rareIn: Math.max(1, P.pityRare - b.sinceRare), epicIn: Math.max(1, (P.pityEpic || 0) - b.sinceEpic), mystIn: Math.max(1, P.pityMyst - b.sinceMyst),
    rareAt: b.sinceRare, epicAt: b.sinceEpic, mystAt: b.sinceMyst,
    got: Object.assign({}, all.got), badge: all.badge || null, pot: all.pot || null, table: all.table || null, chair: all.chair || null, tform: all.tform || null, cform: all.cform || null, spent: b.spent,
  };
}
