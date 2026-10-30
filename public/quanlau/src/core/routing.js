// Route building on the scene layouts (TECH_SPEC §6.10). Pure functions, no allocation beyond the returned path.

export function floorOf(L, y) {
  const fl = L.floors;
  if (!fl || fl.length < 2) return 1;
  for (let i = 0; i < fl.length; i++) if (y >= fl[i].y0 && y < fl[i].y1) return fl[i].id;
  return fl[fl.length - 1].id;
}

function serviceYFor(L, floor) { return floor === 2 && L.serviceY2 != null ? L.serviceY2 : L.serviceY; }

// aisle that minimises the total detour A.x → aisle → B.x (ties → closest to B)
function pickAisle(L, ax, bx) {
  let best = L.aisles[0], bc = Infinity;
  for (const x of L.aisles) {
    const c = Math.abs(ax - x) + Math.abs(bx - x) + Math.abs(bx - x) * 0.001;
    if (c < bc) { bc = c; best = x; }
  }
  return best;
}

function push(out, x, y) {
  const n = out.length;
  if (n) {
    const p = out[n - 1];
    if (Math.abs(p.x - x) < 0.5 && Math.abs(p.y - y) < 0.5) return;
    if (n >= 2) { // collapse collinear axis-aligned runs
      const q = out[n - 2];
      if ((Math.abs(q.x - p.x) < 0.5 && Math.abs(p.x - x) < 0.5) || (Math.abs(q.y - p.y) < 0.5 && Math.abs(p.y - y) < 0.5)) { p.x = x; p.y = y; return; }
    }
  }
  out.push({ x, y });
}

function sameFloor(L, a, b, floor, out) {
  const sy = serviceYFor(L, floor);
  let Y = a.y <= sy ? sy : a.y;
  // v1.1 khu mở rộng: going into / out of a wing, stay on the wing floor (its back wall sits below the service line)
  if (L.wingY != null && floor === 1 && (a.x < 0 || a.x > L.w || b.x < 0 || b.x > L.w)) Y = Math.max(Y, L.wingY);
  push(out, a.x, a.y);
  if (Math.abs(a.y - Y) > 0.5) push(out, a.x, Y);
  if (Math.abs(Y - b.y) > 1) {
    const ax = pickAisle(L, a.x, b.x);
    push(out, ax, Y);
    push(out, ax, b.y);
  }
  push(out, b.x, b.y);
}

// v1.3: the front fence (mặt phố, 2 tầng) has one opening — crossing it anywhere else walked people through the
// railing and flower boxes. gate = { x: aisle through the opening, y: line between outside (sidewalk) and inside,
// yIn: free walkway just inside (between two table rows) }.
function viaGate(L, a, b, floor, out) {
  const gt = L.gate;
  const aOut = a.y > gt.y;
  const inner = aOut ? b : a, outer = aOut ? a : b;
  const gx = gt.x;
  const pin = { x: gx, y: gt.yIn };
  if (aOut) {
    push(out, a.x, a.y);
    push(out, gx, a.y);
    push(out, gx, pin.y);
    const tail = [];
    sameFloor(L, pin, b, floor, tail);
    for (let i = 1; i < tail.length; i++) push(out, tail[i].x, tail[i].y);
  } else {
    sameFloor(L, a, pin, floor, out);
    push(out, gx, outer.y);
    push(out, b.x, b.y);
  }
}
const crossesGate = (L, a, b) => L.gate && (a.y > L.gate.y) !== (b.y > L.gate.y);

/** Path from a to b as an array of points (first point = a). */
export function route(L, a, b) {
  const out = [];
  const fa = floorOf(L, a.y), fb = floorOf(L, b.y);
  const leg = (p, q, fl, o) => (crossesGate(L, p, q) ? viaGate(L, p, q, fl, o) : sameFloor(L, p, q, fl, o));
  if (fa === fb || !L.stairs) { leg(a, b, fa, out); return out; }
  const s1 = fa === 1 ? L.stairs.bottom : L.stairs.top;
  const s2 = fa === 1 ? L.stairs.top : L.stairs.bottom;
  leg(a, s1, fa, out);
  if (L.stairs.via) push(out, L.stairs.via.x, L.stairs.via.y);
  push(out, s2.x, s2.y);
  const tail = [];
  leg(s2, b, fb, tail);
  for (let i = 1; i < tail.length; i++) push(out, tail[i].x, tail[i].y);
  return out;
}

export function pathLength(path) {
  let d = 0;
  for (let i = 1; i < path.length; i++) d += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
  return d;
}
