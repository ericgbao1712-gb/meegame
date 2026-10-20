// Pure derived helpers for the UI/renderer (TECH_SPEC §5.3). Cheap enough to call every frame.
import * as C from '../config.js';
import {
  ING, POT, UP, xpNeed, tierDef, builtTables, allTables, builtStoves, khoInfo, buyPrice as baseBuyPrice, potPrice, masteryStars,
  ambienceOf, featureUnlocked, isPotUnlocked, isIngUnlocked, isDrinkUnlocked, salaryTotal, staffSalary, sidePrice,
} from './economy.js';
import { staffSlots, roleUnlocked, roleCount, candidatesOf } from './staff.js';
import { trayStatus } from './kitchen.js';
import { mainQuestInfo, dailyTasks, loginInfo } from './quests.js';
import { tierInfo, forecastInfo } from './day.js';
import { raining, exposed, needsTarp, ownsTarp, tarpOpen, weatherNow, nextShowerIn } from './rain.js';

// ───────────── level names for upgrades without a `levels` list ─────────────
const GENERIC_NAMES = {
  knife: ['Dao thường', 'Dao bén', 'Dao Nhật', 'Bộ dao đầu bếp', 'Dao chuyên nghiệp', 'Dao huyền thoại'],
  cooler: ['Chưa có', 'Tủ mát nhỏ', 'Tủ mát đôi', 'Tủ mát lớn'],
  speaker: ['Chưa có', 'Loa mini', 'Dàn loa'],
};

export function createGetters(G) {
  const s = G.state;
  const open = () => s.phase === 'open' || s.phase === 'closing';

  function level() {
    const need = xpNeed(s.level);
    const atMax = s.level >= (C.LEVEL.max || Infinity);
    return { level: s.level, xp: s.xp, need, max: atMax, pct: atMax ? 100 : Math.min(100, (s.xp / need) * 100) };
  }
  const kho = () => khoInfo(G);
  /** Price per unit at today's market (buying is only possible before opening). */
  const buyPrice = (id) => baseBuyPrice(G, id);
  const availablePots = () => {
    const out = [];
    for (const p of C.HOTPOTS) {
      if (!s.menu[p.id] || !isPotUnlocked(G, p.id)) continue;
      let ok = true;
      for (const i of p.recipe) if ((s.inventory[i] || 0) < 1) { ok = false; break; }
      if (ok) out.push(p.id);
    }
    return out;
  };

  // ───────────── upgrades ─────────────
  function levelNames(up) {
    if (up.levels) return up.levels;
    if (GENERIC_NAMES[up.id]) return GENERIC_NAMES[up.id];
    return null;
  }
  function upgradeInfo(id) {
    const up = UP[id];
    if (!up) return { level: 0, max: 0, cost: null, canBuy: false, lockedReason: 'Không có nâng cấp này', levelName: '', nextLevelName: null };
    const t = tierDef(G);
    const level = s.upgrades[id] || 0;
    let max, cost = null, lockedReason = null, levelName, nextLevelName = null;
    if (up.perTier) {
      const start = t.startTables, cap = t.maxTables;
      max = cap - start;
      cost = level >= max ? null : C.upgradeCost(up, level, s.tier, level);
      const unit = 'bàn';
      levelName = `${start + level} ${unit}`;
      nextLevelName = level >= max ? null : `${start + level + 1} ${unit}`;
    } else if (id === 'tarp' && t.covered) {
      return { level: 1, max: 1, cost: null, canBuy: false, lockedReason: null, levelName: 'Có mái che', nextLevelName: null };
    } else {
      max = up.costs.length;
      cost = level >= max ? null : C.upgradeCost(up, level, s.tier, level);
      const names = levelNames(up);
      levelName = names ? names[Math.min(level, names.length - 1)] : level ? 'Đã có' : 'Chưa có';
      if (level < max) nextLevelName = names ? names[Math.min(level + 1, names.length - 1)] : max === 1 ? 'Đã có' : 'Cấp ' + (level + 1);
      if (cost != null && up.minTier && up.minTier[level] > s.tier) lockedReason = `Cần ${C.TIERS[up.minTier[level] - 1].name}`;
      else if (cost != null && up.minLv && up.minLv[level] > s.level) lockedReason = `Cần Lv ${up.minLv[level]}`;
      else if (cost != null && id === 'canh' && s.upgrades.table < t.maxTables - t.startTables) lockedReason = 'Kê đủ bàn trong quán trước';
    }
    return { level, max, cost, canBuy: cost != null && !lockedReason && s.money + 1e-9 >= cost, lockedReason, levelName, nextLevelName };
  }

  // ───────────── recipes ─────────────
  function recipeInfo(potId) {
    const p = POT[potId];
    if (!p) return null;
    const r = s.recipes[potId] || { lvl: 1, sold: 0 };
    const max = C.RECIPE.maxLevel;
    const cost = r.lvl >= max ? null : C.RECIPE.upgradeCost(p, r.lvl);
    const stars = masteryStars(G, potId);
    const nextMastery = C.RECIPE.masteryAt[stars] ?? null;
    return {
      id: potId, lvl: r.lvl, max, cost, canUpgrade: cost != null && s.money + 1e-9 >= cost && isPotUnlocked(G, potId),
      price: potPrice(G, potId), sold: r.sold, mastery: stars, nextMastery, unlocked: isPotUnlocked(G, potId), enabled: !!s.menu[potId],
      nextPrice: r.lvl >= max ? null : Math.round(p.price * (1 + r.lvl * C.RECIPE.pricePerLevel) * (1 + stars * C.RECIPE.masteryPriceBonus)),
    };
  }

  function candidates(role) {
    const out = [];
    for (const c of candidatesOf(G, role)) out.push(Object.assign({}, c, { salary: staffSalary(G, c), fee: staffSalary(G, c) * C.STAFF.hireFeeDays }));
    return out;
  }

  // ───────────── tray ─────────────
  function trayInfo() {
    const t = trayStatus(G);
    if (t) return t;
    return { ticket: null, need: [], drinks: { need: 0, done: 0 }, broth: { need: false, ready: false, readyStoveIdx: -1 }, canServe: false };
  }

  // ───────────── red dots ─────────────
  function decoBuyable(d) {
    return !d.default && !d.source && d.price > 0 && (d.minTier || 1) <= s.tier && (d.lv || 1) <= s.level && !s.deco.owned.includes(d.id);
  }
  function dots() {
    // kho: something used by the menu is nearly out, or the supplier is bought but not switched on
    let kho = false;
    const used = new Set();
    for (const p of C.HOTPOTS) if (s.menu[p.id] && isPotUnlocked(G, p.id)) for (const i of p.recipe) used.add(i);
    for (const i of used) if (isIngUnlocked(G, i) && (s.inventory[i] || 0) < 5 && s.money >= baseBuyPrice(G, i) && khoInfo(G).used < khoInfo(G).cap) { kho = true; break; }
    if (!kho && s.upgrades.supplier > 0 && !s.autoRestock) kho = true;
    // menu: recipe upgrade affordable or a new pot not yet looked at
    let menu = false;
    for (const p of C.HOTPOTS) {
      if (!isPotUnlocked(G, p.id)) continue;
      const r = s.recipes[p.id];
      if (r.lvl < C.RECIPE.maxLevel && s.money >= C.RECIPE.upgradeCost(p, r.lvl)) menu = true;
      if (p.unlockLv > 1 && r.sold === 0 && !s.flags.seenUnlock['pot:' + p.id]) menu = true;
    }
    if (s.flags.ui && s.flags.ui.menuNudge && !s.flags.ui.menuNudgeSeen) menu = true;   // Má pointed the player here
    // upgrade
    let upgrade = false;
    for (const u of C.UPGRADES) if (upgradeInfo(u.id).canBuy) { upgrade = true; break; }
    // staff
    let staff = false;
    const sl = staffSlots(G);
    for (const role of Object.keys(C.STAFF.roles)) {
      if (!roleUnlocked(G, role)) continue;
      if (s.flags.seenUnlock['role:' + role]) continue;
      if (sl.used < sl.max && roleCount(G, role) < C.STAFF.roles[role].max && roleCount(G, role) === 0) {
        const cs = candidatesOf(G, role);
        if (cs.length && s.money >= staffSalary(G, cs[0]) * C.STAFF.hireFeeDays) { staff = true; break; }
      }
    }
    // shop
    let shop = !!s.quests.mainClaimable;
    if (!shop && featureUnlocked(G, 'daily')) for (const e of dailyTasks(G)) if (e.done && !e.claimed) { shop = true; break; }
    if (!shop && loginInfo(G).canClaim && s.started) shop = true;
    if (!shop) for (const r of s.reviews) if (r.stars >= 5 && !r.thanked) { shop = true; break; }
    if (!shop && featureUnlocked(G, 'deco')) for (const d of C.DECO) if (decoBuyable(d) && s.money >= d.price) { shop = true; break; }
    if (!shop && tierInfo(G).canExpand) shop = true;
    return { kho, menu, upgrade, staff, shop };
  }

  // ───────────── hint ─────────────
  function hint() {
    const w = G.world;
    if (open()) {
      const piles = w.coinPiles;
      if (piles.length) return 'Có tiền trên bàn kìa — chạm vào để thu nha!';
      // low stock of something the menu needs
      let low = null;
      for (const p of C.HOTPOTS) {
        if (!s.menu[p.id] || !isPotUnlocked(G, p.id)) continue;
        for (const i of p.recipe) if (isIngUnlocked(G, i) && (s.inventory[i] || 0) <= 2 && (!low || s.inventory[i] < s.inventory[low])) low = i;
      }
      const tray = trayStatus(G);
      if (tray && tray.ticket && !tray.canServe) {
        const miss = tray.need.find((n) => !n.done);
        if (miss) return `Còn thiếu ${ING[miss.ing].name.toLowerCase()} trong mâm.`;
      }
      const wait = w.tickets.find((t) => t.status === 'new');
      if (wait) {
        const pot = POT[wait.pot];
        return `Có khách gọi ${pot.name.toLowerCase()} — chạm vào phiếu để soạn mâm nha.`;
      }
      if (!availablePots().length) return 'Hết hàng rồi! Mở Kho nhập thêm, hoặc đóng cửa sớm nha.';
      if (low) return `Kho còn ${s.inventory[low]} phần ${ING[low].name.toLowerCase()} — mở Kho nhập thêm kẻo hết nha.`;
      return 'Quán ổn áp rồi, cứ giữ nhịp nha!';
    }
    if (s.phase === 'report') return 'Xem báo cáo rồi chuẩn bị cho ngày mới nha.';
    const ti = tierInfo(G);
    if (ti.canExpand) return `Đủ điều kiện rồi! Mở ${C.TIERS[ti.next - 1].name} thôi.`;
    for (const i of used3()) if ((s.inventory[i] || 0) < 5) return `Kho còn ${s.inventory[i] || 0} phần ${ING[i].name.toLowerCase()} — đi chợ thôi!`;
    if (s.weather === 'rain' && !tierDef(G).covered && s.upgrades.tarp === 0) return 'Hôm nay có mưa rào mà chưa có bạt che — khách ướt sẽ bỏ về đó nha!';
    return 'Sẵn sàng thì bấm MỞ HÀNG nha!';
  }
  function used3() {
    const set = new Set();
    for (const p of C.HOTPOTS) if (s.menu[p.id] && isPotUnlocked(G, p.id)) for (const i of p.recipe) if (isIngUnlocked(G, i)) set.add(i);
    return set;
  }

  return {
    level, kho, buyPrice,
    buyPriceBase: (id) => baseBuyPrice(G, id),
    potPrice: (id) => potPrice(G, id),
    ambience: () => ambienceOf(G),
    unlocked: (key) => featureUnlocked(G, key),
    isPotUnlocked: (id) => isPotUnlocked(G, id),
    isIngUnlocked: (id) => isIngUnlocked(G, id),
    sidePrice: (id) => sidePrice(G, id),   // v1.6 Thực đơn
    isDrinkUnlocked: (id) => isDrinkUnlocked(G, id),
    availablePots, upgradeInfo, recipeInfo, candidates,
    tierInfo: () => tierInfo(G),
    staffSlots: () => staffSlots(G),
    salaryTotal: () => salaryTotal(G),
    mainQuest: () => mainQuestInfo(G),
    dailyTasks: () => dailyTasks(G),
    loginInfo: () => loginInfo(G),
    dots, trayInfo, hint,
    forecastText: () => forecastInfo(G).text,
    tables: () => allTables(G),
    stoves: () => builtStoves(G),
    weatherNow: () => weatherNow(G),
    rain: () => ({ raining: raining(G), exposed: exposed(G), needsTarp: needsTarp(G), owns: ownsTarp(G), tarp: tarpOpen(G), next: nextShowerIn(G) }),
  };
}
