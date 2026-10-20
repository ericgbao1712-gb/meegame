// Characters (TECH_SPEC §2.2, ART_PIPELINE.md): sprite-sheet based people. Every character is one 4×4 pose sheet
// (idle/walk/cheer, side, back, act, carry, sit ×3, angry) sliced to 2× detail sprites by tools/art/build.py and
// packed into assets/chars.png (frame table: src/art/data/chars.js, keys "<sheet>/<pose>", "carry/<item>").
// Look = plain JSON {kind, sheet, ...} (staff looks are saved in the game state). Never throws; unknown ids → idle.
import { loadAtlas, blit, DETAIL } from './assets.js';
import CHARS from './data/chars.js';
import { SIT_LIFT } from './layouts.js';
import { UNIFORMS, UNIFORM_STYLES, OWNER_LOOKS } from '../config.js';

export const CHAR_W = 16, CHAR_H = 24;

const rec = loadAtlas(CHARS.file);
const FR = CHARS.frames;

// ───────────────────────── sheet tables ─────────────────────────
const POSES = ['idle_d', 'walk_d1', 'walk_d2', 'cheer_d', 'idle_r', 'walk_r1', 'walk_r2', 'act_r',
  'idle_u', 'walk_u1', 'walk_u2', 'carry_d', 'sit_d', 'sit_r', 'sit_u', 'angry_d'];

/** sheet name → { pose: frame } for the sheets that exist in the atlas. */
const SPR = Object.create(null);
for (const key of Object.keys(FR)) {
  const i = key.indexOf('/');
  const sheet = key.slice(0, i), pose = key.slice(i + 1);
  (SPR[sheet] || (SPR[sheet] = Object.create(null)))[pose] = FR[key];
}
const has = (sheet) => !!(SPR[sheet] && SPR[sheet].idle_d);

const OWNER_SHEETS = ['owner0', 'owner1', 'owner2', 'owner3'].concat(OWNER_LOOKS.map((o) => o.sheet));   // v1.5: + 8 drawn owners
const STAFF_SHEETS = {
  phucvu: ['staff_phucvu_f', 'staff_phucvu_m'],
  daubep: ['staff_daubep_f', 'staff_daubep_m'],
  thungan: ['staff_thungan'],
  quankho: ['staff_quankho'],
};
const KIND_SHEETS = {
  sinhvien: ['cust_sinhvien_m', 'cust_sinhvien_f'],
  vanphong: ['cust_vanphong_m', 'cust_vanphong_f'],
  giadinh: ['cust_giadinh_dad', 'cust_giadinh_mom', 'cust_giadinh_kid'],      // by memberIdx: dad, mom, kid(s)
  capdoi: ['cust_capdoi_m', 'cust_capdoi_f'],                                  // by memberIdx: him, her (long hair)
  hoiban: ['cust_hoiban_a', 'cust_hoiban_b'],                                  // matching club tees, alternate
  chutu: ['cust_chutu'],
  khachtay: ['cust_khachtay_m', 'cust_khachtay_f'],
  reviewer: ['cust_reviewer'],
  tiktoker: ['cust_tiktoker'],
  vip: ['cust_vip_f'],
  doandulich: ['cust_doandulich_leader', 'cust_doandulich_member'],           // member 0 = flag leader, others = caps
  shipper: ['cust_shipper'],
  khotinh: ['cust_khotinh'],                                                   // v1.5 khách mới (lau_refchars.py)
  ongba: ['cust_ong', 'cust_ba'],                                              // by memberIdx: ông, bà
  tangca: ['cust_tangca'],
  hannhat: ['cust_han', 'cust_nhat'],
  veso: ['cust_veso'],
  pedestrian: ['cust_ped_a', 'cust_ped_b'],
};

function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); return (n ^ (n >>> 15)) >>> 0; }

/** First sheet of `list` (starting at preferred index, wrapping) that exists in the atlas, else a generic fallback. */
function firstExisting(list, pref = 0) {
  for (let k = 0; k < list.length; k++) {
    const s = list[(pref + k) % list.length];
    if (has(s)) return s;
  }
  for (const s of OWNER_SHEETS.concat(['cust_ped_a', 'cust_ped_b'], Object.keys(SPR))) if (has(s)) return s;
  return list[0];
}

// ───────────────────────── looks ─────────────────────────
export function makeLook(kind, seed = 1, memberIdx = 0) {
  kind = KIND_SHEETS[kind] ? kind : 'pedestrian';
  seed = (seed | 0) || 1; memberIdx = memberIdx | 0;
  const list = KIND_SHEETS[kind];
  const h = hash(seed * 31 + 7 + (kind === 'hoiban' || kind === 'giadinh' ? 0 : memberIdx * 13));
  let pick;
  if (kind === 'giadinh') pick = Math.min(Math.max(memberIdx, 0), 2);
  else if (kind === 'capdoi' || kind === 'ongba') pick = memberIdx & 1;
  else if (kind === 'hannhat') pick = (h + memberIdx) & 1;
  else if (kind === 'doandulich') pick = memberIdx === 0 ? 0 : 1;
  else if (kind === 'hoiban') pick = (h + memberIdx) & 1;
  else pick = h % list.length;
  const look = { kind, sheet: firstExisting(list, pick), seed, memberIdx };
  if (kind === 'giadinh' && memberIdx >= 2) look.kid = true;
  return look;
}

// v1.5: avatars 0…3 are the original owners, 4…11 the new drawn owners (OWNER_LOOKS); old saves keep their index
export function makeOwnerLook(avatar = 0, tier = 1, uniform = 'do', style = 'tron') {
  const n = OWNER_SHEETS.length;
  const a = ((avatar | 0) % n + n) % n;
  return { kind: 'owner', sheet: firstExisting([OWNER_SHEETS[a], OWNER_SHEETS[0]]), avatar: a, tier: tier | 0, uniform, style };
}

export function makeStaffLook(role, seed = 1, uniform = 'do', style = 'tron') {
  const r = STAFF_SHEETS[role] ? role : 'phucvu';
  seed = (seed | 0) || 1;
  const h = hash(seed * 17 + r.length);
  return { kind: r, role: r, sheet: firstExisting(STAFF_SHEETS[r], h & 1), seed, uniform, style };
}

/** v1.3: full-body preview (idle_d) of a look with its uniform colour, as a data URL for the UI. */
export function lookPreviewURL(look, scale = 3) {
  try {
    if (!rec.img || typeof document === 'undefined') return BLANK;
    const sheet = sheetOf(look), f = (SPR[sheet] || {}).idle_d;
    if (!f) return BLANK;
    const key = 'pv:' + sheet + ':' + (look.uniform || 'do') + ':' + (look.style || '') + '@' + scale;
    let url = urlCache.get(key);
    if (url) return url;
    const src = (needsRecolor(look) && uniformCanvas(f, false, sheet + '/idle_d', look, sheet)) || null;
    const c = document.createElement('canvas');
    c.width = 40 * scale; c.height = 52 * scale;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    const dx = (40 - f[2]) / 2, dy = 52 - f[3];
    if (src) g.drawImage(src, 0, 0, f[2], f[3], dx * scale, dy * scale, f[2] * scale, f[3] * scale);
    else g.drawImage(rec.img, f[0], f[1], f[2], f[3], dx * scale, dy * scale, f[2] * scale, f[3] * scale);
    url = c.toDataURL();
    urlCache.set(key, url);
    return url;
  } catch (e) { return BLANK; }
}

const sheetCache = new WeakMap();
/** Sheet name for any look-like object (also repairs looks saved without a sheet, e.g. {lookSeed}). */
function sheetOf(look) {
  if (!look || typeof look !== 'object') return firstExisting(KIND_SHEETS.pedestrian);
  if (look.sheet && has(look.sheet)) return look.sheet;
  let s = sheetCache.get(look);
  if (s) return s;
  const seed = look.seed ?? look.lookSeed ?? 1;
  if (look.kind === 'owner') s = makeOwnerLook(look.avatar | 0, look.tier | 0).sheet;
  else if (STAFF_SHEETS[look.kind]) s = makeStaffLook(look.kind, seed).sheet;
  else if (KIND_SHEETS[look.kind]) s = makeLook(look.kind, seed, look.memberIdx | 0).sheet;
  else s = makeStaffLook('phucvu', seed).sheet;          // kind-less record such as {lookSeed}: treat as a waiter
  sheetCache.set(look, s);
  return s;
}

// ───────────────────────── drawing ─────────────────────────
const SHADOW = 'rgba(42,27,45,0.24)';
const ITEM_NAMES = { pot: 1, tray: 1, drinks: 1, coins: 1, box: 1, notebook: 1 };
// carried item centre relative to the feet anchor (world px): [dx (× facing sign), dy]
const ITEM_AT = { down: [0, -4.5], side: [4, -5.5], up: [0, -8] };

let flashCache = null;   // key → tinted canvas (created lazily: art modules never touch the DOM at import)
function tinted(f, flip, key) {
  if (!flashCache) flashCache = new Map();
  const k = key + (flip ? '<' : '>');
  let c = flashCache.get(k);
  if (c) return c;
  if (typeof document === 'undefined' || !rec.img) return null;
  c = document.createElement('canvas');
  c.width = f[2]; c.height = f[3];
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  if (flip) { g.translate(c.width, 0); g.scale(-1, 1); }
  g.drawImage(rec.img, f[0], f[1], f[2], f[3], 0, 0, f[2], f[3]);
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = 'rgba(226,67,59,0.34)';
  g.fillRect(0, 0, c.width, c.height);
  flashCache.set(k, c);
  return c;
}

// ───────────────────────── v1.3 uniform recolour ─────────────────────────
// Torso rows only (so blush, lips and hair stay), saturated reds (aprons, neckerchief) and, for the storekeeper,
// the orange vest. Each (sheet, pose, flip, colour) is recoloured once into its own small canvas.
const UNI = Object.fromEntries(UNIFORMS.map((u) => [u.id, u]));
const uniCache = new Map();
function rgb2hsv(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  return [h, mx ? d / mx : 0, mx / 255];
}
function hsv2rgb(h, s, v) {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
const PAT = Object.fromEntries(UNIFORM_STYLES.map((u) => [u.id, u]));
/** Does a look need the recolour pass at all? (default red, plain, own hair → draw the atlas frame directly) */
const needsRecolor = (look) => !!look && ((look.uniform && look.uniform !== 'do') || (look.style && look.style !== 'tron'));
/** spec: { uniform, style } */
function uniformCanvas(f, flip, key, look, sheet) {
  const u = UNI[look.uniform] || UNI.do, pat = PAT[look.style] || PAT.tron;
  if (typeof document === 'undefined' || !rec.img) return null;
  const k = key + (flip ? '<' : '>') + u.id + ':' + pat.id;
  let c = uniCache.get(k);
  if (c !== undefined) return c;
  c = document.createElement('canvas');
  c.width = f[2]; c.height = f[3];
  const g = c.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingEnabled = false;
  if (flip) { g.translate(c.width, 0); g.scale(-1, 1); }
  g.drawImage(rec.img, f[0], f[1], f[2], f[3], 0, 0, f[2], f[3]);
  g.setTransform(1, 0, 0, 1, 0, 0);
  try {
    const id = g.getImageData(0, 0, c.width, c.height), d = id.data, W = c.width, H = c.height;
    const vest = sheet === 'staff_quankho', chef = sheet.startsWith('staff_daubep');
    const UH = u.h ?? 4, USK = u.h == null ? 1 : (u.sk ?? 1), UVK = u.h == null ? 1 : (u.vk ?? 1);
    const recolorOn = u.h != null;
    // hats: the storekeeper's green cap and the chef's white toque take the uniform colour too
    const hatEnd = Math.ceil(H * (chef ? 0.30 : 0.26));
    for (let y = 0; y < hatEnd && recolorOn && (vest || chef); y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (d[i + 3] < 8) continue;
      const [hh, ss, vv] = rgb2hsv(d[i], d[i + 1], d[i + 2]);
      let out = null;
      if (vest && hh >= 55 && hh <= 170 && ss > 0.25 && vv > 0.2) out = hsv2rgb(UH, Math.min(1, ss * USK), Math.min(1, vv * UVK));
      else if (chef && ss < 0.16 && vv > 0.62) out = hsv2rgb(UH, Math.min(1, 0.42 * USK), Math.min(1, vv * Math.min(1, UVK + 0.1)));
      if (!out) continue;
      d[i] = out[0]; d[i + 1] = out[1]; d[i + 2] = out[2];
    }
    // apron / neckerchief / vest: colour, then the pattern (sọc, chấm bi, caro, viền) in the apron's own pixels
    const r0 = Math.floor(H * (chef ? 0.46 : 0.55)), r1 = Math.ceil(H * 0.90);   // below the chin: chibi heads reach ~half the frame
    const mask = new Uint8Array(W * H);
    for (let y = r0; y < r1; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (d[i + 3] < 8) continue;
      const [hh, ss, vv] = rgb2hsv(d[i], d[i + 1], d[i + 2]);
      const red = (hh >= 340 || hh <= 16) && ss > 0.42 && vv > 0.42;   // > 0.42: leave the dark-brown outline alone
      const orange = vest && hh > 16 && hh <= 48 && ss > 0.55 && vv > 0.45;
      if (!red && !orange) continue;
      mask[y * W + x] = 1;
      if (!recolorOn) continue;
      const [r, gg, b] = hsv2rgb(UH, Math.min(1, ss * USK), Math.min(1, vv * UVK));
      d[i] = r; d[i + 1] = gg; d[i + 2] = b;
    }
    if (pat.id !== 'tron') {
      const light = hsv2rgb(UH, Math.min(1, 0.22 * USK), Math.min(1, 0.97)), dark = hsv2rgb(UH, Math.min(1, 0.85 * USK), Math.min(1, 0.42 * UVK + 0.05));
      const M = (x, y) => x >= 0 && y >= 0 && x < W && y < H && mask[y * W + x];
      for (let y = r0; y < r1; y++) for (let x = 0; x < W; x++) {
        if (!mask[y * W + x]) continue;
        let o = null;
        if (pat.id === 'soc' && x % 4 === 0) o = light;
        else if (pat.id === 'cham' && (x + (y >> 2) * 2) % 4 === 1 && y % 4 === 1) o = light;
        else if (pat.id === 'caro') { const a = x % 6 < 2, b2 = y % 6 < 2; if (a && b2) o = dark; else if (a || b2) o = light; }
        else if (pat.id === 'vien' && (!M(x - 1, y) || !M(x + 1, y) || !M(x, y + 1))) o = light;
        else if (pat.id === 'tui' && y > (r0 + r1) / 2 && y < r1 - 3 && x % 5 === 0) o = dark;
        if (!o) continue;
        const i = (y * W + x) * 4; d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2];
      }
    }
    g.putImageData(id, 0, 0);
  } catch (e) { c = null; }
  uniCache.set(k, c);
  return c;
}

function drawTinted(ctx, c, f, x, y, flip) {
  const [, , fw, fh, ax, ay] = f;
  const px = Math.round(x * DETAIL), py = Math.round(y * DETAIL);
  ctx.drawImage(c, 0, 0, fw, fh, (px - (flip ? fw - ax : ax)) / DETAIL, (py - ay) / DETAIL, fw / DETAIL, fh / DETAIL);
}

function shadow(ctx, x, y, kid) {
  const w = kid ? 9 : 11;                       // world px; drawn in half-pixel rows so it reads as a flat ellipse
  ctx.fillStyle = SHADOW;
  ctx.fillRect(x - w / 2 + 1.5, y - 0.5, w - 3, 0.5);
  ctx.fillRect(x - w / 2, y, w, 0.5);
  ctx.fillRect(x - w / 2 + 1.5, y + 0.5, w - 3, 0.5);
}

function placeholder(ctx, x, y) {
  ctx.fillStyle = '#ff00ff';
  ctx.fillRect(Math.round(x) - 1, Math.round(y) - 12, 2, 2);
}

const q = (v) => Math.round(v * DETAIL) / DETAIL;       // snap to the 2× buffer grid

export function drawChar(ctx, look, x, y, opts) {
  try { draw(ctx, look, x, y, opts || {}); } catch (e) { /* art must never throw */ }
}

function draw(ctx, look, x, y, o) {
  if (!rec.img) return;                                  // atlas still loading: draw nothing
  const sheet = sheetOf(look), spr = SPR[sheet];
  if (!spr) { placeholder(ctx, x, y); return; }
  const pose = o.pose || 'idle', facing = o.facing || 'down', t = +o.t || 0;
  const alpha = o.alpha == null ? 1 : o.alpha;
  let carry = o.carry && ITEM_NAMES[o.carry] ? o.carry : null;
  const side = facing === 'left' || facing === 'right';
  const dir = facing === 'up' ? 'u' : side ? 'r' : 'd';
  let flip = facing === 'left';
  let name = 'idle_' + dir, dx = 0, dy = 0;
  let standing = true, flash = false;

  switch (pose) {
    case 'walk': {
      const step = Math.floor(t * 8) % 4;
      name = step % 2 === 0 ? `walk_${dir}${step === 0 ? 1 : 2}` : 'idle_' + dir;
      break;
    }
    case 'sit': case 'eat': {
      name = 'sit_' + dir; standing = false; carry = null;
      dy = -SIT_LIFT;                                                   // perched on the stool, not on the ground
      if (pose === 'eat' && Math.floor(t / 0.25) % 2) dy -= 0.5;       // chopstick bob
      break;
    }
    case 'cook': name = 'act_r'; flip = facing === 'left'; carry = null; dx = (Math.floor(t * 6) % 2) * 0.5; break;
    case 'cheer': name = 'cheer_d'; flip = false; carry = null; dy = -q(Math.abs(Math.sin(t * 9)) * 2); break;
    case 'angry': {
      name = 'angry_d'; flip = false; carry = null;
      dx = (Math.floor(t * 16) % 2 ? 0.5 : -0.5);                        // ±1 buffer px shake
      flash = Math.floor(t * 8) % 2 === 0;
      break;
    }
    case 'write': name = 'carry_d'; flip = false; if (!carry) carry = 'notebook'; break;
    default: // idle (and unknown poses)
      if (Math.floor(t / 0.7) % 2) dy = 0.5;                             // breathing, 1 buffer px
  }
  // carrying while facing the camera: arms-at-chest pose, with a small step bob when walking
  if (carry && facing === 'down' && (pose === 'idle' || pose === 'walk' || pose === 'write') && spr.carry_d) {
    name = 'carry_d';
    if (pose === 'walk' && Math.floor(t * 8) % 2) dy = -0.5;
  }
  const f = spr[name] || spr.idle_d;
  if (!f) { placeholder(ctx, x, y); return; }
  const kid = !!(look && look.kid);
  const bx = x + dx, by = y + dy;

  if (alpha !== 1) ctx.globalAlpha = alpha;
  if (standing) shadow(ctx, x, y, kid);
  const it = carry ? FR['carry/' + carry] : null;
  const sg = side ? (flip ? -1 : 1) : 1;
  const ip = facing === 'up' ? ITEM_AT.up : side ? ITEM_AT.side : ITEM_AT.down;
  const ix = bx + ip[0] * sg, iy = by + ip[1];
  if (it && facing === 'up') blit(ctx, rec, it, ix, iy + 1.5, false, 1);
  let drawn = false;
  if (flash) {
    const c = tinted(f, flip, sheet + '/' + (spr[name] ? name : 'idle_d'));
    if (c) { drawTinted(ctx, c, f, bx, by, flip); drawn = true; }
  }
  if (!drawn && needsRecolor(look)) {
    const c = uniformCanvas(f, flip, sheet + '/' + (spr[name] ? name : 'idle_d'), look, sheet);
    if (c) { drawTinted(ctx, c, f, bx, by, flip); drawn = true; }
  }
  if (!drawn) blit(ctx, rec, f, bx, by, flip, 1);
  if (it && facing !== 'up') blit(ctx, rec, it, ix, iy, false, 1);
  if (alpha !== 1) ctx.globalAlpha = 1;
}

// ───────────────────────── portraits ─────────────────────────
const urlCache = new Map();
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/** Head-and-shoulders crop (32×32 sprite px = 16×16 world px) of idle_d, scaled to 16×scale px. Cached. */
export function portraitURL(look, scale = 4) {
  try {
    if (!rec.img || typeof document === 'undefined') return BLANK;      // not cached: art not loaded yet
    const sheet = sheetOf(look);
    const key = sheet + (needsRecolor(look) ? ':' + (look.uniform || '') + ':' + (look.style || '') : '') + '@' + scale;
    let url = urlCache.get(key);
    if (url) return url;
    const f = (SPR[sheet] || {}).idle_d;
    if (!f) return BLANK;
    const base = document.createElement('canvas');
    base.width = base.height = 32;
    const bg = base.getContext('2d');
    bg.imageSmoothingEnabled = false;
    // centre the head on the crop; take the top 32 rows (hair/hat, face, shoulders)
    const rc = needsRecolor(look) ? uniformCanvas(f, false, sheet + '/idle_d', look, sheet) : null;   // v1.3 hair / uniform
    if (rc) bg.drawImage(rc, 0, 0, f[2], f[3], 16 - f[4], 1, f[2], f[3]);
    else bg.drawImage(rec.img, f[0], f[1], f[2], f[3], 16 - f[4], 1, f[2], f[3]);
    const size = Math.max(16, Math.round(16 * scale));
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(base, 0, 0, 32, 32, 0, 0, size, size);
    url = c.toDataURL();
    urlCache.set(key, url);
    return url;
  } catch (e) { return BLANK; }
}
