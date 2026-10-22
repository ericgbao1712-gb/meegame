// Lẩu Ơi! — all game content and balance numbers.
// Pure data + pure helper functions. NO DOM access (imported by the headless balance sim).
// Money unit: k = 1.000đ (so 99 means 99.000đ). Time unit: game minutes unless noted.
// Ids here are the contract shared by sim, UI and art. Don't rename ids without updating art + UI.

export const VERSION = 1;

// ───────────────────────────── TIME ─────────────────────────────
export const TIME = {
  dayStart: 10 * 60,          // 10:00
  chefCarryPx: 70,            // v1.2: a free chef carries a ready pot when every free waiter is ≥ 70 px farther from the pass
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
  // v1.6b đầu game đông hơn chút: ở vỉa hè + trong hẻm, giờ vắng (10h, 13–16h, 22h) có khách đều hơn (sàn 0,9 nhóm/giờ)
  // và cả ngày +10%. Giờ cao điểm gần như giữ nguyên, số món chờ cùng lúc vẫn bị giới hạn bởi số bàn → người mới không bị ngợp.
  earlyGame: { maxTier: 2, floor: 0.9, mult: 1.1 },
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
// v1.3: uniform colours (staff and owner chosen separately). Recolours the red apron / neckerchief and the orange
// storekeeper vest on the fly. h = hue°, sk/vk = saturation / brightness factors. lv = level that unlocks it.
export const UNIFORMS = [
  { id: 'do',        name: 'Đỏ ớt',        lv: 1,  swatch: '#d8432f' },
  { id: 'xanhla',    name: 'Xanh lá',      lv: 3,  swatch: '#4f9a3c', h: 112, sk: 0.9, vk: 0.86 },
  { id: 'xanhduong', name: 'Xanh dương',   lv: 6,  swatch: '#3d6fc4', h: 216, sk: 0.95, vk: 0.92 },
  { id: 'cam',       name: 'Cam',          lv: 9,  swatch: '#e8822c', h: 28, sk: 1, vk: 1.04 },
  { id: 'tim',       name: 'Tím',          lv: 12, swatch: '#8a52b8', h: 278, sk: 0.8, vk: 0.9 },
  { id: 'hong',      name: 'Hồng',         lv: 15, swatch: '#e77aa6', h: 334, sk: 0.55, vk: 1.12 },
  { id: 'vang',      name: 'Vàng nghệ',    lv: 18, swatch: '#e2b23a', h: 44, sk: 0.95, vk: 1.1 },
  { id: 'reu',       name: 'Xanh rêu',     lv: 22, swatch: '#5e7a46', h: 95, sk: 0.55, vk: 0.72 },
  { id: 'nau',       name: 'Nâu cà phê',   lv: 26, swatch: '#7a4f34', h: 24, sk: 0.62, vk: 0.62 },
  { id: 'den',       name: 'Đen lịch lãm', lv: 34, swatch: '#33303a', h: 260, sk: 0.12, vk: 0.42 },
  // v1.18 màu ĐỘC QUYỀN Hộp mù (lv 99: chỉ có khi rút được trong Hộp mù)
  { id: 'bachha',    name: 'Xanh bạc hà',   lv: 99, box: 'bx_u_bachha', swatch: '#7fd1b4', h: 158, sk: 0.5, vk: 1.1 },
  { id: 'camdao',    name: 'Cam đào',       lv: 99, box: 'bx_u_camdao', swatch: '#f2a07b', h: 18, sk: 0.55, vk: 1.14 },
  { id: 'datroi',    name: 'Xanh da trời',  lv: 99, box: 'bx_u_datroi', swatch: '#6db6e8', h: 202, sk: 0.62, vk: 1.1 },
  { id: 'dodo',      name: 'Đỏ đô',         lv: 99, box: 'bx_u_dodo',   swatch: '#8e2234', h: 350, sk: 0.9, vk: 0.6 },
  { id: 'oaihuong',  name: 'Tím oải hương', lv: 99, box: 'bx_u_oaihuong', swatch: '#b9a2e0', h: 262, sk: 0.42, vk: 1.1 },
  { id: 'ngoclam',   name: 'Ngọc lam',      lv: 99, box: 'bx_u_ngoclam', swatch: '#1f9e9a', h: 178, sk: 0.85, vk: 0.82 },
  { id: 'hoanggia',  name: 'Vàng hoàng gia', lv: 99, box: 'bx_u_hoanggia', swatch: '#f4c430', h: 47, sk: 1, vk: 1.18 },
  { id: 'bacanhkim', name: 'Bạc ánh kim',   lv: 99, box: 'bx_u_bac', swatch: '#c9d0da', h: 218, sk: 0.08, vk: 1.18 },
];

// v1.3: uniform pattern styles (combine with any colour). lv = unlock level.
export const UNIFORM_STYLES = [
  { id: 'tron', name: 'Trơn',      lv: 1 },
  { id: 'vien', name: 'Viền trắng', lv: 5 },
  { id: 'soc',  name: 'Kẻ sọc',     lv: 10 },
  { id: 'tui',  name: 'Túi đựng bút', lv: 14 },
  { id: 'cham', name: 'Chấm bi',    lv: 18 },
  { id: 'caro', name: 'Caro',       lv: 24 },
];
// v1.3: more owner looks = the 4 owner sprites with another hair colour (base = owner sheet index)
// v1.5: 8 kiểu chủ quán mới — characters from the owner's reference sheet (tools/art/lau_refchars.py → sheets owner4…owner11),
// spread over the game every 3–4 levels instead of piling up at Lv 32–39.
export const OWNER_LOOKS = [
  { lv: 13, sheet: 'owner4',  name: 'Chị tóc nâu dài' },
  { lv: 17, sheet: 'owner5',  name: 'Chị tóc đen rối' },
  { lv: 21, sheet: 'owner6',  name: 'Chị tạp dề cam' },
  { lv: 25, sheet: 'owner7',  name: 'Cô tóc vàng bồng bềnh' },
  { lv: 28, sheet: 'owner8',  name: 'Cô tóc hồng' },
  { lv: 32, sheet: 'owner9',  name: 'Chị tóc ngang vai' },
  { lv: 35, sheet: 'owner10', name: 'Anh tóc đen áo xanh' },
  { lv: 38, sheet: 'owner11', name: 'Anh tóc nâu áo be' },
];

export const AVATARS = [
  { id: 0, name: 'Tóc búi hoa' },
  { id: 1, name: 'Tóc húi cua' },
  { id: 2, name: 'Đeo kính cận' },
  { id: 3, name: 'Tóc ngắn kẹp' },
];
for (let i = 0; i < OWNER_LOOKS.length; i++) AVATARS.push({ id: 4 + i, name: OWNER_LOOKS[i].name, lv: OWNER_LOOKS[i].lv, box: 'bx_l_' + (4 + i) });   // v1.18 rút trong Hộp mù là dùng được sớm   // v1.5

// ───────────────────────────── INGREDIENTS ─────────────────────────────
// Display order matters (dock grid is 2×5 in this order).
export const INGREDIENTS = [
  { id: 'bo',     name: 'Thịt bò',  short: 'Bò',   icon: 'ing_bo',     cost: 20, extraPrice: 50, unlockLv: 5, shelf: 2, frozen: true },
  { id: 'heo',    name: 'Thịt heo', short: 'Heo',  icon: 'ing_heo',    cost: 12, extraPrice: 35, unlockLv: 8, shelf: 2, frozen: true },
  { id: 'ga',     name: 'Thịt gà',  short: 'Gà',   icon: 'ing_ga',     cost: 14, extraPrice: 35, unlockLv: 1, shelf: 2, frozen: true },
  { id: 'tom',    name: 'Tôm',      short: 'Tôm',  icon: 'ing_tom',    cost: 18, extraPrice: 45, unlockLv: 3, shelf: 2, seafood: true, frozen: true },
  { id: 'muc',    name: 'Mực',      short: 'Mực',  icon: 'ing_muc',    cost: 18, extraPrice: 45, unlockLv: 3, shelf: 2, seafood: true, frozen: true },
  { id: 'ca',     name: 'Cá',       short: 'Cá',   icon: 'ing_ca',     cost: 15, extraPrice: 40, unlockLv: 11, shelf: 2, seafood: true, frozen: true },
  { id: 'rau',    name: 'Rau xanh', short: 'Rau',  icon: 'ing_rau',    cost: 4,  extraPrice: 15, unlockLv: 1, shelf: 2 },
  { id: 'nam',    name: 'Nấm',      short: 'Nấm',  icon: 'ing_nam',    cost: 6,  extraPrice: 20, unlockLv: 1, shelf: 2 },
  { id: 'dauphu', name: 'Đậu phụ',  short: 'Đậu',  icon: 'ing_dauphu', cost: 3,  extraPrice: 15, unlockLv: 1, shelf: 2 },
  { id: 'mi',     name: 'Mì',       short: 'Mì',   icon: 'ing_mi',     cost: 3,  extraPrice: 10, unlockLv: 1, shelf: 5 },
  // shelf: days a portion stays usable, counting the day it was bought (2 = today + tomorrow). Fresh food 2, mì & nước lẩu 5.
  // Broth is stocked like any ingredient (one item per hotpot, first in its recipe). broth: true keeps it
  // out of the dock's ingredient grid (it has its own row) and out of level-up unlock lists.
  // v1.1 Tráng miệng: ordered AFTER the hotpot (a new ticket); stocked in the Kho like any item. `needs` = equipment.
  { id: 'tm_kem',    name: 'Kem dừa',     short: 'Kem',     icon: 'tm_kem',    cost: 8,  extraPrice: 25, unlockLv: 12, shelf: 5, dessert: true, needs: 'tukem' },
  { id: 'tm_flan',   name: 'Bánh flan',   short: 'Flan',    icon: 'tm_flan',   cost: 6,  extraPrice: 20, unlockLv: 14, shelf: 2, dessert: true },
  { id: 'tm_panna',  name: 'Panna cotta', short: 'Panna',   icon: 'tm_panna',  cost: 12, extraPrice: 38, unlockLv: 20, shelf: 2, dessert: true, needs: 'tukem' },
  { id: 'tm_waffle', name: 'Bánh waffle', short: 'Waffle',  icon: 'tm_waffle', cost: 14, extraPrice: 45, unlockLv: 24, shelf: 3, dessert: true, needs: 'waffle' },
  // v1.4 món ăn kèm: ordered together with the hotpot (part of the same ticket). Made ahead and kept in the kho like
  // tráng miệng; `needs` = the kitchen tool that must be bought first. extraPrice = selling price (k).
  { id: 'ak_oc',       name: 'Ốc hấp sả',             short: 'Ốc',       icon: 'ak_oc',       cost: 10, extraPrice: 35,  unlockLv: 1,  shelf: 2, side: true, needs: 'xunghap', frozen: true },
  { id: 'ak_ngeu',     name: 'Ngêu hấp sả',           short: 'Ngêu',     icon: 'ak_ngeu',     cost: 9,  extraPrice: 30,  unlockLv: 1,  shelf: 2, side: true, needs: 'xunghap', frozen: true },
  { id: 'ak_chagio',   name: 'Chả giò',               short: 'Chả giò',  icon: 'ak_chagio',   cost: 8,  extraPrice: 30,  unlockLv: 3,  shelf: 3, side: true, needs: 'chaochien' },
  { id: 'ak_hau',      name: 'Hàu nướng mỡ hành',     short: 'Hàu',      icon: 'ak_hau',      cost: 14, extraPrice: 45,  unlockLv: 3,  shelf: 2, side: true, needs: 'vinuong', frozen: true },
  { id: 'ak_comchien', name: 'Cơm chiên',             short: 'Cơm chiên', icon: 'ak_comchien', cost: 6, extraPrice: 25,  unlockLv: 3,  shelf: 2, side: true, needs: 'chaochien' },
  { id: 'ak_canhga',   name: 'Cánh gà chiên nước mắm', short: 'Cánh gà', icon: 'ak_canhga',   cost: 15, extraPrice: 50,  unlockLv: 5,  shelf: 2, side: true, needs: 'chaochien', frozen: true },
  { id: 'ak_mixao',    name: 'Mì xào bò',             short: 'Mì xào',   icon: 'ak_mixao',    cost: 12, extraPrice: 45,  unlockLv: 5,  shelf: 2, side: true, needs: 'chaochien' },
  { id: 'ak_goiga',    name: 'Gỏi gà',                short: 'Gỏi gà',   icon: 'ak_goiga',    cost: 12, extraPrice: 45,  unlockLv: 8,  shelf: 2, side: true, needs: 'banso' },
  { id: 'ak_changa',   name: 'Chân gà sả tắc',        short: 'Chân gà',  icon: 'ak_changa',   cost: 11, extraPrice: 45,  unlockLv: 8,  shelf: 3, side: true, needs: 'banso' },
  { id: 'ak_bolalot',  name: 'Bò lá lốt',             short: 'Lá lốt',   icon: 'ak_bolalot',  cost: 16, extraPrice: 55,  unlockLv: 8,  shelf: 2, side: true, needs: 'vinuong', frozen: true },
  { id: 'ak_mucchien', name: 'Mực chiên giòn',        short: 'Mực chiên', icon: 'ak_mucchien', cost: 18, extraPrice: 65, unlockLv: 12, shelf: 2, side: true, needs: 'chaochien', frozen: true },
  { id: 'ak_bachtuoc', name: 'Bạch tuộc nướng sa tế', short: 'Bạch tuộc', icon: 'ak_bachtuoc', cost: 20, extraPrice: 70, unlockLv: 12, shelf: 2, side: true, needs: 'vinuong', frozen: true },
  { id: 'ak_goingosen', name: 'Gỏi ngó sen',          short: 'Ngó sen',  icon: 'ak_goingosen', cost: 14, extraPrice: 55, unlockLv: 15, shelf: 2, side: true, needs: 'banso' },
  { id: 'ak_mienxao',  name: 'Miến xào hải sản',      short: 'Miến xào', icon: 'ak_mienxao',  cost: 16, extraPrice: 60,  unlockLv: 15, shelf: 2, side: true, needs: 'chaochien' },
  { id: 'ak_combo',    name: 'Combo khai vị đặc biệt', short: 'Combo',   icon: 'ak_combo',    cost: 35, extraPrice: 129, unlockLv: 20, shelf: 2, side: true, needs: 'banso' },
  // v1.18 món ĐỘC QUYỀN Hộp mù (unlockLv 99 = không mở theo cấp; có món trong Hộp mù là bán được — xem lvOk)
  { id: 'tm_kemtra',   name: 'Kem trà xanh',          short: 'Kem trà',  icon: 'tm_kemtra',   cost: 9,  extraPrice: 32,  unlockLv: 99, shelf: 5, dessert: true, needs: 'tukem', box: 'bx_kemtra' },
  { id: 'tm_flancf',   name: 'Flan cà phê',           short: 'Flan cf',  icon: 'tm_flancf',   cost: 7,  extraPrice: 26,  unlockLv: 99, shelf: 2, dessert: true, box: 'bx_flancf' },
  { id: 'tm_kemdau',   name: 'Kem dâu',               short: 'Kem dâu',  icon: 'tm_kemdau',   cost: 10, extraPrice: 38,  unlockLv: 99, shelf: 5, dessert: true, needs: 'tukem', box: 'bx_kemdau' },
  { id: 'ak_oclen',    name: 'Ốc len xào dừa',        short: 'Ốc len',   icon: 'ak_oclen',    cost: 14, extraPrice: 55,  unlockLv: 99, shelf: 2, side: true, needs: 'xunghap', frozen: true, box: 'bx_oclen' },
  { id: 'ak_tomchien', name: 'Tôm chiên xù',          short: 'Tôm xù',   icon: 'ak_tomchien', cost: 20, extraPrice: 79,  unlockLv: 99, shelf: 2, side: true, needs: 'chaochien', frozen: true, box: 'bx_tomchien' },
  { id: 'ak_hauphomai', name: 'Hàu nướng phô mai',    short: 'Hàu phô mai', icon: 'ak_hauphomai', cost: 22, extraPrice: 89, unlockLv: 99, shelf: 2, side: true, needs: 'vinuong', frozen: true, box: 'bx_hauphomai' },
  { id: 'ak_met',      name: 'Mẹt món chiên tổng hợp', short: 'Mẹt chiên', icon: 'ak_met',    cost: 40, extraPrice: 149, unlockLv: 20, shelf: 2, side: true, needs: 'chaochien' },
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
  { id: 'tradao',   name: 'Trà đào cam sả', icon: 'drk_tradao', price: 25, cost: 7, unlockLv: 99, box: 'bx_tradao' },   // v1.18 Hộp mù
  { id: 'matcha',   name: 'Trà sữa matcha', icon: 'drk_matcha', price: 32, cost: 10, unlockLv: 99, box: 'bx_matcha' },  // v1.18 Hộp mù
];
// v1.1 tráng miệng: chance a group orders one after the hotpot (× kind taste), minutes to eat it
export const DESSERT = { chance: 0.42, chanceTuKem: 0.08, eatMin: [4, 7], kinds: { giadinh: 1.5, capdoi: 1.4, sinhvien: 1.2, hoiban: 1.1, khachtay: 1.2, vip: 1.3, vanphong: 0.8, chutu: 0.5 } };
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
  // picky: below this ambience (0..1 of the tier's ambCap) the score loses 1 star — rating.js
  vip: { name: 'Khách VIP', group: [1, 1], patience: 60, budget: 450, weight: 0.03, minTier: 3,
    tipChance: 0.7, tip: [40, 100], extraChance: 0.5, special: true, likesAmbience: true, reviewWeight: 3, picky: 0.5,
    prefers: { dacbiet: 4, rieucua: 2, chuacay: 2, bo: 1 }, drinks: { nuocdua: 3, nuocsam: 2 },
    hours: { 12: 1.3, 19: 1.6, 20: 1.4 },
    desc: 'Chị chủ chuỗi spa đi tìm quán ruột. Quán sang, lên món nhanh là tip đậm; quán lèo tèo là chấm thẳng tay.' },
  // v1.5 khách mới (từ bảng mẫu: tools/art/lau_refchars.py). Extra keys: minLv (shows up from this level), waitStrict (× wait
  // penalty — rating.js), walkMult / eatMult (slower walk, longer meal), sideChance (overrides SIDE.chance).
  khotinh: { name: 'Khách khó tính', group: [1, 2], patience: 48, budget: 230, weight: 0.3, minTier: 1, minLv: 6,
    tipChance: 0.35, tip: [15, 40], extraChance: 0.15, waitStrict: 1.8, reviewWeight: 2, picky: 0.3,
    prefers: { chuacay: 2, thai: 2, bo: 2 }, drinks: { tratac: 2, nuocsam: 3 },
    hours: { 11: 1.2, 12: 1.4, 18: 1.2, 19: 1.4, 20: 1.0 },
    desc: 'Đeo kính đen, soi từng cái ly. Lên món chậm hay quán bừa bộn là chấm thẳng tay; làm vừa ý thì tip đậm.' },
  ongba: { name: 'Ông bà đi ăn', group: [2, 2], patience: 140, budget: 190, weight: 0.45, minTier: 1, minLv: 9,
    tipChance: 0.45, tip: [10, 20], extraChance: 0.2, walkMult: 0.65, eatMult: 1.4,
    prefers: { ga: 3, rieucua: 3, nam: 2 }, drinks: { trada: 4, nuocsam: 3 },
    hours: { 10: 1.6, 11: 1.6, 12: 1.0, 16: 1.0, 17: 1.6, 18: 1.2, 20: 0.3, 21: 0.1, 22: 0 },
    desc: 'Hai ông bà tóc bạc đi chậm rãi tới quán quen. Ăn từ tốn, ít khi phàn nàn, về còn dúi tiền lì xì.' },
  tangca: { name: 'Dân tăng ca', group: [1, 3], patience: 55, budget: 170, weight: 0.5, minTier: 1, minLv: 12,
    tipChance: 0.1, tip: [5, 10], extraChance: 0.45, sideChance: 0.9,
    prefers: { bo: 3, thai: 2, chuacay: 2 }, drinks: { nuocngot: 3, tratac: 2 },
    hours: { 11: 0.2, 12: 0.2, 18: 0.4, 19: 0.8, 20: 1.8, 21: 2.4, 22: 2.4 },
    desc: 'Sơ mi cà vạt, mặt mệt mỏi, tới khi quán sắp dọn. Đói nên gọi thêm món ăn kèm, chỉ mong lên món thật nhanh.' },
  hannhat: { name: 'Khách Hàn/Nhật', group: [2, 3], patience: 80, budget: 300, weight: 0.25, minTier: 2, minLv: 16,
    tipChance: 0.5, tip: [20, 50], extraChance: 0.35, likesAmbience: true, sideChance: 0.8,
    prefers: { bo: 3, thai: 2, dacbiet: 3, chuacay: 1.5 }, drinks: { nuocdua: 3, tratac: 2, trada: 2 },
    hours: { 11: 1.0, 12: 1.2, 18: 1.4, 19: 1.6, 20: 1.2 },
    desc: 'Nhóm bạn du lịch xem review trên mạng tìm tới. Thích quán đẹp, gọi nhiều món kèm để chụp hình, khen "mashita!".' },
  shipper:  { name: 'Anh shipper', group: [1, 1], patience: 45, budget: 200, weight: 0.35, minTier: 2,
    tipChance: 0.15, tip: [2, 5], extraChance: 0, takeaway: true,
    prefers: { ga: 2, thai: 2, bo: 2 }, drinks: {},
    hours: { 11: 1.5, 12: 1.5, 18: 1.5, 19: 1.5, 20: 1.2 },
    desc: 'Đơn mang về cho khách đặt qua app. Không cần bàn, chỉ cần nhanh.' },
};

// Ambient NPC (not a customer): cô bán vé số
// ───────────────────────────── v1.16 ĐƠN SHIP ─────────────────────────────
// Có Shipper thì trong giờ bán có đơn ship gọi tới (số đơn ≈ share × lượng khách vãng lai). Phiếu ship lên bếp như phiếu
// thường (đầu bếp hoặc bạn tự nấu); nấu xong Shipper ra quầy lấy, chạy ra đường giao rồi về. Khách trả tiền món + phí ship.
// Sao đánh giá theo tổng thời gian từ lúc gọi tới lúc nhận (hứa giao trong promiseMin phút).
export const SHIP = {
  share: 0.28, perShipper: 2,            // đơn đang chạy tối đa = số shipper × perShipper
  patience: 70,                          // phút game chờ bếp nấu + shipper lấy; quá thì khách hủy đơn
  tripMin: [9, 15],                      // phút game chạy đi giao rồi về (chia cho tốc độ shipper)
  fee: 15,                               // phí ship (k) khách trả thêm
  drinkChance: 0.45, sideChance: 0.3,
  promiseMin: 55, starsAt: [[40, 5], [55, 4], [75, 3], [Infinity, 2]],   // tổng phút (từ lúc gọi tới lúc nhận) → sao
  tipChance: 0.35, tip: [5, 15],
  reviewChance: 0.25,
  reviews: {
    5: ['Lẩu tới nơi còn nóng hổi, shipper dễ thương!', 'Giao nhanh xỉu, nước lẩu vẫn sôi khi bắc lên bếp nhà mình.', 'Đặt ship mà ngon như ăn tại quán!'],
    4: ['Giao hơi lâu xíu nhưng lẩu ngon.', 'Đóng gói kỹ, không đổ giọt nào.'],
    3: ['Chờ ship lâu quá, đói meo.', 'Lẩu tới hơi nguội rồi.'],
    2: ['Giao trễ cả tiếng, lần sau chắc ra quán ăn.', 'Đơn tới trễ quá trời.'],
    cancel: ['Đặt ship chờ mãi không thấy, hủy luôn!', 'Quán nhận đơn rồi mà không giao, buồn ghê.'],
  },
};

export const LOTTERY = {
  name: 'Cô bán vé số', ticketPrice: 10, maxPerDay: 5, visitChancePerHour: 0.12,
  // v1.15 vé số có số 6 chữ số, cuối ngày quay kết quả; người chơi tự DÒ vé rồi bấm NHẬN THƯỞNG.
  // Bảng kết quả giống xổ số kiến thiết (rút gọn): vé trúng một giải khi các số CUỐI của vé trùng một số của giải đó.
  // Một vé chỉ lãnh giải cao nhất. v1.18 thêm giải năm: trúng ~16% số vé (≈ 2 ngày mua đủ 5 vé là có giải); trung bình trả ~80% tiền vé (vé số thật luôn lỗ nha).
  tiers: [
    { id: 'db',   name: 'Giải đặc biệt', digits: 6, count: 1, prize: 100000 },
    { id: 'nhat', name: 'Giải nhất',     digits: 5, count: 1, prize: 15000 },
    { id: 'nhi',  name: 'Giải nhì',      digits: 4, count: 1, prize: 3000 },
    { id: 'ba',   name: 'Giải ba',       digits: 3, count: 2, prize: 600 },
    { id: 'tu',   name: 'Giải tư',       digits: 2, count: 6, prize: 60 },
    { id: 'nam',  name: 'Giải năm',      digits: 2, count: 10, prize: 30 },   // v1.18: ~10%/vé → mua đều tay cứ ~2 ngày trúng 1 lần
  ],
  claimDays: 7,           // vé trúng phải lãnh trong 7 ngày (vé thật 30 ngày)
  keepDays: 14,           // vé cũ hơn thì cất khỏi sổ
  // Đoán số: chọn 2 số 00–99, đặt cược; 2 số cuối GIẢI ĐẶC BIỆT trùng thì nhận cược × payout.
  guess: { payout: 70, maxBets: 3, maxBet: 1000, maxShare: 0.2, chips: [50, 100, 500] },
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
    thungan: { name: 'Thu ngân', icon: 'ui_coin',  unlockLv: 9,  minTier: 2, max: 1,  desc: 'Khách kiên nhẫn hơn 20%, tip nhiều hơn.' },
    quankho: { name: 'Quản kho', icon: 'ui_kho',   unlockLv: 17, minTier: 3, max: 1,  desc: 'Mỗi sáng tự nhập đủ hàng, không mất phí giao.' },
    shipper: { name: 'Shipper',  icon: 'eq_truck', unlockLv: 11, minTier: 1, max: 3,  desc: 'Có shipper thì quán nhận đơn ship qua điện thoại. Bếp nấu xong, shipper chạy xe giao lẩu tận nhà, khách trả thêm phí ship.' },
  },
  slotsByTier: [2, 4, 6, 9, 9],
  // v1.17: lên cấp mở thêm chỗ chứa nhân viên (cộng vào slotsByTier), tối đa 12 người một quán
  slotBonus: [[20, 1], [28, 1], [34, 1]],
  maxSlots: 12,
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
  walkPxPerMin: 18,   // v1.2: 14 → 18, the owner was the slowest runner on the floor
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
  // v1.1 khu mở rộng hai bên: the neighbour shophouses become dining space (from Nhà hàng mặt phố); each level = 2 tables
  { id: 'canh', cat: 'banghe', name: 'Mở rộng hai bên', icon: 'eq_table', costs: [60000, 180000], minTier: [3, 3], minLv: [22, 30],
    levels: ['Chưa mở', 'Thuê hiên hai bên · +2 bàn', 'Mở cả hai dãy · +4 bàn'], amb: 3,
    levelsHaitang: ['Chưa mở', 'Dãy bên trái tầng trệt · +2 bàn', 'Thêm lầu dãy bên trái · +2 bàn'],   // v1.19 nhà hàng 2 lầu: bên phải là phòng giải trí
    desc: 'Thuê hiên của hai căn bên cạnh làm chỗ ngồi: thêm bàn, có tủ chén và chỗ đứng cho phục vụ. Cần kê đủ bàn trong quán trước.' },
  // v1.19 phòng giải trí: khối 2 tầng bên phải nhà hàng 2 lầu (trệt Photo Studio, lầu Karaoke). Khách chờ bàn vào chơi.
  { id: 'giaitri', cat: 'banghe', name: 'Phòng giải trí', icon: 'ui_hopmu', costs: [150000, 350000], minTier: [4, 4], minLv: [28, 32],
    levels: ['Chưa mở', 'Photo Studio · tầng trệt', 'Karaoke · trên lầu'], amb: 6, patiencePer: 0.06, demandPer: 0.04,
    desc: 'Mở khối 2 tầng bên hông quán: chụp ảnh, hát karaoke. Khách chờ bàn đỡ sốt ruột, khách tới đông hơn. Bày đồ giải trí vào phòng ở Quán ▸ Trang trí.' },
  { id: 'tablestyle', cat: 'banghe', name: 'Bàn ghế xịn', icon: 'eq_table', costs: [500, 3000, 12000, 40000], minTier: [1, 2, 3, 4], minLv: [3, 9, 18, 28],
    levels: ['Nhựa đỏ', 'Inox', 'Gỗ thông', 'Gỗ lim', 'Đá cẩm thạch'], amb: 4, patiencePer: 0.08,
    desc: 'Khách ngồi êm hơn thì kiên nhẫn hơn, quán cũng sang hơn.' },
  { id: 'stovetype', cat: 'bep', name: 'Đời bếp', icon: 'eq_stove', costs: [600, 3000, 10000, 40000], minTier: [1, 1, 2, 3], minLv: [2, 7, 13, 21],
    levels: ['Bếp ga mini', 'Bếp ga đôi', 'Bếp hồng ngoại', 'Bếp từ', 'Bếp công nghiệp'], speedPer: 0.25,
    desc: 'Lửa đều, nồi lẩu lên bàn sôi ngon hơn — khách chấm điểm cao hơn.' },
  { id: 'knife', cat: 'bep', name: 'Dao thớt bén', icon: 'eq_knife', costs: [200, 800, 3000, 10000, 30000], minTier: [1, 1, 2, 3, 4], minLv: [1, 4, 11, 19, 36],
    speedPer: 0.15, desc: 'Đầu bếp soạn mâm nhanh hơn, món cũng ngon hơn.' },
  { id: 'kho', cat: 'thietbi', name: 'Kho chứa', icon: 'ui_kho', costs: [400, 2500, 9000, 30000], minTier: [1, 2, 3, 4], minLv: [3, 9, 17, 27],
    levels: ['Thùng xốp', 'Tủ đông', 'Tủ đông đôi', 'Kho lạnh mini', 'Kho lạnh lớn'], capMult: [1, 1.6, 2.4, 3.5, 5],
    desc: 'Chứa được nhiều nguyên liệu hơn.' },
  { id: 'cooler', cat: 'thietbi', name: 'Tủ mát nước', icon: 'eq_cooler', costs: [300, 1500, 6000], minTier: [1, 2, 3], minLv: [2, 8, 16],
    drinkChancePer: 0.06, desc: 'Nước lạnh mát, khách gọi nước nhiều hơn.' },
  { id: 'tarp', cat: 'thietbi', name: 'Bạt che mưa', icon: 'eq_tarp', costs: [250], minTier: [1], minLv: [1],
    desc: 'Mưa rào thì chạm Kéo bạt để che khách. Không có bạt, khách ướt sẽ bỏ về!' },
  { id: 'cooling', cat: 'thietbi', name: 'Quạt & máy lạnh', icon: 'eq_fan', costs: [350, 2500, 12000], minTier: [1, 2, 3], minLv: [4, 10, 19],
    levels: ['Không có', 'Quạt đứng', 'Quạt trần', 'Máy lạnh'], amb: 3,
    desc: 'Ngày nắng nóng không mất khách.' },
  { id: 'tudong', cat: 'thietbi', name: 'Tủ đông cao cấp', icon: 'eq_tudong', costs: [4000, 12000, 30000, 80000], minTier: [2, 2, 3, 4], minLv: [12, 15, 23, 33],
    levels: ['Chưa có', 'Tủ đông cao cấp (+1 ngày)', 'Cấp 2 (+2 ngày)', 'Cấp 3 (+3 ngày)', 'Cấp 4 (+4 ngày)'],
    desc: 'Cấp đông sâu cho đồ tươi sống: thịt bò, heo, gà, tôm, mực, cá giữ được thêm 1 ngày mỗi cấp (cả hàng đang có trong kho).' },
  // v1.4 dụng cụ món ăn kèm: level 1 unlocks the dishes that need it, each further level +15% on their price
  { id: 'xunghap', cat: 'bep', name: 'Xửng hấp', icon: 'eq_xunghap', costs: [150, 2500, 12000], minTier: [1, 2, 3], minLv: [1, 10, 22], sidePer: 0.15,
    levels: ['Chưa có', 'Xửng hấp nhôm', 'Xửng hấp đôi', 'Tủ hấp inox'], desc: 'Hấp ốc, ngêu (món ăn kèm). Cấp cao: món hấp bán đắt hơn 15% mỗi cấp.' },
  { id: 'chaochien', cat: 'bep', name: 'Chảo chiên xào', icon: 'eq_chaochien', costs: [400, 4000, 18000], minTier: [1, 2, 3], minLv: [3, 12, 24], sidePer: 0.15,
    levels: ['Chưa có', 'Chảo gang', 'Bếp chiên xào', 'Nồi chiên ngập dầu'], desc: 'Chả giò, cơm chiên, cánh gà, mì xào, mực chiên… Cấp cao: món chiên xào bán đắt hơn.' },
  { id: 'vinuong', cat: 'bep', name: 'Vỉ nướng', icon: 'eq_vinuong', costs: [600, 6000, 25000], minTier: [1, 2, 3], minLv: [3, 14, 27], sidePer: 0.15,
    levels: ['Chưa có', 'Vỉ nướng than', 'Bếp nướng đôi', 'Bếp nướng không khói'], desc: 'Hàu mỡ hành, bò lá lốt, bạch tuộc sa tế. Cấp cao: món nướng bán đắt hơn.' },
  { id: 'banso', cat: 'bep', name: 'Bàn sơ chế gỏi', icon: 'eq_banso', costs: [2000, 9000, 30000], minTier: [2, 2, 3], minLv: [8, 16, 29], sidePer: 0.15,
    levels: ['Chưa có', 'Thớt gỗ & thau trộn', 'Bàn inox sơ chế', 'Tủ mát salad'], desc: 'Gỏi gà, chân gà sả tắc, gỏi ngó sen, combo khai vị. Cấp cao: món trộn bán đắt hơn.' },
  { id: 'tukem', cat: 'thietbi', name: 'Tủ kem', icon: 'eq_tukem', costs: [9000], minTier: [2], minLv: [12],
    desc: 'Tủ đông trưng bày cho món tráng miệng lạnh: bán được Kem dừa (Lv 12) và Panna cotta (Lv 20); khách gọi tráng miệng nhiều hơn.' },
  { id: 'waffle', cat: 'bep', name: 'Máy nướng waffle', icon: 'eq_waffle', costs: [60000], minTier: [3], minLv: [24],
    desc: 'Nướng bánh waffle giòn thơm (Lv 24) — món tráng miệng đắt nhất.' },
  { id: 'speaker', cat: 'thietbi', name: 'Loa nhạc', icon: 'eq_speaker', costs: [600, 5000], minTier: [1, 2], minLv: [6, 11], amb: 2, patiencePer: 0.10,
    desc: 'Nhạc hay thì khách chờ cũng không thấy lâu.' },
  { id: 'pos', cat: 'thietbi', name: 'Máy tính tiền', icon: 'ui_coin', costs: [3500], minTier: [2], minLv: [10], tipMult: 1.2,
    desc: 'Thu tiền nhanh gọn, khách vui tip thêm.' },
  { id: 'supplier', cat: 'thietbi', name: 'Mối chợ đầu mối', icon: 'ui_kho', costs: [2500], minTier: [2], minLv: [10], fee: 0.08,
    desc: 'Mỗi sáng tự giao hàng tới quán (phí 8%). Bật/tắt trong Kho.' },
  { id: 'sign', cat: 'quangba', name: 'Biển hiệu', icon: 'eq_sign', costs: [250, 1800, 9000, 30000], minTier: [1, 2, 3, 4], minLv: [2, 8, 16, 37], amb: 2, demandPer: 0.12,
    levels: ['Không có', 'Bảng giấy', 'Bảng gỗ sơn', 'Hộp đèn', 'Đèn neon'],
    desc: 'Người đi đường dễ thấy quán hơn.' },
];
// v1.3: cosmetic unlocks per level (deco, đồng phục, kiểu nhân vật) — shared by core unlocksAt and the UI roadmap
export function cosmeticUnlocksAt(level) {
  const out = [];
  if (level <= 1) return out;
  for (const d of DECO) if (d.lv === level) out.push({ type: 'deco', id: d.id, name: d.name });
  for (const u of UNIFORMS) if (u.lv === level) out.push({ type: 'uniform', id: u.id, name: 'Màu đồng phục ' + u.name.toLowerCase() });
  for (const st of UNIFORM_STYLES) if (st.lv === level) out.push({ type: 'uniform', id: st.id, name: 'Kiểu đồng phục ' + st.name.toLowerCase() });
  for (const a of AVATARS) if (a.lv === level) out.push({ type: 'look', id: a.id, name: 'Chủ quán: ' + a.name });
  for (const [id, k] of Object.entries(CUSTOMERS)) if (k.minLv === level) out.push({ type: 'cust', id, name: 'Khách mới: ' + k.name });   // v1.5
  return out;
}
// v1.3: what the i-th purchase of an upgrade is called (level-up cards, roadmap)
export function upgradeStepName(u, i) {
  if (u.levels && u.levels[i + 1]) return u.name + ': ' + u.levels[i + 1];
  return u.costs.length > 1 ? `${u.name} cấp ${i + 1}` : u.name;
}
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
  { id: 'den',     name: 'Đèn' },   // v1.2: den items carry `light` = how much brighter the shop gets (day + night)
  { id: 'cay',     name: 'Cây' },
  { id: 'tuong',   name: 'Tường' },
  { id: 'dacbiet', name: 'Đặc biệt' },
  { id: 'giaitri', name: 'Phòng giải trí' },   // v1.19 bày nhiều món cùng lúc, mỗi món có chỗ riêng trong phòng
];
// v1.18p đặt nhiều đồ trang trí cùng lúc: hiệu ứng nhân dồn nhưng tối đa (khách ×1,4 · tip ×1,6 · kiên nhẫn ×1,5)
export const DECO_CAP = { demand: 1.4, tip: 1.6, patience: 1.5 };
export const DECO = [
  { id: 'den_bong',     cat: 'den', name: 'Bóng đèn tròn',     price: 0,     amb: 0,  default: true, light: 0.04 },
  { id: 'den_day',      cat: 'den', name: 'Đèn dây vàng',      price: 300,   amb: 4, light: 0.08 },
  { id: 'den_long_do',  cat: 'den', name: 'Đèn lồng đỏ',       price: 1200,  amb: 8, lv: 6, light: 0.12 },
  { id: 'den_hoian',    cat: 'den', name: 'Đèn lồng Hội An',   price: 5000,  amb: 14, lv: 13, minTier: 2, light: 0.16 },
  { id: 'den_chum',     cat: 'den', name: 'Đèn chùm pha lê',   price: 25000, amb: 22, lv: 20, minTier: 3, light: 0.22 },

  { id: 'cay_none',     cat: 'cay', name: 'Chưa có cây',       price: 0,     amb: 0,  default: true },
  { id: 'cay_luoiho',   cat: 'cay', name: 'Chậu lưỡi hổ',      price: 200,   amb: 3 },
  { id: 'cay_kimtien',  cat: 'cay', name: 'Cây kim tiền',      price: 800,   amb: 6, lv: 5,  desc: 'Tên nghe đã thấy giàu.' },
  { id: 'cay_tre',      cat: 'cay', name: 'Khóm trúc',         price: 3000,  amb: 10, lv: 9, minTier: 2 },
  { id: 'cay_bonsai',   cat: 'cay', name: 'Bonsai cổ thụ',     price: 15000, amb: 18, lv: 39, minTier: 3 },
  { id: 'cay_mai',      cat: 'cay', name: 'Cây mai ngày Tết',  price: 0,     amb: 15, source: 'login', desc: 'Quà điểm danh ngày 4.' },

  { id: 'tuong_tron',   cat: 'tuong', name: 'Tường trơn',      price: 0,     amb: 0,  default: true },
  { id: 'tuong_lich',   cat: 'tuong', name: 'Lịch bloc',       price: 150,   amb: 2,  desc: 'Mỗi ngày xé một tờ.' },
  { id: 'tuong_dongho', cat: 'tuong', name: 'Tranh Đông Hồ',   price: 1500,  amb: 8, lv: 7 },
  { id: 'tuong_quat',   cat: 'tuong', name: 'Quạt giấy trang trí', price: 4000, amb: 11, lv: 15, minTier: 2 },
  { id: 'tuong_sonmai', cat: 'tuong', name: 'Tranh sơn mài',   price: 20000, amb: 20, lv: 23, minTier: 3 },

  { id: 'db_none',      cat: 'dacbiet', name: 'Chưa có',       price: 0,     amb: 0,  default: true },
  { id: 'db_ongdia',    cat: 'dacbiet', name: 'Bàn thờ Ông Địa – Thần Tài', price: 888, amb: 5, effect: { tipMult: 1.1 }, desc: 'Buôn may bán đắt! Tip +10%.' },
  { id: 'db_meo',       cat: 'dacbiet', name: 'Mèo thần tài vẫy tay', price: 2500, amb: 7, lv: 7, effect: { tipMult: 1.15 }, desc: 'Vẫy hoài không mỏi. Tip +15%.' },
  { id: 'db_tivi',      cat: 'dacbiet', name: 'Tivi chiếu bóng đá', price: 6000, amb: 10, lv: 11, minTier: 2, effect: { demandMult: 1.1, footballMult: 1.5 }, desc: 'Khách +10%, ngày có trận còn đông hơn.' },
  { id: 'db_beca',      cat: 'dacbiet', name: 'Bể cá Koi',     price: 18000, amb: 16, lv: 22, minTier: 3 },
  // v1.18 đồ ĐỘC QUYỀN Hộp mù (source 'box': không bán, rút trong Hộp mù rồi vào đây bấm Dùng)
  { id: 'tuong_clock',   cat: 'tuong', name: 'Đồng hồ treo tường',     price: 0, amb: 4,  source: 'box', box: 'bx_d_clock' },
  { id: 'tuong_bangmon', cat: 'tuong', name: 'Bảng ghi món trong ngày', price: 0, amb: 5, source: 'box', box: 'bx_d_bangmon' },
  { id: 'tuong_rem',     cat: 'tuong', name: 'Rèm cửa sổ caro',        price: 0, amb: 5,  source: 'box', box: 'bx_d_rem' },
  { id: 'tuong_led',     cat: 'tuong', name: 'Biển hiệu đèn LED',      price: 0, amb: 12, source: 'box', box: 'bx_d_led', effect: { demandMult: 1.05 }, desc: 'Sáng rực cả phố. Khách +5%.' },
  { id: 'cay_trauba',    cat: 'cay', name: 'Chậu trầu bà lá xẻ',       price: 0, amb: 6,  source: 'box', box: 'bx_d_trauba' },
  { id: 'cay_cau',       cat: 'cay', name: 'Chậu cau góc quán',        price: 0, amb: 6,  source: 'box', box: 'bx_d_cau' },
  { id: 'db_xeday',      cat: 'dacbiet', name: 'Xe đẩy thức ăn ba tầng', price: 0, amb: 8, source: 'box', box: 'bx_d_xeday', effect: { patienceMult: 1.05 }, desc: 'Khách kiên nhẫn hơn 5%.' },
  { id: 'db_quaycham',   cat: 'dacbiet', name: 'Quầy nước chấm tự chọn', price: 0, amb: 9, source: 'box', box: 'bx_d_quaycham', effect: { patienceMult: 1.06 }, desc: 'Khách tự pha nước chấm, chờ đỡ sốt ruột. Kiên nhẫn +6%.' },
  { id: 'db_robot',      cat: 'dacbiet', name: 'Robot phục vụ',          price: 0, amb: 12, source: 'box', box: 'bx_d_robot', effect: { patienceMult: 1.1 }, desc: 'Chạy quanh quán chào khách. Kiên nhẫn +10%.' },
  { id: 'db_mayphanuoc', cat: 'dacbiet', name: 'Máy pha đồ uống tự động', price: 0, amb: 12, source: 'box', box: 'bx_d_mayphanuoc', effect: { demandMult: 1.06 }, desc: 'Trà trái cây tự rót. Khách +6%.' },
  { id: 'db_robotmeo',   cat: 'dacbiet', name: 'Robot phục vụ Mèo',      price: 0, amb: 18, source: 'box', box: 'bx_d_robotmeo', effect: { tipMult: 1.2, patienceMult: 1.08 }, desc: 'Meo meo mang món tới bàn. Tip +20%, kiên nhẫn +8%.' },
  { id: 'db_robotgau',   cat: 'dacbiet', name: 'Robot phục vụ Gấu Trúc', price: 0, amb: 18, source: 'box', box: 'bx_d_robotgau', effect: { demandMult: 1.12 }, desc: 'Ai đi ngang cũng ghé chụp hình. Khách +12%.' },
  { id: 'db_quaythungan', cat: 'dacbiet', name: 'Quầy thu ngân Mèo Thần Tài', price: 0, amb: 18, source: 'box', box: 'bx_d_quaythungan', effect: { tipMult: 1.25 }, desc: 'Mèo vẫy tay mỗi lần tính tiền. Tip +25%.' },
  // v1.18c đồ ĐỘC QUYỀN Túi mù (đồ bếp, máy móc, tiện ích)
  { id: 'tuong_giadao', cat: 'tuong', name: 'Giá để dao', price: 0, amb: 4, source: 'box', box: 'bt_giadao' },
  { id: 'tuong_thot', cat: 'tuong', name: 'Bộ thớt treo tường', price: 0, amb: 4, source: 'box', box: 'bt_thot' },
  { id: 'tuong_lichsk', cat: 'tuong', name: 'Bảng lịch sự kiện', price: 0, amb: 5, source: 'box', box: 'bt_lichsk', effect: { demandMult: 1.02 }, desc: 'Ghi ngày khuyến mãi, khách nhớ mà ghé. Khách +2%.' },
  { id: 'db_sanuot', cat: 'dacbiet', name: 'Biển cảnh báo sàn ướt', price: 0, amb: 2, source: 'box', box: 'bt_sanuot', effect: { patienceMult: 1.02 }, desc: 'Sàn sạch bóng, khách yên tâm. Kiên nhẫn +2%.' },
  { id: 'db_choilau', cat: 'dacbiet', name: 'Bộ chổi, cây lau, xô nước', price: 0, amb: 3, source: 'box', box: 'bt_choilau', effect: { patienceMult: 1.03 }, desc: 'Quán lúc nào cũng sạch. Kiên nhẫn +3%.' },
  { id: 'db_maythai', cat: 'dacbiet', name: 'Máy thái thịt cuộn', price: 0, amb: 8, source: 'box', box: 'bt_maythai', effect: { patienceMult: 1.04 }, desc: 'Thịt thái mỏng đều, ra món nhanh. Kiên nhẫn +4%.' },
  { id: 'db_mayxay', cat: 'dacbiet', name: 'Máy xay ớt sa tế', price: 0, amb: 7, source: 'box', box: 'bt_mayxay', effect: { tipMult: 1.04 }, desc: 'Sa tế nhà làm thơm lừng. Tip +4%.' },
  { id: 'db_mayvatcam', cat: 'dacbiet', name: 'Máy vắt nước cam', price: 0, amb: 8, source: 'box', box: 'bt_mayvatcam', effect: { demandMult: 1.03 }, desc: 'Cam vắt tươi tại quán. Khách +3%.' },
  { id: 'db_locKK', cat: 'dacbiet', name: 'Máy lọc không khí', price: 0, amb: 9, source: 'box', box: 'bt_locKK', effect: { patienceMult: 1.05 }, desc: 'Hết mùi khói lẩu. Kiên nhẫn +5%.' },
  { id: 'db_mayutra', cat: 'dacbiet', name: 'Bình ủ trà inox', price: 0, amb: 8, source: 'box', box: 'bt_mayutra', effect: { tipMult: 1.05 }, desc: 'Trà nóng mời khách mọi lúc. Tip +5%.' },
  { id: 'db_bannuoc', cat: 'dacbiet', name: 'Máy bán nước tự động', price: 0, amb: 10, source: 'box', box: 'bt_bannuoc', effect: { demandMult: 1.05 }, desc: 'Khách chờ bàn mua nước uống. Khách +5%.' },
  { id: 'tuong_kds', cat: 'tuong', name: 'Màn hình đơn bếp', price: 0, amb: 9, source: 'box', box: 'bt_kds', effect: { patienceMult: 1.06 }, desc: 'Bếp thấy đơn ngay, không sót món. Kiên nhẫn +6%.' },
  { id: 'tuong_chamcong', cat: 'tuong', name: 'Máy chấm công', price: 0, amb: 6, source: 'box', box: 'bt_chamcong', effect: { patienceMult: 1.03 }, desc: 'Nhân viên đi làm đúng giờ. Kiên nhẫn +3%.' },
  { id: 'db_daychuyenmi', cat: 'dacbiet', name: 'Dây chuyền làm mì tươi', price: 0, amb: 13, source: 'box', box: 'bt_daychuyenmi', effect: { patienceMult: 1.08 }, desc: 'Mì tươi cán tại quán. Kiên nhẫn +8%.' },
  { id: 'db_donggoi', cat: 'dacbiet', name: 'Trạm đóng gói mang về', price: 0, amb: 12, source: 'box', box: 'bt_donggoi', effect: { demandMult: 1.06 }, desc: 'Đơn mang về gói nhanh, đẹp. Khách +6%.' },
  { id: 'tuong_camera', cat: 'tuong', name: 'Màn hình camera an ninh', price: 0, amb: 12, source: 'box', box: 'bt_camera', effect: { tipMult: 1.08 }, desc: 'Quán an toàn, khách thoải mái. Tip +8%.' },
  { id: 'db_robotlau', cat: 'dacbiet', name: 'Robot lau sàn tự động', price: 0, amb: 12, source: 'box', box: 'bt_robotlau', effect: { patienceMult: 1.07 }, desc: 'Chạy vòng vòng lau sàn. Kiên nhẫn +7%.' },
  { id: 'db_photobooth', cat: 'dacbiet', name: 'Máy chụp ảnh lấy liền', price: 0, amb: 14, source: 'box', box: 'bt_photobooth', effect: { demandMult: 1.08 }, desc: 'Khách chụp hình check-in. Khách +8%.' },
  { id: 'db_bachvi', cat: 'dacbiet', name: 'Cỗ Máy Nước Dùng Bách Vị', price: 0, amb: 18, source: 'box', box: 'bt_bachvi', effect: { demandMult: 1.1, patienceMult: 1.05 }, desc: 'Bốn bình nước dùng tự pha. Khách +10%, kiên nhẫn +5%.' },
  { id: 'db_xuongvien', cat: 'dacbiet', name: 'Xưởng Viên Thả Lẩu', price: 0, amb: 18, source: 'box', box: 'bt_xuongvien', effect: { tipMult: 1.15 }, desc: 'Viên cá, viên tôm ra liên tục. Tip +15%.' },
  { id: 'db_phatra', cat: 'dacbiet', name: 'Máy Pha Trà Thượng Hạng', price: 0, amb: 18, source: 'box', box: 'bt_phatra', effect: { tipMult: 1.1, patienceMult: 1.08 }, desc: 'Ấm men ngọc rót trà mời khách. Tip +10%, kiên nhẫn +8%.' },
  // v1.19 ĐỒ PHÒNG GIẢI TRÍ (bản demo): mở bằng nhiệm vụ phòng giải trí hoặc rút Hộp mù; fun = tầng + chỗ đặt (world px)
  { id: 'gt_phong', cat: 'giaitri', name: 'Phông chụp + vòm hoa giấy', price: 0, amb: 8, source: 'box', box: 'bx_gt_phong', fun: { floor: 1, x: 243, y: 232 }, effect: { demandMult: 1.04 }, desc: 'Góc sống ảo của quán. Khách +4%.' },
  { id: 'gt_denvong', cat: 'giaitri', name: 'Đèn vòng chụp ảnh', price: 0, amb: 3, source: 'box', box: 'bx_gt_denvong', fun: { floor: 1, x: 210, y: 256 }, effect: { tipMult: 1.03 }, desc: 'Ảnh lung linh, khách vui tip thêm. Tip +3%.' },
  { id: 'gt_bongbay', cat: 'giaitri', name: 'Chùm bóng bay', price: 0, amb: 3, source: 'box', box: 'bx_gt_bongbay', fun: { floor: 1, x: 266, y: 288 }, effect: { patienceMult: 1.02 }, desc: 'Kiên nhẫn +2%.' },
  { id: 'gt_polaroid', cat: 'giaitri', name: 'Tường ảnh polaroid', price: 0, amb: 4, source: 'box', box: 'bx_gt_polaroid', fun: { floor: 1, x: 290, y: 198, wall: true }, effect: { patienceMult: 1.03 }, desc: 'Khách ngắm ảnh trong lúc chờ. Kiên nhẫn +3%.' },
  { id: 'gt_mayanh', cat: 'giaitri', name: 'Máy chụp ảnh lấy liền (to)', price: 0, amb: 8, source: 'box', box: 'bx_gt_mayanh', fun: { floor: 1, x: 288, y: 246 }, effect: { demandMult: 1.05 }, desc: 'Khách +5%.' },
  { id: 'gt_gapthu', cat: 'giaitri', name: 'Máy gắp thú', price: 0, amb: 6, source: 'box', box: 'bx_gt_gapthu', fun: { floor: 1, x: 214, y: 288 }, effect: { patienceMult: 1.05 }, desc: 'Trẻ em mê lắm. Kiên nhẫn +5%.' },
  { id: 'gt_neon', cat: 'giaitri', name: 'Bảng neon KARAOKE', price: 0, amb: 4, source: 'box', box: 'bx_gt_neon', fun: { floor: 2, x: 222, y: 22, wall: true }, effect: { demandMult: 1.02 }, desc: 'Khách +2%.' },
  { id: 'gt_disco', cat: 'giaitri', name: 'Quả cầu disco', price: 0, amb: 4, source: 'box', box: 'bx_gt_disco', fun: { floor: 2, x: 276, y: 17, wall: true }, effect: { tipMult: 1.03 }, desc: 'Tip +3%.' },
  { id: 'gt_sankhau', cat: 'giaitri', name: 'Sân khấu karaoke', price: 0, amb: 12, source: 'box', box: 'bx_gt_sankhau', fun: { floor: 2, x: 232, y: 79 }, effect: { demandMult: 1.06, patienceMult: 1.04 }, desc: 'Màn hình, loa, micro đủ bộ. Khách +6%, kiên nhẫn +4%.' },
  { id: 'gt_quaynuoc', cat: 'giaitri', name: 'Quầy nước karaoke', price: 0, amb: 6, source: 'box', box: 'bx_gt_quaynuoc', fun: { floor: 2, x: 288, y: 86 }, effect: { tipMult: 1.05 }, desc: 'Tip +5%.' },
  { id: 'gt_sofa', cat: 'giaitri', name: 'Sofa đỏ + bàn trà', price: 0, amb: 6, source: 'box', box: 'bx_gt_sofa', fun: { floor: 2, x: 234, y: 112 }, effect: { patienceMult: 1.05 }, desc: 'Khách ngồi chờ thoải mái. Kiên nhẫn +5%.' },
  { id: 'gt_gheluoi', cat: 'giaitri', name: 'Ghế lười', price: 0, amb: 3, source: 'box', box: 'bx_gt_gheluoi', fun: { floor: 2, x: 272, y: 126 }, effect: { patienceMult: 1.02 }, desc: 'Kiên nhẫn +2%.' },
  { id: 'db_karaoke',   cat: 'dacbiet', name: 'Dàn karaoke',   price: 40000, amb: 20, lv: 31, minTier: 4, effect: { patienceMult: 1.15 }, desc: 'Khách kiên nhẫn hơn 15%. Hàng xóm thì… hơi bực.' },
];

// ───────────────────────────── TIERS (restaurants) ─────────────────────────────
export const TIERS = [
  { id: 1, scene: 'vihe',    name: 'Quán lẩu vỉa hè',      cost: 0,      require: null,
    startTables: 2, maxTables: 4,  startStoves: 2, maxStoves: 2, waitSpots: 2, kho: 100, khoBonus: 50 /* v1.6d +50 chỗ */, rent: 0,   demand: 1.0, ambCap: 20, covered: false,
    desc: 'Hai bộ bàn nhựa đỏ trước hiên nhà, một bếp ga mini và rất nhiều quyết tâm.' },
  { id: 2, scene: 'hem',     name: 'Quán lẩu trong hẻm',   cost: 2500,   require: { level: 8, rating: 3.6 },
    startTables: 5, maxTables: 7,  startStoves: 2, maxStoves: 3, waitSpots: 3, kho: 210, khoBonus: 50 /* v1.6d +50 chỗ */, rent: 80,  demand: 1.5, ambCap: 40, covered: false /* v1.3: the hẻm courtyard is open — pull the tarp until the mặt phố */,
    desc: 'Thuê nguyên căn nhà trong hẻm. Dây điện chằng chịt, hàng xóm thân thiện, khách quen đông dần.' },
  { id: 3, scene: 'mapho',   name: 'Nhà hàng lẩu mặt phố', cost: 15000,  require: { level: 16, rating: 4.0 },
    startTables: 7, maxTables: 10, startStoves: 3, maxStoves: 4, waitSpots: 4, kho: 400, rent: 300, demand: 2.1, ambCap: 65, covered: true,
    desc: 'Mặt tiền đường lớn, cửa kính, biển hiệu to. Giờ bạn là chủ nhà hàng thật sự.' },
  { id: 4, scene: 'haitang', name: 'Nhà hàng lẩu 2 tầng',  cost: 60000,  require: { level: 26, rating: 4.3 },
    startTables: 10, maxTables: 14, startStoves: 4, maxStoves: 5, waitSpots: 5, kho: 670, rent: 900, demand: 2.7, ambCap: 90, covered: true,
    desc: 'Hai tầng, ban công nhìn ra phố, tầng trên dành cho khách đi nhóm.' },
  { id: 5, scene: 'haitang', name: 'Chuỗi Lẩu Nhà Mình',   cost: 250000, require: { level: 40, rating: 4.5 }, chain: true,   // v1.3: the chain is the last level
    startTables: 14, maxTables: 14, startStoves: 5, maxStoves: 5, waitSpots: 5, kho: 670, rent: 900, demand: 2.7, ambCap: 90, covered: true,
    desc: 'Mở chi nhánh khắp Việt Nam. Nhà hàng gốc vẫn hoạt động như cũ.' },
];
export const TIER_MULT = [1, 3, 8, 20, 50]; // reward/price scaling helper by tier

// ───────────────────────────── LEVELS ─────────────────────────────
export const LEVEL = {
  xpGainMult: 2,   // v1.3: every XP gain counts double (owner asked for faster levelling)
  // v1.3: max level 40 (= Chuỗi Lẩu Nhà Mình). Hand-tuned XP per level so each shop lasts a sensible stretch:
  // vỉa hè Lv 1–7 (~2,5 game days), hẻm 8–15 (~4), mặt phố 16–25 (~7,5), 2 tầng 26–39 (~20), chuỗi at 40.
  max: 40,
  // owner: "không quá lâu để không bị chán" → about half of the first v1.3 table from Lv 8 on (~35 game days to Lv 40)
  table: [60, 150, 300, 450, 650, 900, 1150,                          // 1→2 … 7→8
    900, 1100, 1300, 1500, 1700, 1900, 2200, 2500,                     // 8 … 15
    3400, 3800, 4200, 4700, 5200, 5800, 6400, 7000, 7700, 8400,        // 16 … 25
    9500, 10500, 11500, 12500, 13500, 14500, 15500, 16500, 17500, 18500, 19500, 20500, 21500, 22500], // 26 … 39
  xpTableMult: 1.5,   // owner 20/10: "+30%" then "tăng xp lên 50%" — every level needs 50% more XP than the table
  lateFrom: 16, lateMult: 2,   // owner 20/10: "exp từ lv 16 tăng gấp đôi" — Lv 16 → 17 and up need twice the XP
  barMult: 1.6 * 1.2 * 1.2,   // owner 21/10: "tăng thanh xp lên 60%" (Lv 32: 46.500 → 74.400), rồi "+20%" (→ 89.280), rồi "+20%" nữa (→ 107.140)
  upFrom: 21, upMult: 1.45,   // owner 22/10: "từ level 21 tăng 45% số xp phải làm trong thanh xp"
  xpToNext: (lv) => Math.round(LEVEL.table[Math.max(1, Math.min(lv, LEVEL.table.length)) - 1] * LEVEL.xpTableMult * (lv >= LEVEL.lateFrom ? LEVEL.lateMult : 1) * LEVEL.barMult * (lv >= LEVEL.upFrom ? LEVEL.upMult : 1) / 10) * 10,
  // XP for a finished table: price/8 + 3/person + 6 if 5★, × tierXp
  xpForGroup: (potPrice, size, stars, tier) => Math.round((potPrice / 8 + 3 * size + (stars >= 5 ? 6 : 0)) * [1, 1.3, 1.7, 2.2, 2.6][tier - 1]),
  thankXp: 2,
};
// Feature flags unlocked by level (hotpots/ingredients/drinks unlock by their own unlockLv).
export const FEATURES = {
  hire_phucvu: 2, hire_daubep: 3, deco: 4, daily: 4, reservations: 6, mkt_reviewer: 6,
  hire_thungan: 9, mkt_livestream: 10, hire_quankho: 17, speed2: 5, manageMode: 9, extras: 3, lottery: 7,
  // v1.16 sắp xếp lại (Lv 3 quá dồn): giá bán Lv 6, vé số Lv 7, ship Lv 11, thuế Lv 13
  pricing: 6,   // v1.14 Thực đơn ▸ Giá bán: tự đặt giá từng món / cả thực đơn (mang từ Xoài Lắc)
  tax: 13,      // v1.14 đóng thuế theo kỳ (quán đã làm ăn ổn định)
  hire_shipper: 11, ship: 11,   // v1.16 nhận đơn ship + thuê Shipper
  blindbox: 8,  // v1.18 Hộp mù (tab Giải trí, cùng Vé số)
};

// ───────────────────────────── v1.14 GIÁ BÁN (người chơi tự đặt, mang từ Xoài Lắc v2) ─────────────────────────────
// state.prices[potId] = giá (k) người chơi chọn; không có = giá gợi ý (potPrice: giá gốc × cấp công thức × sổ công thức).
// Khác Xoài Lắc: để giá gợi ý thì game chạy y như trước (không khách nào chê đắt) — chỉ khi NÂNG giá mới có người bỏ đi.
export const PRICING = {
  minMult: 0.5, maxMult: 2.0,             // giá được đặt = giá gốc × [0,5 … 2,0], tròn nghìn
  // 1) chọn món: trọng số × (giá / gợi ý)^-choiceExp
  choiceExp: 2, choiceMin: 0.3, choiceMax: 2.5,
  // 2) chê đắt bỏ về: sig(k × (overW·(over − overC) − value)) − sig(tại giá gợi ý), chỉ khi over > 1.
  //    over = giá / gợi ý. +10% ≈ 6%, +20% ≈ 21%, +30% ≈ 47% khách bỏ về.
  k: 1.6, overW: 7.25, overC: 1.3,
  valueRating: 0.5, valueRecipe: 0.15,    // ★ trên 4,0 / mỗi cấp công thức trên 1 → khách chịu giá cao hơn chút
  // 3) truyền miệng: chỉ số giá cả thực đơn → lượng khách × index^-demandExp
  demandExp: 0.8, demandMin: 0.7, demandMax: 1.3,
  // 4) "đáng tiền" trong điểm hài lòng: × (1 − over)
  valueW: 1.2, valueMin: -0.5, valueMax: 0.35,
  priceyReviewChance: 0.15,               // khách chê đắt đôi khi để lại đánh giá 3★
  bulkSteps: [-10, -5, 5, 10],            // nút chỉnh cả thực đơn (%)
};

// ───────────────────────────── v1.14 THUẾ ─────────────────────────────
// Hộ kinh doanh ăn uống nộp thuế khoán trên doanh thu (thuế GTGT 3% + TNCN 1,5% = 4,5%). Doanh thu tiền lẩu, nước,
// món kèm, tráng miệng (không tính tiền tip). Cứ periodDays ngày ra một tờ thông báo thuế, hạn đóng graceDays ngày.
// Trễ hạn: mỗi ngày phạt lateFeePerDay; trễ forceAfter ngày thì bị cưỡng chế thu luôn + phạt thêm forceFine.
export const TAX = {
  rate: 0.045, periodDays: 7, graceDays: 3, remindDays: 2,
  lateFeePerDay: 0.05, forceAfter: 3, forceFine: 0.2, minBill: 5,
  officer: 'Cán bộ thuế phường',
};

// ───────────────────────────── MARKET ─────────────────────────────
export const MARKET = {
  dailyVol: 0.10, meanRevert: 0.2, min: 0.75, max: 1.35, // multiplier random walk on cost
  // no buying while the restaurant is open: the kho is stocked at the start of the day only
  packs: [5, 10, 50],            // v1.6c buy buttons: +5 / +10 / +50 (nút "Đầy kho" đã bỏ theo yêu cầu chủ dự án)
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
  // v1.6d: giá theo cấp quán (tierCosts) thay cho cost × TIER_MULT (×3, ×8, ×20 tăng nhanh hơn doanh thu: livestream ở
  // nhà hàng 2 tầng từng tốn 30 tr ≈ 1,5 ngày doanh thu). Giờ reviewer ≈ 9%, livestream ≈ 17% doanh thu một ngày.
  { id: 'reviewer',   name: 'Mời Food Reviewer',  icon: 'ui_review',    cost: 600,  tierCosts: [600, 1000, 1400, 1800, 2200], unlockLv: 6, desc: 'Chắc chắn có reviewer ghé hôm nay.' },
  { id: 'livestream', name: 'Livestream bán hàng', icon: 'ui_music',    cost: 1200, tierCosts: [1200, 2000, 2800, 3600, 4500], demand: 1.7, xp: 200, unlockLv: 10, desc: 'Khách +70% và +XP.' },
];
/** v1.6d: what a marketing action costs at a given shop tier */
export function marketingCost(m, tier) {
  const t = Math.max(1, tier | 0);
  if (m.tierCosts) return m.tierCosts[Math.min(t, m.tierCosts.length) - 1];
  return m.cost * (m.scale ? TIER_MULT[Math.min(t, TIER_MULT.length) - 1] : 1);
}
export const VIRAL = { days: 2, demand: 1.6, badDemand: 0.8 };

// v1.4 món ăn kèm: chance a group adds a side dish to its hotpot order (a second one for groups of 3+)
export const SIDE = { chance: 0.5, second: 0.3 };

// v1.2: hired quản kho restocks mid-service when an ingredient on the menu drops to lowAt portions
// v1.9: quản kho đi chợ sớm hơn (sắp hết = còn ≤ lowAt phần HOẶC không đủ bán horizonMin phút tới theo tốc độ bán
// hôm nay), đi bộ ra chợ thật, tripMin phút sau mang hàng về (trả tiền lúc về). Mua đủ bán ~buyMin phút, ít nhất minBuy.
// v1.10 thanh lý hàng cũ (mang từ Xoài Lắc v2.6): Cô Ba đầu hẻm mua lại hàng tồn buổi sáng (trước khi mở hàng), lô cũ
// nhất trước, theo % giá vốn: rates[min(số ngày còn hạn, 2)] — 0 = hết hạn sau hôm nay. Luôn thấp hơn giá mua.
export const LIQUIDATE = { buyer: 'Cô Ba đầu hẻm', rates: [0.35, 0.5, 0.6] };
export const QUANKHO_RUN = { lowAt: 6, horizonMin: 120, cooldown: 10, minBuy: 15, buyMin: 240, usageShare: 0.5, tripMin: 6, runMult: 2 };

// ───────────────────────────── OFFLINE & CHAIN ─────────────────────────────
export const OFFLINE = { minAwaySec: 120, shopShare: 0.125 /* v1.2: halved */, chainShare: 0.5 /* v1.2: halved */, daySec: 240 /* offline pays as if a day took 4 min (kept when days became 9 min) */, shopCapSec: 4 * 3600, chainCapSec: 8 * 3600 };
export const BRANCHES = [
  { id: 'dalat',   name: 'Đà Lạt',   dish: 'Lẩu gà lá é',          cost: 70000,   income: 0.9 },  // k per real second at level 1 (×240/540 when days went 4 → 9 min)
  { id: 'vungtau', name: 'Vũng Tàu', dish: 'Lẩu hải sản',           cost: 140000,  income: 1.6 },
  { id: 'cantho',  name: 'Cần Thơ',  dish: 'Lẩu mắm',               cost: 245000,  income: 2.6 },
  { id: 'danang',  name: 'Đà Nẵng',  dish: 'Lẩu cá',                cost: 420000,  income: 4.1 },
  { id: 'hanoi',   name: 'Hà Nội',   dish: 'Lẩu riêu cua bắp bò',   cost: 700000,  income: 6.7 },
  // v1.7: thêm 3 chi nhánh (cùng tỉ lệ ~105k vốn cho 1k/giây)
  { id: 'hue',      name: 'Huế',       dish: 'Lẩu bò cay Huế',       cost: 1100000, income: 10.5 },
  { id: 'nhatrang', name: 'Nha Trang', dish: 'Lẩu sứa cá',           cost: 1700000, income: 16 },
  { id: 'phuquoc',  name: 'Phú Quốc',  dish: 'Lẩu cá bớp',           cost: 2600000, income: 24 },
];
// v1.7 dời quán: the main shop can move to any opened branch city (scenery changes); 'saigon' = home
export const HOME_CITY = { id: 'saigon', name: 'Sài Gòn' };
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
  { id: 'qp1', text: 'Tự đặt giá bán một món (Thực đơn ▸ Giá bán, Lv 6)', type: 'setPrice', target: 1, reward: { money: 300 } },   // v1.16
  { id: 'ql1', text: 'Mua vé số rồi dò vé (Lv 7)',      type: 'lotteryChecked', target: 1, reward: { money: 300 } },              // v1.16
  { id: 'qb1', text: 'Mở thử một Hộp mù (Lv 8)',        type: 'boxOpened', target: 1, reward: { money: 400 } },                   // v1.18
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
  { id: 'qs1', text: 'Thuê Shipper để nhận đơn ship',   type: 'hire:shipper', target: 1, reward: { money: 2500 } },              // v1.16
  { id: 'qs2', text: 'Giao 20 đơn ship',                type: 'shipDelivered', target: 20, reward: { money: 5000 } },            // v1.16
  { id: 'qd1', text: 'Mua Tủ kem để bán tráng miệng',   type: 'upgrade:tukem', target: 1, reward: { money: 3000 } },
  { id: 'qd2', text: 'Bán 20 phần tráng miệng',          type: 'dessertsSold', target: 20, reward: { money: 5000 } },
  { id: 'qt1', text: 'Đóng thuế lần đầu (Lv 13, Quán ▸ Thuế)', type: 'taxPaid', target: 1, reward: { money: 4000 } },          // v1.16
  { id: 'q27', text: 'Đạt combo x10',                   type: 'combo', target: 10,     reward: { money: 3000 } },
  { id: 'q28', text: 'Gặp đủ 10 kiểu khách',            type: 'kindsMet', target: 10,  reward: { money: 5000 } },
  { id: 'q29', text: 'Mở Nhà hàng lẩu 2 tầng',          type: 'tier', target: 4,       reward: { money: 10000 }, mom: 'tier4' },
  // v1.19 phòng giải trí + dãy bên — mỗi nhiệm vụ tặng đồ trang trí trong bản demo
  { id: 'qg1', text: 'Mở Photo Studio bên hông quán (Lv 28)', type: 'upgLvl:giaitri', target: 1, reward: { money: 20000, decos: ['gt_phong', 'gt_denvong', 'gt_bongbay'] } },
  { id: 'qg2', text: 'Bày 3 món trong phòng giải trí',  type: 'funPlaced', target: 3, reward: { money: 15000, decos: ['gt_polaroid', 'gt_mayanh'] } },
  { id: 'qg3', text: 'Mở thêm bàn trên lầu dãy bên',    type: 'upgLvl:canh', target: 2, reward: { money: 20000, decos: ['gt_gapthu'] } },
  { id: 'qg4', text: 'Mở phòng Karaoke trên lầu (Lv 32)', type: 'upgLvl:giaitri', target: 2, reward: { money: 30000, decos: ['gt_sankhau', 'gt_neon', 'gt_disco'] } },
  { id: 'qg5', text: 'Bày đủ 9 món trong phòng giải trí', type: 'funPlaced', target: 9, reward: { money: 50000, decos: ['gt_sofa', 'gt_gheluoi', 'gt_quaynuoc'] } },
  { id: 'q30', text: 'Có 8 nhân viên',                  type: 'staffCount', target: 8, reward: { money: 8000 } },
  { id: 'qn1', text: 'Có 10 nhân viên',                 type: 'staffCount', target: 10, reward: { money: 15000 } },           // v1.17
  { id: 'q31', text: 'Mở khoá Lẩu thập cẩm Nhà Mình',   type: 'level', target: 18,     reward: { money: 10000 } },
  { id: 'q32', text: 'Bán 2.000 nồi lẩu',               type: 'potsSold', target: 2000, reward: { money: 15000 } },
  { id: 'qd3', text: 'Bán 150 phần tráng miệng',         type: 'dessertsSold', target: 150, reward: { money: 20000 } },
  { id: 'q33', text: 'Đạt 4.5★ với ít nhất 60 đánh giá', type: 'rating', target: 4.5, minReviews: 60, reward: { money: 20000 } },
  { id: 'qn2', text: 'Có đủ 12 nhân viên',              type: 'staffCount', target: 12, reward: { money: 30000 } },           // v1.17
  { id: 'q34', text: 'Mở Chuỗi Lẩu Nhà Mình',           type: 'tier', target: 5,       reward: { money: 50000 }, mom: 'tier5' },
  { id: 'q35', text: 'Mở chi nhánh đầu tiên',           type: 'branches', target: 1,   reward: { money: 30000 } },
  { id: 'q36', text: 'Mở 3 chi nhánh',                  type: 'branches', target: 3,   reward: { money: 100000 } },
  { id: 'q37', text: 'Mở 5 chi nhánh',                  type: 'branches', target: 5,   reward: { money: 300000 } },
  { id: 'qd4', text: 'Mua Máy nướng waffle',             type: 'upgrade:waffle', target: 1, reward: { money: 80000 } },
  { id: 'qd5', text: 'Bán 500 phần tráng miệng',         type: 'dessertsSold', target: 500, reward: { money: 200000 } },
  { id: 'q38', text: 'Phủ sóng cả 8 thành phố',         type: 'branches', target: 8,   reward: { money: 1000000 }, mom: 'ending' },   // v1.7
];
// v1.1: quests inserted into the main chain; old saves move their pointer past them (state.js migrate)
export const MAIN_QUEST_INSERTS = [{ after: 'q26', n: 2 }, { after: 'q32', n: 1 }];
// v1.16 nhiệm vụ chính mới: save cũ giữ đúng nhiệm vụ đang làm (đổi chỉ số theo id, xem state.migrate)
export const MAIN_QUESTS_V116 = ['qp1', 'ql1', 'qs1', 'qs2', 'qt1'];
export const MAIN_QUESTS_V117 = ['qn1', 'qn2'];
export const MAIN_QUESTS_V118 = ['qb1'];
// v1.20 Khu vui chơi: bán vé Photo Studio (tầng trệt) và Karaoke (lầu). Giá vé đặt ở Thực đơn ▸ Giá bán ▸ Vé.
export const FUN = {
  tickets: {
    photo: { name: 'Vé Photo Studio', icon: 'ui_hopmu', floor: 1, ref: 35, group: [1, 3], stay: [25, 50], perHour: 3.2, desc: 'Chụp ảnh lấy liền, phông hoa giấy, máy gắp thú.' },
    kara: { name: 'Vé Karaoke', icon: 'ui_ticket', floor: 2, ref: 80, group: [2, 4], stay: [45, 90], perHour: 2.2, desc: 'Phòng hát trên lầu: sân khấu, sofa, quầy nước.' },
  },
  tier5Mult: 1.3,                // nhà hàng lớn (bậc 5) giá gợi ý cao hơn
  minMult: 0.5, maxMult: 2.5,    // giá đặt được = giá gợi ý × [0,5 … 2,5]
  priceExp: 1.6,                 // khách ∝ (giá / gợi ý)^-1,6
  perItem: 0.12,                 // mỗi món đồ giải trí đang bày ở tầng đó: +12% khách
  weekendMult: 1.3, rainMult: 1.25,
  hourCurve: { 10: 0.4, 11: 0.6, 12: 0.7, 13: 0.8, 14: 1, 15: 1, 16: 1, 17: 1.1, 18: 1.3, 19: 1.5, 20: 1.6, 21: 1.4, 22: 0.9 },
};
export const MAIN_QUESTS_V119 = ['qg1', 'qg2', 'qg3', 'qg4', 'qg5'];

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
  { id: 'd_sides',   text: 'Bán {n} món ăn kèm',            type: 'sidesSold', target: (t) => [4, 8, 14, 20, 20][t - 1], chest: 'wood', minLv: 2 },
  { id: 'd_dessert', text: 'Bán {n} phần tráng miệng',      type: 'dessertsSold', target: (t) => [4, 8, 14, 20, 20][t - 1], chest: 'silver', minLv: 12 },
  { id: 'd_thank',   text: 'Cảm ơn {n} đánh giá',           type: 'thank',      target: () => 3, chest: 'wood' },
  { id: 'd_ship',    text: 'Giao {n} đơn ship',             type: 'shipDelivered', target: (t) => [3, 5, 8, 12, 12][t - 1], chest: 'silver', minLv: 11, needs: 'shipper' },   // v1.16
];
// v1.7: từ Lv 10 XP nhận từ nhiệm vụ (rương nhiệm vụ ngày + mục tiêu chính) ×1.6
// v1.11b: trả lại như v1.9 (bản v1.10 hiểu nhầm yêu cầu "tăng exp 60%" — ý chủ game là thanh XP, xem LEVEL.barMult)
export const QUEST_XP = { fromLv: 10, mult: 1.6 };

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
  vip: ['Chị Vy Spa', 'Madam Lan', 'Chị Hạnh Địa Ốc'],
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
export const NEXT_GAMES = ['Tiramisu', 'Buffet Lẩu Tobooki'];   // màn chào + Cài đặt ▸ Sắp ra mắt

// v1.8: đăng nhập Google + lưu lên mạng + bảng xếp hạng (API: /api/lau/*, Vercel + Turso).
// Client ID là mã công khai của MeeGame trên Google (không phải mật khẩu).
export const CLOUD = {
  clientId: '279939367302-c932eltrgmjda8jdj3vm15t2hh6lg42t.apps.googleusercontent.com',
  api: '/api/lau',
  syncSec: 120,          // tự lưu lên mạng tối đa 2 phút / lần khi có thay đổi
  levelSlack: 2,         // bản mới hơn nhưng thấp hơn quá 2 cấp → hỏi người chơi thay vì tự lấy
};

// ───────────────────────────── v1.18 HỘP MÙ (tab Giải trí) ─────────────────────────────
// Mỗi hộp ra 1 món sưu tầm theo độ hiếm. Món: món ăn/uống độc quyền (bán được trong quán), màu đồng phục độc quyền
// (nhân viên + chủ quán), kiểu chủ quán (mở sớm, không cần đợi cấp), thẻ thành tích (đeo lên bảng xếp hạng).
// Trùng món → mảnh; gom mảnh đổi món còn thiếu. Bảo hiểm: 10 hộp chắc chắn có Hiếm trở lên, 150 hộp chắc chắn có Bí ẩn.
export const BOX = {
  // owner 22/10: tăng giá hộp + giá đổi mảnh; tỉ lệ / bảo hiểm chỉnh theo bộ 61 món của Lẩu Ơi
  price: [200, 400, 1000, 2500, 5000],  // k / hộp theo cấp quán (owner 22/10: "để lại giá cũ")
  tenMult: 9,                           // mở 10 hộp = giá 9 hộp
  freePerDay: 1,
  rar: [
    { id: 1, name: 'Thường',   rate: 60, shard: 5,   cost: 40,   icon: 'ui_star_empty' },
    { id: 2, name: 'Hiếm',     rate: 30, shard: 15,  cost: 150,  icon: 'ui_star_half' },
    { id: 3, name: 'Cực hiếm', rate: 8,  shard: 40,  cost: 900,  icon: 'ui_star' },
    { id: 4, name: 'Bí ẩn',    rate: 2,  shard: 100, cost: 2000, icon: 'ui_chest_gold' },
  ],
  pityRare: 10, pityEpic: 40, pityMyst: 100,   // chắc chắn Hiếm+ trong 10 hộp, Cực hiếm+ trong 40, Bí ẩn trong 100
  // v1.18e: owner 22/10 "gộp túi mù và hộp mù lại" — một Hộp mù duy nhất, đủ cả món của Túi mù cũ (grp 'bep')
  sets: {
    hop: { name: 'Hộp mù', icon: 'ui_hopmu', feature: 'blindbox' },
  },
  items: [
    // món ăn / uống độc quyền
    { id: 'bx_kemtra',    r: 1, kind: 'food', ref: 'tm_kemtra',   name: 'Kem trà xanh' },
    { id: 'bx_tradao',    r: 1, kind: 'drink', ref: 'tradao',     name: 'Trà đào cam sả' },
    { id: 'bx_flancf',    r: 1, kind: 'food', ref: 'tm_flancf',   name: 'Flan cà phê' },
    { id: 'bx_oclen',     r: 2, kind: 'food', ref: 'ak_oclen',    name: 'Ốc len xào dừa' },
    { id: 'bx_kemdau',    r: 2, kind: 'food', ref: 'tm_kemdau',   name: 'Kem dâu' },
    { id: 'bx_matcha',    r: 2, kind: 'drink', ref: 'matcha',     name: 'Trà sữa matcha' },
    { id: 'bx_tomchien',  r: 3, kind: 'food', ref: 'ak_tomchien', name: 'Tôm chiên xù' },
    { id: 'bx_hauphomai', r: 3, kind: 'food', ref: 'ak_hauphomai', name: 'Hàu nướng phô mai' },
    // màu đồng phục độc quyền (nhân viên + chủ quán)
    { id: 'bx_u_bachha',  r: 1, kind: 'uniform', ref: 'bachha',  name: 'Áo xanh bạc hà' },
    { id: 'bx_u_camdao',  r: 1, kind: 'uniform', ref: 'camdao',  name: 'Áo cam đào' },
    { id: 'bx_u_datroi',  r: 1, kind: 'uniform', ref: 'datroi',  name: 'Áo xanh da trời' },
    { id: 'bx_u_dodo',    r: 2, kind: 'uniform', ref: 'dodo',    name: 'Áo đỏ đô' },
    { id: 'bx_u_oaihuong', r: 2, kind: 'uniform', ref: 'oaihuong', name: 'Áo tím oải hương' },
    { id: 'bx_u_ngoclam', r: 2, kind: 'uniform', ref: 'ngoclam', name: 'Áo ngọc lam' },
    { id: 'bx_u_hoanggia', r: 3, kind: 'uniform', ref: 'hoanggia', name: 'Áo vàng hoàng gia' },
    { id: 'bx_u_bac',     r: 4, kind: 'uniform', ref: 'bacanhkim', name: 'Áo bạc ánh kim' },
    // kiểu chủ quán (mở sớm, không cần đợi cấp) — ref = id trong AVATARS
    { id: 'bx_l_4',  r: 1, kind: 'look', ref: 4,  name: 'Chị tóc nâu dài' },
    { id: 'bx_l_5',  r: 1, kind: 'look', ref: 5,  name: 'Chị tóc đen rối' },
    { id: 'bx_l_6',  r: 2, kind: 'look', ref: 6,  name: 'Chị tạp dề cam' },
    { id: 'bx_l_7',  r: 2, kind: 'look', ref: 7,  name: 'Cô tóc vàng bồng bềnh' },
    { id: 'bx_l_8',  r: 2, kind: 'look', ref: 8,  name: 'Cô tóc hồng' },
    { id: 'bx_l_9',  r: 3, kind: 'look', ref: 9,  name: 'Chị tóc ngang vai' },
    { id: 'bx_l_10', r: 3, kind: 'look', ref: 10, name: 'Anh tóc đen áo xanh' },
    { id: 'bx_l_11', r: 4, kind: 'look', ref: 11, name: 'Anh tóc nâu áo be' },
    // kiểu nồi lẩu (đeo 1 kiểu: mọi nồi trên bàn + trên bếp đổi theo)
    { id: 'bx_p_inoxden',  r: 1, kind: 'pot', ref: 'inoxden',  name: 'Nồi lẩu inox đen' },
    { id: 'bx_p_datnung',  r: 1, kind: 'pot', ref: 'datnung',  name: 'Nồi lẩu đất nung' },
    { id: 'bx_p_mentrang', r: 1, kind: 'pot', ref: 'mentrang', name: 'Nồi lẩu men trắng' },
    { id: 'bx_p_dong',     r: 2, kind: 'pot', ref: 'dong',     name: 'Nồi lẩu đồng cổ điển' },
    { id: 'bx_p_gomxanh',  r: 2, kind: 'pot', ref: 'gomxanh',  name: 'Nồi lẩu gốm hoa văn xanh' },
    { id: 'bx_p_menngoc',  r: 3, kind: 'pot', ref: 'menngoc',  name: 'Nồi lẩu men ngọc' },
    { id: 'bx_p_hoanggia', r: 4, kind: 'pot', ref: 'hoanggia', name: 'Nồi Lẩu Hoàng Gia' },
    // kiểu BÀN (mặt bàn + chân bàn, đeo 1 kiểu cho cả quán)
    { id: 'bx_t_gosang',   r: 1, kind: 'table', ref: 'gosang',   name: 'Bàn lẩu gỗ sáng' },
    { id: 'bx_t_mattrang', r: 1, kind: 'table', ref: 'mattrang', name: 'Bàn lẩu mặt trắng' },
    { id: 'bx_t_matda',    r: 2, kind: 'table', ref: 'matda',    name: 'Bàn lẩu mặt đá' },
    { id: 'bx_t_occho',    r: 3, kind: 'table', ref: 'occho',    name: 'Bàn lẩu gỗ óc chó' },
    { id: 'bx_t_ngurthien', r: 4, kind: 'table', ref: 'ngurthien', name: 'Bàn Lẩu Ngự Thiện' },
    // v1.18h kiểu GHẾ (đẩu ngồi quanh bàn, đeo 1 kiểu cho cả quán)
    { id: 'bx_g_gosang',   r: 1, kind: 'chair', ref: 'gosang',   name: 'Ghế gỗ sáng' },
    { id: 'bx_g_trang',    r: 1, kind: 'chair', ref: 'trang',    name: 'Ghế nhựa trắng' },
    { id: 'bx_g_xanhla',   r: 1, kind: 'chair', ref: 'xanhla',   name: 'Ghế nhựa xanh lá' },
    { id: 'bx_g_xanhduong', r: 2, kind: 'chair', ref: 'xanhduong', name: 'Ghế nhựa xanh dương' },
    { id: 'bx_g_hong',     r: 2, kind: 'chair', ref: 'hong',     name: 'Ghế hồng pastel' },
    { id: 'bx_g_occho',    r: 3, kind: 'chair', ref: 'occho',    name: 'Ghế gỗ óc chó' },
    { id: 'bx_g_vang',     r: 4, kind: 'chair', ref: 'vang',     name: 'Ghế Rồng Vàng' },
    // v1.18i DÁNG bàn / ghế (đeo 1 dáng cho cả quán, kết hợp được với màu)
    { id: 'bx_tf_tron',   r: 3, kind: 'tform', ref: 'tron',   name: 'Bàn gỗ khảm xà cừ' },
    { id: 'bx_tf_tre',    r: 1, kind: 'tform', ref: 'tre',    name: 'Bàn tre' },
    { id: 'bx_tf_kinh',   r: 2, kind: 'tform', ref: 'kinh',   name: 'Bàn mặt kính chân sắt' },
    { id: 'bx_tf_bepam',  r: 1, kind: 'tform', ref: 'bepam',  name: 'Bàn lẩu bếp âm' },
    { id: 'bx_cf_tre',    r: 1, kind: 'cform', ref: 'tre',    name: 'Ghế đẩu tre' },
    { id: 'bx_cf_dem',    r: 1, kind: 'cform', ref: 'dem',    name: 'Ghế có đệm' },
    { id: 'bx_cf_tua',    r: 2, kind: 'cform', ref: 'tua',    name: 'Ghế tựa lưng' },
    { id: 'bx_cf_tuadem', r: 3, kind: 'cform', ref: 'tuadem', name: 'Ghế tựa lưng có đệm' },
    { id: 'bx_cf_banh',   r: 4, kind: 'cform', ref: 'banh',   name: 'Đôn sứ Bát Tràng' },
    // đồ trang trí (vào Quán ▸ Trang trí bấm Dùng)
    { id: 'bx_d_clock',    r: 1, kind: 'deco', ref: 'tuong_clock',   name: 'Đồng hồ treo tường' },
    { id: 'bx_d_bangmon',  r: 1, kind: 'deco', ref: 'tuong_bangmon', name: 'Bảng ghi món trong ngày' },
    { id: 'bx_d_rem',      r: 1, kind: 'deco', ref: 'tuong_rem',     name: 'Rèm cửa sổ caro' },
    { id: 'bx_d_trauba',   r: 1, kind: 'deco', ref: 'cay_trauba',    name: 'Chậu trầu bà lá xẻ' },
    { id: 'bx_d_cau',      r: 1, kind: 'deco', ref: 'cay_cau',       name: 'Chậu cau góc quán' },
    { id: 'bx_d_led',      r: 2, kind: 'deco', ref: 'tuong_led',     name: 'Biển hiệu đèn LED' },
    { id: 'bx_d_xeday',    r: 2, kind: 'deco', ref: 'db_xeday',      name: 'Xe đẩy thức ăn ba tầng' },
    { id: 'bx_d_quaycham', r: 2, kind: 'deco', ref: 'db_quaycham',   name: 'Quầy nước chấm tự chọn' },
    { id: 'bx_d_robot',    r: 3, kind: 'deco', ref: 'db_robot',      name: 'Robot phục vụ' },
    { id: 'bx_d_mayphanuoc', r: 3, kind: 'deco', ref: 'db_mayphanuoc', name: 'Máy pha đồ uống tự động' },
    { id: 'bx_d_robotmeo', r: 4, kind: 'deco', ref: 'db_robotmeo',   name: 'Robot phục vụ Mèo' },
    { id: 'bx_d_robotgau', r: 4, kind: 'deco', ref: 'db_robotgau',   name: 'Robot phục vụ Gấu Trúc' },
    { id: 'bx_d_quaythungan', r: 4, kind: 'deco', ref: 'db_quaythungan', name: 'Quầy thu ngân Mèo Thần Tài' },
    // ═══ v1.18c đồ bếp, máy móc, tiện ích (v1.18e gộp Túi mù vào Hộp mù) — đặt trong Quán ▸ Trang trí ═══
    { id: 'bt_giadao', grp: 'bep', r: 1, kind: 'deco', ref: 'tuong_giadao', name: 'Giá để dao' },
    { id: 'bt_thot', grp: 'bep', r: 1, kind: 'deco', ref: 'tuong_thot', name: 'Bộ thớt treo tường' },
    { id: 'bt_lichsk', grp: 'bep', r: 1, kind: 'deco', ref: 'tuong_lichsk', name: 'Bảng lịch sự kiện' },
    { id: 'bt_sanuot', grp: 'bep', r: 1, kind: 'deco', ref: 'db_sanuot', name: 'Biển cảnh báo sàn ướt' },
    { id: 'bt_choilau', grp: 'bep', r: 1, kind: 'deco', ref: 'db_choilau', name: 'Bộ chổi, cây lau, xô nước' },
    { id: 'bt_maythai', grp: 'bep', r: 2, kind: 'deco', ref: 'db_maythai', name: 'Máy thái thịt cuộn' },
    { id: 'bt_mayxay', grp: 'bep', r: 2, kind: 'deco', ref: 'db_mayxay', name: 'Máy xay ớt sa tế' },
    { id: 'bt_mayvatcam', grp: 'bep', r: 2, kind: 'deco', ref: 'db_mayvatcam', name: 'Máy vắt nước cam' },
    { id: 'bt_locKK', grp: 'bep', r: 2, kind: 'deco', ref: 'db_locKK', name: 'Máy lọc không khí' },
    { id: 'bt_mayutra', grp: 'bep', r: 2, kind: 'deco', ref: 'db_mayutra', name: 'Bình ủ trà inox' },
    { id: 'bt_bannuoc', grp: 'bep', r: 2, kind: 'deco', ref: 'db_bannuoc', name: 'Máy bán nước tự động' },
    { id: 'bt_kds', grp: 'bep', r: 2, kind: 'deco', ref: 'tuong_kds', name: 'Màn hình đơn bếp' },
    { id: 'bt_chamcong', grp: 'bep', r: 2, kind: 'deco', ref: 'tuong_chamcong', name: 'Máy chấm công' },
    { id: 'bt_daychuyenmi', grp: 'bep', r: 3, kind: 'deco', ref: 'db_daychuyenmi', name: 'Dây chuyền làm mì tươi' },
    { id: 'bt_donggoi', grp: 'bep', r: 3, kind: 'deco', ref: 'db_donggoi', name: 'Trạm đóng gói mang về' },
    { id: 'bt_camera', grp: 'bep', r: 3, kind: 'deco', ref: 'tuong_camera', name: 'Màn hình camera an ninh' },
    { id: 'bt_robotlau', grp: 'bep', r: 3, kind: 'deco', ref: 'db_robotlau', name: 'Robot lau sàn tự động' },
    { id: 'bt_photobooth', grp: 'bep', r: 3, kind: 'deco', ref: 'db_photobooth', name: 'Máy chụp ảnh lấy liền' },
    { id: 'bt_bachvi', grp: 'bep', r: 4, kind: 'deco', ref: 'db_bachvi', name: 'Cỗ Máy Nước Dùng Bách Vị' },
    { id: 'bt_xuongvien', grp: 'bep', r: 4, kind: 'deco', ref: 'db_xuongvien', name: 'Xưởng Viên Thả Lẩu' },
    { id: 'bt_phatra', grp: 'bep', r: 4, kind: 'deco', ref: 'db_phatra', name: 'Máy Pha Trà Thượng Hạng' },
    // v1.19 đồ phòng giải trí (grp 'giaitri')
    { id: 'bx_gt_phong', grp: 'giaitri', r: 2, kind: 'deco', ref: 'gt_phong', name: 'Phông chụp + vòm hoa giấy' },
    { id: 'bx_gt_denvong', grp: 'giaitri', r: 1, kind: 'deco', ref: 'gt_denvong', name: 'Đèn vòng chụp ảnh' },
    { id: 'bx_gt_bongbay', grp: 'giaitri', r: 1, kind: 'deco', ref: 'gt_bongbay', name: 'Chùm bóng bay' },
    { id: 'bx_gt_polaroid', grp: 'giaitri', r: 1, kind: 'deco', ref: 'gt_polaroid', name: 'Tường ảnh polaroid' },
    { id: 'bx_gt_mayanh', grp: 'giaitri', r: 3, kind: 'deco', ref: 'gt_mayanh', name: 'Máy chụp ảnh lấy liền (to)' },
    { id: 'bx_gt_gapthu', grp: 'giaitri', r: 2, kind: 'deco', ref: 'gt_gapthu', name: 'Máy gắp thú' },
    { id: 'bx_gt_neon', grp: 'giaitri', r: 1, kind: 'deco', ref: 'gt_neon', name: 'Bảng neon KARAOKE' },
    { id: 'bx_gt_disco', grp: 'giaitri', r: 1, kind: 'deco', ref: 'gt_disco', name: 'Quả cầu disco' },
    { id: 'bx_gt_sankhau', grp: 'giaitri', r: 4, kind: 'deco', ref: 'gt_sankhau', name: 'Sân khấu karaoke' },
    { id: 'bx_gt_quaynuoc', grp: 'giaitri', r: 2, kind: 'deco', ref: 'gt_quaynuoc', name: 'Quầy nước karaoke' },
    { id: 'bx_gt_sofa', grp: 'giaitri', r: 2, kind: 'deco', ref: 'gt_sofa', name: 'Sofa đỏ + bàn trà' },
    { id: 'bx_gt_gheluoi', grp: 'giaitri', r: 1, kind: 'deco', ref: 'gt_gheluoi', name: 'Ghế lười' },
    // thẻ thành tích (đeo 1 thẻ, hiện cạnh tên quán trên bảng xếp hạng)
    { id: 'bx_b_tapsu',   r: 1, kind: 'badge', icon: 'pot_ga', name: 'Lẩu thủ tập sự' },
    { id: 'bx_b_chamchi', r: 1, kind: 'badge', icon: 'ui_clock', name: 'Chủ quán chăm chỉ' },
    { id: 'bx_b_trada',   r: 1, kind: 'badge', icon: 'drk_trada', name: 'Fan cứng trà đá' },
    { id: 'bx_b_cay',     r: 1, kind: 'badge', icon: 'pot_chuacay', name: 'Thánh ăn cay' },
    { id: 'bx_b_bep',     r: 2, kind: 'badge', icon: 'role_daubep', name: 'Bếp trưởng vàng' },
    { id: 'bx_b_ship',    r: 2, kind: 'badge', icon: 'eq_truck', name: 'Ông hoàng ship' },
    { id: 'bx_b_thantai', r: 2, kind: 'badge', icon: 'ui_coin', name: 'Thần tài gõ cửa' },
    { id: 'bx_b_den',     r: 2, kind: 'badge', icon: 'ui_shop', name: 'Quán quen của phố' },
    { id: 'bx_b_vua',     r: 3, kind: 'badge', icon: 'ui_trophy', name: 'Vua lẩu Sài Gòn' },
    { id: 'bx_b_dinh',    r: 3, kind: 'badge', icon: 'ui_fire', name: 'Lẩu đỉnh nóc' },
    { id: 'bx_b_rong',    r: 4, kind: 'badge', icon: 'pot_dacbiet', name: 'Rồng vàng' },
    { id: 'bx_b_huyen',   r: 4, kind: 'badge', icon: 'ui_heart', name: 'Huyền thoại Lẩu Ơi' },
    // v1.18f thêm 11 thẻ: 4 Thường, 3 Hiếm, 2 Cực hiếm, 2 Bí ẩn (SSR)
    { id: 'bx_b_mua',     r: 1, kind: 'badge', icon: 'wx_rain',     name: 'Khách quen ngày mưa' },
    { id: 'bx_b_tratac',  r: 1, kind: 'badge', icon: 'drk_tratac',  name: 'Mê trà tắc' },
    { id: 'bx_b_cudem',   r: 1, kind: 'badge', icon: 'emo_zzz',     name: 'Cú đêm bán lẩu' },
    { id: 'bx_b_nam',     r: 1, kind: 'badge', icon: 'pot_nam',     name: 'Chuyên gia lẩu nấm' },
    { id: 'bx_b_haisan',  r: 2, kind: 'badge', icon: 'ing_muc',     name: 'Trùm hải sản' },
    { id: 'bx_b_veso',    r: 2, kind: 'badge', icon: 'ui_ticket',   name: 'Tay chơi vé số' },
    { id: 'bx_b_decor',   r: 2, kind: 'badge', icon: 'ui_deco',     name: 'Phù thủy trang trí' },
    { id: 'bx_b_bepluu',  r: 3, kind: 'badge', icon: 'eq_stove',    name: 'Bếp lửa không tắt' },
    { id: 'bx_b_daigia',  r: 3, kind: 'badge', icon: 'emo_money',   name: 'Đại gia phố lẩu' },
    { id: 'bx_b_mattroi', r: 4, kind: 'badge', icon: 'wx_sun',      name: 'Mặt trời phố lẩu' },
    { id: 'bx_b_kholau',  r: 4, kind: 'badge', icon: 'ui_chest_gold', name: 'Kho báu Lẩu Ơi' },
  ],
};
// v1.18 kiểu NỒI LẨU / BÀN LẨU độc quyền Hộp mù: đổi màu lúc vẽ (art/scenes.js tô lại phần inox của nồi, phần gỗ của bàn ghế).
// h = màu (độ), s = độ đậm, v = độ sáng (× sáng gốc). Đeo trong Hộp mù, áp dụng cho mọi bàn và bếp.
export const POT_SKINS = {
  inoxden:  { name: 'Nồi lẩu inox đen',      h: 230, s: 0.08, v: 0.5 },
  datnung:  { name: 'Nồi lẩu đất nung',      h: 16,  s: 0.55, v: 0.85 },
  mentrang: { name: 'Nồi lẩu men trắng',     h: 40,  s: 0.04, v: 1.3 },
  dong:     { name: 'Nồi lẩu đồng cổ điển',  h: 28,  s: 0.62, v: 1.05 },
  gomxanh:  { name: 'Nồi lẩu gốm hoa văn xanh', h: 214, s: 0.5, v: 1.05, dots: '#ffffff' },
  menngoc:  { name: 'Nồi lẩu men ngọc',      h: 160, s: 0.35, v: 1.1 },
  hoanggia: { name: 'Nồi Lẩu Hoàng Gia',     h: 46,  s: 0.8, v: 1.2, dots: '#fff6c8' },
};
// v1.18h: màu GHẾ tách riêng khỏi màu BÀN (owner: "chỉ mới có màu ghế, tạo thêm cả màu bàn")
export const CHAIR_SKINS = {
  gosang:   { name: 'Ghế gỗ sáng',          h: 36,  s: 0.42, v: 1.22 },
  trang:    { name: 'Ghế nhựa trắng',       h: 35,  s: 0.05, v: 1.45 },
  xanhla:   { name: 'Ghế nhựa xanh lá',     h: 110, s: 0.6,  v: 1.0 },
  xanhduong: { name: 'Ghế nhựa xanh dương', h: 212, s: 0.65, v: 1.0 },
  hong:     { name: 'Ghế hồng pastel',      h: 340, s: 0.38, v: 1.25 },
  occho:    { name: 'Ghế gỗ óc chó',        h: 20,  s: 0.5,  v: 0.62 },
  vang:     { name: 'Ghế Rồng Vàng',        h: 46,  s: 0.85, v: 1.15 },
};
// v1.18i DÁNG bàn / ghế (vẽ riêng, art: tshape_* / cshape_*) — dùng chung được với màu bàn / màu ghế
export const TABLE_SHAPES = {
  tron:  { name: 'Bàn gỗ khảm xà cừ' },   // v1.18j vẽ lại từ bàn gỗ chạm
  tre:   { name: 'Bàn tre' },
  kinh:  { name: 'Bàn mặt kính chân sắt' },
  bepam: { name: 'Bàn lẩu bếp âm' },
};
export const CHAIR_SHAPES = {
  tre:    { name: 'Ghế đẩu tre' },
  dem:    { name: 'Ghế có đệm' },
  tua:    { name: 'Ghế tựa lưng' },
  tuadem: { name: 'Ghế tựa lưng có đệm' },
  banh:   { name: 'Đôn sứ Bát Tràng' },   // v1.18j thay ghế bành
};
export const TABLE_SKINS = {
  gosang:   { name: 'Bàn lẩu gỗ sáng',      h: 36,  s: 0.42, v: 1.22 },
  mattrang: { name: 'Bàn lẩu mặt trắng',    h: 35,  s: 0.06, v: 1.45 },
  matda:    { name: 'Bàn lẩu mặt đá',       h: 210, s: 0.07, v: 1.0 },
  occho:    { name: 'Bàn lẩu gỗ óc chó',    h: 20,  s: 0.5, v: 0.62 },
  ngurthien: { name: 'Bàn Lẩu Ngự Thiện',   h: 2,   s: 0.78, v: 0.85 },
};
for (const it of BOX.items) if (!it.set) it.set = 'hop';
export const BOX_ITEM = Object.fromEntries(BOX.items.map((x) => [x.id, x]));
export const boxSet = (id) => Object.assign({ price: BOX.price, price10: BOX.price10, pityRare: BOX.pityRare, pityEpic: BOX.pityEpic, pityMyst: BOX.pityMyst }, BOX.sets[id] || BOX.sets.hop);
export const boxHas = (s, id) => !!(s && s.box && s.box.got && s.box.got[id] > 0);
/** Món / màu / kiểu đã mở: tới cấp HOẶC (món độc quyền) đã có trong Hộp mù. */
export const lvOk = (s, it, lvKey = 'unlockLv') => !!it && (((s && s.level) || 1) >= (it[lvKey] || 1) || (!!it.box && boxHas(s, it.box)));
/** thẻ thành tích đang đeo (leaderboard): id → {icon, name} */
export const badgeOf = (id) => { const b = BOX_ITEM[id]; return b && b.kind === 'badge' ? b : null; };
