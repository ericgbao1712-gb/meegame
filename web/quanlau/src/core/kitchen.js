// Tickets, the player's tray, scenery stoves (TECH_SPEC §6.3, §6.4).
import * as C from '../config.js';
import { nid } from './world.js';
import { ING, POT, DRINK, consumeIngredient, mods, isPotUnlocked } from './economy.js';

export const findTicket = (G, id) => G.world.tickets.find((t) => t.id === id) || null;
export const trayTicket = (G) => (G.world.tray.ticketId ? findTicket(G, G.world.tray.ticketId) : null);
export const ticketRecipe = (t) => (t.extra ? [t.extra] : t.sides && t.sides.length ? POT[t.pot].recipe.concat(t.sides) : POT[t.pot].recipe);   // v1.4 + món ăn kèm
export const missingIngredients = (t) => ticketRecipe(t).filter((i) => !t.added[i]);
export const needsDrinks = (t) => !t.extra && t.drinks.length > 0 && !t.drinksAdded;
export const ticketComplete = (t) => missingIngredients(t).length === 0 && !needsDrinks(t);

// ───────────── tickets ─────────────
export function patienceFor(G, kind, tutorial) {
  const k = C.CUSTOMERS[kind];
  return k.patience * C.PATIENCE_MULT * mods(G).patience * (tutorial ? 3 : 1);
}

export function createTicket(G, group, extra = null) {
  const w = G.world;
  const t = {
    id: nid(w), groupId: group.id, tableIdx: group.tableIdx, door: group.doorIdx, kind: group.kind,
    pot: group.pot, drinks: extra ? [] : group.drinks.slice(), extra, sides: extra ? [] : (group.sides || []).slice(),
    status: 'new', added: {}, drinksAdded: false, createdAt: w.tMin,
    patience: extra ? 40 * C.PATIENCE_MULT : patienceFor(G, group.kind, group.tutorial), waited: 0,
    claimedBy: 0, maker: null, readyAt: 0, takeaway: !!group.takeaway,
  };
  w.tickets.push(t);
  return t;
}

export function removeTicket(G, t) {
  if (!t || t.status === 'dead') return;
  t.status = 'dead';
  const w = G.world;
  const i = w.tickets.indexOf(t);
  if (i >= 0) w.tickets.splice(i, 1);
  if (w.tray.ticketId === t.id) w.tray.ticketId = null;
}

export function updateTickets(G, dtMin) {
  const w = G.world, closing = G.state.phase === 'closing';
  for (let i = w.tickets.length - 1; i >= 0; i--) {
    const t = w.tickets[i];
    t.waited += dtMin;
    if (closing) { if (t.waited > t.patience * 0.99) t.waited = t.patience * 0.99; }
    else if (t.waited >= t.patience) G.hooks.ticketExpired(t);
  }
}

// ───────────── stoves (scenery only) ─────────────
// Broth is a stocked item now (config INGREDIENTS nl_*), so stoves just show a simmering pot of
// something on the menu while the shop is open.
export function clearStove(st) { st.pot = null; st.progress = 0; st.ready = false; st.portions = 0; st.maxPortions = 0; }
export function dressStoves(G) {
  const menu = C.HOTPOTS.filter((p) => G.state.menu[p.id] && isPotUnlocked(G, p.id));
  G.world.stoves.forEach((st, i) => {
    const p = menu[i % Math.max(1, menu.length)];
    if (!p) { clearStove(st); return; }
    st.pot = p.id; st.progress = 1; st.ready = true; st.portions = 1; st.maxPortions = 1; st.fresh = G.world.time;
  });
}

// ───────────── player actions ─────────────
const fail = (reason, msg) => ({ ok: false, reason, msg });
const bumpCook = (G) => { G.world.cookPoseT = 1.4; };

export function selectTicket(G, id) {
  const t = findTicket(G, id);
  if (!t) return fail('noTicket', 'Phiếu này không còn nữa.');
  if (t.status === 'chef') return fail('busy', 'Đầu bếp đang làm phiếu này rồi nha!');
  if (t.status !== 'new' && t.status !== 'tray') return fail('busy', 'Phiếu này đã làm xong rồi.');
  const w = G.world;
  if (w.tray.ticketId === id) return { ok: true, ticket: t };
  const prev = trayTicket(G);
  if (prev && prev.status === 'tray') prev.status = 'new';
  t.status = 'tray';
  w.tray.ticketId = id;
  return { ok: true, ticket: t };
}

export function addIngredientAct(G, ing) {
  const s = G.state, w = G.world;
  const def = ING[ing];
  if (!def) return fail('unknown', 'Không có nguyên liệu này.');
  let t = trayTicket(G);
  if (!t) {
    t = w.tickets.find((x) => x.status === 'new');
    if (!t) return fail('noTicket', 'Chưa có phiếu nào để làm nha!');
    selectTicket(G, t.id);
  }
  if (!ticketRecipe(t).includes(ing) || t.added[ing]) return fail('notNeeded', `Phiếu này không cần ${def.name.toLowerCase()}.`);
  if ((s.inventory[ing] || 0) <= 0) return fail('noStock', `Hết ${def.name.toLowerCase()} rồi! Mai nhập thêm nha.`);
  consumeIngredient(G, ing, 1);
  t.added[ing] = 1;
  bumpCook(G);
  const complete = ticketComplete(t) || missingIngredients(t).length === 0;
  G.emit('ingredientAdded', { ing, complete: missingIngredients(t).length === 0, ticketId: t.id });
  return { ok: true, complete: missingIngredients(t).length === 0, ticketId: t.id };
}

export function addDrinksAct(G) {
  const t = trayTicket(G);
  if (!t) return fail('noTicket', 'Chọn phiếu trước nha!');
  if (!t.drinks.length) return fail('noDrinks', 'Bàn này không gọi nước.');
  if (t.drinksAdded) return fail('done', 'Nước đã có trong mâm rồi.');
  t.drinksAdded = true;
  bumpCook(G);
  G.emit('drinksAdded', { ticketId: t.id });
  return { ok: true };
}

export function trayStatus(G) {
  const t = trayTicket(G);
  if (!t) return null;
  const miss = missingIngredients(t);
  return {
    ticket: t,
    need: ticketRecipe(t).map((ing) => ({ ing, done: !!t.added[ing], inStock: (G.state.inventory[ing] || 0) > 0 })),
    drinks: { need: t.drinks.length, done: t.drinksAdded ? t.drinks.length : 0 },
    broth: { need: false, ready: true, readyStoveIdx: -1 },   // broth is one of the `need` items now
    canServe: miss.length === 0 && !needsDrinks(t),
  };
}

export function serveAct(G) {
  const t = trayTicket(G);
  if (!t) return fail('noTicket', 'Chưa chọn phiếu nào nha!');
  const info = trayStatus(G);
  if (missingIngredients(t).length || needsDrinks(t) || !info.canServe) return fail('incomplete', 'Mâm chưa đủ, kiểm tra lại nha!');
  t.status = 'ready';
  t.maker = { type: 'owner' };
  t.readyAt = G.world.tMin;
  G.world.tray.ticketId = null;
  G.emit('ticketReady', { ticketId: t.id, by: 'player' });
  return { ok: true, ticketId: t.id };
}

export { DRINK };
