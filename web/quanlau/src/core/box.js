// v1.18 Hộp mù (tab Quán ▸ Giải trí). Rút hộp → 1 món sưu tầm theo độ hiếm (C.BOX).
// Món mới: mở luôn (món ăn bán được ngay, màu áo / kiểu chủ quán chọn được, thẻ thành tích đeo được).
// Món trùng: đổi ra mảnh. Gom mảnh đổi món còn thiếu. Bảo hiểm Hiếm (10 hộp) và Bí ẩn (150 hộp).
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
  if (!(b.freeDay >= 0)) b.freeDay = 0;                   // ngày (s.day) đã mở hộp miễn phí
  if (!(b.spent >= 0)) b.spent = 0;
  if (b.badge && !C.badgeOf(b.badge)) b.badge = null;
  if (b.pot && !C.POT_SKINS[b.pot]) b.pot = null;           // kiểu nồi đang dùng (ref trong C.POT_SKINS)
  if (b.table && !C.TABLE_SKINS[b.table]) b.table = null;   // kiểu bàn đang dùng
  if (!Array.isArray(b.log)) b.log = [];                  // 20 món gần nhất
  return b;
}

export const boxPrice = (G) => B().price[Math.max(0, Math.min(B().price.length - 1, (G.state.tier || 1) - 1))];

function rollRarity(G, b) {
  if (b.sinceMyst + 1 >= B().pityMyst) return 4;
  if (b.sinceRare + 1 >= B().pityRare) {   // bảo hiểm: Hiếm trở lên (giữ tỉ lệ tương đối giữa Hiếm / Cực hiếm / Bí ẩn)
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
    if (item.kind === 'deco' && s.deco && Array.isArray(s.deco.owned) && !s.deco.owned.includes(item.ref)) s.deco.owned.push(item.ref);
  }
  return { id: item.id, r: item.r, dup, shards };
}

function rollOne(G) {
  const b = boxState(G.state);
  const r = rollRarity(G, b);
  const pool = B().items.filter((x) => x.r === r);
  const item = G.rng.pick(pool);
  b.opened++;
  b.sinceRare = r >= 2 ? 0 : b.sinceRare + 1;
  b.sinceMyst = r >= 4 ? 0 : b.sinceMyst + 1;
  return grant(G, item);
}

/** Mở n hộp (1 hoặc 10). free = hộp miễn phí trong ngày. */
export function openBox(G, n = 1, free = false) {
  const s = G.state, b = boxState(s);
  if (!featureUnlocked(G, 'blindbox')) return fail('locked', `Hộp mù mở ở Lv ${C.FEATURES.blindbox} nha!`);
  n = n === 10 ? 10 : 1;
  let cost = 0;
  if (free) {
    if (n !== 1) return fail('free', 'Hộp miễn phí chỉ 1 hộp thôi nha.');
    if (b.freeDay === s.day) return fail('freeUsed', 'Hôm nay mở hộp miễn phí rồi, mai quay lại nha!');
  } else {
    cost = boxPrice(G) * (n === 10 ? B().tenMult : 1);
    if (s.money + 1e-9 < cost) return fail('money', `Cần ${fmtMoney(cost)} để mở ${n} hộp, chưa đủ tiền nha.`);
  }
  if (free) b.freeDay = s.day;
  else { spend(G, 'box', cost, 'box'); b.spent += cost; }
  const got = [];
  for (let i = 0; i < n; i++) got.push(rollOne(G));
  b.log = got.map((x) => x.id).concat(b.log).slice(0, 20);
  G.counter('boxOpened', n);
  G.emit('boxOpened', { got, cost, free });
  return { ok: true, got, cost, free, shards: b.shards };
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
  if (!it || !['badge', 'pot', 'table'].includes(it.kind)) return fail('unknown', 'Món này không đeo được.');
  if (!(b.got[id] > 0)) return fail('locked', 'Chưa có món này, rút Hộp mù để nhận nha.');
  const key = it.kind === 'badge' ? 'badge' : it.kind, val = it.kind === 'badge' ? id : it.ref;
  b[key] = on ? val : null;
  G.emit('boxEquip', { kind: it.kind, id, on });
  return { ok: true, kind: it.kind, on };
}
export const setBadge = (G, id) => (id == null ? (boxState(G.state).badge = null, { ok: true }) : equipBox(G, id, true));

export function boxInfo(G) {
  const s = G.state, b = boxState(s);
  const total = B().items.length, owned = B().items.filter((x) => b.got[x.id] > 0).length;
  return {
    unlocked: featureUnlocked(G, 'blindbox'), price: boxPrice(G), price10: boxPrice(G) * B().tenMult,
    freeLeft: b.freeDay === s.day ? 0 : 1, shards: b.shards, opened: b.opened, owned, total,
    rareIn: Math.max(1, B().pityRare - b.sinceRare), mystIn: Math.max(1, B().pityMyst - b.sinceMyst),
    got: Object.assign({}, b.got), badge: b.badge || null, pot: b.pot || null, table: b.table || null, spent: b.spent,
  };
}
