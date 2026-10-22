// Money, XP/levels/unlocks, prices, market, stock, modifiers (TECH_SPEC §6.7, §6.11, §6.12).
import * as C from '../config.js';
import { clamp, round2 } from './util.js';
import { fmtMoney } from './format.js';

export const ING = Object.fromEntries(C.INGREDIENTS.map((i) => [i.id, i]));
export const POT = Object.fromEntries(C.HOTPOTS.map((p) => [p.id, p]));
export const DRINK = Object.fromEntries(C.DRINKS.map((d) => [d.id, d]));
export const UP = Object.fromEntries(C.UPGRADES.map((u) => [u.id, u]));
export const DECO_BY_ID = Object.fromEntries(C.DECO.map((d) => [d.id, d]));
export const BRANCH_BY_ID = Object.fromEntries(C.BRANCHES.map((b) => [b.id, b]));
export const MARKETING_BY_ID = Object.fromEntries(C.MARKETING.map((m) => [m.id, m]));

export const FEATURE_NAMES = {
  deco: 'Trang trí quán', daily: 'Nhiệm vụ hằng ngày', reservations: 'Đặt bàn trước', mkt_reviewer: 'Mời Food Reviewer',
  mkt_livestream: 'Livestream bán hàng', speed2: 'Tốc độ ×2', manageMode: 'Chế độ Quản lý', extras: 'Khách gọi thêm', pricing: 'Tự đặt giá bán', tax: 'Đóng thuế', ship: 'Nhận đơn ship', lottery: 'Vé số', blindbox: 'Hộp mù',
};

export const tierDef = (G) => C.TIERS[G.state.tier - 1];
export const nextTierDef = (G) => C.TIERS[G.state.tier] || null;
export const builtTables = (G) => { const t = tierDef(G); return Math.min(t.maxTables, t.startTables + G.state.upgrades.table); };
/** v1.1: every table in use, in-shop + khu mở rộng (2 per wing level from tier 3). */
export const allTables = (G) => builtTables(G) + (G.state.tier >= 4 ? 4 : 2) * (G.state.tier >= 3 ? Math.min(2, G.state.upgrades.canh || 0) : 0);   // v1.23 nhà hàng 2 lầu: +4 bàn mỗi cấp
export const builtWing = (G) => (G.state.tier >= 3 ? Math.min(2, G.state.upgrades.canh || 0) : 0);   // v1.1 khu mở rộng hai bên
/** v1.19 phòng giải trí (nhà hàng 2 lầu): 0 chưa mở · 1 Photo Studio (trệt) · 2 + Karaoke (lầu) */
export const builtFun = (G) => (G.state.tier >= 4 ? Math.min(2, G.state.upgrades.giaitri || 0) : 0);
/** món giải trí đang bày (chỉ tính tầng đã mở) */
export function funPlaced(s) {
  const lvl = s.tier >= 4 ? Math.min(2, (s.upgrades && s.upgrades.giaitri) || 0) : 0;
  return (s.deco.fun || []).filter((id) => { const d = DECO_BY_ID[id]; return d && d.fun && s.deco.owned.includes(id) && d.fun.floor <= lvl; });
}
export const builtStoves = (G) => { const t = tierDef(G); return Math.min(t.maxStoves, t.startStoves + (G.state.upgrades.stove || 0)); };

// ───────────── money ─────────────
/** Add (or subtract, clamped at 0) money and emit the event. Returns the applied delta. */
export function addMoney(G, delta, reason = '', x, y) {
  const s = G.state;
  const before = s.money;
  s.money = Math.max(0, round2(s.money + delta));
  const applied = round2(s.money - before);
  if (applied > 0 && reason !== 'debug' && reason !== 'liquidation' && reason !== 'code' && reason !== 'lottery' && s.stats) s.stats.moneyEarned = round2((s.stats.moneyEarned || 0) + applied);   // v1.8: bảng xếp hạng
  if (applied !== 0) G.emit('money', { delta: applied, total: s.money, reason, x, y });
  return applied;
}
/** Record an operating cost in today's costs and take it out of the till (never below 0). */
export function spend(G, costKey, amount, reason = costKey) {
  if (!(amount > 0)) return 0;
  const today = G.state.today;
  const applied = -addMoney(G, -amount, reason); // clamped: money never goes below 0
  today.costs[costKey] = round2((today.costs[costKey] || 0) + applied);
  return applied;
}
/** Pay for a purchase; false (and no change) when the player cannot afford it. */
export function pay(G, amount, reason) {
  if (G.state.money + 1e-9 < amount) return false;
  addMoney(G, -amount, reason);
  return true;
}
export const cantAfford = (G, amount) => ({ ok: false, reason: 'money', msg: `Chưa đủ tiền (cần ${fmtMoney(amount)}) nha!` });

// ───────────── prices ─────────────
export function eventDef(G) { return C.EVENTS.find((e) => e.id === G.state.event) || null; }

export function buyPrice(G, ing) {
  const d = ING[ing];
  if (!d) return 0;
  let m = G.state.market.mult[ing] ?? 1;
  const ev = eventDef(G);
  if (ev && ev.priceMult && ev.priceMult[ing]) m *= ev.priceMult[ing];
  return Math.max(1, Math.round(d.cost * m * 2) / 2);
}
export function masteryStars(G, potId) {
  const sold = G.state.recipes[potId]?.sold || 0;
  let n = 0;
  for (const t of C.RECIPE.masteryAt) if (sold >= t) n++;
  return n;
}
export function potPrice(G, potId) {
  const p = POT[potId];
  if (!p) return 0;
  const lvl = G.state.recipes[potId]?.lvl || 1;
  return Math.round(p.price * (1 + (lvl - 1) * C.RECIPE.pricePerLevel) * (1 + masteryStars(G, potId) * C.RECIPE.masteryPriceBonus));
}
// ───────────── v1.14 giá bán (người chơi tự đặt) ─────────────
/** Khoảng giá được đặt cho một món (bội số cố định của giá gốc → giá đã lưu không phải đổi khi lên cấp công thức). */
export function priceBounds(potId) {
  const p = POT[potId];
  if (!p) return { min: 1, max: 1 };
  return { min: Math.max(1, Math.round(p.price * C.PRICING.minMult)), max: Math.max(2, Math.round(p.price * C.PRICING.maxMult)) };
}
/** Giá đang bán: giá người chơi đặt (kẹp trong khoảng), không thì giá gợi ý. */
export function sellPrice(G, potId) {
  const v = G.state.prices && G.state.prices[potId];
  if (typeof v === 'number' && isFinite(v) && v > 0) { const b = priceBounds(potId); return clamp(Math.round(v), b.min, b.max); }
  return potPrice(G, potId);
}
/** giá / giá gợi ý (1 = đúng giá gợi ý). */
export const priceRatio = (G, potId) => sellPrice(G, potId) / Math.max(1, potPrice(G, potId));
/** Vốn nguyên liệu một nồi theo giá chợ hôm nay. */
export function portionCost(G, potId) {
  const p = POT[potId];
  if (!p) return 0;
  let c = 0;
  for (const i of p.recipe) c += buyPrice(G, i);
  return round2(c);
}
/** Truyền miệng: giá trung bình cả thực đơn so với gợi ý → hệ số lượng khách. */
export function menuPriceDemand(G) {
  const s = G.state;
  let sum = 0, n = 0;
  for (const p of C.HOTPOTS) if (s.menu[p.id] && isPotUnlocked(G, p.id)) { sum += priceRatio(G, p.id); n++; }
  if (!n) return 1;
  const P = C.PRICING;
  return clamp(Math.pow(sum / n, -P.demandExp), P.demandMin, P.demandMax);
}

// ───────────── v1.14 thuế ─────────────
const taxOf = (s) => (s.tax && typeof s.tax === 'object' ? s.tax : (s.tax = { since: 0, base: 0, bill: null, nextId: 1, history: [] }));
/** Tiền phạt trễ hạn tính tới hôm nay. */
export function taxLateFee(G, bill) {
  const late = Math.max(0, G.state.day - bill.dueDay);
  return round2(bill.amount * C.TAX.lateFeePerDay * late);
}
/** Cuối ngày: cộng doanh thu vào kỳ thuế; đủ periodDays ngày thì ra thông báo thuế (hạn graceDays ngày). */
export function taxDayEnd(G) {
  const s = G.state, T = C.TAX, tx = taxOf(s);
  if (!featureUnlocked(G, 'tax')) return null;
  if (!tx.since) tx.since = s.day;
  tx.base = round2(tx.base + (s.today.revenue || 0));
  if (s.day - tx.since + 1 < T.periodDays) return null;
  const amount = Math.round(tx.base * T.rate);
  const from = tx.since, to = s.day, base = tx.base;
  tx.since = s.day + 1; tx.base = 0;
  if (amount < T.minBill) return null;
  if (tx.bill) { tx.bill.amount += amount; tx.bill.base = round2(tx.bill.base + base); tx.bill.to = to; tx.bill.dueDay = s.day + T.graceDays; }
  else tx.bill = { id: tx.nextId++, from, to, base, amount, dueDay: s.day + T.graceDays, issuedDay: s.day };
  G.emit('taxBill', { bill: Object.assign({}, tx.bill) });
  return tx.bill;
}
/** Sáng ngày mới: quá hạn forceAfter ngày thì cán bộ thuế thu luôn (kèm phạt), thiếu tiền thì Má bù. */
export function taxMorning(G) {
  const s = G.state, T = C.TAX, tx = taxOf(s), b = tx.bill;
  if (!b) return null;
  const late = s.day - b.dueDay;
  if (late < T.forceAfter) return null;
  const fee = taxLateFee(G, b), fine = Math.round(b.amount * T.forceFine);
  const total = round2(b.amount + fee + fine);
  const paid = spend(G, 'tax', total, 'tax');
  tx.history.unshift({ id: b.id, from: b.from, to: b.to, amount: b.amount, fee: round2(fee + fine), paidDay: s.day, forced: true });
  tx.history.length = Math.min(tx.history.length, 20);
  tx.bill = null;
  const short = round2(total - paid);
  G.momText('taxForced', `${T.officer} ghé quán thu thuế quá hạn ${late} ngày: ${fmtMoney(b.amount)} tiền thuế + ${fmtMoney(fee + fine)} tiền phạt.`
    + (short > 0 ? ` Két không đủ, Má bù cho ${fmtMoney(short)} lần này. Lần sau nhớ đóng đúng hạn nha con!` : ' Lần sau nhớ đóng đúng hạn kẻo bị phạt nha con!'));
  G.emit('taxForced', { amount: b.amount, fee: fee + fine });
  return { forced: true, total };
}
/** Người chơi bấm Đóng thuế. */
export function payTax(G) {
  const s = G.state, tx = taxOf(s), b = tx.bill;
  if (!b) return { ok: false, reason: 'none', msg: 'Hiện không có khoản thuế nào cần đóng.' };
  const fee = taxLateFee(G, b), total = round2(b.amount + fee);
  if (s.money + 1e-9 < total) return { ok: false, reason: 'money', msg: `Cần ${fmtMoney(total)} để đóng thuế, két còn ${fmtMoney(s.money)}.` };
  spend(G, 'tax', total, 'tax');
  tx.history.unshift({ id: b.id, from: b.from, to: b.to, amount: b.amount, fee, paidDay: s.day, forced: false, early: s.day < b.dueDay });
  tx.history.length = Math.min(tx.history.length, 20);
  tx.bill = null;
  G.counter('taxPaid', 1);
  return { ok: true, total, fee };
}

export function khoInfo(G) {
  const s = G.state;
  let used = 0;
  for (const k in s.inventory) used += s.inventory[k];
  const up = UP.kho;
  const t = tierDef(G);
  const cap = Math.round(t.kho * (up.capMult[s.upgrades.kho] || 1)) + (t.khoBonus || 0);   // v1.6d: +50 chỗ ở quán cấp 1–2
  return { used, cap };
}

// ───────────── modifiers (cached, recomputed when dirty) ─────────────
export function mods(G) {
  if (G._mods && !G.modsDirty) return G._mods;
  const s = G.state, up = s.upgrades;
  const staff = s.staff;
  const has = (trait) => staff.some((m) => m.trait === trait);
  const count = (trait) => staff.filter((m) => m.trait === trait).length;
  let decoDemand = 1, decoTip = 1, decoPatience = 1, decoFootball = 1;
  for (const id of decoInUse(s)) {
    const d = DECO_BY_ID[id];
    const e = d && d.effect;
    if (!e) continue;
    if (e.demandMult) decoDemand *= e.demandMult;
    if (e.tipMult) decoTip *= e.tipMult;
    if (e.patienceMult) decoPatience *= e.patienceMult;
    if (e.footballMult) decoFootball = e.footballMult;
  }
  // v1.18p đặt nhiều món cùng lúc: hiệu ứng cộng dồn nhưng có trần
  decoDemand = Math.min(decoDemand, C.DECO_CAP.demand); decoTip = Math.min(decoTip, C.DECO_CAP.tip); decoPatience = Math.min(decoPatience, C.DECO_CAP.patience);
  const cashier = staff.some((m) => m.role === 'thungan');
  G._mods = {
    patience: (1 + up.tablestyle * UP.tablestyle.patiencePer + up.speaker * UP.speaker.patiencePer + builtFun(G) * UP.giaitri.patiencePer) * (cashier ? 1.2 : 1) * (has('hat') ? 1.1 : 1) * decoPatience,
    tip: (up.pos > 0 ? UP.pos.tipMult : 1) * decoTip * (has('ngot') ? 1.25 : 1),
    demand: (1 + up.sign * UP.sign.demandPer + builtFun(G) * UP.giaitri.demandPer) * decoDemand * Math.pow(1.05, count('tiktok')),
    footballMult: decoFootball,
    cashier,
    hasWaiter: staff.some((m) => m.role === 'phucvu'),
    hasChef: staff.some((m) => m.role === 'daubep'),
    hasQuankho: staff.some((m) => m.role === 'quankho'),
  };
  G.modsDirty = false;
  return G._mods;
}
export function dirtyMods(G) { G.modsDirty = true; }
/** v1.18p mọi món trang trí đang dùng: món chính từng loại + đồ đặt thêm */
export function decoInUse(s) {
  const out = [];
  for (const cat of Object.keys(s.deco.equipped || {})) if (s.deco.equipped[cat]) out.push(s.deco.equipped[cat]);
  for (const id of s.deco.more || []) if (!out.includes(id)) out.push(id);
  for (const id of funPlaced(s)) if (!out.includes(id)) out.push(id);   // v1.19
  return out;
}
/** chỗ đặt thêm: 'wall' (đồ treo tường) / 'floor' (cây, đồ đặc biệt); đèn không đặt thêm */
export const decoSlotKind = (d) => (!d || d.default || d.cat === 'den' || d.cat === 'giaitri' ? null : d.cat === 'tuong' ? 'wall' : 'floor');
export function decoMoreInfo(G) {
  const s = G.state, L = G.world && G.world.layout, M = (L && L.decoMore) || { tuong: [], floor: [] };
  const used = { wall: 0, floor: 0 };
  for (const id of s.deco.more || []) { const k = decoSlotKind(DECO_BY_ID[id]); if (k) used[k]++; }
  return { wall: { used: used.wall, max: (M.tuong || []).length }, floor: { used: used.floor, max: (M.floor || []).length }, list: (s.deco.more || []).slice() };
}

export function ambienceOf(G) {
  const s = G.state, up = s.upgrades;
  let a = 0;
  for (const id of decoInUse(s)) a += (DECO_BY_ID[id] || {}).amb || 0;
  a += (s.tier >= 4 ? Math.min(2, up.giaitri || 0) : 0) * UP.giaitri.amb + up.tablestyle * UP.tablestyle.amb + up.cooling * UP.cooling.amb + up.speaker * UP.speaker.amb + up.sign * UP.sign.amb;
  return clamp(a / tierDef(G).ambCap, 0, 1);
}

// ───────────── xp / levels / unlocks ─────────────
export const xpNeed = (lv) => C.LEVEL.xpToNext(lv);

/** Everything that becomes available exactly at `level`. */
export function unlocksAt(level) {
  const out = [];
  for (const p of C.HOTPOTS) if (p.unlockLv === level && level > 1) out.push({ type: 'pot', id: p.id, name: p.name });
  for (const i of C.INGREDIENTS) if (i.unlockLv === level && level > 1 && !i.broth) out.push(i.side
    ? { type: 'side', id: i.id, name: i.name, desc: `Món ăn kèm: bán ${i.extraPrice}k, vốn ${i.cost}k` + (i.needs ? ` · cần ${C.UPGRADES.find((u) => u.id === i.needs).name}` : '') }
    : i.dessert
    ? { type: 'dessert', id: i.id, name: i.name, desc: `Tráng miệng: bán ${i.extraPrice}k, vốn ${i.cost}k` + (i.needs ? ` · cần ${C.UPGRADES.find((u) => u.id === i.needs).name}` : '') }
    : { type: 'ingredient', id: i.id, name: i.name });
  for (const u of C.UPGRADES) (u.minLv || []).forEach((lv, i) => { if (lv === level && level > 1) out.push({ type: 'equip', id: u.id, name: C.upgradeStepName(u, i), desc: u.desc }); });
  for (const d of C.DRINKS) if (d.unlockLv === level && level > 1) out.push({ type: 'drink', id: d.id, name: d.name });
  for (const r of Object.keys(C.STAFF.roles)) if (C.STAFF.roles[r].unlockLv === level) out.push({ type: 'role', id: r, name: C.STAFF.roles[r].name });
  for (const f of Object.keys(C.FEATURES)) if (C.FEATURES[f] === level && FEATURE_NAMES[f]) out.push({ type: 'feature', id: f, name: FEATURE_NAMES[f] });
  for (const t of C.TIERS) if (t.require && t.require.level === level) out.push({ type: 'tier', id: t.id, name: t.name });
  for (const [lv, k] of C.STAFF.slotBonus || []) if (lv === level) out.push({ type: 'slot', id: 'slot' + lv, name: `+${k} chỗ nhân viên`, desc: `Quán chứa thêm ${k} nhân viên (tối đa ${C.STAFF.maxSlots} người)` });   // v1.17
  out.push(...C.cosmeticUnlocksAt(level));
  return out;
}

export function addXp(G, n, x, y) {
  const s = G.state;
  n = Math.round(n * (C.LEVEL.xpGainMult || 1));
  if (!(n > 0)) return;
  s.xp += n;
  let leveled = 0;
  const MAX = C.LEVEL.max || Infinity;
  while (s.level < MAX && s.xp >= xpNeed(s.level)) {
    s.xp -= xpNeed(s.level);
    s.level++;
    leveled++;
    onLevel(G, s.level);
  }
  if (s.level >= MAX) s.xp = Math.min(s.xp, xpNeed(s.level));   // v1.3: level cap — the bar just stays full
  G.emit('xp', { delta: n, total: s.xp, level: s.level, need: xpNeed(s.level), x, y });
  return leveled;
}

function onLevel(G, level) {
  const s = G.state;
  const unlocks = unlocksAt(level);
  for (const u of unlocks) if (u.type === 'pot') s.menu[u.id] = true; // new pots go straight on the menu
  G.modsDirty = true;
  G.emit('levelUp', { level, unlocks });
  if (G.onLevelUp) G.onLevelUp(level, unlocks);
}

/** Set level directly (debug), firing level-up events for every step. */
export function setLevel(G, target) {
  const s = G.state;
  target = Math.max(1, Math.min(C.LEVEL.max || Infinity, Math.floor(target)));
  if (target < s.level) { s.level = target; s.xp = 0; G.emit('xp', { delta: 0, total: 0, level: s.level, need: xpNeed(s.level) }); return; }
  while (s.level < target) { s.level++; onLevel(G, s.level); }
  s.xp = 0;
  G.emit('xp', { delta: 0, total: 0, level: s.level, need: xpNeed(s.level) });
}

export const isPotUnlocked = (G, id) => !!POT[id] && G.state.level >= POT[id].unlockLv;
export const isIngUnlocked = (G, id) => !!ING[id] && C.lvOk(G.state, ING[id]) && (!ING[id].needs || (G.state.upgrades[ING[id].needs] || 0) > 0);
/** v1.1 tráng miệng the shop can serve right now (unlocked, equipment bought). */
// v1.6: a món ăn kèm / tráng miệng the owner switched off in Thực đơn (state.menu[id] === false) is neither ordered nor restocked
export const offMenu = (G, id) => !!G.state.menu && G.state.menu[id] === false;
export const dessertsOn = (G) => C.INGREDIENTS.filter((i) => i.dessert && isIngUnlocked(G, i.id) && !offMenu(G, i.id));
/** v1.4 món ăn kèm the shop can serve (unlocked + its tool bought) and their selling price with the tool's level bonus. */
export const sidesOn = (G) => C.INGREDIENTS.filter((i) => i.side && isIngUnlocked(G, i.id) && !offMenu(G, i.id));
export function sidePrice(G, id) {
  const i = ING[id]; if (!i) return 0;
  const u = i.needs ? UP[i.needs] : null, lv = u ? (G.state.upgrades[i.needs] || 0) : 1;
  return Math.round(i.extraPrice * (1 + Math.max(0, lv - 1) * ((u && u.sidePer) || 0)));
}
export const isDrinkUnlocked = (G, id) => !!DRINK[id] && C.lvOk(G.state, DRINK[id]);   // v1.18 + món Hộp mù
export const featureUnlocked = (G, key) => (key in C.FEATURES ? G.state.level >= C.FEATURES[key] : true);

// ───────────── shelf life ─────────────
// state.inventory keeps the totals everything reads; state.lots[id] = [{ n, e }] splits them by expiry
// (e = last day the portions are usable). Used oldest-first; past-date lots are thrown out each morning.
export const shelfBase = (id) => (ING[id] && ING[id].shelf) || 5;
/** v1.2: Tủ đông cao cấp adds +1 day per level to thịt & hải sản (ING.frozen). */
export const shelfOf = (id, s) => shelfBase(id) + (s && ING[id] && ING[id].frozen ? (s.upgrades.tudong || 0) : 0);
/** Push every lot of the frozen ingredients one day later (just bought a Tủ đông level). */
export function extendFrozenLots(G, days = 1) {
  const s = G.state;
  for (const i of C.INGREDIENTS) if (i.frozen) for (const l of lotsOf(s, i.id)) l.e += days;
}
function lotsOf(s, id) {
  if (!s.lots || typeof s.lots !== 'object') s.lots = {};
  const L = s.lots[id];
  return Array.isArray(L) ? L : (s.lots[id] = []);
}
/** Last usable day for a portion that enters the kho right now (after closing it counts from tomorrow). */
const expDayNow = (s, id) => s.day + shelfOf(id, s) - 1 + (s.phase === 'report' ? 1 : 0);
function pushLot(s, id, n, e) {
  const L = lotsOf(s, id), last = L[L.length - 1];
  if (last && last.e === e) last.n += n; else { L.push({ n, e }); L.sort((a, b) => a.e - b.e); }
}
function takeLots(s, id, n) {
  const L = lotsOf(s, id);
  while (n > 0 && L.length) { const k = Math.min(n, L[0].n); L[0].n -= k; n -= k; if (L[0].n <= 0) L.shift(); }
}
/** Put n portions into the kho (dated today). */
// ───────────── v1.10 thanh lý hàng cũ (mang từ Xoài Lắc) ─────────────
// Lô hàng Lẩu Ơi không nhớ giá mua → vốn mỗi phần = giá chợ hôm nay (không tính phí giao).
const unitBasis = (s, id) => (ING[id] ? ING[id].cost : 0) * (s.market.mult[id] ?? 1);
const liqRate = (s, lot) => C.LIQUIDATE.rates[clamp(lot.e - s.day, 0, C.LIQUIDATE.rates.length - 1)];
/** What Cô Ba would pay for the oldest n portions of `id` (n defaults to everything). */
export function liquidateQuote(G, id, n) {
  const s = G.state;
  if (!ING[id]) return { ok: false, n: 0, money: 0, basis: 0, groups: [] };
  const have = Math.max(0, Math.floor(s.inventory[id] || 0));
  if (n == null) n = have;
  n = Math.max(0, Math.min(Math.floor(n), have));
  let left = n, money = 0, basis = 0;
  const groups = [];                                        // by days left: { left, n, rate, money }
  const b = unitBasis(s, id);
  for (const lot of lotsOf(s, id)) {
    if (left <= 0) break;
    const k = Math.min(left, lot.n), r = liqRate(s, lot), dl = Math.max(0, lot.e - s.day);
    money += k * b * r; basis += k * b; left -= k;
    const g = groups.find((x) => x.left === dl);
    if (g) { g.n += k; g.money += k * b * r; } else groups.push({ left: dl, n: k, rate: r, money: k * b * r });
  }
  if (left > 0) { money += left * b * C.LIQUIDATE.rates[0]; basis += left * b; left = 0; }   // phần không có lô (save cũ): giá thấp nhất
  return { ok: n > 0, n, money: round2(money), basis: round2(basis), groups };
}
/** Portions of `id` whose date runs out after today (the ones worth selling first). */
export function oldStock(G, id) {
  const s = G.state;
  let n = 0;
  for (const l of lotsOf(s, id)) if (l.e <= s.day) n += l.n;
  return n;
}
/** Sell the oldest n portions of `id` back to the market. Morning only. */
export function liquidate(G, id, n) {
  const s = G.state;
  if (!ING[id]) return { ok: false, reason: 'unknown', msg: 'Không có món hàng này.' };
  if (s.phase !== 'prep') return { ok: false, reason: 'phase', msg: `${C.LIQUIDATE.buyer} chỉ mua lại hàng buổi sáng, trước khi mở hàng nha.` };
  const q = liquidateQuote(G, id, n);
  if (!q.ok) return { ok: false, reason: 'empty', msg: 'Kho không còn món này để bán.' };
  takeLots(s, id, q.n);
  s.inventory[id] = Math.max(0, (s.inventory[id] || 0) - q.n);
  addMoney(G, q.money, 'liquidation');
  const loss = round2(Math.max(0, q.basis - q.money));
  s.today.costs.liquidation = round2((s.today.costs.liquidation || 0) + loss);
  G.counter('liquidated', q.n);
  resetStockWarn(G, id);
  return { ok: true, n: q.n, money: q.money, basis: q.basis, loss };
}

export function addStock(G, id, n) {
  if (!(n > 0)) return;
  const s = G.state;
  s.inventory[id] = (s.inventory[id] || 0) + n;
  pushLot(s, id, n, expDayNow(s, id));
}
/** Keep lots in step with the totals (old saves, gifts, debug edits). */
export function syncLots(G) {
  const s = G.state;
  for (const i of C.INGREDIENTS) {
    const have = Math.max(0, Math.floor(s.inventory[i.id] || 0)), L = lotsOf(s, i.id);
    let sum = 0;
    for (const l of L) sum += l.n;
    if (have > sum) pushLot(s, i.id, have - sum, expDayNow(s, i.id));
    else if (have < sum) takeLots(s, i.id, sum - have);
  }
}
/** Portions of `id` that are past their date after today (must be sold today). */
export function expiringToday(G, id) {
  const s = G.state;
  let n = 0;
  for (const l of lotsOf(s, id)) if (l.e <= s.day) n += l.n;
  return n;
}
/** Morning: throw out everything past its date. Returns { total, value, items: { id: n } }. */
export function expireStock(G) {
  const s = G.state, items = {};
  let total = 0, value = 0;
  for (const i of C.INGREDIENTS) {
    const L = lotsOf(s, i.id);
    let n = 0;
    while (L.length && L[0].e < s.day) n += L.shift().n;
    if (n <= 0) continue;
    s.inventory[i.id] = Math.max(0, (s.inventory[i.id] || 0) - n);
    items[i.id] = n; total += n; value += n * i.cost;
  }
  value = round2(value);
  s.expired = total ? { day: s.day, total, value, items } : null;
  if (total) G.emit('expired', s.expired);
  return { total, value, items };
}

// ───────────── stock ─────────────
export function consumeIngredient(G, ing, n = 1) {
  const s = G.state;
  takeLots(s, ing, Math.min(n, s.inventory[ing] || 0));
  s.inventory[ing] = Math.max(0, (s.inventory[ing] || 0) - n);
  const cost = (ING[ing] ? ING[ing].cost : 0) * (s.market.mult[ing] ?? 1) * n;
  s.today.costs.ingredients = round2(s.today.costs.ingredients + cost);
  s.today.usage[ing] = (s.today.usage[ing] || 0) + n;
  if (s.inventory[ing] <= 2 && G.world) {
    const w = G.world;
    if (!w.lowWarned[ing]) {
      w.lowWarned[ing] = true;
      G.emit(s.inventory[ing] <= 0 ? 'stockOut' : 'stockLow', { ing });
    } else if (s.inventory[ing] <= 0 && !w.outWarned[ing]) {
      w.outWarned[ing] = true;
      G.emit('stockOut', { ing });
    }
  }
}
export function resetStockWarn(G, ing) {
  if (!G.world) return;
  if ((G.state.inventory[ing] || 0) > 2) { G.world.lowWarned[ing] = false; G.world.outWarned[ing] = false; }
}

export function buyIngredient(G, ing, qty) {
  const s = G.state, def = ING[ing];
  if (!def) return { ok: false, reason: 'unknown', msg: 'Không có nguyên liệu này.' };
  if (!isIngUnlocked(G, ing)) return { ok: false, reason: 'locked', msg: `${def.name} mở ở Lv ${def.unlockLv} nha!` };
  if (s.phase === 'report') return { ok: false, reason: 'closed', msg: 'Chợ đóng rồi, sáng mai nhập tiếp nha!' };
  const price = buyPrice(G, ing);
  const { used, cap } = khoInfo(G);
  const free = cap - used;
  if (free <= 0) return { ok: false, reason: 'full', msg: 'Kho đầy rồi! Nâng cấp kho hoặc bán bớt nha.' };
  let n = Math.max(1, Math.floor(Number(qty) || 1));   // v1.6c: no more 'fill' (nhập đầy kho) — fixed packs only
  n = Math.min(n, free);
  const afford = Math.floor((s.money + 1e-9) / price);
  if (afford <= 0) return { ok: false, reason: 'money', msg: `Chưa đủ tiền mua ${def.name} (${fmtMoney(price)}/phần).` };
  const partial = n > afford;
  n = Math.min(n, afford);
  const cost = round2(n * price);
  addMoney(G, -cost, 'buy');
  addStock(G, ing, n);
  G.counter('buyIngredients', 1);
  resetStockWarn(G, ing);
  if (G.world) G.world.soldOutDay = 0;          // restocked mid-day: the "hết hàng" prompt may show again later
  return { ok: true, bought: n, cost, price, partial };
}

/** Ingredients the menu needs (enabled pots) + the tráng miệng the shop sells. */
function wantedIngs(G) {
  const s = G.state, wanted = new Set();
  for (const p of C.HOTPOTS) if (s.menu[p.id] && isPotUnlocked(G, p.id)) for (const i of p.recipe) wanted.add(i);
  for (const d of dessertsOn(G)) wanted.add(d.id);
  for (const d of sidesOn(G)) wanted.add(d.id);
  return wanted;
}

/** v1.9: what a quản kho should buy right now: ingredients the menu needs that will run out soon.
 *  Sắp hết = ≤ lowAt portions, or less than horizonMin minutes of today's selling rate. → [{ id, n }] (n = wanted qty) */
export function quankhoNeeds(G) {
  const s = G.state, Q = C.QUANKHO_RUN;
  const mins = Math.max(30, (s.clock || C.TIME.dayStart) - C.TIME.dayStart);
  const out = [];
  for (const id of wantedIngs(G)) {
    if (!isIngUnlocked(G, id)) continue;
    const have = s.inventory[id] || 0;
    const rate = (s.today.usage[id] || 0) / mins;                       // portions per game-minute today
    if (have > Q.lowAt && have >= rate * Q.horizonMin) continue;
    const want = Math.max(Q.minBuy, Math.ceil(rate * Q.buyMin), Math.ceil((s.usageYesterday[id] || 0) * Q.usageShare));
    if (want - have > 0) out.push({ id, n: want - have, have });
  }
  out.sort((x, y) => x.have - y.have);
  return out;
}

/** v1.9: the quản kho is back from the market — pay and stock what fits (kho space, money). */
export function quankhoDeliver(G, list) {
  const s = G.state;
  let { used } = khoInfo(G);
  const { cap } = khoInfo(G);
  let spent = 0, bought = 0;
  for (const it of list || []) {
    const price = buyPrice(G, it.id);
    const n = Math.min(it.n, cap - used, Math.floor((s.money + 1e-9) / price));
    if (n <= 0) continue;
    const cost = round2(n * price);
    addMoney(G, -cost, 'restock');
    addStock(G, it.id, n);
    used += n; spent += cost; bought += n;
    resetStockWarn(G, it.id);
  }
  if (bought > 0) {
    if (G.world) G.world.soldOutDay = 0;
    const names = list.filter((x) => x.n > 0).slice(0, 3).map((x) => (ING[x.id] ? ING[x.id].name : x.id)).join(', ');
    G.toast(`Quản kho đi chợ về: +${bought} phần ${names}${list.length > 3 ? '…' : ''} (−${fmtMoney(spent)})`, 'good', 'ui_kho');
  } else if (list && list.length) {
    G.toast(cap - used <= 0 ? 'Quản kho đi chợ về nhưng kho đầy, không cất thêm được!' : 'Quản kho đi chợ về tay không: không đủ tiền mua hàng.', 'bad', 'ui_kho');
  }
  return { bought, spent };
}

/** v1.2→v1.9: during service a hired quản kho checks stock; when something will run out soon he walks to the
 *  market (workers.js moves him: out the gate, away tripMin game-minutes, back) and the goods arrive with him. */
export function quankhoTick(G, dtMin) {
  const s = G.state, w = G.world, Q = C.QUANKHO_RUN;
  if (!w) return null;
  const trip = w.qkTrip;
  if (trip && s.phase === 'report') { w.qkTrip = null; quankhoDeliver(G, trip.list); return null; }   // day ended mid-trip
  if (s.phase !== 'open' || !mods(G).hasQuankho) return null;
  w.qkCool = Math.max(0, (w.qkCool || 0) - dtMin);
  if (trip) {
    // v1.10: món nào hết / sắp hết trong lúc quản kho chưa về → mua luôn trong chuyến này (trả tiền lúc về)
    if (trip.phase === 'go' || trip.phase === 'away') {
      for (const it of quankhoNeeds(G)) if (!trip.list.some((x) => x.id === it.id)) trip.list.push(it);
    }
    return null;
  }
  const list = quankhoNeeds(G);
  if (!list.length) return null;
  // v1.10: hết hẳn một món (còn 0 phần) đang bán → chạy đi chợ NGAY, không chờ hết giờ nghỉ giữa 2 chuyến
  const out = list.filter((x) => x.have <= 0);
  const soldOutNow = w.soldOutDay === s.day;      // không món nào trên thực đơn nấu được nữa
  if (w.qkCool > 0 && !out.length && !soldOutNow) return null;
  if (khoInfo(G).used >= khoInfo(G).cap) { w.qkCool = Q.cooldown; return null; }
  w.qkCool = Q.cooldown;
  w.qkTrip = { list, phase: 'go', t: 0 };
  if (out.length || soldOutNow) {
    const names = out.slice(0, 2).map((x) => (ING[x.id] ? ING[x.id].name.toLowerCase() : x.id)).join(', ');
    G.toast(`Hết ${names || 'hàng'}${out.length > 2 ? '…' : ''} — Quản kho chạy đi chợ ngay, chờ chút là có hàng!`, 'info', 'ui_kho');
  }
  return w.qkTrip;
}

/** Morning auto-restock (supplier upgrade or quản kho). fee = 0 for quản kho. */
export function autoRestock(G, byManager) {
  const s = G.state;
  const fee = byManager ? 0 : UP.supplier.fee;
  const { cap } = khoInfo(G);
  let used = khoInfo(G).used;
  // ingredients used by enabled pots
  const wanted = wantedIngs(G);
  const rows = [];
  for (const id of wanted) {
    if (!isIngUnlocked(G, id)) continue;
    const target = Math.min(cap, Math.max(8, Math.ceil((s.usageYesterday[id] || 0) * (s.soldOutYesterday ? C.MARKET.soldOutTargetMult : C.MARKET.autoBuyTargetMult))));
    const need = target - (s.inventory[id] || 0);
    if (need > 0) rows.push({ id, need, ratio: (s.inventory[id] || 0) / target });
  }
  rows.sort((a, b) => a.ratio - b.ratio);
  let spent = 0, bought = 0;
  for (const r of rows) {
    const price = buyPrice(G, r.id) * (1 + fee);
    let n = Math.min(r.need, cap - used, Math.floor((s.money + 1e-9) / price));
    if (n <= 0) continue;
    const cost = round2(n * price);
    addMoney(G, -cost, 'restock');
    s.today.costs.ingredients = round2(s.today.costs.ingredients + n * buyPrice(G, r.id) * fee);
    addStock(G, r.id, n);
    used += n; spent += cost; bought += n;
    resetStockWarn(G, r.id);
  }
  if (bought > 0) G.toast(`Đã nhập ${bought} phần hàng tự động (−${fmtMoney(spent)})`, 'info', 'ui_kho');
  return { bought, spent };
}

// ───────────── market (daily random walk) ─────────────
export function rollMarket(G) {
  const s = G.state, rng = G.rng;
  const M = C.MARKET;
  for (const i of C.INGREDIENTS) {
    const old = s.market.mult[i.id] ?? 1;
    const nv = clamp(old + rng.gauss() * M.dailyVol - M.meanRevert * (old - 1), M.min, M.max);
    s.market.mult[i.id] = Math.round(nv * 1000) / 1000;
    const d = nv - old;
    s.market.trend[i.id] = d > 0.02 ? 1 : d < -0.02 ? -1 : 0;
  }
}

// ───────────── staff pay ─────────────
export function staffSalary(G, m, tier = G.state.tier) {
  let sal = C.STAFF.salary(m, tier) * Math.pow(1 + C.STAFF.levelSalaryUp, (m.lvl || 1) - 1);
  if (m.trait === 'vung') sal *= 0.7;
  return Math.max(1, Math.round(sal));
}
export function salaryTotal(G) { let t = 0; for (const m of G.state.staff) t += staffSalary(G, m); return t; }
