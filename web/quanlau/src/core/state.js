// Persistent state factory + migration (TECH_SPEC §4).
import * as C from '../config.js';
import { mergeDefaults, clone } from './util.js';

export const COST_KEYS = ['ingredients', 'broth', 'drinks', 'salary', 'rent', 'marketing', 'lottery', 'liquidation', 'tax'];   // v1.14 tax = thuế + tiền phạt đã đóng   // v1.10 liquidation = lỗ thanh lý so với vốn

export function newToday() {
  const costs = {};
  for (const k of COST_KEYS) costs[k] = 0;
  return {
    revenue: 0, tips: 0, costs,
    served: 0, angry: 0, fiveStars: 0, potsSold: 0, potsSoldOf: {}, drinksSold: 0, extrasServed: 0, dessertsSold: 0, sidesSold: 0, thanked: 0,
    comboMax: 0, newKinds: [], bestReviewId: null, noAngryUntil: null,
    stars: 0, rated: 0, lost: 0,            // star sum / count of finished groups, walk-aways
    priceLost: 0, priceRefused: {},         // v1.14 nhóm khách chê đắt bỏ về (theo món)
    usage: {},                              // ingredients consumed today (→ usageYesterday)
    ratingBefore: 3.5, levelBefore: 1, lotteryWon: 0, lotteryTickets: 0,
  };
}

export function defaultState(now = Date.now()) {
  const inventory = {}, market = { mult: {}, trend: {} };
  for (const i of C.INGREDIENTS) { inventory[i.id] = C.START.inventory[i.id] || 0; market.mult[i.id] = 1; market.trend[i.id] = 0; }
  const recipes = {}, menu = {};
  for (const p of C.HOTPOTS) { recipes[p.id] = { lvl: 1, sold: 0 }; menu[p.id] = p.unlockLv <= 1; }
  const upgrades = {};
  for (const u of C.UPGRADES) upgrades[u.id] = 0;
  const marketingToday = {};
  for (const m of C.MARKETING) marketingToday[m.id] = false;
  const defaults = C.DECO.filter((d) => d.default);
  const equipped = {};
  for (const c of C.DECO_CATS) equipped[c.id] = (defaults.find((d) => d.cat === c.id) || {}).id;
  const branches = {};
  for (const b of C.BRANCHES) branches[b.id] = 0;
  const kinds = {};
  return {
    v: C.VERSION, savedAt: now, createdAt: now,
    started: false,
    prices: {},                                                   // v1.14 giá bán người chơi tự đặt (k) theo món
    tax: { since: 0, base: 0, bill: null, nextId: 1, history: [] }, // v1.14 thuế: kỳ đang tính + tờ thông báo chưa đóng
    shopName: C.START.shopName, avatar: 0, uniform: { staff: 'do', owner: 'do', staffStyle: 'tron', ownerStyle: 'tron' },
    money: C.START.money, xp: 0, level: 1, tier: 1,
    day: 1, clock: C.TIME.dayStart, phase: 'prep',
    speed: 1,
    tutorial: { step: 0, done: false },
    flags: { mom: {}, seenUnlock: {}, ui: {} },
    inventory, lots: {}, expired: null, market, autoRestock: false, usageYesterday: {},
    recipes, menu,
    upgrades,
    deco: { owned: defaults.map((d) => d.id), equipped },
    staff: [], candidates: { day: 0, list: [] }, staffTickets: 0, ownerMode: 'work', nextStaffId: 1, nextCid: 1,
    rating: { recent: [], avg: C.RATING.prior, count: 0 },
    reviews: [], nextReviewId: 1, combo: { best: 0 },
    weather: 'sun', event: null,
    forecast: { weather: 'rain', event: null },
    marketingToday,
    viral: { days: 0, mult: 1 }, boost: 1, nextBoost: 1,   // boost = today's TikToker bonus, nextBoost = tomorrow's
    reservations: [],
    lottery: { tickets: 0 },
    quests: { main: 0, mainClaimable: false, daily: { day: 0, list: [], allClaimed: false }, counters: {} },
    login: { lastDate: '', streak: 0, claimedDate: null },
    book: { kinds },
    stats: { potsSold: 0, potsSoldOf: {}, served: 0, fiveStars: 0, angry: 0, extrasServed: 0, drinksSold: 0, dessertsSold: 0, sidesSold: 0, daysPlayed: 0,
      bestDayRevenue: 0, bestDayProfit: 0, avgDayProfit: 0, moneyEarned: 0 },
    today: newToday(),
    report: null,
    branches,
    location: 'saigon',   // v1.7 dời quán
    ended: false,
    settings: { music: 0.6, sfx: 0.8, haptics: true, dayMin: C.TIME.defaultDayMin },
  };
}

/** Deep-merge a (possibly old) save onto the defaults so new fields never break old saves. */
export function migrate(save, now) {
  const def = defaultState(now);
  if (!save || typeof save !== 'object') return def;
  const hadBroth = !!(save.inventory && 'nl_ga' in save.inventory);
  const s = mergeDefaults(def, save);
  delete s.potAssign;
  // saves from before broth was a kho item: Má sends a few portions of every broth on the menu
  if (save.started && !hadBroth) {
    for (const i of C.INGREDIENTS) if (i.broth && s.level >= i.unlockLv) s.inventory[i.id] = Math.max(s.inventory[i.id] || 0, 12);
  }
  // v1.1: dessert quests were inserted into the main chain (after q26 and q32). Move an old save's pointer so it still
  // points at the same old quest — except a pointer sitting right after an insert, which now meets the new quests first.
  if (save.started && !(s.flags.ui && s.flags.ui.mqV11)) {
    const p = s.quests.main | 0, oldIdx = { q26: 25, q32: 31 };
    let shift = 0;
    for (const ins of C.MAIN_QUEST_INSERTS) if (p > oldIdx[ins.after] + 1) shift += ins.n;
    if (shift) { s.quests.main = p + shift; s.quests.mainClaimable = false; }
  }
  if (s.flags && s.flags.ui) s.flags.ui.mqV11 = true;
  // sanity
  if (!(s.clock >= C.TIME.dayStart)) s.clock = C.TIME.dayStart;
  if (!['prep', 'open', 'closing', 'report'].includes(s.phase)) s.phase = 'prep';
  if (!(s.tier >= 1 && s.tier <= C.TIERS.length)) s.tier = 1;
  if (C.LEVEL.max && s.level > C.LEVEL.max) s.level = C.LEVEL.max;   // v1.3: level cap 40
  if (!(s.money >= 0)) s.money = 0;
  // v1.8: tổng tiền kiếm được (bảng xếp hạng) — save cũ chưa có thì tính từ tiền đang có
  if (s.started && !(s.stats.moneyEarned >= s.money)) s.stats.moneyEarned = s.money;
  s.v = C.VERSION;
  return s;
}
export { clone };
