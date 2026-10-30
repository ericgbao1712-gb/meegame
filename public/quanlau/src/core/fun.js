// v1.20 Khu vui chơi (Karaoke & Photo, nhà hàng 2 lầu): khách mua vé, vào cổng riêng, chơi một lúc rồi về.
// Photo Studio ở tầng trệt, Karaoke trên lầu (đi cầu thang trong khu). Giá vé đặt ở Thực đơn ▸ Giá bán ▸ Vé.
import * as C from '../config.js';
import { clamp, round2 } from './util.js';
import { isWeekend } from './format.js';
import { addMoney, spend, builtFun, funPlaced } from './economy.js';
import { makeActor, removeActor, setPath, stepActor, nid } from './world.js';
import { route } from './routing.js';

const F = () => C.FUN;
const fail = (reason, msg) => ({ ok: false, reason, msg });
const KINDS = ['sinhvien', 'capdoi', 'hoiban', 'vanphong', 'giadinh', 'tiktoker'];

// ───────────── giá vé ─────────────
export function ticketDef(id) { return F().tickets[id] || null; }
export function ticketRef(G, id) {
  const t = ticketDef(id);
  if (!t) return 0;
  return Math.round(t.ref * (G.state.tier >= 5 ? F().tier5Mult : 1));
}
export function ticketBounds(G, id) {
  const r = ticketRef(G, id);
  return { min: Math.max(1, Math.round(r * F().minMult)), max: Math.max(2, Math.round(r * F().maxMult)) };
}
export function ticketPrice(G, id) {
  const v = G.state.funPrices && G.state.funPrices[id];
  const b = ticketBounds(G, id);
  if (typeof v === 'number' && isFinite(v) && v > 0) return clamp(Math.round(v), b.min, b.max);
  return ticketRef(G, id);
}
/** hệ số khách theo giá: rẻ đông, đắt vắng. */
export function priceDemand(G, id) {
  const ratio = ticketPrice(G, id) / Math.max(1, ticketRef(G, id));
  return clamp(Math.pow(ratio, -F().priceExp), 0.08, 2.2);
}
export function setTicketPrice(G, id, price) {
  const t = ticketDef(id);
  if (!t) return fail('unknown', 'Không có loại vé này.');
  if (!G.state.funPrices || typeof G.state.funPrices !== 'object') G.state.funPrices = {};
  if (price == null) { delete G.state.funPrices[id]; return { ok: true, price: null }; }
  const v = Math.round(Number(price)), b = ticketBounds(G, id);
  if (!isFinite(v) || v < b.min || v > b.max) return fail('range', `Giá ${t.name} đặt được từ ${b.min}k đến ${b.max}k.`);
  G.state.funPrices[id] = v;
  G.counter('setPrice', 1);
  return { ok: true, price: v };
}

// ───────────── khách ─────────────
const fw = (G) => { const w = G.world; if (!w.funGroups) { w.funGroups = []; w.funAcc = { photo: 0, kara: 0 }; } return w.funGroups; };
const fl = (id) => ticketDef(id).floor;
function spotsFor(G, id) {
  const L = G.world.layout, placed = new Set(funPlaced(G.state));
  return (L.fun.spots[fl(id)] || []).map((p, i) => Object.assign({ i }, p)).filter((p) => !p.need || placed.has(p.need));
}
function freeSpots(G, id) {
  const used = new Set();
  for (const g of fw(G)) if (g.ticket === id) for (const m of g.members) if (m.spot != null) used.add(m.spot);
  return spotsFor(G, id).filter((p) => !used.has(p.i));
}
/** khách / giờ game cho một loại vé lúc này */
export function funRate(G, id) {
  const s = G.state, t = ticketDef(id);
  if (!t || s.phase !== 'open' || builtFun(G) < t.floor) return 0;
  const hour = Math.floor(s.clock / 60);
  const curve = F().hourCurve[hour] ?? 0;
  if (!curve) return 0;
  const items = funPlaced(s).filter((x) => C.DECO.find((d) => d.id === x)?.fun?.floor === t.floor).length;
  let r = t.perHour * curve * (1 + items * F().perItem) * priceDemand(G, id);
  if (isWeekend(s.day)) r *= F().weekendMult;
  if ((s.weather === 'rain' || s.weather === 'storm')) r *= F().rainMult;     // trời mưa: khách tạt vào chơi trong nhà
  return r;
}

// v1.21 khách đi như khách quán: vào cổng quán, (lên cầu thang chung tới chiếu nghỉ lầu), bước qua cửa vòm bên hông
// cầu thang sang khu giải trí. Về thì đi ngược lại.
const P = (a) => ({ x: a[0], y: a[1] });
function pathIn(G, id, spot, startX) {
  const L = G.world.layout, D = L.fun.nav.door[fl(id)];
  const pts = route(L, { x: startX, y: L.fun.nav.walkY }, P(D.out));
  pts.push(P(D.at), P(D.in), { x: spot.x, y: D.walk }, { x: spot.x, y: spot.y });
  return pts;
}
function pathOut(G, id, a, endX) {
  const L = G.world.layout, D = L.fun.nav.door[fl(id)];
  const pts = [{ x: a.x, y: a.y }, { x: a.x, y: D.walk }, P(D.in), P(D.at)];
  const back = route(L, P(D.out), { x: endX, y: L.fun.nav.walkY });
  for (const p of back) pts.push(p);
  return pts;
}

function spawn(G, id) {
  const s = G.state, w = G.world, rng = G.rng, L = w.layout, t = ticketDef(id);
  const free = freeSpots(G, id);
  if (!free.length) return null;
  const size = Math.min(free.length, rng.int(t.group[0], t.group[1]));
  const kind = rng.pick(KINDS), seed = rng.int(1, 999999);
  const fromRight = rng.next() < 0.6;
  const sx = fromRight ? L.fun.nav.spawnR : L.fun.nav.spawnL;
  const picks = free.slice().sort(() => rng.next() - 0.5).slice(0, size).sort((a, b) => a.i - b.i);
  const g = { id: nid(w), ticket: id, state: 'in', members: [], stay: rng.range(t.stay[0], t.stay[1]), paid: false, exitX: rng.next() < 0.5 ? L.fun.nav.spawnR : L.fun.nav.spawnL };
  picks.forEach((sp, i) => {
    const a = makeActor(G, { type: 'funguest', kind, memberIdx: i, lookSeed: seed, x: sx + (fromRight ? 1 : -1) * i * 7, y: L.fun.nav.walkY, speed: 15 + (i % 2) * 1.5, pose: 'walk' });
    a.spot = sp.i; a.spotPose = sp.pose || 'idle'; a.spotFacing = sp.facing || 'down'; a.sortY = sp.sortY;
    setPath(a, pathIn(G, id, sp, a.x));
    g.members.push(a);
  });
  fw(G).push(g);
  return g;
}

function pay(G, g) {
  const s = G.state, price = ticketPrice(G, g.ticket), n = g.members.length, a = g.members[0];
  const amount = round2(price * n);
  addMoney(G, amount, 'fun', a && a.x, a && a.y);
  s.today.funTickets = (s.today.funTickets || 0) + n;
  s.today.funRevenue = round2((s.today.funRevenue || 0) + amount);
  s.today.revenue = round2((s.today.revenue || 0) + amount);   // tính vào doanh thu ngày (lời lỗ, thuế)
  if (!s.stats.funTickets) s.stats.funTickets = 0;
  s.stats.funTickets += n;
  G.counter('funTicket', n);
  G.emit('funTicket', { ticket: g.ticket, n, amount, x: a && a.x, y: a && a.y });
}

// ───────────── v1.24 thực đơn trong phòng (mở trong Hộp mù) ─────────────
export const menuOwned = (s) => (C.FUN.menu || []).filter((m) => s.box && s.box.got && s.box.got['bx_fn_' + m.id] > 0);
function orderMenu(G, g) {
  const s = G.state, rng = G.rng, fl = ticketDef(g.ticket).floor;
  const own = menuOwned(s).filter((m) => m.rooms.includes(fl));
  if (!own.length) return;
  const food = own.filter((m) => m.cat === 'moi' || m.cat === 'traicay'), drink = own.filter((m) => m.cat !== 'moi' && m.cat !== 'traicay');
  let rev = 0, cost = 0, n = 0;
  const got = [];
  for (let i = 0; i < g.members.length; i++) {
    if (food.length && rng.chance(C.FUN.orderFood)) { const m = rng.pick(food); rev += m.price; cost += m.cost; n++; got.push(m.id); }
    if (drink.length && rng.chance(C.FUN.orderDrink)) { const m = rng.pick(drink); rev += m.price; cost += m.cost; n++; got.push(m.id); }
  }
  if (!n) return;
  const a = g.members[0];
  addMoney(G, rev, 'fun', a && a.x, a && a.y);
  spend(G, 'drinks', cost, 'drinks');
  s.today.funRevenue = round2((s.today.funRevenue || 0) + rev);
  s.today.revenue = round2((s.today.revenue || 0) + rev);
  s.today.funMenu = (s.today.funMenu || 0) + n;
  for (const id of got) { if (!s.stats.funMenu) s.stats.funMenu = {}; s.stats.funMenu[id] = (s.stats.funMenu[id] || 0) + 1; }
  G.emit('funMenu', { n, amount: rev, items: got, x: a && a.x, y: a && a.y });
}

export function funTick(G, dtMin) {
  const s = G.state, w = G.world, L = w.layout;
  const groups = fw(G);
  if (L && L.fun && L.funLevel > 0 && s.phase === 'open') {
    for (const id of Object.keys(F().tickets)) {
      const r = funRate(G, id);
      if (!r) continue;
      w.funAcc[id] = (w.funAcc[id] || 0) + (r / 60) * dtMin;
      if (w.funAcc[id] >= 1) { w.funAcc[id] -= 1; spawn(G, id); }
    }
  }
  for (let gi = groups.length - 1; gi >= 0; gi--) {
    const g = groups[gi];
    for (const a of g.members) {
      if (stepActor(L, a, dtMin)) a.pose = 'walk';
      else if (g.state !== 'out') { a.pose = a.spotPose; a.facing = a.spotFacing; }
    }
    const N = L && L.fun && L.fun.nav;
    if (!g.paid && N && g.members.some((a) => a.x > 199 && a.y < 300)) { g.paid = true; pay(G, g); }   // v1.21 bước qua cửa vòm là mua vé
    if (g.state === 'in' && !g.members.some((a) => a.path)) {
      g.state = 'play';
      orderMenu(G, g);   // v1.24 gọi thêm mồi nhậu / trái cây / bia / rượu / nước
    } else if (g.state === 'play') {
      g.stay -= dtMin;
      if (g.stay <= 0 || s.phase !== 'open') {
        g.state = 'out';
        for (const a of g.members) { a.spot = null; setPath(a, pathOut(G, g.ticket, a, g.exitX)); a.pose = 'walk'; }
      }
    } else if (g.state === 'out' && !g.members.some((a) => a.path)) {
      for (const a of g.members) removeActor(G, a);
      groups.splice(gi, 1);
    }
  }
}
/** đóng cửa / qua ngày: ai đang chơi thì về luôn */
export function funReset(G) {
  const w = G.world;
  for (const a of w.actors.slice()) if (a.type === 'funguest') removeActor(G, a);
  if (w.funGroups) w.funGroups.length = 0;
}
export function funInfo(G) {
  const s = G.state, out = {};
  const lvl = builtFun(G);
  for (const id of Object.keys(F().tickets)) {
    const t = ticketDef(id), b = ticketBounds(G, id), price = ticketPrice(G, id), ref = ticketRef(G, id);
    const ratio = price / Math.max(1, ref);
    out[id] = { id, name: t.name, icon: t.icon, floor: t.floor, open: lvl >= t.floor, price, ref, min: b.min, max: b.max, custom: typeof (s.funPrices || {})[id] === 'number',
      ratio, demand: priceDemand(G, id), band: ratio < 0.9 ? 'cheap' : ratio > 1.1 ? 'pricey' : 'normal',
      playing: (G.world.funGroups || []).filter((g) => g.ticket === id && g.state !== 'out').reduce((n, g) => n + g.members.length, 0),
      spots: G.world.layout && G.world.layout.fun ? spotsFor(G, id).length : 0 };
  }
  return { level: lvl, unlocked: s.tier >= 4, tickets: out, today: { tickets: s.today.funTickets || 0, revenue: s.today.funRevenue || 0, menu: s.today.funMenu || 0 }, menu: (C.FUN.menu || []).map((m) => Object.assign({ owned: menuOwned(s).includes(m) }, m)) };
}
