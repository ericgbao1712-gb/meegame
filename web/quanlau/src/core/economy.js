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
  mkt_livestream: 'Livestream bán hàng', speed2: 'Tốc độ ×2', manageMode: 'Chế độ Quản lý', extras: 'Khách gọi thêm', lottery: 'Vé số',
};

export const tierDef = (G) => C.TIERS[G.state.tier - 1];
export const nextTierDef = (G) => C.TIERS[G.state.tier] || null;
export const builtTables = (G) => { const t = tierDef(G); return Math.min(t.maxTables, t.startTables + G.state.upgrades.table); };
export const builtStoves = (G) => { const t = tierDef(G); return Math.min(t.maxStoves, t.startStoves + (G.state.upgrades.stove || 0)); };

// ───────────── money ─────────────
/** Add (or subtract, clamped at 0) money and emit the event. Returns the applied delta. */
export function addMoney(G, delta, reason = '', x, y) {
  const s = G.state;
  const before = s.money;
  s.money = Math.max(0, round2(s.money + delta));
  const applied = round2(s.money - before);
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
export function khoInfo(G) {
  const s = G.state;
  let used = 0;
  for (const k in s.inventory) used += s.inventory[k];
  const up = UP.kho;
  const cap = Math.round(tierDef(G).kho * (up.capMult[s.upgrades.kho] || 1));
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
  for (const cat of Object.keys(s.deco.equipped)) {
    const d = DECO_BY_ID[s.deco.equipped[cat]];
    const e = d && d.effect;
    if (!e) continue;
    if (e.demandMult) decoDemand *= e.demandMult;
    if (e.tipMult) decoTip *= e.tipMult;
    if (e.patienceMult) decoPatience *= e.patienceMult;
    if (e.footballMult) decoFootball = e.footballMult;
  }
  const cashier = staff.some((m) => m.role === 'thungan');
  G._mods = {
    patience: (1 + up.tablestyle * UP.tablestyle.patiencePer + up.speaker * UP.speaker.patiencePer) * (cashier ? 1.2 : 1) * (has('hat') ? 1.1 : 1) * decoPatience,
    tip: (up.pos > 0 ? UP.pos.tipMult : 1) * decoTip * (has('ngot') ? 1.25 : 1),
    demand: (1 + up.sign * UP.sign.demandPer) * decoDemand * Math.pow(1.05, count('tiktok')),
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

export function ambienceOf(G) {
  const s = G.state, up = s.upgrades;
  let a = 0;
  for (const cat of Object.keys(s.deco.equipped)) a += (DECO_BY_ID[s.deco.equipped[cat]] || {}).amb || 0;
  a += up.tablestyle * UP.tablestyle.amb + up.cooling * UP.cooling.amb + up.speaker * UP.speaker.amb + up.sign * UP.sign.amb;
  return clamp(a / tierDef(G).ambCap, 0, 1);
}

// ───────────── xp / levels / unlocks ─────────────
export const xpNeed = (lv) => C.LEVEL.xpToNext(lv);

/** Everything that becomes available exactly at `level`. */
export function unlocksAt(level) {
  const out = [];
  for (const p of C.HOTPOTS) if (p.unlockLv === level && level > 1) out.push({ type: 'pot', id: p.id, name: p.name });
  for (const i of C.INGREDIENTS) if (i.unlockLv === level && level > 1 && !i.broth) out.push({ type: 'ingredient', id: i.id, name: i.name });
  for (const d of C.DRINKS) if (d.unlockLv === level && level > 1) out.push({ type: 'drink', id: d.id, name: d.name });
  for (const r of Object.keys(C.STAFF.roles)) if (C.STAFF.roles[r].unlockLv === level) out.push({ type: 'role', id: r, name: C.STAFF.roles[r].name });
  for (const f of Object.keys(C.FEATURES)) if (C.FEATURES[f] === level && FEATURE_NAMES[f]) out.push({ type: 'feature', id: f, name: FEATURE_NAMES[f] });
  for (const t of C.TIERS) if (t.require && t.require.level === level) out.push({ type: 'tier', id: t.id, name: t.name });
  return out;
}

export function addXp(G, n, x, y) {
  const s = G.state;
  n = Math.round(n);
  if (!(n > 0)) return;
  s.xp += n;
  let leveled = 0;
  while (s.xp >= xpNeed(s.level)) {
    s.xp -= xpNeed(s.level);
    s.level++;
    leveled++;
    onLevel(G, s.level);
  }
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
  target = Math.max(1, Math.floor(target));
  if (target < s.level) { s.level = target; s.xp = 0; G.emit('xp', { delta: 0, total: 0, level: s.level, need: xpNeed(s.level) }); return; }
  while (s.level < target) { s.level++; onLevel(G, s.level); }
  s.xp = 0;
  G.emit('xp', { delta: 0, total: 0, level: s.level, need: xpNeed(s.level) });
}

export const isPotUnlocked = (G, id) => !!POT[id] && G.state.level >= POT[id].unlockLv;
export const isIngUnlocked = (G, id) => !!ING[id] && G.state.level >= ING[id].unlockLv;
export const isDrinkUnlocked = (G, id) => !!DRINK[id] && G.state.level >= DRINK[id].unlockLv;
export const featureUnlocked = (G, key) => (key in C.FEATURES ? G.state.level >= C.FEATURES[key] : true);

// ───────────── shelf life ─────────────
// state.inventory keeps the totals everything reads; state.lots[id] = [{ n, e }] splits them by expiry
// (e = last day the portions are usable). Used oldest-first; past-date lots are thrown out each morning.
export const shelfOf = (id) => (ING[id] && ING[id].shelf) || 5;
function lotsOf(s, id) {
  if (!s.lots || typeof s.lots !== 'object') s.lots = {};
  const L = s.lots[id];
  return Array.isArray(L) ? L : (s.lots[id] = []);
}
/** Last usable day for a portion that enters the kho right now (after closing it counts from tomorrow). */
const expDayNow = (s, id) => s.day + shelfOf(id) - 1 + (s.phase === 'report' ? 1 : 0);
function pushLot(s, id, n, e) {
  const L = lotsOf(s, id), last = L[L.length - 1];
  if (last && last.e === e) last.n += n; else { L.push({ n, e }); L.sort((a, b) => a.e - b.e); }
}
function takeLots(s, id, n) {
  const L = lotsOf(s, id);
  while (n > 0 && L.length) { const k = Math.min(n, L[0].n); L[0].n -= k; n -= k; if (L[0].n <= 0) L.shift(); }
}
/** Put n portions into the kho (dated today). */
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
  let n = qty === 'fill' ? free : Math.max(1, Math.floor(qty || 1));
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

/** Morning auto-restock (supplier upgrade or quản kho). fee = 0 for quản kho. */
export function autoRestock(G, byManager) {
  const s = G.state;
  const fee = byManager ? 0 : UP.supplier.fee;
  const { cap } = khoInfo(G);
  let used = khoInfo(G).used;
  // ingredients used by enabled pots
  const wanted = new Set();
  for (const p of C.HOTPOTS) if (s.menu[p.id] && isPotUnlocked(G, p.id)) for (const i of p.recipe) wanted.add(i);
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
