// Characters (TECH_SPEC §2.2, ART_PIPELINE.md): sprite-sheet based people. Every character is one 4×4 pose sheet
// (idle/walk/cheer, side, back, act, carry, sit ×3, angry) sliced to 2× detail sprites by tools/art/build.py and
// packed into assets/chars.png (frame table: src/art/data/chars.js, keys "<sheet>/<pose>", "carry/<item>").
// Look = plain JSON {kind, sheet, ...} (staff looks are saved in the game state). Never throws; unknown ids → idle.
import { loadAtlas, blit, DETAIL } from './assets.js';
import CHARS from './data/chars.js';
import { SIT_LIFT } from './layouts.js';

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

const OWNER_SHEETS = ['owner0', 'owner1', 'owner2', 'owner3'];
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
  doandulich: ['cust_doandulich_leader', 'cust_doandulich_member'],           // member 0 = flag leader, others = caps
  shipper: ['cust_shipper'],
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
  else if (kind === 'capdoi') pick = memberIdx & 1;
  else if (kind === 'doandulich') pick = memberIdx === 0 ? 0 : 1;
  else if (kind === 'hoiban') pick = (h + memberIdx) & 1;
  else pick = h % list.length;
  const look = { kind, sheet: firstExisting(list, pick), seed, memberIdx };
  if (kind === 'giadinh' && memberIdx >= 2) look.kid = true;
  return look;
}

export function makeOwnerLook(avatar = 0, tier = 1) {
  const a = ((avatar | 0) % 4 + 4) % 4;
  return { kind: 'owner', sheet: firstExisting([OWNER_SHEETS[a]]), avatar: a, tier: tier | 0 };
}

export function makeStaffLook(role, seed = 1) {
  const r = STAFF_SHEETS[role] ? role : 'phucvu';
  seed = (seed | 0) || 1;
  const h = hash(seed * 17 + r.length);
  return { kind: r, role: r, sheet: firstExisting(STAFF_SHEETS[r], h & 1), seed };
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
    const key = sheet + '@' + scale;
    let url = urlCache.get(key);
    if (url) return url;
    const f = (SPR[sheet] || {}).idle_d;
    if (!f) return BLANK;
    const base = document.createElement('canvas');
    base.width = base.height = 32;
    const bg = base.getContext('2d');
    bg.imageSmoothingEnabled = false;
    // centre the head on the crop; take the top 32 rows (hair/hat, face, shoulders)
    bg.drawImage(rec.img, f[0], f[1], f[2], f[3], 16 - f[4], 1, f[2], f[3]);
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
