// v1.7 Dời quán: per-city scenery painted onto the scene background composite (art/scenes.js bgFor).
// The shop itself (the painted art rect) is left untouched; the neighbour wings, the sky above and the road
// continuation get a colour grade, and the pavement in front of the wings gets city props drawn in code
// (pixel shapes in sprite px, 2 px per world px) plus a road sign with the city's name.
// Everything here is pure canvas drawing, no new image assets.

export const CITY_THEMES = {
  saigon: null,   // home city: the original painted scene
  dalat: {
    sign: 'ĐÀ LẠT', grade: '#5f93b0', gradeA: 0.55, haze: 'rgba(236,244,248,0.20)',
    items: ['pine', 'pine', 'flowers', 'pine'],
  },
  vungtau: {
    sign: 'VŨNG TÀU', grade: '#4fc2dc', gradeA: 0.45,
    items: ['palm', 'umbrella', 'palm', 'palm'],
  },
  cantho: {
    sign: 'CẦN THƠ', grade: '#7fb35a', gradeA: 0.5,
    items: ['coconut', 'fruit', 'coconut', 'banana'],
  },
  danang: {
    sign: 'ĐÀ NẴNG', grade: '#4f86d8', gradeA: 0.45,
    items: ['palm', 'lanternY', 'palm', 'lanternY'],
  },
  hanoi: {
    sign: 'HÀ NỘI', grade: '#c08850', gradeA: 0.5,
    items: ['milkwood', 'lanternR', 'milkwood', 'milkwood'],
  },
  hue: {
    sign: 'HUẾ', grade: '#9a72cc', gradeA: 0.55,
    items: ['lanternP', 'round', 'lanternP', 'round'],
  },
  nhatrang: {
    sign: 'NHA TRANG', grade: '#33c4c4', gradeA: 0.45,
    items: ['palm', 'umbrella', 'coconut', 'umbrella'],
  },
  phuquoc: {
    sign: 'PHÚ QUỐC', grade: '#f0a050', gradeA: 0.5, haze: 'rgba(255,190,120,0.12)',
    items: ['coconut', 'umbrella', 'coconut', 'coconut'],
  },
};

export const cityTheme = (id) => (id && CITY_THEMES[id]) || null;

// ── tiny pixel helpers (sprite px) ──
function rect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function disc(g, cx, cy, r, c) {
  g.fillStyle = c;
  for (let dy = -r; dy <= r; dy++) {
    const hw = Math.floor(Math.sqrt(r * r - dy * dy));
    g.fillRect(Math.round(cx - hw), Math.round(cy + dy), hw * 2 + 1, 1);
  }
}
function tri(g, cx, top, w, h, c) {   // isoceles triangle pointing up, base at top+h
  g.fillStyle = c;
  for (let i = 0; i < h; i++) { const hw = Math.round((w / 2) * (i + 1) / h); g.fillRect(cx - hw, top + i, hw * 2, 1); }
}
function shadow(g, x, y, w) { g.fillStyle = 'rgba(40,30,60,0.22)'; g.fillRect(Math.round(x - w / 2), Math.round(y), Math.round(w), 3); }

// Each item is drawn with its base (ground contact) at (x, y), sprite px.
const ITEMS = {
  pine(g, x, y) {
    shadow(g, x, y - 1, 26);
    rect(g, x - 2, y - 14, 5, 14, '#6b4a2f');
    const dark = '#2c5a45', mid = '#3d7656', hi = '#5d9a6e';
    tri(g, x, y - 58, 20, 18, dark); tri(g, x, y - 46, 28, 20, dark); tri(g, x, y - 32, 34, 20, dark);
    tri(g, x - 2, y - 56, 12, 14, mid); tri(g, x - 3, y - 44, 18, 16, mid); tri(g, x - 4, y - 30, 22, 16, mid);
    rect(g, x - 6, y - 40, 2, 2, hi); rect(g, x - 9, y - 24, 2, 2, hi); rect(g, x - 3, y - 52, 2, 2, hi);
  },
  palm(g, x, y, lean = 1) {
    shadow(g, x, y - 1, 20);
    for (let i = 0; i < 16; i++) {   // ringed trunk, slightly curved
      const tx = x + Math.round(Math.sin(i / 16 * 1.6) * 6 * lean);
      rect(g, tx - 2, y - 4 - i * 4, 5, 4, i % 2 ? '#8d6b45' : '#7a5a39');
    }
    const top = { x: x + Math.round(Math.sin(1.6) * 6 * lean), y: y - 66 };
    const leaf = (dir, dy, len, c) => { for (let k = 0; k < len; k++) { const lx = top.x + dir * k * 2, ly = top.y + dy * k + Math.round((k * k) / (len * 0.9)); rect(g, lx - 1, ly, 4, 3, c); } };
    leaf(-1, -0.3, 11, '#3d8a4c'); leaf(1, -0.3, 11, '#3d8a4c'); leaf(-1, 0.4, 9, '#2f7442'); leaf(1, 0.4, 9, '#2f7442');
    leaf(-0.4, -0.9, 7, '#55a85e'); leaf(0.4, -0.9, 7, '#55a85e');
  },
  coconut(g, x, y) {
    ITEMS.palm(g, x, y, -1);
    const cx = x - Math.round(Math.sin(1.6) * 6);
    disc(g, cx - 3, y - 62, 2, '#6a4a22'); disc(g, cx + 2, y - 61, 2, '#7a5628'); disc(g, cx, y - 59, 2, '#5e4020');
  },
  banana(g, x, y) {
    shadow(g, x, y - 1, 22);
    rect(g, x - 3, y - 24, 6, 24, '#7b8a45');
    const leaf = (dir, ly, c) => { for (let k = 0; k < 9; k++) rect(g, x + dir * (2 + k * 2), ly - 4 + Math.round(k * k / 12), 3, 5 - Math.floor(k / 4), c); };
    leaf(-1, y - 26, '#4e9a3e'); leaf(1, y - 30, '#5aa848'); leaf(-1, y - 34, '#3f8a36'); leaf(1, y - 22, '#3f8a36');
    rect(g, x - 2, y - 40, 4, 12, '#5aa848');
  },
  round(g, x, y, flowers) {
    shadow(g, x, y - 1, 28);
    rect(g, x - 2, y - 26, 5, 26, '#6e5038');
    disc(g, x - 8, y - 34, 10, '#3f7d48'); disc(g, x + 8, y - 34, 10, '#3f7d48'); disc(g, x, y - 44, 12, '#4a8a50');
    disc(g, x - 4, y - 46, 6, '#6aa85e'); disc(g, x + 6, y - 38, 4, '#6aa85e');
    if (flowers) for (const [dx, dy] of [[-10, -36], [-3, -50], [6, -46], [11, -32], [0, -30], [-7, -42]]) rect(g, x + dx, y + dy, 2, 2, flowers);
  },
  milkwood(g, x, y) { ITEMS.round(g, x, y, '#f6f2d8'); },   // cây hoa sữa
  flowers(g, x, y) {   // Đà Lạt flower cart / bed
    shadow(g, x, y - 1, 30);
    rect(g, x - 14, y - 10, 28, 9, '#8a5a3a'); rect(g, x - 14, y - 10, 28, 2, '#a8744c');
    const cols = ['#e86a8a', '#f2c14e', '#b48ae0', '#f4f0f0', '#ef8f5a'];
    for (let i = 0; i < 9; i++) { rect(g, x - 12 + i * 3, y - 16 + (i % 2) * 2, 2, 6, '#4f8a4a'); disc(g, x - 11 + i * 3, y - 17 + (i % 2) * 2, 2, cols[i % cols.length]); }
  },
  fruit(g, x, y) {   // chợ nổi: thúng trái cây
    shadow(g, x, y - 1, 24);
    rect(g, x - 11, y - 8, 22, 8, '#b08a4a'); rect(g, x - 11, y - 8, 22, 1, '#d0aa66');
    for (const [dx, dy, c] of [[-7, -10, '#f2a33a'], [-2, -11, '#e05a3a'], [3, -10, '#9bc24a'], [8, -9, '#f2d04a'], [0, -14, '#7a3a8a']]) disc(g, x + dx, y + dy, 3, c);
  },
  umbrella(g, x, y) {
    shadow(g, x, y - 1, 30);
    rect(g, x - 1, y - 30, 2, 30, '#8a7a6a');
    const cols = ['#f05a5a', '#f4f0e8'];
    for (let i = 0; i < 9; i++) { const hw = Math.round(16 * Math.sqrt(1 - Math.pow((8 - i) / 9, 2))); rect(g, x - hw, y - 40 + i, hw * 2, 1, cols[0]); }
    for (let s = -12; s <= 12; s += 8) rect(g, x + s - 2, y - 36, 4, 5, cols[1]);
    rect(g, x - 2, y - 42, 4, 2, '#8a7a6a');
  },
  lantern(g, x, y, c) {   // pole with three hanging lanterns
    rect(g, x - 1, y - 46, 3, 46, '#4a3a3a'); rect(g, x - 14, y - 46, 28, 2, '#4a3a3a');
    for (const dx of [-11, 0, 11]) {
      rect(g, x + dx, y - 44, 1, 4, '#4a3a3a');
      rect(g, x + dx - 3, y - 40, 7, 2, '#d9a43a'); rect(g, x + dx - 4, y - 38, 9, 8, c); rect(g, x + dx - 3, y - 30, 7, 2, '#d9a43a');
      rect(g, x + dx - 2, y - 37, 2, 5, 'rgba(255,255,255,0.35)'); rect(g, x + dx, y - 28, 1, 3, '#d9a43a');
    }
  },
  lanternR(g, x, y) { ITEMS.lantern(g, x, y, '#d8423a'); },
  lanternY(g, x, y) { ITEMS.lantern(g, x, y, '#f2b23a'); },
  lanternP(g, x, y) { ITEMS.lantern(g, x, y, '#9a5ad0'); },
};

function roadSign(g, x, y, text) {
  g.save();
  g.font = 'bold 9px "Be Vietnam Pro", system-ui, sans-serif';
  const tw = Math.ceil(g.measureText(text).width);
  const w = tw + 10, h = 14, top = y - 44;
  rect(g, x - 1, top + h, 3, y - top - h, '#5a5f66');
  rect(g, x - w / 2 - 1, top - 1, w + 2, h + 2, '#f4f4ee');
  rect(g, x - w / 2, top, w, h, '#2f7a52');
  g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, x, top + h / 2 + 1);
  g.restore();
  shadow(g, x, y - 1, 10);
}

/**
 * Paint the city scenery onto a background composite.
 * g: composite ctx; box: { L, T, R, B, W, H } painted-art rect + canvas size (sprite px);
 * toPx(wx, wy): world → composite px; shopW: shop width (world); laneY: pavement line (world).
 */
export function paintCity(g, city, box, toPx, shopW, laneY) {
  const th = cityTheme(city);
  if (!th) return;
  const { L, T, R, W } = box;
  // 1) colour grade the neighbour buildings + sky (everything outside the shop's painted rect, above the fence line).
  //    The pavement / road stay as painted so they run on seamlessly under the shop; the grade fades out over FADE px.
  const cut = Math.round(toPx(0, laneY - 18)[1]), FADE = 24, STEPS = 8;
  const band = (fill, a) => {
    g.save(); g.globalCompositeOperation = fill.op || 'source-over'; g.fillStyle = fill.c;
    g.globalAlpha = a; g.fillRect(0, 0, L, cut); g.fillRect(R + 1, 0, W - R - 1, cut); g.fillRect(L, 0, R - L + 1, Math.min(T, cut));
    for (let i = 0; i < STEPS; i++) {
      const y = cut + Math.round(i * FADE / STEPS), h = Math.round(FADE / STEPS);
      g.globalAlpha = a * (1 - (i + 1) / (STEPS + 1));
      g.fillRect(0, y, L, h); g.fillRect(R + 1, y, W - R - 1, h);
    }
    g.restore();
  };
  band({ op: 'soft-light', c: th.grade }, th.gradeA);
  band({ op: 'soft-light', c: th.grade }, th.gradeA * 0.6);
  if (th.haze) band({ c: th.haze }, 1);
  // 2) props on the pavement in front of the neighbour wings + the city sign
  const base = (wx) => { const p = toPx(wx, laneY - 3); return [Math.round(p[0]), Math.round(p[1])]; };
  const left = [-14, -60, -104, -148], right = [shopW + 14, shopW + 58, shopW + 104, shopW + 148];
  th.items.forEach((k, i) => {
    const f = ITEMS[k]; if (!f) return;
    const a = base(left[i]); f(g, a[0], a[1]);
    const b = base(right[(i + 1) % right.length]); f(g, b[0], b[1]);
  });
  const s = base(-36); roadSign(g, s[0], s[1], th.sign);
}
