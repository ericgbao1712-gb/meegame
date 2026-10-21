// Kitchen dock (open phase): ticket strip, broth row, tray, ingredient keys, drinks, serve.
import * as C from '../config.js';
import { h, div, span, ico, setIco, setText, setClass, setStyleVar, setShown, clear, onPress, store, vibrate } from './dom.js';
import { ctx, S, G, act, sfx } from './ctx.js';
import { ING, POT, DRINK, stock, ingUnlocked, staffCount } from './data.js';

const KEYS = C.INGREDIENTS.filter((i) => !i.broth);      // broth items get their own row above the tray
const quiet = (name, ...a) => { try { const r = ctx.game.act?.[name]?.(...a); return r || { ok: true }; } catch (e) { console.error('[ui] ' + name, e); return { ok: false }; } };

export function mountDock(root, sceneUi) {
  const flying = new Set();            // ingredient ids currently flying to the tray
  const play = div('dock-play');
  const lower = div('dock-lower');

  // ------------------------------------------------------------- toggle
  const toggle = h('button', { class: 'dock-toggle', 'aria-label': 'Thu gọn bảng bếp' }, ico('ui_down', 16));
  toggle.addEventListener('click', () => {
    sfx('click');
    collapsed = !collapsed; store.set('dockCollapsed', collapsed);
    applyCollapsed();
  });
  let collapsed = !!store.get('dockCollapsed', false);
  function applyCollapsed() {
    play.classList.toggle('collapsed', collapsed);
    toggle.classList.toggle('up', collapsed);
    toggle.setAttribute('aria-label', collapsed ? 'Mở rộng bảng bếp' : 'Thu gọn bảng bếp');
    requestAnimationFrame(() => ctx.renderer?.resize?.());
  }

  // ------------------------------------------------------------- tickets
  const strip = div('tickets');
  const emptyTxt = span('', 'Chưa có phiếu — chờ khách gọi món nha'); const emptyIco = ico('emo_zzz', 16);
  const closeBtn = h('button', { class: 'btn red sm body closeearly' }, 'Đóng cửa sớm'); closeBtn.hidden = true;
  closeBtn.addEventListener('click', () => { sfx('click'); askCloseEarly(); });
  const stripEmpty = div('tk-empty', emptyIco, emptyTxt, closeBtn);
  strip.appendChild(stripEmpty);
  // nothing on the menu can be made: restock now (the market is open all day) or close up early
  function askCloseEarly() {
    if (S().phase !== 'open') return;
    // v1.10: quản kho đã chạy đi chợ → chỉ báo chờ hàng về, không hỏi đóng cửa
    if (ctx.game.world?.qkTrip) { ctx.toast('Hết hàng! Quản kho đang đi chợ, chút nữa có hàng bán tiếp nha.', 'info', 'ui_kho'); return; }
    const hasQk = (S().staff || []).some((m) => m.role === 'quankho');
    ctx.confirm({ title: 'Hết hàng rồi!', icon: 'ui_kho', yes: 'Nhập thêm hàng', no: 'Đóng cửa sớm',
      text: 'Kho hết món để bán rồi. Nhập thêm hàng để bán tiếp, hay đóng cửa sớm qua ngày mới?'
        + (hasQk ? '' : ' (Thuê Quản kho thì hết hàng là anh ấy tự chạy đi chợ.)'),
      onYes: () => { ctx.openSheet('kho'); },
      onNo: () => { const r = act('closeEarly'); if (r.ok !== false) sfx('door'); } });
  }
  ctx.game.on?.('soldOut', () => setTimeout(askCloseEarly, 600));
  const tk = new Map();                 // ticketId -> refs
  let tkKey = '';

  function makeTicket(t) {
    const num = span('tb', ''); const potI = ico('pot_ga', 32, 'tpot'); const exI = ico('ing_ga', 16, 'tex');
    const plus = span('tplus', '+'); const drk = div('tdrk'); const sideEl = div('tside');
    const stI = ico('ui_check', 16, 'tst'); const bar = h('i'); const pb = div('pbar', bar);
    const el = h('button', { class: 'tk', dataset: { id: String(t.id) } }, num, potI, exI, plus, drk, sideEl, stI, pb);
    onPress(el, () => { sfx('click'); const r = quiet('selectTicket', t.id); if (r.ok === false && r.msg) ctx.toast(r.msg, 'bad'); tickNow(); ctx.tutorial?.onAction?.('select'); });
    return { el, num, potI, exI, plus, drk, sideEl, stI, bar, drkKey: '', sideKey: '' };
  }
  function updateTicket(r, t, trayId) {
    const ratio = Math.max(0, Math.min(1, 1 - (t.waited || 0) / (t.patience || 1)));
    setText(r.num, 'B' + ((t.tableIdx ?? 0) + 1));
    if (t.extra) { setIco(r.exI, ING[t.extra]?.icon || 'ing_ga', 32); r.exI.width = r.exI.height = 32; setClass(r.exI, 'big', true); r.potI.style.display = 'none'; r.plus.style.display = ''; }
    else { setIco(r.potI, POT[t.pot]?.icon || 'pot_ga', 32); r.potI.style.display = ''; r.exI.style.display = 'none'; r.plus.style.display = 'none'; }
    if (t.extra) r.exI.style.display = '';
    const dk = (t.drinks || []).join(',');
    if (r.drkKey !== dk) { r.drkKey = dk; clear(r.drk); (t.drinks || []).slice(0, 3).forEach((d) => r.drk.appendChild(ico(DRINK[d]?.icon || 'drk_trada', 16))); }
    const sk = (t.sides || []).join(',');
    if (r.sideKey !== sk) { r.sideKey = sk; clear(r.sideEl); (t.sides || []).slice(0, 2).forEach((d) => r.sideEl.appendChild(ico(ING[d]?.icon || 'ak_oc', 16))); }
    setClass(r.el, 'sel', t.id === trayId || t.status === 'tray');
    setClass(r.el, 'chef', t.status === 'chef');
    setClass(r.el, 'ready', t.status === 'ready' || t.status === 'carrying');
    setClass(r.el, 'extra', !!t.extra);
    const st = t.status === 'chef' ? 'eq_knife' : (t.status === 'ready' ? 'ui_check' : (t.status === 'carrying' ? 'ui_speed' : null));
    if (st) { setIco(r.stI, st, 16); r.stI.style.display = ''; } else r.stI.style.display = 'none';
    setStyleVar(r.bar, '--p', Math.round(ratio * 20) * 5);
    setClass(r.el, 'p-ok', ratio > 0.5); setClass(r.el, 'p-mid', ratio <= 0.5 && ratio > 0.25); setClass(r.el, 'p-low', ratio <= 0.25);
    r.el.disabled = t.status === 'chef' || t.status === 'ready' || t.status === 'carrying';
  }
  function updateTickets(trayId) {
    const list = (ctx.game.world?.tickets || []).filter((t) => t.status !== 'done');
    const key = list.map((t) => t.id).join(',');
    for (const [id, r] of tk) if (!list.some((t) => t.id === id)) { r.el.remove(); tk.delete(id); }
    list.forEach((t) => { if (!tk.has(t.id)) tk.set(t.id, makeTicket(t)); });
    if (key !== tkKey) {
      tkKey = key;
      list.forEach((t, i) => { const r = tk.get(t.id); if (strip.children[i + 1] !== r.el) strip.insertBefore(r.el, strip.children[i + 1] || null); if (!r.shown) { r.shown = true; r.el.classList.add('pop'); } });
      list.forEach((t, i) => { const r = tk.get(t.id); r.el.dataset.tut = i === 0 ? 'ticket-first' : ''; });
    }
    list.forEach((t) => updateTicket(tk.get(t.id), t, trayId));
    stripEmpty.style.display = list.length ? 'none' : '';
    if (!list.length) {
      const out = S().phase === 'open' && (ctx.game.get?.availablePots?.() || [1]).length === 0;
      setText(emptyTxt, out ? 'Hết hàng! Nhập thêm ở Kho nha' : 'Chưa có phiếu — chờ khách gọi món nha');
      setIco(emptyIco, out ? 'ui_kho' : 'emo_zzz', 16);
      closeBtn.hidden = !out; setClass(stripEmpty, 'out', out);
    }
  }

  // ------------------------------------------------------------- broth row
  // Broth is a kho item like the others (config nl_*): one key per broth on the menu, tap to add it.
  const brothRow = div('stoves broths');
  let brothKeys = [], brothSig = '';
  const menuBroths = () => {
    const st = S();
    return C.INGREDIENTS.filter((i) => i.broth && st.menu?.[i.broth] && (ctx.game.get?.isPotUnlocked?.(i.broth) ?? st.level >= i.unlockLv));
  };
  function buildBroths(list) {
    clear(brothRow); brothKeys = [];
    brothRow.className = 'stoves broths n' + Math.min(list.length, 7);
    list.forEach((ing) => {
      const icn = ico(ing.icon, 32, 'sicon'); const name = span('sname', ing.short || ing.name);
      const sub = span('ssub', ''); const ck = h('i', { class: 'ck kck' });
      const el = h('button', { class: 'st bt', dataset: { ing: ing.id, tut: 'key-' + ing.id }, 'aria-label': ing.name }, div('sg', icn), div('sl', name, sub), ck);
      onPress(el, () => onKey(ing.id, el, icn));
      brothRow.appendChild(el); brothKeys.push({ id: ing.id, el, icn, sub });
    });
  }
  function updateBroths(info) {
    const list = menuBroths();
    const sig = list.map((i) => i.id).join(',');
    if (sig !== brothSig) { brothSig = sig; buildBroths(list); }
    const need = new Map((info?.need || []).map((n) => [n.ing, n]));
    const hasTray = !!info?.ticket;
    brothKeys.forEach((r) => {
      const n = stock(r.id), nd = need.get(r.id);
      setText(r.sub, n > 0 ? 'Còn ' + n : 'Hết hàng');
      setClass(r.el, 'zero', n < 1);
      setClass(r.el, 'low', n > 0 && n <= 3);
      setClass(r.el, 'need', !!nd && !nd.done);
      setClass(r.el, 'done', !!nd && nd.done && !flying.has(r.id));
      setClass(r.el, 'dim', hasTray && !nd);
    });
  }

  // ------------------------------------------------------------- tray
  const trayBox = div('tray');
  const trayHead = span('thead', '');
  const traySlots = div('tslots');
  trayBox.append(trayHead, traySlots);
  let traySig = '';
  const slotEls = {};
  const trayTicket = () => {
    const id = ctx.game.world?.tray?.ticketId;
    return id == null ? null : (ctx.game.world?.tickets || []).find((t) => t.id === id) || null;
  };
  function buildTray(info) {
    clear(traySlots); Object.keys(slotEls).forEach((k) => delete slotEls[k]);
    if (!info?.ticket) return;
    (info.need || []).forEach((n) => {
      const el = div('slot', ico(ING[n.ing]?.icon || 'ing_ga', 16), h('i', { class: 'ck' }));
      el.dataset.ing = n.ing; slotEls[n.ing] = el; traySlots.appendChild(el);
    });
    if (info.drinks?.need > 0) {
      const t = info.ticket;
      const el = div('slot drk', ico(DRINK[t.drinks[0]]?.icon || 'drk_trada', 16), info.drinks.need > 1 ? span('dn', '×' + info.drinks.need) : null, h('i', { class: 'ck' }));
      slotEls.__drk = el; traySlots.appendChild(el);
    }
  }
  function trayInfo() { try { return ctx.game.get?.trayInfo?.() || null; } catch (e) { return null; } }
  function updateTray(info) {
    const t = info?.ticket;
    const sig = t ? t.id + ':' + (info.need || []).map((n) => n.ing).join('') + ':' + (info.drinks?.need || 0) : 'none';
    if (sig !== traySig) { traySig = sig; buildTray(info); }
    if (!t) {
      const hasNew = (ctx.game.world?.tickets || []).some((x) => x.status === 'new');
      setText(trayHead, hasNew ? 'Chạm vào phiếu để soạn mâm' : 'Chưa có mâm nào');
      setClass(trayBox, 'empty', true); setClass(trayBox, 'point', hasNew); setClass(trayBox, 'warn', false);
      return;
    }
    setClass(trayBox, 'empty', false); setClass(trayBox, 'point', false);
    setText(trayHead, t.extra ? `B${t.tableIdx + 1} · ${ING[t.extra]?.dessert ? 'Tráng miệng' : 'Gọi thêm'} ${ING[t.extra]?.name?.toLowerCase() || ''}` : `B${t.tableIdx + 1} · ${POT[t.pot]?.name || ''}` + ((t.sides || []).length ? ' + ' + t.sides.map((d) => ING[d]?.short || '').join(', ') : ''));
    (info.need || []).forEach((n) => {
      const el = slotEls[n.ing]; if (!el) return;
      setClass(el, 'done', n.done && !flying.has(n.ing));
      setClass(el, 'zero', !n.done && !n.inStock);
    });
    if (slotEls.__drk) setClass(slotEls.__drk, 'done', info.drinks.done >= info.drinks.need);
  }

  // ------------------------------------------------------------- actions
  const drinkBtn = h('button', { class: 'btn night body dbtn', dataset: { tut: 'drink-btn' } }, ico('drk_trada', 32, 'dico'), span('dl', 'Nước'));
  const serveBtn = h('button', { class: 'btn red serve', dataset: { tut: 'serve-btn' } }, span('', 'PHỤC VỤ'));
  onPress(drinkBtn, () => {
    const r = act('addDrinks');
    if (r.ok !== false) {
      sfx('pop'); const to = slotEls.__drk ? ctx.fx.centerOf(slotEls.__drk) : ctx.fx.centerOf(trayBox);
      const t = trayTicket(); flying.add('__drk');
      ctx.fx.fly(DRINK[t?.drinks?.[0]]?.icon || 'drk_trada', ctx.fx.centerOf(drinkBtn), to, { size: 32, dur: 360, endScale: .6, done: () => { flying.delete('__drk'); tickNow(); } });
      ctx.tutorial?.onAction?.('drinks');
    }
    tickNow();
  });
  onPress(serveBtn, () => {
    if (serveBtn.classList.contains('off')) { const info = trayInfo(); ctx.toast(!info?.ticket ? 'Chọn phiếu trước đã nha.' : 'Mâm chưa đủ — còn thiếu món sáng lên nha.', 'bad'); sfx('error'); serveBtn.classList.remove('shake'); void serveBtn.offsetWidth; serveBtn.classList.add('shake'); return; }
    const r = act('serve');
    if (r.ok !== false) { serveBtn.classList.remove('pop'); void serveBtn.offsetWidth; serveBtn.classList.add('pop'); vibrate(15); ctx.tutorial?.onAction?.('serve'); }
    tickNow();
  });

  // ------------------------------------------------------------- keys
  const keys = div('keys');
  const keyRefs = {};
  KEYS.forEach((ing) => {
    const icn = ico(ing.icon, 32, 'kico'); const nm = span('kn', ing.short); const cnt = span('kc', '0');
    const lock = div('klock', ico('ui_lock', 16), span('', 'Lv ' + ing.unlockLv));
    const ck = h('i', { class: 'ck kck' });
    const el = h('button', { class: 'key' + (ing.side ? ' side' : ''), dataset: { ing: ing.id, tut: 'key-' + ing.id }, 'aria-label': ing.name }, icn, nm, cnt, ck, lock);
    onPress(el, () => onKey(ing.id, el, icn));
    keys.appendChild(el);
    keyRefs[ing.id] = { el, icn, nm, cnt, lock, ck };
  });
  function onKey(id, el, icn) {
    if (!ingUnlocked(id)) { ctx.toast(`${ING[id].name} mở ở Lv ${ING[id].unlockLv} nha.`, 'info', 'ui_lock'); sfx('error'); return; }
    if (stock(id) < 1) { ctx.toast(`Hết ${ING[id].name.toLowerCase()} rồi — mở Kho nhập thêm nha!`, 'bad', ING[id].icon); sfx('error'); return; }
    const r = quiet('addIngredient', id);
    if (r.ok === false) {
      el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); sfx('error');
      if (r.msg && r.reason !== 'notNeeded') ctx.toast(r.msg, 'bad');
      else if (r.reason === 'notNeeded') ctx.toast('Mâm này không cần ' + ING[id].name.toLowerCase() + ' nha.', 'info');
      return;
    }
    vibrate(8);                                           // the 'pop' sound comes from audio (ingredientAdded)
    flying.add(id);
    tickNow();                                            // builds the tray slot if the ticket was just auto-selected
    const slot = slotEls[id];
    const to = slot ? ctx.fx.centerOf(slot) : ctx.fx.centerOf(trayBox);
    ctx.fx.fly(ING[id].icon, ctx.fx.centerOf(icn), to, { size: 32, dur: 340, arc: -30, endScale: 0.8, done: () => { flying.delete(id); tickNow(); if (slot) { slot.classList.remove('land'); void slot.offsetWidth; slot.classList.add('land'); } } });
    ctx.tutorial?.onAction?.('ingredient', id);
  }
  function updateKeys(info) {
    const need = new Map((info?.need || []).map((n) => [n.ing, n]));
    const hasTray = !!info?.ticket;
    KEYS.forEach((ing) => {
      const r = keyRefs[ing.id]; const un = ingUnlocked(ing.id); const n = stock(ing.id);
      const nd = need.get(ing.id);
      if (ing.dessert) { r.el.style.display = un ? '' : 'none'; }   // v1.1 tráng miệng keys appear once sellable
      if (ing.side) { r.el.style.display = un && nd ? '' : 'none'; }   // v1.4 món ăn kèm: only while the tray ticket needs it
      setClass(r.el, 'lock', !un);
      setText(r.cnt, un ? n : '');
      setClass(r.el, 'zero', un && n < 1);
      setClass(r.el, 'need', un && !!nd && !nd.done);
      setClass(r.el, 'done', un && !!nd && nd.done && !flying.has(ing.id));
      setClass(r.el, 'dim', un && hasTray && !nd);
      r.lock.style.display = un ? 'none' : '';
    });
  }

  // drinks button state
  function updateActions(info) {
    const t = info?.ticket;
    const hasDrinks = !!t && info.drinks?.need > 0;
    setShown(drinkBtn, hasDrinks);
    if (hasDrinks) {
      setIco(drinkBtn.querySelector('.dico'), DRINK[t.drinks[0]]?.icon || 'drk_trada', 32);
      const done = info.drinks.done >= info.drinks.need;
      setClass(drinkBtn, 'off', done); setClass(drinkBtn, 'pulse', !done);
      setText(drinkBtn.querySelector('.dl'), done ? 'Xong' : 'Nước');
    }
    const can = !!info?.canServe;
    setClass(serveBtn, 'off', !can); setClass(serveBtn, 'ready', can);
  }

  // hint line ------------------------------------------------------------
  const hint = div('hintbar'); const hintS = span('', ''); hint.appendChild(hintS); hint.hidden = true; sceneUi.appendChild(hint);
  let idleT = 0, hintT = 0;

  // rain tarp button (vỉa hè only): shows while it rains and the tarp is still rolled up ------
  const tarpLbl = span('tl', 'Kéo bạt');
  const tarpBtn = h('button', { class: 'btn red tarpbtn', onclick: onTarp }, ico('wx_rain', 32), tarpLbl);
  tarpBtn.hidden = true; sceneUi.appendChild(tarpBtn);
  function onTarp() {
    const rn = ctx.game.get?.rain?.();
    if (rn && !rn.owns) { sfx('click'); ctx.openSheet('upgrade'); return; }
    const r = act('pullTarp');
    if (r && r.ok) { sfx('whoosh'); vibrate(15); }
  }
  function updateTarp() {
    let rn = null;
    try { rn = ctx.game.get?.rain?.(); } catch (e) { rn = null; }
    const show = !!(rn && rn.raining && rn.needsTarp && !rn.tarp);
    tarpBtn.hidden = !show;
    if (show) { setText(tarpLbl, rn.owns ? 'KÉO BẠT!' : 'Mua bạt che mưa'); setClass(tarpBtn, 'buy', !rn.owns); }
  }

  // ------------------------------------------------------------- assemble
  const actionRow = div('arow', trayBox, drinkBtn, serveBtn);
  lower.append(brothRow, actionRow, keys);
  play.append(toggle, strip, lower);
  root.appendChild(play);
  applyCollapsed();

  function tickNow() { tick(0, true); }
  let acc = 0;
  function tick(dt, force) {
    acc += dt;
    if (!force && acc < 0.08) return;
    acc = 0;
    const info = trayInfo();
    updateTickets(info?.ticket?.id ?? ctx.game.world?.tray?.ticketId);
    const canCollapse = staffCount('daubep') >= 1 && staffCount('phucvu') >= 1;
    toggle.style.display = canCollapse ? '' : 'none';
    if (!canCollapse && collapsed) { collapsed = false; applyCollapsed(); }
    updateBroths(info); updateTray(info); updateKeys(info); updateActions(info);
  }
  function update(dt) {
    const open = S().phase === 'open' || S().phase === 'closing';
    setShown(play, open);
    if (!open) { hint.hidden = true; tarpBtn.hidden = true; return; }
    tick(dt);
    updateTarp();
    // idle hint
    const noTickets = !(ctx.game.world?.tickets || []).length;
    idleT = noTickets ? idleT + dt : 0;
    if (idleT > 4) { hintT += dt; if (hintT > 0.5) { hintT = 0; const t = ctx.game.get?.hint?.(); if (t) { setText(hintS, t); hint.hidden = false; } } } else hint.hidden = true;
  }

  return { update, tickNow, els: { strip, keys, serveBtn, drinkBtn, trayBox, brothRow }, keyRefs };
}
