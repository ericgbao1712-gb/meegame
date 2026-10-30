// v1.16 Đơn ship (Lẩu Ơi!). Có Shipper thì trong giờ bán có đơn gọi tới → một phiếu "ship" lên bếp như phiếu thường.
// Nấu xong, Shipper (core/workers.js tickShipper) ra quầy lấy, chạy ra đường, vắng tripMin phút rồi về.
// Giao xong mới tính tiền: món + nước + món kèm + phí ship (+ tip). Sao theo tổng thời gian giao.
import * as C from '../config.js';
import { clamp, round2 } from './util.js';
import { nid } from './world.js';
import { POT, DRINK, isPotUnlocked, isDrinkUnlocked, featureUnlocked, sidesOn, sidePrice, sellPrice, potPrice, priceRatio, addXp, spend } from './economy.js';
import { demandRate, payCoins } from './customers.js';
import { pushRating, makeReview } from './rating.js';

const S = () => C.SHIP;
export const shippers = (G) => G.state.staff.filter((m) => m.role === 'shipper');
const active = (G) => G.world.shipOrders.filter((o) => o.status !== 'done' && o.status !== 'cancel');
const choiceMult = (G, id) => clamp(Math.pow(priceRatio(G, id), -C.PRICING.choiceExp), C.PRICING.choiceMin, C.PRICING.choiceMax);

function canMake(G, potId, sides) {
  const inv = G.state.inventory, w = G.world;
  const need = {};
  for (const t of w.tickets) if (t.status === 'new' || t.status === 'tray' || t.status === 'chef') for (const i of POT[t.pot].recipe.concat(t.sides || [])) if (!t.added[i]) need[i] = (need[i] || 0) + 1;
  for (const i of POT[potId].recipe.concat(sides || [])) if ((inv[i] || 0) - (need[i] || 0) < 1) return false;
  return true;
}

/** Mỗi tick: theo lượng khách mà có đơn ship gọi tới (cần Shipper, đang mở cửa, trước giờ nhận khách cuối). */
export function shipTick(G, dtMin) {
  const s = G.state, w = G.world;
  if (!w || s.phase !== 'open' || s.clock >= C.TIME.lastSeat || !featureUnlocked(G, 'ship')) return;
  if (s.day === 1 && !s.tutorial.done) return;
  const n = shippers(G).length;
  if (!n) return;
  w.shipAcc = (w.shipAcc || 0) + demandRate(G) * S().share * dtMin / 60;
  if (w.shipAcc < 1) return;
  w.shipAcc -= 1;
  if (active(G).length >= n * S().perShipper) return;   // đang quá tải: đơn này gọi quán khác
  newOrder(G);
}

export function newOrder(G) {
  const s = G.state, w = G.world, rng = G.rng;
  const sides = [];
  if (rng.chance(S().sideChance)) { const av = sidesOn(G); if (av.length) sides.push(rng.pick(av).id); }
  const pots = C.HOTPOTS.filter((p) => s.menu[p.id] && isPotUnlocked(G, p.id) && canMake(G, p.id, sides));
  if (!pots.length) return null;
  const pot = rng.weighted(pots, (p) => choiceMult(G, p.id)).id;
  const drinks = [];
  if (rng.chance(S().drinkChance)) {
    const ds = C.DRINKS.filter((d) => isDrinkUnlocked(G, d.id));
    const k = rng.int(1, 2);
    for (let i = 0; i < k && ds.length; i++) drinks.push(rng.pick(ds).id);
  }
  const id = w.shipNext++;
  const t = {
    id: nid(w), groupId: 0, ship: id, tableIdx: -1, door: -1, kind: 'ship', pot, drinks, extra: null, sides,
    status: 'new', added: {}, drinksAdded: false, createdAt: w.tMin, patience: S().patience, waited: 0,
    claimedBy: 0, maker: null, readyAt: 0, takeaway: true,
  };
  w.tickets.push(t);
  const o = { id, ticketId: t.id, pot, drinks, sides, price: sellPrice(G, pot), created: w.tMin, status: 'cooking', riderId: 0 };
  w.shipOrders.push(o);
  s.today.shipOrders = (s.today.shipOrders || 0) + 1;
  G.emit('shipOrder', { order: Object.assign({}, o) });
  return o;
}

export const orderOf = (G, id) => G.world.shipOrders.find((o) => o.id === id) || null;

/** Shipper đã lấy hàng ở quầy: phiếu rời bếp, đơn chuyển sang "đang giao". */
export function pickUp(G, t, actor) {
  const w = G.world, o = orderOf(G, t.ship);
  t.status = 'done';
  const i = w.tickets.indexOf(t);
  if (i >= 0) w.tickets.splice(i, 1);
  if (w.tray.ticketId === t.id) w.tray.ticketId = null;
  if (!o) return null;
  o.status = 'riding'; o.riderId = actor.id; o.pickedAt = w.tMin;
  let dcost = 0;
  for (const d of o.drinks) dcost += DRINK[d].cost;
  if (dcost > 0) spend(G, 'drinks', dcost, 'drinks');
  G.emit('shipPicked', { order: Object.assign({}, o) });
  return o;
}

/** Giao tới tay khách: tính tiền, sao, XP. */
export function deliver(G, o) {
  const s = G.state, w = G.world, rng = G.rng;
  if (!o || o.status === 'done') return null;
  o.status = 'done';
  let mins = Math.max(0, w.tMin - o.created);
  if (w.rushOn) mins -= S().rushGrace || 0;                        // v1.25k giờ cao điểm khách thông cảm hơn
  let stars = S().minStars || 2;
  for (const [lim, st] of S().starsAt) if (mins <= lim) { stars = st; break; }
  stars = Math.max(S().minStars || 2, stars);                      // giao tới nơi thì không bị 2★ (2★ chỉ khi hủy đơn)
  mins = Math.max(0, w.tMin - o.created);
  let drinksRev = 0;
  for (const d of o.drinks) drinksRev += DRINK[d].price;
  let sidesRev = 0;
  for (const sd of o.sides) sidesRev += sidePrice(G, sd);
  const base = round2(o.price + drinksRev + sidesRev + S().fee);
  const tip = stars >= 4 && rng.chance(S().tipChance) ? rng.int(S().tip[0], S().tip[1]) : 0;
  payCoins(G, { base, tip, amount: round2(base + tip), pot: o.pot, drinks: o.drinks.length, sides: o.sides.length, size: 2, kind: 'ship', stars }, 'staff', 0, 0);
  pushRating(G, stars, 1);
  s.today.stars += stars; s.today.rated++;
  if (stars >= 5) { s.stats.fiveStars++; s.today.fiveStars++; }
  addXp(G, C.LEVEL.xpForGroup(potPrice(G, o.pot), 2, stars, s.tier));
  s.today.shipDelivered = (s.today.shipDelivered || 0) + 1;
  s.today.shipRevenue = round2((s.today.shipRevenue || 0) + base + tip);
  s.stats.shipDelivered = (s.stats.shipDelivered || 0) + 1;
  G.counter('shipDelivered', 1);
  if (rng.chance(S().reviewChance)) {
    const review = makeReview(G, { kind: 'ship', pot: o.pot }, stars, null, rng.pick(S().reviews[stars] || S().reviews[4]));
    G.emit('review', { review, x: 0, y: 0, groupId: 0 });
  }
  G.emit('shipDelivered', { order: Object.assign({}, o), amount: round2(base + tip), stars, mins: Math.round(mins) });
  w.shipOrders = w.shipOrders.filter((x) => x.status !== 'done' && x.status !== 'cancel');
  return { stars, amount: base + tip };
}

/** Phiếu ship quá hạn trên bếp → khách hủy đơn. */
export function cancelOrder(G, t) {
  const s = G.state, w = G.world;
  const o = orderOf(G, t.ship);
  t.status = 'dead';
  const i = w.tickets.indexOf(t);
  if (i >= 0) w.tickets.splice(i, 1);
  if (w.tray.ticketId === t.id) w.tray.ticketId = null;
  if (o) o.status = 'cancel';
  s.today.shipCancelled = (s.today.shipCancelled || 0) + 1;
  pushRating(G, 2, 1);
  s.today.stars += 2; s.today.rated++;
  if (G.rng.chance(0.5)) {
    const review = makeReview(G, { kind: 'ship', pot: t.pot }, 2, null, G.rng.pick(S().reviews.cancel));
    G.emit('review', { review, x: 0, y: 0, groupId: 0 });
  }
  G.emit('shipCancelled', { pot: t.pot });
  w.shipOrders = w.shipOrders.filter((x) => x.status !== 'done' && x.status !== 'cancel');
}

/** Hết ngày: đơn đang trên đường giao luôn; đơn chưa nấu thì bỏ (không trừ sao). */
export function shipDayEnd(G) {
  const w = G.world;
  if (!w || !w.shipOrders) return;
  for (const o of w.shipOrders.slice()) if (o.status === 'riding') deliver(G, o);
  w.shipOrders = [];
  w.shipAcc = 0;
  for (const a of w.actors) if (a.type === 'staff' && a.role === 'shipper') { a.hidden = false; a.carry = null; a.task = null; }
}

export function shipInfo(G) {
  const s = G.state, w = G.world;
  const list = (w && w.shipOrders) || [];
  return {
    unlocked: featureUnlocked(G, 'ship'), shippers: shippers(G).length, cap: shippers(G).length * S().perShipper,
    cooking: list.filter((o) => o.status === 'cooking').length, riding: list.filter((o) => o.status === 'riding').length,
    today: { orders: s.today.shipOrders || 0, delivered: s.today.shipDelivered || 0, cancelled: s.today.shipCancelled || 0, revenue: s.today.shipRevenue || 0 },
    fee: S().fee, promiseMin: S().promiseMin,
  };
}
