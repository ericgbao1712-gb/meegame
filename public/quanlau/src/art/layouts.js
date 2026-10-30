// Scene layouts per tier — PURE DATA, no DOM (the headless balance sim imports this).
// Owned by the scene artist (Art-B). Initial version by the designer; Art-B may move any
// coordinate to match the art, but must keep the schema and the counts (tables = TIERS.maxTables,
// stoves = TIERS.maxStoves, waitSpots ≥ TIERS.waitSpots).
//
// Coordinates: world pixels, origin = top-left of the scene core (w × h). Characters are anchored
// at their FEET (bottom-centre). Every drawable is y-sorted by its `y` (or `sortY` when given).
//
// Schema (see TECH_SPEC.md §Layout):
// {
//   scene, w, h,
//   lane: { y },                         // pedestrians walk along this line, off-screen to on-screen
//   aisles: [x…],                        // vertical walkways between table columns (routing, see TECH_SPEC §Routing)
//   serviceY: y,                         // horizontal walkway between kitchen and dining area (per floor: serviceY2 on floor 2)
//   spawn: [{x,y}],                      // off-screen entry/exit points (left, right)
//   waitSpots: [{x,y,facing}],           // groups waiting for a free table (door queue)
//   tables: [{x,y,floor, seats:[{x,y,facing}]×4 }],  // tabletop centre; seat order = fill order
//   kitchen: { stoves:[{x,y,sortY}], chefSpots:[{x,y,facing}], pickup:{x,y}, ownerHome:{x,y} },
//   staffSpots: { waiter:[{x,y}], cashier:{x,y}|null, quankho:{x,y}|null, manager:{x,y} },
//   props: [{id,x,y}],                   // static y-sorted props art draws via drawProp(id,…)
//   deco: { den:[…], cay:[…], tuong:[…], dacbiet:[…] },  // where equipped deco is drawn
//   equip: { cooler, cooling, speaker, pos, tarp },       // where upgrade props are drawn
//   sign: {x,y,w,h},                     // shop-name text box (overlay text drawn by renderer)
//   street: { y } | null,                // vehicles drive along this y
//   floors: [{id,y0,y1}], stairs: {bottom:{x,y}, top:{x,y}} | null
// }

// Stools stand at these spots; a seated guest is drawn SIT_LIFT px higher so they sit ON the stool (feet off the ground).
export const SEAT = [
  { dx: -16, dy: 3, facing: 'right' }, // left of table, looking right
  { dx: 16, dy: 3, facing: 'left' },   // right of table
  { dx: 0, dy: -8, facing: 'down' },   // behind the table, faces the camera
  { dx: 0, dy: 13, facing: 'up' },     // in front, back to the camera
];
export const SIT_LIFT = 3.5;
// v1.18q độ cao mặt ghế (world px) → khách ngồi đúng lên mặt ghế, không lún hay lơ lửng
//   đẩu gốc theo kiểu bàn (tablestyle 0..4), dáng ghế Hộp mù theo id (C.CHAIR_SHAPES)
export const SIT_BY_STYLE = [2.5, 3.5, 3.5, 4.5, 4.5];
export const SIT_BY_FORM = { tre: 1.5, dem: 2.5, tua: 1.5, tuadem: 2.5, banh: 4.5 };
export const sitLiftFor = (tablestyle, cform) => SIT_BY_FORM[cform] ?? SIT_BY_STYLE[Math.max(0, Math.min(4, tablestyle | 0))];
const table = (x, y, floor = 1) => ({ x, y, floor, seats: SEAT.map((s) => ({ x: x + s.dx, y: y + s.dy, facing: s.facing })) });

const LAYOUTS = {
  // ── Tier 1: quán lẩu vỉa hè ─────────────────────────────────────────
  // Art: scene PNG assets/scenes/vihe.png (see data/scenes.js). Kitchen counters stand in the shop doorway.
  vihe: {
    scene: 'vihe', w: 144, h: 168,
    lane: { y: 141 },
    aisles: [50, 95, 140], serviceY: 84,
    spawn: [{ x: -16, y: 141 }, { x: 160, y: 141 }],
    waitSpots: [{ x: 14, y: 116, facing: 'right' }, { x: 14, y: 132, facing: 'right' }],
    tables: [table(72, 96), table(118, 96), table(72, 126), table(118, 126)],
    canopy: { x0: 26, x1: 143, yTop: 26, yFront: 100, ground: 146 },   // rain tarp pulled out over the tables
    kitchen: {
      stoves: [{ x: 50, y: 62, sortY: 74.5 }, { x: 72, y: 62, sortY: 74.5 }],
      chefSpots: [{ x: 50, y: 60, facing: 'down' }, { x: 72, y: 60, facing: 'down' }],
      pickup: { x: 61, y: 82 },
      ownerHome: { x: 80, y: 84 },      // v1.5: in front of the counter (was behind it, hidden by the stoves)
    },
    staffSpots: { waiter: [{ x: 40, y: 88 }, { x: 40, y: 112 }], cashier: null, quankho: null, manager: { x: 96, y: 80 } },
    props: [{ id: 'vihe_counter', x: 61, y: 74 }],
    deco: { den: [{ x: 34, y: 22, w: 78 }], cay: [{ x: 126, y: 72 }], tuong: [{ x: 98, y: 32 }], dacbiet: [{ x: 28, y: 79 }] },   // v1.2: mèo thần tài no longer on top of the loa
    decoMore: { tuong: [{ x: 22, y: 36 }], floor: [{ x: 22, y: 92 }] },   // v1.18p chỗ đặt THÊM đồ trang trí (treo tường / đặt sàn)
    equip: { cooler: { x: 104, y: 76 }, cooling: { x: 134, y: 98 }, speaker: { x: 10, y: 70 }, pos: null, tarp: { x: 28, y: 20, w: 92 }, kho: { x: 92, y: 74 } },
    sign: { x: 32, y: 5, w: 82, h: 12 },
    street: { y: 160 },
    floors: [{ id: 1, y0: 0, y1: 168 }], stairs: null,
  },

  // ── Tier 2: quán lẩu trong hẻm ──────────────────────────────────────
  hem: {
    scene: 'hem', w: 176, h: 204,
    lane: { y: 196 },
    aisles: [64, 112, 162], serviceY: 91,
    spawn: [{ x: -16, y: 196 }, { x: 192, y: 196 }],
    waitSpots: [{ x: 154, y: 156, facing: 'left' }, { x: 154, y: 170, facing: 'left' }, { x: 138, y: 184, facing: 'up' }],
    tables: [table(88, 102), table(136, 102), table(40, 130), table(88, 130), table(136, 130), table(40, 158), table(88, 158)],
    canopy: { x0: 18, x1: 174, yTop: 36, yFront: 126, ground: 186 },   // v1.3: open courtyard → rain tarp like the vỉa hè
    kitchen: {
      stoves: [{ x: 34, y: 72, sortY: 84.5 }, { x: 56, y: 72, sortY: 84.5 }, { x: 78, y: 72, sortY: 84.5 }],
      chefSpots: [{ x: 34, y: 70, facing: 'down' }, { x: 56, y: 70, facing: 'down' }, { x: 78, y: 70, facing: 'down' }],
      pickup: { x: 56, y: 90 },
      ownerHome: { x: 40, y: 91 },      // v1.5: in front of the counter, easy to spot
    },
    staffSpots: { waiter: [{ x: 64, y: 91 }, { x: 112, y: 118 }, { x: 64, y: 146 }], cashier: { x: 156, y: 79 }, quankho: null, manager: { x: 112, y: 91 } },
    props: [{ id: 'hem_counter', x: 56, y: 84 }, { id: 'hem_cashier_desk', x: 156, y: 85 }],
    deco: { den: [{ x: 24, y: 27, w: 64 }], cay: [{ x: 10, y: 118 }], tuong: [{ x: 129, y: 40 }], dacbiet: [{ x: 168, y: 118 }] },
    decoMore: { tuong: [{ x: 44, y: 6 }, { x: 166, y: 44 }], floor: [{ x: 9, y: 150 }, { x: 170, y: 160 }] },
    // v1.2: tủ đông beside the kitchen (was standing in the dining floor), loa by the right window
    equip: { cooler: { x: 10, y: 92 }, cooling: { x: 166, y: 104 }, speaker: { x: 130, y: 80 }, pos: { x: 155, y: 79 }, tarp: null, kho: { x: 100, y: 84 } },
    sign: { x: 77, y: 6, w: 62, h: 16 },
    street: null,
    floors: [{ id: 1, y0: 0, y1: 204 }], stairs: null,
  },

  // ── Tier 3: nhà hàng lẩu mặt phố ────────────────────────────────────
  mapho: {
    scene: 'mapho', w: 192, h: 236,
    lane: { y: 196 },
    aisles: [53, 99, 145], serviceY: 92,
    spawn: [{ x: -16, y: 196 }, { x: 208, y: 196 }],
    waitSpots: [{ x: 92, y: 192, facing: 'up' }, { x: 106, y: 192, facing: 'up' }, { x: 120, y: 192, facing: 'up' }, { x: 78, y: 192, facing: 'up' }],
    tables: [table(76, 104), table(122, 104), table(168, 104), table(76, 135), table(122, 135), table(168, 135),
      table(30, 135), table(76, 166), table(122, 166), table(30, 104)],
    kitchen: {
      stoves: [{ x: 38, y: 68, sortY: 80.5 }, { x: 60, y: 68, sortY: 80.5 }, { x: 82, y: 68, sortY: 80.5 }, { x: 104, y: 68, sortY: 80.5 }],
      chefSpots: [{ x: 38, y: 66, facing: 'down' }, { x: 60, y: 66, facing: 'down' }, { x: 82, y: 66, facing: 'down' }, { x: 104, y: 66, facing: 'down' }],
      pickup: { x: 71, y: 90 },
      ownerHome: { x: 54, y: 92 },      // v1.5: in front of the counter, easy to spot
    },
    staffSpots: { waiter: [{ x: 140, y: 92 }, { x: 53, y: 120 }, { x: 99, y: 152 }, { x: 145, y: 152 }], cashier: { x: 160, y: 79 }, quankho: { x: 31, y: 89, facing: 'left' }, manager: { x: 150, y: 184 } },   // v1.3: quản kho beside the tủ đông, not inside it
    props: [{ id: 'mapho_counter', x: 71, y: 80 }, { id: 'mapho_cashier_desk', x: 160, y: 86 }],
    deco: { den: [{ x: 14, y: 31, w: 164 }], cay: [{ x: 184, y: 118 }, { x: 8, y: 158 }], tuong: [{ x: 148, y: 38 }], dacbiet: [{ x: 110, y: 84 }] },   // v1.2: off table 10
    decoMore: { tuong: [{ x: 8, y: 44 }, { x: 188, y: 44 }], floor: [{ x: 22, y: 192 }, { x: 156, y: 194 }] },
    equip: { cooler: { x: 134, y: 86 }, cooling: { x: 182, y: 150 }, speaker: { x: 186, y: 74 }, pos: { x: 160, y: 80 }, tarp: null, kho: { x: 14, y: 84 } },
    sign: { x: 20, y: 3, w: 152, h: 15 },
    gate: { x: 99, y: 172, yIn: 153 },   // v1.3: front fence opening spans x 55…138 → cross on the middle aisle
    street: { y: 222 },
    floors: [{ id: 1, y0: 0, y1: 236 }], stairs: null,
    // v1.1 khu mở rộng hai bên (upgrade 'canh'): per level one table on each side, in order L, R; wing waiter stands
    // by the painted tủ chén. view = how far the camera may pan once a wing is open.
    wing: { tables: [table(-26, 100), table(225, 100), table(-26, 138), table(225, 138)], aisles: [-6, 205], y: 70,
      waiters: [{ x: -44, y: 76 }, { x: 243, y: 76 }], view: [-70, 262] },
  },

  // ── Tier 4 (and 5): nhà hàng lẩu 2 tầng ─────────────────────────────
  haitang: {
    scene: 'haitang', w: 192, h: 360,
    lit: { y0: 14, y1: 300 },   // v1.23b buổi tối cả nhà hàng (cả dãy bên + phòng giải trí) sáng đèn, chỉ trời và phố tối
    lane: { y: 326 },
    aisles: [59, 105, 151], serviceY: 232, serviceY2: 72,
    spawn: [{ x: -16, y: 326 }, { x: 208, y: 326 }],
    waitSpots: [{ x: 94, y: 322, facing: 'up' }, { x: 108, y: 322, facing: 'up' }, { x: 122, y: 322, facing: 'up' }, { x: 136, y: 322, facing: 'up' }, { x: 150, y: 322, facing: 'up' }],
    tables: [
      // v1.23 bàn sát chân cầu thang (174,280) bị khuất + chật → dời lên lầu, góc phải trống cạnh chiếu nghỉ
      // v1.23b bỏ luôn bàn góc phải lầu cạnh cầu thang (dư, chật lối lên chiếu nghỉ)
      table(36, 250), table(82, 250), table(128, 250), table(36, 280), table(82, 280), table(128, 280),
      table(36, 88, 2), table(82, 88, 2), table(128, 88, 2), table(36, 116, 2), table(82, 116, 2), table(128, 116, 2),
    ],   // v1.24 bỏ bàn đơn hàng trước sát cổng (chắn lối vào, chật)
    kitchen: {
      stoves: [{ x: 36, y: 212, sortY: 224.5 }, { x: 58, y: 212, sortY: 224.5 }, { x: 80, y: 212, sortY: 224.5 }, { x: 102, y: 212, sortY: 224.5 }, { x: 124, y: 212, sortY: 224.5 }],
      chefSpots: [{ x: 36, y: 210, facing: 'down' }, { x: 58, y: 210, facing: 'down' }, { x: 80, y: 210, facing: 'down' }, { x: 102, y: 210, facing: 'down' }, { x: 124, y: 210, facing: 'down' }],
      pickup: { x: 80, y: 231 },
      ownerHome: { x: 58, y: 232 },     // v1.5: in front of the counter, easy to spot
    },
    staffSpots: {
      waiter: [{ x: 150, y: 234 }, { x: 59, y: 265 }, { x: 105, y: 265 }, { x: 59, y: 102 }, { x: 105, y: 102 }],
      cashier: { x: 68, y: 297 }, quankho: { x: 30, y: 231, facing: 'left' }, manager: { x: 140, y: 240 },   // v1.18r quầy vào trong cổng (trước nằm trên hàng rào)   // v1.7: quầy thu ngân ra góc trước bên trái (trước kẹt giữa các bàn ở lối cổng)
    },
    props: [{ id: 'haitang_counter', x: 80, y: 224 }, { id: 'haitang_cashier_desk', x: 68, y: 311 }, { id: 'haitang_balcony', x: 96, y: 148 }],
    deco: {
      den: [{ x: 16, y: 192, w: 140 }, { x: 24, y: 34, w: 140 }],
      cay: [{ x: 10, y: 262 }, { x: 22, y: 130 }],
      tuong: [{ x: 146, y: 198 }, { x: 70, y: 40 }],
      dacbiet: [{ x: 156, y: 228 }],   // v1.7: góc sau bên phải cạnh tủ, không còn chắn chân cầu thang (trước: 170,236)
    },
    decoMore: { tuong: [{ x: 24, y: 44 }, { x: 128, y: 44 }], floor: [{ x: 8, y: 104 }, { x: 104, y: 66 }] },   // v1.23 (158,104) nhường chỗ bàn mới
    equip: { cooler: { x: 152, y: 216 }, cooling: { x: 166, y: 134 }, speaker: { x: 154, y: 124 }, pos: { x: 68, y: 304 }, tarp: null, kho: { x: 14, y: 222 } },
    sign: { x: 28, y: 157, w: 136, h: 13 },
    gate: { x: 105, y: 312, yIn: 266 },  // v1.3: front fence opening spans x 57…135 → cross on the middle aisle
    street: { y: 346 },
    floors: [{ id: 2, y0: 0, y1: 160 }, { id: 1, y0: 160, y1: 360 }],
    // v1.3: the ground-floor stair climbs to y≈198 and comes out on the upper floor beside the balcony (160,148).
    // Before, the top point was the ROOF stair (178,70): people walked up the balcony rail and the roof steps.
    // While inside `hide` (behind the awning / facade band) the walker is not drawn.
    // v1.21b cầu thang một mạch từ nền trệt lên thẳng chiếu nghỉ lầu (cạnh cửa Karaoke); đoạn giữa chạy sau mặt tiền
    stairs: { bottom: { x: 177, y: 262 }, via: { x: 177, y: 140 }, top: { x: 177, y: 128 }, hide: { x0: 166, y0: 137, y1: 196 } },   // v1.21c khuất sau mặt tiền
    // v1.19: bên trái = dãy bàn 2 tầng (cấp 1 trệt, cấp 2 lầu); bên phải = phòng giải trí (art/scenes.js, fun)
    // v1.23 mỗi tầng dãy bên kê 2 hàng × 2 bàn (trước 1 hàng) cho đỡ trống, cách nhau như bàn trong quán; đèn treo trên từng cặp bàn
    wing: { perLevel: 4,
      tables: [table(-24, 250, 1), table(-68, 250, 1), table(-24, 280, 1), table(-68, 280, 1), table(-24, 88, 2), table(-68, 88, 2), table(-24, 116, 2), table(-68, 116, 2)],
      aisles: [-46], y: 234,
      waiters: [{ x: -46, y: 236 }, { x: -46, y: 74 }], view: [-104, 292], leftOnly: true,
      lamps: [{ x: -24, y: 200, lvl: 1 }, { x: -68, y: 200, lvl: 1 }, { x: -24, y: 34, lvl: 2 }, { x: -68, y: 34, lvl: 2 }],
      lights: [{ x: -24, y: 262, r: 34, lvl: 1 }, { x: -68, y: 262, r: 34, lvl: 1 }, { x: -24, y: 98, r: 32, lvl: 2 }, { x: -68, y: 98, r: 32, lvl: 2 }] },
    // v1.19 phòng giải trí bên phải: vùng trong phòng (world px) theo tầng, khách tham quan đứng / ngồi khi quán mở
    fun: {
      rooms: { 1: { x0: 202, x1: 304, y0: 186, y1: 295 }, 2: { x0: 202, x1: 304, y0: 16, y1: 136 } },   // v1.23 bắt đầu sau vách hông (đèn không lọt ra cửa)
      view: 312,
      // v1.20 khách mua vé: đi vỉa hè → cổng riêng → (cầu thang bên phải lên lầu) → chỗ chơi
      // v1.21 khách vào khu giải trí qua cổng quán → (cầu thang chung → chiếu nghỉ lầu) → cửa vòm hông cầu thang
      nav: { spawnR: 344, spawnL: -124, walkY: 326,
        door: { 1: { out: [182, 286], at: [195, 287], in: [207, 284], walk: 282 }, 2: { out: [184, 132], at: [195, 133], in: [207, 128], walk: 124 } }, },
      doors: [
        { floor: 2, x: 195, x0: 190.5, x1: 199.5, y0: 96, y1: 134, glow: '#b06cff', win: '#ff8ad8' },
        { floor: 1, x: 195, x0: 190.5, x1: 199.5, y0: 249, y1: 288, glow: '#ffc4dc', win: '#8ae6ff' },
      ],
      spots: {
        1: [{ x: 238, y: 232, pose: 'cheer', need: 'gt_phong' }, { x: 249, y: 232, pose: 'cheer', need: 'gt_phong' },
          { x: 244, y: 258, facing: 'up' }, { x: 288, y: 262, facing: 'up', need: 'gt_mayanh' }, { x: 226, y: 288, pose: 'cheer', need: 'gt_gapthu' },
          { x: 218, y: 262, facing: 'left' }, { x: 258, y: 276, facing: 'up' }, { x: 230, y: 250, facing: 'right' }],
        2: [{ x: 246, y: 72, pose: 'cheer', need: 'gt_sankhau' }, { x: 224, y: 110, pose: 'sit', need: 'gt_sofa', sortY: 113 }, { x: 240, y: 110, pose: 'sit', need: 'gt_sofa', sortY: 113 },
          { x: 262, y: 100, pose: 'cheer' }, { x: 276, y: 112, pose: 'cheer' }, { x: 256, y: 122, facing: 'up' }, { x: 270, y: 124, pose: 'sit', need: 'gt_gheluoi' },
          { x: 230, y: 90, facing: 'up' }],
      },
    },
  },
};

const SCENE_BY_TIER = { 1: 'vihe', 2: 'hem', 3: 'mapho', 4: 'haitang', 5: 'haitang' };

// Returns the layout for a tier. `tables`/`stoves` = how many are currently built;
// the returned arrays are sliced to those counts (order = build order).
export function getLayout(tier, { tables = Infinity, stoves = Infinity, wing = 0, fun = 0 } = {}) {
  const base = LAYOUTS[SCENE_BY_TIER[tier]];
  const W = base.wing && wing > 0 ? base.wing : null;
  const FN = base.fun && fun > 0 ? base.fun : null;   // v1.19
  let viewX = W ? W.view.slice() : null;
  if (W && W.leftOnly) viewX[1] = base.w + 4;
  if (FN) viewX = [viewX ? viewX[0] : -4, FN.view];
  return {
    ...base,
    // v1.1: wing tables come after every in-shop table (the wing is only sold once those are all built)
    tables: base.tables.slice(0, tables).concat(W ? W.tables.slice(0, wing * (W.perLevel || 2)) : []),
    wingLamps: W && W.lamps ? W.lamps.filter((l) => l.lvl <= wing) : null,      // v1.23
    wingLights: W && W.lights ? W.lights.filter((l) => l.lvl <= wing) : null,
    aisles: W ? base.aisles.concat(W.aisles) : base.aisles,
    wingY: W ? W.y : null,
    viewX,
    funLevel: base.fun ? fun : 0,
    staffSpots: W ? { ...base.staffSpots, waiter: base.staffSpots.waiter.concat(W.waiters) } : base.staffSpots,
    kitchen: {
      ...base.kitchen,
      stoves: base.kitchen.stoves.slice(0, stoves),
      chefSpots: base.kitchen.chefSpots.slice(0, Math.max(1, Math.min(stoves, base.kitchen.chefSpots.length))),
    },
  };
}

export function sceneForTier(tier) { return SCENE_BY_TIER[tier]; }
export const SCENES = Object.keys(LAYOUTS);
/** v1.7: shop width + pavement line of a scene (world px), for the city scenery painted around it. */
export function sceneGeom(id) { const L = LAYOUTS[id]; return L ? { w: L.w, laneY: L.lane.y } : null; }
