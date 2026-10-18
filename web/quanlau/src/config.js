// Lẩu Ơi! — all game content and balance numbers.
// Pure data + pure helper functions. NO DOM access (imported by the headless balance sim).
// Money unit: k = 1.000đ (so 99 means 99.000đ). Time unit: game minutes unless noted.
// Ids here are the contract shared by sim, UI and art. Don't rename ids without updating art + UI.

export const VERSION = 1;

// ───────────────────────────── TIME ─────────────────────────────
export const TIME = {
  dayStart: 10 * 60,          // 10:00
  lastSeat: 22 * 60 + 30,     // no new groups after 22:30
  dayEnd: 23 * 60,            // 23:00 → remaining groups hurry up, then report
  // Real minutes per selling day at 1× is a player setting (Cài đặt → Độ dài 1 ngày), state.settings.dayMin.
  dayMinOptions: [4, 5, 6, 7, 8, 9, 10],
  defaultDayMin: 6,
  baseDaySec: 540,            // branch income (k per real second) is tuned for a 540 s day and rescaled to the setting
  orderDelay: 4,              // after sitting, the order ticket appears
  eatMinutes: [50, 70],
  payDelay: 3,                // after eating, coin pile appears
  collectMinutes: 3,          // time to collect + wipe table once a worker is there
  doorPatience: 90,           // groups waiting at the door for a free table (×2 since 2026-10-13)
  // groups per game hour, multiplied by tier.demand and all other multipliers
  demandCurve: { 10: 0.5, 11: 1.2, 12: 1.4, 13: 0.8, 14: 0.4, 15: 0.4, 16: 0.6, 17: 1.2, 18: 1.9, 19: 2.2, 20: 1.9, 21: 1.3, 22: 0.7 },
  rushHours: [[11 * 60, 13 * 60], [17 * 60 + 30, 21 * 60]],
  weekdays: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'], // day 1 = T2
  weekendMult: 1.3,
};

// ───────────────────────────── START ─────────────────────────────
/** Real seconds one selling day lasts at 1× for this save. */
export const daySecOf = (s) => {
  const m = Number(s && s.settings && s.settings.dayMin);
  return (TIME.dayMinOptions.includes(m) ? m : TIME.defaultDayMin) * 60;
};
/** Game minutes per real second at 1×. */
export const minPerSecOf = (s) => (TIME.dayEnd - TIME.dayStart) / daySecOf(s);
/** Branch income per real second is × this, so a whole day of branches pays the same whatever the day length. */
export const branchScale = (s) => TIME.baseDaySec / daySecOf(s);

export const START = {
  money: 500,                                  // 500.000đ tiền chu cấp
  inventory: { ga: 4, nam: 6, rau: 6, mi: 6, dauphu: 4, nl_ga: 4, nl_nam: 4 }, // giỏ nguyên liệu Má gửi
  shopName: 'Lẩu Nhà Mình',
  intro: [
    'Ra trường được ba tháng, bạn quyết định mở một quán lẩu nhỏ ngay trước hiên nhà.',
    'Ba mẹ chu cấp 500.000đ làm vốn. Má gửi thêm một giỏ rau, nấm, gà để "bán thử coi sao".',
    'Hai bộ bàn nhựa đỏ, một bếp ga mini. Trời chuyển mưa rồi kìa… mở hàng thôi!',
  ],
};

// Owner avatars the player picks at the start (art draws them via makeOwnerLook(avatar, tier))
export const AVATARS = [
  { id: 0, name: 'Tóc búi hoa' },
  { id: 1, name: 'Tóc húi cua' },
  { id: 2, name: 'Đeo kính cận' },
  { id: 3, name: 'Tóc ngắn kẹp' },
];

// ───────────────────────────── INGREDIENTS ─────────────────────────────
// Display order matters (dock grid is 2×5 in this order).
export const INGREDIENTS = [
  { id: 'bo',     name: 'Thịt bò',  short: 'Bò',   icon: 'ing_bo',     cost: 20, extraPrice: 50, unlockLv: 5, shelf: 2 },
  { id: 'heo',    name: 'Thịt heo', short: 'Heo',  icon: 'ing_heo',    cost: 12, extraPrice: 35, unlockLv: 8, shelf: 2 },
  { id: 'ga',     name: 'Thịt gà',  short: 'Gà',   icon: 'ing_ga',     cost: 14, extraPrice: 35, unlockLv: 1, shelf: 2 },
  { id: 'tom',    name: 'Tôm',      short: 'Tôm',  icon: 'ing_tom',    cost: 18, extraPrice: 45, unlockLv: 3, shelf: 2, seafood: true },
  { id: 'muc',    name: 'Mực',      short: 'Mực',  icon: 'ing_muc',    cost: 18, extraPrice: 45, unlockLv: 3, shelf: 2, seafood: true },
  { id: 'ca',     name: 'Cá',       short: 'Cá',   icon: 'ing_ca',     cost: 15, extraPrice: 40, unlockLv: 11, shelf: 2, seafood: true },
  { id: 'rau',    name: 'Rau xanh', short: 'Rau',  icon: 'ing_rau',    cost: 4,  extraPrice: 15, unlockLv: 1, shelf: 2 },
  { id: 'nam',    name: 'Nấm',      short: 'Nấm',  icon: 'ing_nam',    cost: 6,  extraPrice: 20, unlockLv: 1, shelf: 2 },
  { id: 'dauphu', name: 'Đậu phụ',  short: 'Đậu',  icon: 'ing_dauphu', cost: 3,  extraPrice: 15, unlockLv: 1, shelf: 2 },
  { id: 'mi',     name: 'Mì',       short: 'Mì',   icon: 'ing_mi',     cost: 3,  extraPrice: 10, unlockLv: 1, shelf: 5 },
  // shelf: days a portion stays usable, counting the day it was bought (2 = today + tomorrow). Fresh food 2, mì & nước lẩu 5.
  // Broth is stocked like any ingredient (one item per hotpot, first in its recipe). broth: true keeps it
  // out of the dock's ingredient grid (it has its own row) and out of level-up unlock lists.
  { id: 'nl_ga',      name: 'Nước lẩu gà',       short: 'Gà',      icon: 'pot_ga',      cost: 3, extraPrice: 20, unlockLv: 1,  broth: 'ga', shelf: 5 },
  { id: 'nl_nam',     name: 'Nước lẩu nấm',      short: 'Nấm',     icon: 'pot_nam',     cost: 2, extraPrice: 15, unlockLv: 1,  broth: 'nam', shelf: 5 },
  { id: 'nl_thai',    name: 'Nước lẩu Thái',     short: 'Thái',    icon: 'pot_thai',    cost: 4, extraPrice: 25, unlockLv: 3,  broth: 'thai', shelf: 5 },
  { id: 'nl_bo',      name: 'Nước lẩu bò',       short: 'Bò',      icon: 'pot_bo',      cost: 4, extraPrice: 25, unlockLv: 5,  broth: 'bo', shelf: 5 },
  { id: 'nl_rieucua', name: 'Nước riêu cua',     short: 'Riêu',    icon: 'pot_rieucua', cost: 5, extraPrice: 30, unlockLv: 8,  broth: 'rieucua', shelf: 5 },
  { id: 'nl_chuacay', name: 'Nước lẩu chua cay', short: 'Chua cay', icon: 'pot_chuacay', cost: 4, extraPrice: 30, unlockLv: 11, broth: 'chuacay', shelf: 5 },
  { id: 'nl_dacbiet', name: 'Nước cốt Nhà Mình', short: 'Nhà Mình', icon: 'pot_dacbiet', cost: 6, extraPrice: 40, unlockLv: 18, broth: 'dacbiet', shelf: 5 },
];

// ───────────────────────────── HOTPOTS ─────────────────────────────
// broth: colour key the art uses for the soup surface (see palette.js BROTH)
export const HOTPOTS = [
  { id: 'ga',      name: 'Lẩu gà',        icon: 'pot_ga',      broth: 'ga',      recipe: ['nl_ga', 'ga', 'nam', 'rau', 'mi'],                 price: 99,  brothCost: 5,  cookMin: 12, unlockLv: 1,
    desc: 'Nước dùng gà ngọt thanh, thơm mùi lá é. Ai ăn cũng được.' },
  { id: 'nam',     name: 'Lẩu nấm',       icon: 'pot_nam',     broth: 'nam',     recipe: ['nl_nam', 'nam', 'dauphu', 'rau', 'mi'],             price: 79,  brothCost: 3,  cookMin: 10, unlockLv: 1,
    desc: 'Thanh đạm, đủ loại nấm. Hợp người ăn chay và sinh viên cuối tháng.' },
  { id: 'thai',    name: 'Lẩu Thái',      icon: 'pot_thai',    broth: 'thai',    recipe: ['nl_thai', 'tom', 'muc', 'nam', 'rau', 'mi'],         price: 149, brothCost: 7,  cookMin: 15, unlockLv: 3,
    desc: 'Chua chua cay cay, sả ớt lá chanh, tôm mực tươi rói.' },
  { id: 'bo',      name: 'Lẩu bò',        icon: 'pot_bo',      broth: 'bo',      recipe: ['nl_bo', 'bo', 'dauphu', 'nam', 'rau', 'mi'],       price: 139, brothCost: 7,  cookMin: 16, unlockLv: 5,
    desc: 'Xương bò hầm tám tiếng, thịt bò nhúng tái mềm tan.' },
  { id: 'rieucua', name: 'Lẩu riêu cua',  icon: 'pot_rieucua', broth: 'rieucua', recipe: ['nl_rieucua', 'heo', 'bo', 'dauphu', 'rau', 'mi'],       price: 169, brothCost: 9,  cookMin: 16, unlockLv: 8,
    desc: 'Riêu cua đồng béo ngậy, sườn sụn, bắp bò, đậu rán vàng.' },
  { id: 'chuacay', name: 'Lẩu chua cay',  icon: 'pot_chuacay', broth: 'chuacay', recipe: ['nl_chuacay', 'ca', 'tom', 'muc', 'rau', 'mi'],         price: 179, brothCost: 8,  cookMin: 15, unlockLv: 11,
    desc: 'Hải sản chua cay xé lưỡi. Húp một muỗng là nghiện.' },
  { id: 'dacbiet', name: 'Lẩu thập cẩm Nhà Mình', icon: 'pot_dacbiet', broth: 'dacbiet',
    recipe: ['nl_dacbiet', 'bo', 'heo', 'ga', 'tom', 'muc', 'ca', 'rau', 'nam', 'dauphu', 'mi'], price: 299, brothCost: 12, cookMin: 20, unlockLv: 18,
    desc: 'Món tủ của quán: đủ cả mười nguyên liệu, nồi to, nước cốt bí truyền.' },
];

export const RECIPE = {
  maxLevel: 5,
  pricePerLevel: 0.12,           // +12% price per level above 1
  qualityPerLevel: 0.08,
  upgradeCost: (pot, lvl) => Math.round(pot.price * 3 * Math.pow(2.0, lvl - 1)), // cost to go lvl → lvl+1
  masteryAt: [10, 50, 200, 500], // pots sold → mastery stars 1..4
  masteryPriceBonus: 0.03,       // per mastery star
};

// ───────────────────────────── DRINKS ─────────────────────────────
// Drinks are not stocked; serving one deducts `cost` automatically.
export const DRINKS = [
  { id: 'trada',    name: 'Trà đá',    icon: 'drk_trada',    price: 3,  cost: 0.5, unlockLv: 1 },
  { id: 'nuocngot', name: 'Nước ngọt', icon: 'drk_nuocngot', price: 15, cost: 7,   unlockLv: 1 },
  { id: 'tratac',   name: 'Trà tắc',   icon: 'drk_tratac',   price: 12, cost: 3,   unlockLv: 2 },
  { id: 'nuocsam',  name: 'Nước sâm',  icon: 'drk_nuocsam',  price: 15, cost: 4,   unlockLv: 4 },
  { id: 'nuocdua',  name: 'Nước dừa',  icon: 'drk_nuocdua',  price: 22, cost: 9,   unlockLv: 7 },
];
export const DRINK_CHANCE = 0.75;     // per person; + cooler level × 0.06

// ───────────────────────────── CUSTOMERS ─────────────────────────────
// patience: game minutes from order ticket to food served (×staff/upgrade multipliers, ×PATIENCE_MULT)
export const PATIENCE_MULT = 2;   // the player asked for customers to wait twice as long
// prefers: weights over hotpot ids (missing = 0.5). drinks: weights over drink ids (missing = 1)
// hours: demand multipliers per hour for this kind (missing = 1). weight: base share of spawns.
export const CUSTOMERS = {
  sinhvien: { name: 'Sinh viên', group: [2, 4], patience: 90, budget: 110, weight: 1.3, minTier: 1,
    tipChance: 0.05, tip: [2, 5], extraChance: 0.25,
    prefers: { nam: 3, ga: 2, thai: 1.2 }, drinks: { trada: 4, tratac: 2, nuocngot: 1 },
    hours: { 10: 0.3, 11: 1.0, 12: 1.2, 14: 0.5, 18: 1.0, 19: 1.3, 20: 1.6, 21: 1.8, 22: 1.6 },
    desc: 'Ví mỏng nhưng bụng to. Thích quán rẻ, ngồi lâu, cười to, chụp hình nồi lẩu trước khi ăn.' },
  vanphong: { name: 'Dân văn phòng', group: [1, 3], patience: 60, budget: 180, weight: 1.0, minTier: 1,
    tipChance: 0.18, tip: [5, 15], extraChance: 0.15,
    prefers: { thai: 3, bo: 2, ga: 1.5, chuacay: 1.5 }, drinks: { tratac: 3, nuocngot: 2, nuocsam: 2 },
    hours: { 11: 1.9, 12: 2.0, 13: 1.0, 14: 0.3, 17: 1.5, 18: 1.6, 19: 1.0, 21: 0.4, 22: 0.2 },
    desc: 'Giờ nghỉ trưa có đúng 45 phút. Lên món chậm là ăn ngay 3 sao.' },
  giadinh:  { name: 'Gia đình nhỏ', group: [3, 4], patience: 75, budget: 200, weight: 0.8, minTier: 1,
    tipChance: 0.1, tip: [5, 10], extraChance: 0.3,
    prefers: { ga: 3, bo: 2.5, nam: 1, rieucua: 2 }, drinks: { nuocngot: 3, nuocdua: 2, nuocsam: 2 },
    hours: { 10: 0.5, 11: 1.0, 12: 1.2, 17: 1.2, 18: 1.6, 19: 1.8, 20: 1.0, 21: 0.4, 22: 0.1 },
    desc: 'Ba mẹ và một bé con háo hức. Bé thích nhất là lúc nồi lẩu sôi phì phò.' },
  capdoi:   { name: 'Cặp đôi', group: [2, 2], patience: 80, budget: 190, weight: 0.9, minTier: 1,
    tipChance: 0.12, tip: [5, 15], extraChance: 0.2, likesAmbience: true,
    prefers: { thai: 3, chuacay: 3, nam: 1, ga: 1 }, drinks: { tratac: 2, nuocdua: 2, nuocsam: 1 },
    hours: { 11: 0.5, 12: 0.6, 18: 1.2, 19: 1.6, 20: 1.8, 21: 1.6, 22: 1.0 },
    desc: 'Hẹn hò ở quán lẩu là chuẩn bài. Để ý từng cái đèn, từng chậu cây.' },
  hoiban:   { name: 'Hội bạn thân', group: [4, 4], patience: 90, budget: 230, weight: 0.7, minTier: 1,
    tipChance: 0.1, tip: [5, 20], extraChance: 0.65,
    prefers: { thai: 2, chuacay: 2.5, rieucua: 2, dacbiet: 2.5, bo: 1 }, drinks: { nuocngot: 3, tratac: 2, trada: 2 },
    hours: { 10: 0.1, 11: 0.4, 12: 0.5, 18: 1.0, 19: 1.4, 20: 1.8, 21: 2.0, 22: 1.8 },
    desc: '"Một, hai, ba, dô!" Gọi thêm dĩa liên tục, về khuya mới chịu đứng dậy.' },
  chutu:    { name: 'Chú Tư hàng xóm', group: [1, 1], patience: 140, budget: 160, weight: 0, minTier: 1,
    tipChance: 0.3, tip: [5, 5], extraChance: 0.2, regular: true, oncePerDay: true, arriveHour: [17, 19],
    prefers: { bo: 3, ga: 2, nam: 1 }, drinks: { trada: 5 },
    desc: 'Ngày nào cũng ghé, ngồi đúng một bàn quen, kể chuyện hồi xưa khu này còn ruộng.' },
  khachtay: { name: 'Khách Tây', group: [1, 2], patience: 80, budget: 280, weight: 0.22, minTier: 2,
    tipChance: 0.6, tip: [20, 60], extraChance: 0.3, likesNew: true,
    prefers: { thai: 2, rieucua: 2, chuacay: 2, ga: 1 }, drinks: { nuocdua: 4, tratac: 2 },
    hours: { 11: 1.0, 12: 1.0, 19: 1.3, 20: 1.3 },
    desc: 'Lần đầu ăn lẩu Việt. Tip rất mạnh tay nếu thấy ngon. "So good! Ngon quá!"' },
  reviewer: { name: 'Food Reviewer', group: [1, 1], patience: 65, budget: 320, weight: 0.03, minTier: 1,
    tipChance: 0.2, tip: [10, 30], extraChance: 0.5, special: true, reviewWeight: 5,
    prefers: { dacbiet: 3, chuacay: 2, rieucua: 2, thai: 2, bo: 1, ga: 1, nam: 1 }, drinks: { tratac: 1, nuocsam: 1 },
    desc: 'Một video của anh ấy có thể làm cả hẻm xếp hàng. Hoặc làm quán vắng cả tuần.' },
  tiktoker: { name: 'Hot TikToker', group: [1, 2], patience: 60, budget: 250, weight: 0.05, minTier: 2,
    tipChance: 0.2, tip: [10, 20], extraChance: 0.3, special: true, likesAmbience: true,
    prefers: { thai: 2, chuacay: 2, dacbiet: 2 }, drinks: { nuocdua: 2, tratac: 2 },
    hours: { 19: 1.5, 20: 1.5, 21: 1.5 },
    desc: '"Hello cả nhà iu!" Quán đẹp là quay, món ngon là lên xu hướng.' },
  doandulich: { name: 'Đoàn du lịch', group: [4, 4], patience: 70, budget: 350, weight: 0.04, minTier: 3,
    tipChance: 0.4, tip: [20, 50], extraChance: 0.6, special: true,
    prefers: { dacbiet: 4, rieucua: 2, chuacay: 2 }, drinks: { nuocdua: 3, nuocngot: 2 },
    hours: { 12: 1.5, 18: 1.5, 19: 1.5 },
    desc: 'Hướng dẫn viên cầm cờ dẫn cả đoàn tới. Ăn nhanh, trả nhanh, khen nức nở.' },
  shipper:  { name: 'Anh shipper', group: [1, 1], patience: 45, budget: 200, weight: 0.35, minTier: 2,
    tipChance: 0.15, tip: [2, 5], extraChance: 0, takeaway: true,
    prefers: { ga: 2, thai: 2, bo: 2 }, drinks: {},
    hours: { 11: 1.5, 12: 1.5, 18: 1.5, 19: 1.5, 20: 1.2 },
    desc: 'Đơn mang về cho khách đặt qua app. Không cần bàn, chỉ cần nhanh.' },
};

// Ambient NPC (not a customer): cô bán vé số
export const LOTTERY = {
  name: 'Cô bán vé số', ticketPrice: 10, maxPerDay: 5, visitChancePerHour: 0.12,
  prizes: [{ chance: 0.01, amount: 1000 }, { chance: 0.10, amount: 100 }], // checked in order at day end
};

// ───────────────────────────── SATISFACTION / RATING ─────────────────────────────
export const SAT = {
  base: 3.5,                    // fast owner-served early table ≈ 4.3★ avg (tune with the sim)
  qualityWeight: 1.3,           // quality ~0.55 .. 1.15
  baseQuality: 0.55,
  ownerSkill: 0.12,             // owner prepares → quality bonus
  chefSkillPer: 0.02,           // per chef skl point
  stoveQualityPer: 0.03,        // per stove-type level
  knifeQualityPer: 0.02,
  wait: [[0.35, 0.5], [0.6, 0.15], [0.85, -0.35], [Infinity, -0.9]], // waited/patience thresholds → bonus
  ambienceWeight: 0.6,          // × ambience score 0..1
  charmMax: 0.3,                // best cashier/waiter charm bonus
  pricePenalty: 1.2,            // × (price/budget − 1), capped
  pricePenaltyCap: 1.0,
  substitutePenalty: 0.5,       // ordered pot unavailable → picked another
  hotNoCooling: -0.4,
  rainNoTarp: -0.5,
  noise: 0.35,
  angryStars: 1,                // left before being served
};
export const RATING = {
  window: 60, prior: 3.5, priorWeight: 8,
  reviewChance: 0.55,           // regular customers leaving a written review (specials: always)
  demandMult: (r) => 0.5 + 0.25 * (r - 1), // 1★ → 0.5×, 5★ → 1.5×
};

export const COMBO = { fastRatio: 0.35, bonusPer: 0.03, maxBonus: 0.30 };

// ───────────────────────────── STAFF ─────────────────────────────
export const STAFF = {
  roles: {
    phucvu:  { name: 'Phục vụ',  icon: 'ui_staff', unlockLv: 2,  minTier: 1, max: 99, desc: 'Bưng lẩu, mang nước, thu tiền, dọn bàn.' },
    daubep:  { name: 'Đầu bếp',  icon: 'ui_fire',  unlockLv: 3,  minTier: 1, max: 99, desc: 'Nấu nước lẩu và soạn mâm cho từng phiếu.' },
    thungan: { name: 'Thu ngân', icon: 'ui_coin',  unlockLv: 7,  minTier: 2, max: 1,  desc: 'Khách kiên nhẫn hơn 20%, tip nhiều hơn.' },
    quankho: { name: 'Quản kho', icon: 'ui_kho',   unlockLv: 10, minTier: 3, max: 1,  desc: 'Mỗi sáng tự nhập đủ hàng, không mất phí giao.' },
  },
  slotsByTier: [2, 4, 6, 9, 9],
  rarityWeights: [40, 30, 18, 9, 3],          // ★1..★5
  rarityPoints: [6, 9, 12, 16, 21],           // total stat points (spd+skl+chm), ±2
  salary: (s, tier) => Math.round((30 + 5 * (s.spd + s.skl + s.chm)) * [1, 1.6, 2.4, 2.8, 2.8][tier - 1]), // k/day
  hireFeeDays: 1,
  refreshCost: (tier) => 30 * [1, 3, 8, 20, 20][tier - 1],
  levelXp: [10, 30, 60, 100, 160, 240, 350, 500, 700], // jobs done to reach lvl 2..10
  levelSalaryUp: 0.05,
  // speeds are multipliers on top of base action times
  speedMult: (spd) => 0.6 + 0.08 * spd,      // spd 1..10 → 0.68..1.4
  walkPxPerMin: (spd) => 11 + spd,           // owner walks 14 px / game-min
  managerBonus: 0.10,                        // owner in manage mode → all staff +10% speed
  traits: [
    { id: 'nhanh',    name: 'Nhanh như sóc', desc: 'Tốc độ +20%' },
    { id: 'ngot',     name: 'Miệng ngọt',    desc: 'Tip +25%' },
    { id: 'chamchi',  name: 'Chăm chỉ',      desc: 'Lên cấp nhanh gấp đôi' },
    { id: 'tiktok',   name: 'Mê TikTok',     desc: 'Khách tới quán +5%' },
    { id: 'hat',      name: 'Hay hát',       desc: 'Khách kiên nhẫn hơn 10%' },
    { id: 'kytinh',   name: 'Kỹ tính',       desc: 'Món ngon hơn (+0.05 chất lượng)' },
    { id: 'tietkiem', name: 'Tiết kiệm',     desc: '10% cơ hội không tốn nguyên liệu' },
    { id: 'vung',     name: 'Hơi vụng',      desc: 'Chậm hơn 10% nhưng lương rẻ 30%' },
  ],
  traitChance: 0.6,
  names: ['Bé Na', 'Anh Tèo', 'Chị Mơ', 'Tí', 'Tủn', 'Bông', 'Su', 'Mít', 'Bin', 'Thỏ', 'Cốm', 'Gạo', 'Bắp', 'Đậu',
    'Xu', 'Út Hiền', 'Cu Tí', 'Khoa', 'Thảo', 'Vy', 'Trâm', 'Duy', 'Phát', 'Lộc', 'Hân', 'Tuấn', 'Long', 'Nhi',
    'Quân', 'Hậu', 'Kem', 'Mận', 'Bơ', 'Sóc', 'Tũn', 'Chíp', 'Na Na', 'Bé Ba', 'Anh Hai', 'Chị Út'],
};

// Owner base action speeds (game minutes)
export const OWNER = {
  walkPxPerMin: 14,
  prepPerIngredient: 0,     // player taps = instant
  chefPrepPerIngredient: 4, // chef: 4 min / (speedMult × knifeMult)
  tapBoostMin: 1.5,         // each tap on a cooking pot adds this much progress (max 8 taps/s)
};

// ───────────────────────────── UPGRADES ─────────────────────────────
// costs[i] = price to go from level i to i+1. minTier[i] = tier needed for that step.
// perTier: level resets meaning per tier (count added beyond tier.start*); cost uses tierCostBase.
export const UPGRADE_CATS = [
  { id: 'banghe',  name: 'Bàn ghế' },
  { id: 'bep',     name: 'Bếp' },
  { id: 'thietbi', name: 'Thiết bị' },
  { id: 'quangba', name: 'Quảng bá' },
];
export const UPGRADES = [
  { id: 'table', cat: 'banghe', name: 'Thêm bàn', icon: 'eq_table', perTier: true, tierCostBase: [180, 900, 4000, 8000], growth: 1.6,
    desc: 'Thêm một bộ bàn ghế. Nhiều bàn hơn, nhiều khách hơn.' },
  { id: 'tablestyle', cat: 'banghe', name: 'Bàn ghế xịn', icon: 'eq_table', costs: [500, 3000, 12000, 40000], minTier: [1, 2, 3, 4],
    levels: ['Nhựa đỏ', 'Inox', 'Gỗ thông', 'Gỗ lim', 'Đá cẩm thạch'], amb: 4, patiencePer: 0.08,
    desc: 'Khách ngồi êm hơn thì kiên nhẫn hơn, quán cũng sang hơn.' },
  { id: 'stovetype', cat: 'bep', name: 'Đời bếp', icon: 'eq_stove', costs: [600, 3000, 10000, 40000], minTier: [1, 1, 2, 3],
    levels: ['Bếp ga mini', 'Bếp ga đôi', 'Bếp hồng ngoại', 'Bếp từ', 'Bếp công nghiệp'], speedPer: 0.25,
    desc: 'Lửa đều, nồi lẩu lên bàn sôi ngon hơn — khách chấm điểm cao hơn.' },
  { id: 'knife', cat: 'bep', name: 'Dao thớt bén', icon: 'eq_knife', costs: [200, 800, 3000, 10000, 30000], minTier: [1, 1, 2, 3, 4],
    speedPer: 0.15, desc: 'Đầu bếp soạn mâm nhanh hơn, món cũng ngon hơn.' },
  { id: 'kho', cat: 'thietbi', name: 'Kho chứa', icon: 'ui_kho', costs: [400, 2500, 9000, 30000], minTier: [1, 2, 3, 4],
    levels: ['Thùng xốp', 'Tủ đông', 'Tủ đông đôi', 'Kho lạnh mini', 'Kho lạnh lớn'], capMult: [1, 1.6, 2.4, 3.5, 5],
    desc: 'Chứa được nhiều nguyên liệu hơn.' },
  { id: 'cooler', cat: 'thietbi', name: 'Tủ mát nước', icon: 'eq_cooler', costs: [300, 1500, 6000], minTier: [1, 2, 3],
    drinkChancePer: 0.06, desc: 'Nước lạnh mát, khách gọi nước nhiều hơn.' },
  { id: 'tarp', cat: 'thietbi', name: 'Bạt che mưa', icon: 'eq_tarp', costs: [250], minTier: [1],
    desc: 'Mưa rào thì chạm Kéo bạt để che khách. Không có bạt, khách ướt sẽ bỏ về!' },
  { id: 'cooling', cat: 'thietbi', name: 'Quạt & máy lạnh', icon: 'eq_fan', costs: [350, 2500, 12000], minTier: [1, 2, 3],
    levels: ['Không có', 'Quạt đứng', 'Quạt trần', 'Máy lạnh'], amb: 3,
    desc: 'Ngày nắng nóng không mất khách.' },
  { id: 'speaker', cat: 'thietbi', name: 'Loa nhạc', icon: 'eq_speaker', costs: [600, 5000], minTier: [1, 2], amb: 2, patiencePer: 0.10,
    desc: 'Nhạc hay thì khách chờ cũng không thấy lâu.' },
  { id: 'pos', cat: 'thietbi', name: 'Máy tính tiền', icon: 'ui_coin', costs: [3500], minTier: [2], tipMult: 1.2,
    desc: 'Thu tiền nhanh gọn, khách vui tip thêm.' },
  { id: 'supplier', cat: 'thietbi', name: 'Mối chợ đầu mối', icon: 'ui_kho', costs: [2500], minTier: [2], fee: 0.08,
    desc: 'Mỗi sáng tự giao hàng tới quán (phí 8%). Bật/tắt trong Kho.' },
  { id: 'sign', cat: 'quangba', name: 'Biển hiệu', icon: 'eq_sign', costs: [250, 1800, 9000, 30000], minTier: [1, 2, 3, 4], amb: 2, demandPer: 0.12,
    levels: ['Không có', 'Bảng giấy', 'Bảng gỗ sơn', 'Hộp đèn', 'Đèn neon'],
    desc: 'Người đi đường dễ thấy quán hơn.' },
];
// helper: price of the next level of an upgrade; returns null at max
export function upgradeCost(up, level, tier, tierLevelsBought = level) {
  if (up.perTier) {
    const base = up.tierCostBase[Math.min(tier, 4) - 1];
    return Math.round(base * Math.pow(up.growth, tierLevelsBought));
  }
  if (level >= up.costs.length) return null;
  return up.costs[level];
}

// ───────────────────────────── DECO ─────────────────────────────
// One equipped item per category. amb = ambience points. source: shop | login | quest | chest
export const DECO_CATS = [
  { id: 'den',     name: 'Đèn' },
  { id: 'cay',     name: 'Cây' },
  { id: 'tuong',   name: 'Tường' },
  { id: 'dacbiet', name: 'Đặc biệt' },
];
export const DECO = [
  { id: 'den_bong',     cat: 'den', name: 'Bóng đèn tròn',     price: 0,     amb: 0,  default: true },
  { id: 'den_day',      cat: 'den', name: 'Đèn dây vàng',      price: 300,   amb: 4 },
  { id: 'den_long_do',  cat: 'den', name: 'Đèn lồng đỏ',       price: 1200,  amb: 8 },
  { id: 'den_hoian',    cat: 'den', name: 'Đèn lồng Hội An',   price: 5000,  amb: 14, minTier: 2 },
  { id: 'den_chum',     cat: 'den', name: 'Đèn chùm pha lê',   price: 25000, amb: 22, minTier: 3 },

  { id: 'cay_none',     cat: 'cay', name: 'Chưa có cây',       price: 0,     amb: 0,  default: true },
  { id: 'cay_luoiho',   cat: 'cay', name: 'Chậu lưỡi hổ',      price: 200,   amb: 3 },
  { id: 'cay_kimtien',  cat: 'cay', name: 'Cây kim tiền',      price: 800,   amb: 6,  desc: 'Tên nghe đã thấy giàu.' },
  { id: 'cay_tre',      cat: 'cay', name: 'Khóm trúc',         price: 3000,  amb: 10, minTier: 2 },
  { id: 'cay_bonsai',   cat: 'cay', name: 'Bonsai cổ thụ',     price: 15000, amb: 18, minTier: 3 },
  { id: 'cay_mai',      cat: 'cay', name: 'Cây mai ngày Tết',  price: 0,     amb: 15, source: 'login', desc: 'Quà điểm danh ngày 4.' },

  { id: 'tuong_tron',   cat: 'tuong', name: 'Tường trơn',      price: 0,     amb: 0,  default: true },
  { id: 'tuong_lich',   cat: 'tuong', name: 'Lịch bloc',       price: 150,   amb: 2,  desc: 'Mỗi ngày xé một tờ.' },
  { id: 'tuong_dongho', cat: 'tuong', name: 'Tranh Đông Hồ',   price: 1500,  amb: 8 },
  { id: 'tuong_quat',   cat: 'tuong', name: 'Quạt giấy trang trí', price: 4000, amb: 11, minTier: 2 },
  { id: 'tuong_sonmai', cat: 'tuong', name: 'Tranh sơn mài',   price: 20000, amb: 20, minTier: 3 },

  { id: 'db_none',      cat: 'dacbiet', name: 'Chưa có',       price: 0,     amb: 0,  default: true },
  { id: 'db_ongdia',    cat: 'dacbiet', name: 'Bàn thờ Ông Địa – Thần Tài', price: 888, amb: 5, effect: { tipMult: 1.1 }, desc: 'Buôn may bán đắt! Tip +10%.' },
  { id: 'db_meo',       cat: 'dacbiet', name: 'Mèo thần tài vẫy tay', price: 2500, amb: 7, effect: { tipMult: 1.15 }, desc: 'Vẫy hoài không mỏi. Tip +15%.' },
  { id: 'db_tivi',      cat: 'dacbiet', name: 'Tivi chiếu bóng đá', price: 6000, amb: 10, minTier: 2, effect: { demandMult: 1.1, footballMult: 1.5 }, desc: 'Khách +10%, ngày có trận còn đông hơn.' },
  { id: 'db_beca',      cat: 'dacbiet', name: 'Bể cá Koi',     price: 18000, amb: 16, minTier: 3 },
  { id: 'db_karaoke',   cat: 'dacbiet', name: 'Dàn karaoke',   price: 40000, amb: 20, minTier: 4, effect: { patienceMult: 1.15 }, desc: 'Khách kiên nhẫn hơn 15%. Hàng xóm thì… hơi bực.' },
];

// ───────────────────────────── TIERS (restaurants) ─────────────────────────────
export const TIERS = [
  { id: 1, scene: 'vihe',    name: 'Quán lẩu vỉa hè',      cost: 0,      require: null,
    startTables: 2, maxTables: 4,  startStoves: 2, maxStoves: 2, waitSpots: 2, kho: 300, rent: 0,   demand: 1.0, ambCap: 20, covered: false,
    desc: 'Hai bộ bàn nhựa đỏ trước hiên nhà, một bếp ga mini và rất nhiều quyết tâm.' },
  { id: 2, scene: 'hem',     name: 'Quán lẩu trong hẻm',   cost: 2500,   require: { level: 5, rating: 3.6 },
    startTables: 5, maxTables: 7,  startStoves: 2, maxStoves: 3, waitSpots: 3, kho: 640, rent: 80,  demand: 1.5, ambCap: 40, covered: true,
    desc: 'Thuê nguyên căn nhà trong hẻm. Dây điện chằng chịt, hàng xóm thân thiện, khách quen đông dần.' },
  { id: 3, scene: 'mapho',   name: 'Nhà hàng lẩu mặt phố', cost: 15000,  require: { level: 10, rating: 4.0 },
    startTables: 7, maxTables: 10, startStoves: 3, maxStoves: 4, waitSpots: 4, kho: 1200, rent: 300, demand: 2.1, ambCap: 65, covered: true,
    desc: 'Mặt tiền đường lớn, cửa kính, biển hiệu to. Giờ bạn là chủ nhà hàng thật sự.' },
  { id: 4, scene: 'haitang', name: 'Nhà hàng lẩu 2 tầng',  cost: 60000,  require: { level: 16, rating: 4.3 },
    startTables: 10, maxTables: 14, startStoves: 4, maxStoves: 5, waitSpots: 5, kho: 2000, rent: 900, demand: 2.7, ambCap: 90, covered: true,
    desc: 'Hai tầng, ban công nhìn ra phố, tầng trên dành cho khách đi nhóm.' },
  { id: 5, scene: 'haitang', name: 'Chuỗi Lẩu Nhà Mình',   cost: 250000, require: { level: 22, rating: 4.5 }, chain: true,
    startTables: 14, maxTables: 14, startStoves: 5, maxStoves: 5, waitSpots: 5, kho: 2000, rent: 900, demand: 2.7, ambCap: 90, covered: true,
    desc: 'Mở chi nhánh khắp Việt Nam. Nhà hàng gốc vẫn hoạt động như cũ.' },
];
export const TIER_MULT = [1, 3, 8, 20, 50]; // reward/price scaling helper by tier

// ───────────────────────────── LEVELS ─────────────────────────────
export const LEVEL = {
  xpToNext: (lv) => (lv === 1 ? 60 : Math.round(450 * Math.pow(1.295, lv - 2))),
  // XP for a finished table: price/8 + 3/person + 6 if 5★, × tierXp
  xpForGroup: (potPrice, size, stars, tier) => Math.round((potPrice / 8 + 3 * size + (stars >= 5 ? 6 : 0)) * [1, 1.3, 1.7, 2.2, 2.6][tier - 1]),
  thankXp: 2,
};
// Feature flags unlocked by level (hotpots/ingredients/drinks unlock by their own unlockLv).
export const FEATURES = {
  hire_phucvu: 2, hire_daubep: 3, deco: 4, daily: 4, reservations: 6, mkt_reviewer: 6,
  hire_thungan: 7, mkt_livestream: 9, hire_quankho: 10, speed2: 5, manageMode: 7, extras: 3, lottery: 3,
};

// ───────────────────────────── MARKET ─────────────────────────────
export const MARKET = {
  dailyVol: 0.10, meanRevert: 0.2, min: 0.75, max: 1.35, // multiplier random walk on cost
  // no buying while the restaurant is open: the kho is stocked at the start of the day only
  packs: [10, 50],               // buy buttons (+ "Đầy kho")
  soldOutTargetMult: 2,         // …or × this when yesterday sold out (usage undercounts the real demand)
  autoBuyTargetMult: 1.3,        // auto restock to yesterday usage × this (min 8 each for enabled pots)
};

// ───────────────────────────── RAIN SHOWERS (vỉa hè only) ─────────────────────────────
// Rain/storm days bring showers (game-minute windows). At an uncovered tier the player pulls the tarp out
// (button in the scene) while it rains; guests caught in the rain walk out after wetLeaveMin.
export const RAIN = {
  showers: { rain: [2, 3], storm: [1, 1] },
  showerMin: [60, 140],
  from: 10 * 60 + 25, to: 22 * 60 + 40,
  wetLeaveMin: 30,               // game minutes a guest sits in the rain before giving up
  tarpPullSec: 0.9,              // real seconds the unrolling animation takes
};

// ───────────────────────────── WEATHER & EVENTS ─────────────────────────────
export const WEATHER = {
  sun:   { name: 'Nắng đẹp',   icon: 'wx_sun',   weight: 40, demand: 1.0 },
  hot:   { name: 'Nắng nóng',  icon: 'wx_hot',   weight: 20, demand: 1.0, noCoolingDemand: 0.75, noCoolingSat: -0.4 },
  rain:  { name: 'Mưa',        icon: 'wx_rain',  weight: 22, demand: 1.3, uncoveredDemand: 0.6, uncoveredSat: -0.5 },
  cold:  { name: 'Trời lạnh',  icon: 'wx_cold',  weight: 13, demand: 1.45 },
  storm: { name: 'Bão',        icon: 'wx_storm', weight: 5,  demand: 0.5 },
};
export const EVENTS = [
  { id: 'valentine', name: 'Lễ tình nhân',     chance: 0.03, kinds: { capdoi: 3 },   desc: 'Cặp đôi đông gấp 3!' },
  { id: 'bongda',    name: 'Chung kết bóng đá', chance: 0.04, kinds: { hoiban: 2 },   desc: 'Hội bạn kéo nhau đi xem bóng ăn lẩu.' },
  { id: 'luong',     name: 'Ngày lĩnh lương',   chance: 0.04, kinds: { vanphong: 2 }, budgetMult: 1.3, desc: 'Dân văn phòng rủng rỉnh, chịu chi.' },
  { id: 'haisan',    name: 'Hải sản rớt giá',   chance: 0.03, priceMult: { tom: 0.65, muc: 0.65, ca: 0.65 }, desc: 'Tôm, mực, cá rẻ hơn 35% ở chợ.' },
  { id: 'lehoi',     name: 'Lễ hội ẩm thực',    chance: 0.02, demand: 1.5, desc: 'Phố đông nghẹt, khách +50%.' },
];

// ───────────────────────────── MARKETING ─────────────────────────────
export const MARKETING = [
  { id: 'toroi',      name: 'Phát tờ rơi',        icon: 'ui_megaphone', cost: 100,  scale: true, demand: 1.35, unlockLv: 1, desc: 'Khách +35% trong ngày.' },
  { id: 'giamgia',    name: 'Khuyến mãi giảm 10%', icon: 'ui_gift',     cost: 0,    demand: 1.5, priceMult: 0.9, unlockLv: 2, desc: 'Khách +50%, giá giảm 10% trong ngày.' },
  { id: 'reviewer',   name: 'Mời Food Reviewer',  icon: 'ui_review',    cost: 800,  scale: true, unlockLv: 6, desc: 'Chắc chắn có reviewer ghé hôm nay.' },
  { id: 'livestream', name: 'Livestream bán hàng', icon: 'ui_music',    cost: 1500, scale: true, demand: 1.7, xp: 200, unlockLv: 9, desc: 'Khách +70% và +XP.' },
];
export const VIRAL = { days: 2, demand: 1.6, badDemand: 0.8 };

// ───────────────────────────── OFFLINE & CHAIN ─────────────────────────────
export const OFFLINE = { minAwaySec: 120, shopShare: 0.25, daySec: 240 /* offline pays as if a day took 4 min (kept when days became 9 min) */, shopCapSec: 4 * 3600, chainCapSec: 8 * 3600 };
export const BRANCHES = [
  { id: 'dalat',   name: 'Đà Lạt',   dish: 'Lẩu gà lá é',          cost: 70000,   income: 0.9 },  // k per real second at level 1 (×240/540 when days went 4 → 9 min)
  { id: 'vungtau', name: 'Vũng Tàu', dish: 'Lẩu hải sản',           cost: 140000,  income: 1.6 },
  { id: 'cantho',  name: 'Cần Thơ',  dish: 'Lẩu mắm',               cost: 245000,  income: 2.6 },
  { id: 'danang',  name: 'Đà Nẵng',  dish: 'Lẩu cá',                cost: 420000,  income: 4.1 },
  { id: 'hanoi',   name: 'Hà Nội',   dish: 'Lẩu riêu cua bắp bò',   cost: 700000,  income: 6.7 },
];
export const BRANCH = { maxLevel: 5, upgradeCost: (b, lvl) => Math.round(b.cost * 0.6 * Math.pow(2.2, lvl - 1)) };

// ───────────────────────────── QUESTS ─────────────────────────────
// type: counter name the sim tracks (see TECH_SPEC §Quests). target: number. reward: { money, xp, deco }
export const MAIN_QUESTS = [
  { id: 'q1',  text: 'Bán nồi lẩu đầu tiên',            type: 'potsSold', target: 1,   reward: { money: 50 }, mom: 'firstSale' },
  { id: 'q2',  text: 'Thu tiền 3 bàn',                  type: 'served', target: 3,     reward: { money: 60 } },
  { id: 'q3',  text: 'Đi chợ nhập thêm nguyên liệu',    type: 'buyIngredients', target: 1, reward: { money: 40 } },
  { id: 'q4',  text: 'Nhận 3 đánh giá 5★',              type: 'fiveStars', target: 3,  reward: { money: 80 } },
  { id: 'q5',  text: 'Thuê nhân viên phục vụ đầu tiên', type: 'hire:phucvu', target: 1, reward: { money: 100 }, mom: 'firstStaff' },
  { id: 'q6',  text: 'Mua bạt che mưa',                 type: 'upgrade:tarp', target: 1, reward: { money: 80 } },
  { id: 'q7',  text: 'Thêm một bộ bàn',                 type: 'upgrade:table', target: 1, reward: { money: 120 } },
  { id: 'q8',  text: 'Mở khoá Lẩu Thái (đạt Lv 3)',     type: 'level', target: 3,      reward: { money: 100 } },
  { id: 'q9',  text: 'Thuê đầu bếp',                    type: 'hire:daubep', target: 1, reward: { money: 150 } },
  { id: 'q10', text: 'Bán 5 nồi Lẩu Thái',              type: 'potsSoldOf:thai', target: 5, reward: { money: 150 } },
  { id: 'q11', text: 'Treo đèn dây hoặc bất kỳ món trang trí nào', type: 'decoEquipped', target: 1, reward: { money: 150 } },
  { id: 'q12', text: 'Lãi một ngày từ 800.000đ',        type: 'dayProfit', target: 800, reward: { money: 200 } },
  { id: 'q13', text: 'Nâng công thức bất kỳ lên cấp 2', type: 'recipeLevel', target: 2, reward: { money: 200 } },
  { id: 'q14', text: 'Đạt Lv 5',                        type: 'level', target: 5,      reward: { money: 300 } },
  { id: 'q15', text: 'Mở Quán lẩu trong hẻm',           type: 'tier', target: 2,       reward: { money: 600 }, mom: 'tier2' },
  { id: 'q16', text: 'Có 3 nhân viên',                  type: 'staffCount', target: 3, reward: { money: 500 } },
  { id: 'q17', text: 'Gặp 6 kiểu khách khác nhau',      type: 'kindsMet', target: 6,   reward: { money: 500 } },
  { id: 'q18', text: 'Phục vụ 15 lần gọi thêm',         type: 'extrasServed', target: 15, reward: { money: 600 } },
  { id: 'q19', text: 'Đạt 4.0★ với ít nhất 40 đánh giá', type: 'rating', target: 4.0, minReviews: 40, reward: { money: 800 } },
  { id: 'q20', text: 'Mời Food Reviewer và nhận 5★',    type: 'reviewer5', target: 1,  reward: { money: 1000 } },
  { id: 'q21', text: 'Bán 300 nồi lẩu',                 type: 'potsSold', target: 300, reward: { money: 1500 } },
  { id: 'q22', text: 'Mở Nhà hàng lẩu mặt phố',         type: 'tier', target: 3,       reward: { money: 3000 }, mom: 'tier3' },
  { id: 'q23', text: 'Thuê Quản kho',                   type: 'hire:quankho', target: 1, reward: { money: 2000 } },
  { id: 'q24', text: 'Trang trí đủ 4 ô',                type: 'decoEquipped', target: 4, reward: { money: 2500 } },
  { id: 'q25', text: 'Doanh thu một ngày từ 8 triệu',   type: 'dayRevenue', target: 8000, reward: { money: 3000 } },
  { id: 'q26', text: 'Mở khoá Lẩu chua cay (Lv 11)',    type: 'level', target: 11,     reward: { money: 3000 } },
  { id: 'q27', text: 'Đạt combo x10',                   type: 'combo', target: 10,     reward: { money: 3000 } },
  { id: 'q28', text: 'Gặp đủ 10 kiểu khách',            type: 'kindsMet', target: 10,  reward: { money: 5000 } },
  { id: 'q29', text: 'Mở Nhà hàng lẩu 2 tầng',          type: 'tier', target: 4,       reward: { money: 10000 }, mom: 'tier4' },
  { id: 'q30', text: 'Có 8 nhân viên',                  type: 'staffCount', target: 8, reward: { money: 8000 } },
  { id: 'q31', text: 'Mở khoá Lẩu thập cẩm Nhà Mình',   type: 'level', target: 18,     reward: { money: 10000 } },
  { id: 'q32', text: 'Bán 2.000 nồi lẩu',               type: 'potsSold', target: 2000, reward: { money: 15000 } },
  { id: 'q33', text: 'Đạt 4.5★ với ít nhất 60 đánh giá', type: 'rating', target: 4.5, minReviews: 60, reward: { money: 20000 } },
  { id: 'q34', text: 'Mở Chuỗi Lẩu Nhà Mình',           type: 'tier', target: 5,       reward: { money: 50000 }, mom: 'tier5' },
  { id: 'q35', text: 'Mở chi nhánh đầu tiên',           type: 'branches', target: 1,   reward: { money: 30000 } },
  { id: 'q36', text: 'Mở 3 chi nhánh',                  type: 'branches', target: 3,   reward: { money: 100000 } },
  { id: 'q37', text: 'Phủ sóng cả 5 thành phố',         type: 'branches', target: 5,   reward: { money: 300000 }, mom: 'ending' },
];

// Daily tasks: 3 picked per game day from the pool (only those whose `minLv` ≤ level).
// target(t) receives tier; reward is a chest tier.
export const DAILY_POOL = [
  { id: 'd_served',  text: 'Phục vụ {n} bàn',               type: 'served',     target: (t) => [10, 18, 30, 45, 45][t - 1], chest: 'wood' },
  { id: 'd_5star',   text: 'Nhận {n} đánh giá 5★',          type: 'fiveStars',  target: (t) => [4, 7, 12, 18, 18][t - 1],  chest: 'silver' },
  { id: 'd_drinks',  text: 'Bán {n} ly nước',               type: 'drinksSold', target: (t) => [15, 30, 50, 80, 80][t - 1], chest: 'wood' },
  { id: 'd_thai',    text: 'Bán {n} nồi Lẩu Thái',          type: 'potsSoldOf:thai', target: (t) => [3, 6, 10, 14, 14][t - 1], chest: 'wood', minLv: 3 },
  { id: 'd_bo',      text: 'Bán {n} nồi Lẩu bò',            type: 'potsSoldOf:bo',   target: (t) => [3, 6, 10, 14, 14][t - 1], chest: 'wood', minLv: 5 },
  { id: 'd_noangry', text: 'Không để bàn nào bỏ về trước 18:00', type: 'noAngryUntil', target: () => 18 * 60, chest: 'silver' },
  { id: 'd_combo',   text: 'Đạt combo x{n}',                type: 'combo',      target: (t) => [4, 6, 8, 10, 10][t - 1], chest: 'silver', minLv: 3 },
  { id: 'd_extras',  text: 'Phục vụ {n} lần gọi thêm',      type: 'extrasServed', target: (t) => [3, 6, 10, 15, 15][t - 1], chest: 'wood', minLv: 3 },
  { id: 'd_revenue', text: 'Doanh thu trong ngày đạt {n}',  type: 'dayRevenue', target: (t) => [1500, 4000, 9000, 18000, 18000][t - 1], chest: 'gold' },
  { id: 'd_thank',   text: 'Cảm ơn {n} đánh giá',           type: 'thank',      target: () => 3, chest: 'wood' },
];
export const CHESTS = {
  wood:   { name: 'Rương gỗ',  money: [80, 150],  xp: 20, decoChance: 0 },
  silver: { name: 'Rương bạc', money: [150, 300], xp: 40, decoChance: 0.05, ingredientPack: 5 },
  gold:   { name: 'Rương vàng', money: [300, 600], xp: 80, decoChance: 0.15, ingredientPack: 10 },
}; // money × TIER_MULT[tier-1]
export const DAILY_ALL_BONUS = 'gold';

// 7-day real-date login streak (money × TIER_MULT)
export const LOGIN_REWARDS = [
  { day: 1, money: 200,  text: '200k' },
  { day: 2, ingredients: 8, text: 'Giỏ nguyên liệu' },
  { day: 3, money: 500,  text: '500k' },
  { day: 4, deco: 'cay_mai', text: 'Cây mai ngày Tết' },
  { day: 5, staffTicket: 3, text: 'Vé tuyển dụng ★3+' },
  { day: 6, money: 1500, text: '1,5 triệu' },
  { day: 7, deco: 'db_meo', money: 3000, text: 'Mèo thần tài + 3 triệu' },
];

// ───────────────────────────── TEXT: REVIEWS ─────────────────────────────
// {mon} = hotpot name, {quan} = shop name. Tags chosen by the sim from what drove the score.
export const REVIEW_TEXT = {
  5: ['Nước lẩu đậm đà, ăn tới giọt cuối luôn!', '{mon} ở đây đỉnh nóc kịch trần 🔥', 'Lên món nhanh xỉu, nhân viên dễ thương.',
      'Sẽ quay lại dẫn cả nhà đi ăn!', 'Giá sinh viên mà chất lượng nhà hàng.', '10 điểm không có nhưng!', 'Ăn xong muốn ăn thêm nồi nữa 😋',
      '{quan} là chân ái của tui.', 'Nồi lẩu sôi sùng sục, rau tươi rói, đã!', 'Quán nhỏ mà có tâm ghê.'],
  4: ['Ngon nha, chờ hơi lâu xíu thôi.', '{mon} vừa miệng, lần sau thử món khác.', 'Ổn áp, giá hợp lý.', 'Nước dùng ngọt, rau hơi ít.',
      'Ngồi chill, ăn ngon, sẽ ghé lại.', 'Nhân viên nhiệt tình, món ổn.'],
  3: ['Cũng được, không có gì đặc biệt.', 'Chờ hơi lâu, đói muốn xỉu.', 'Giá hơi chát so với vỉa hè.', 'Ăn tạm ổn, quán hơi nóng.',
      'Nước lẩu hơi nhạt.'],
  2: ['Chờ lâu quá trời 😤', 'Gọi {mon} mà hết hàng, đổi món buồn ghê.', 'Ngồi dưới mưa ăn lẩu… ướt hết.', 'Nóng như cái lò, ăn không nổi.',
      'Giá cao mà món bình thường.'],
  1: ['Đợi nửa tiếng không ai ra, về luôn!', 'Hết chỗ ngồi, đứng chờ mỏi chân rồi về.', 'Không bao giờ quay lại.', 'Bỏ về, đói còn bực.'],
  tags: {
    fast:      ['Lên món nhanh như chớp ⚡', 'Vừa ngồi xuống đã có lẩu!'],
    slow:      ['Chờ hơi lâu nha quán ơi.', 'Đông khách nên chờ lâu, thông cảm.'],
    quality:   ['Nước dùng ngọt xương, chuẩn vị.', 'Nguyên liệu tươi thấy rõ.'],
    ambience:  ['Quán decor xinh xỉu, chụp hình mỏi tay 📸', 'Đèn đóm lung linh, hẹn hò hợp lắm.'],
    cheap:     ['Giá quá hời luôn!', 'Ăn no căng mà ví vẫn khoẻ.'],
    pricey:    ['Hơi mắc so với túi tiền tụi mình.'],
    rain:      ['Trời mưa ăn lẩu là chân ái 🥲', 'Mưa rả rích, nồi lẩu nóng hổi, hết sảy!'],
    cold:      ['Trời lạnh mà có nồi lẩu là ấm cả lòng.'],
    hot:       ['Trời nóng mà ăn lẩu… mồ hôi như tắm.'],
    substitute:['Hết món mình thích, đổi món khác cũng ổn.'],
    staff:     ['Bạn nhân viên dễ thương, nói chuyện có duyên.'],
    extra:     ['Gọi thêm dĩa nào ra liền dĩa đó, thích!'],
    tourist:   ['So good! Ngon quá! 🇻🇳', 'Best hotpot in Saigon, for real.'],
    regular:   ['Ngày nào chú cũng ghé, vẫn ngon như mọi khi.'],
  },
};
export const REVIEW_NAMES = ['Thư Nguyễn', 'Minh Khang', 'Bảo Anh', 'Tuấn Kiệt', 'Ngọc Hân', 'Gia Huy', 'Khánh Linh', 'Đức Anh',
  'Phương Vy', 'Hoàng Long', 'Thảo My', 'Quốc Bảo', 'Mai Anh', 'Trung Hiếu', 'Lan Chi', 'Nhật Minh', 'Hà Vy', 'Tấn Phát',
  'Kim Ngân', 'Văn Toàn', 'Thanh Trúc', 'Hữu Nghĩa', 'Yến Nhi', 'Công Danh', 'Bích Ngọc', 'Thành Đạt', 'Diệu Linh', 'Anh Thư'];
export const REVIEW_NAMES_SPECIAL = {
  khachtay: ['John', 'Emma', 'Lukas', 'Sofia', 'Kenji', 'Mia', 'Noah', 'Chloé'],
  reviewer: ['Kênh Ăn Gì Đây', 'Reviewer Bụng Bự', 'Hội Săn Quán Ngon'],
  tiktoker: ['@chillcunglau', '@anhetsaigon', '@bonbonreview'],
  chutu: ['Chú Tư hàng xóm'],
  doandulich: ['Đoàn du lịch Hạnh Phúc', 'Tour Sài Gòn by night'],
};

// ───────────────────────────── TEXT: MÁ NHẮN ─────────────────────────────
export const MOM = {
  start:      'Mở hàng nhớ cười tươi nha con. Má chúc con buôn may bán đắt! 🧧',
  firstSale:  'Nồi lẩu đầu tiên! Má nghe hàng xóm khen rồi đó nghen 😆',
  firstFive:  '5 sao lận hả? Con của Má giỏi quá trời!',
  firstAngry: 'Khách bỏ về cũng đừng buồn. Mai mình làm nhanh hơn chút là được.',
  firstStaff: 'Có người phụ rồi thì nhớ trả lương đàng hoàng, đối xử tử tế nha con.',
  rain:       'Trời mưa rồi, ai cũng thèm lẩu. Nhớ che bạt kẻo khách ướt!',
  cold:       'Trời trở lạnh, khách ăn lẩu đông lắm đó. Nhập thêm hàng đi con.',
  lowStock:   'Kho sắp hết rồi đó con. Mở Kho nhập thêm liền kẻo khách tới không có mà bán nha.',
  tier2:      'Có quán trong hẻm rồi! Ba con đi khoe khắp xóm 🥹',
  tier3:      'Nhà hàng mặt phố! Má không dám tin luôn. Nhớ giữ sức khoẻ nha.',
  tier4:      'Hai tầng lận… Con giỏi hơn Má tưởng nhiều.',
  tier5:      'Giờ con có cả chuỗi lẩu rồi. Nhưng cuối tuần nhớ về ăn cơm với ba má nghen.',
  lateNight:  'Khuya rồi, dọn hàng nghỉ sớm đi con.',
  reviewerGood: 'Má thấy cái clip quay quán con trên mạng rồi! Đông khách lắm nha!',
  reviewerBad:  'Một lời chê thôi mà, mình sửa là được. Má tin con.',
  ending:     'Vua Lẩu Việt Nam hả? Với Má, con vẫn là đứa nhỏ hay ăn vụng nồi lẩu nhà mình. Má thương con! ❤️',
};

// Teaser for the next games in the series (shown at the ending + settings)
export const NEXT_GAMES = ['Xoài lắc', 'Phở Việt Nam', 'Bánh tráng trộn'];
