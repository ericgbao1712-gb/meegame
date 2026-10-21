// Toasts (max 2), Má messages (queued), review popups, banners — and the game events that feed them.
import * as C from '../config.js';
import { fmtShort, fmtMoney } from '../core/format.js';
import { h, div, span, ico, rich } from './dom.js';
import { ctx, sfx } from './ctx.js';
import { ING, DRINK, POT } from './data.js';

export function stars(n, size = 16) {
  const w = span('stars');
  const full = Math.floor(n), half = n - full >= 0.5;
  for (let i = 0; i < 5; i++) w.appendChild(ico(i < full ? 'ui_star' : (i === full && half ? 'ui_star_half' : 'ui_star_empty'), size));
  return w;
}

export function mountToasts({ toastRoot, sceneUi }) {
  // ---------------------------------------------------------------- toasts
  const live = [];
  // v1.2: toasts live in the scene corners, small — left = news, right = combo + reviews — so the tables stay visible
  const cornerL = div('corner corner-l'), cornerR = div('corner corner-r');
  sceneUi.appendChild(cornerL); sceneUi.appendChild(cornerR);
  // key: toasts sharing a key update in place (e.g. one combo pill whose number climbs) instead of stacking.
  ctx.toast = (text, kind = 'info', icon = null, key = null) => {
    if (!text) return;
    // de-dupe: same key, or identical text, already visible → refresh it
    const dup = live.find((t) => (key && t.key === key) || t.text === text);
    if (dup) {
      if (dup.text !== text) { dup.text = text; dup.label.textContent = text; dup.el.className = 'toast ' + kind; }
      dup.el.classList.remove('pop'); void dup.el.offsetWidth; dup.el.classList.add('pop');
      clearTimeout(dup.timer); dup.timer = setTimeout(() => drop(dup), 2600);
      return;
    }
    const label = span('', text);
    const el = h('div', { class: 'toast ' + kind, role: 'status' }, icon ? ico(icon, 14) : null, label);
    const right = key === 'combo';
    (right ? cornerR : cornerL).appendChild(el);
    const rec = { el, text, key, label, timer: 0 };
    live.push(rec);
    while (live.filter((t) => t.key !== 'combo').length > 2) drop(live.find((t) => t.key !== 'combo'));
    rec.timer = setTimeout(() => drop(rec), 2600);
  };
  function drop(rec) {
    const i = live.indexOf(rec); if (i < 0) return;
    live.splice(i, 1); clearTimeout(rec.timer);
    rec.el.classList.add('out'); setTimeout(() => rec.el.remove(), 260);
  }

  // ---------------------------------------------------------------- Má
  const momWrap = div('mom-wrap'); sceneUi.appendChild(momWrap);
  const momQ = []; let momShown = 0;
  ctx.mom = (text, { tip = false, who = null } = {}) => {
    if (!text) return;
    momQ.push({ text, tip, who });
    pump();
  };
  function pump() {
    while (momShown < 1 && momQ.length) {
      const m = momQ.shift(); momShown++;
      const el = h('div', { class: 'mom' + (m.tip ? ' tip' : ''), role: 'status' },
        div('av', ico(m.tip ? 'ui_info' : 'ui_mom', 22)),
        div('bd', div('who', m.who || (m.tip ? 'Mẹo nhỏ' : 'Má nhắn'), m.tip ? null : h('i', null, 'vừa xong')), h('p', null, rich(m.text))));
      momWrap.appendChild(el);
      if (m.tip) sfx('pop');                  // real Má messages are voiced by the audio module (mom event)
      let closed = false;
      const close = () => { if (closed) return; closed = true; clearTimeout(t); el.classList.add('out'); setTimeout(() => { el.remove(); momShown--; setTimeout(pump, 200); }, 300); };
      const t = setTimeout(close, Math.max(5000, m.text.length * 55));
      el.addEventListener('pointerdown', close);
    }
  }

  // ---------------------------------------------------------------- reviews
  let revEl = null, revT = 0;
  ctx.reviewPop = (rv) => {
    if (!rv) return;
    if (revEl) { revEl.remove(); clearTimeout(revT); }
    const bad = rv.stars <= 2;
    const el = h('div', { class: 'rev-pop' + (bad ? ' bad' : '') },
      div('rn', span('', rv.name || 'Khách'), stars(rv.stars, 11)),
      div('rt', rv.text || ''));
    cornerR.appendChild(el); revEl = el;
    const close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 300); if (revEl === el) revEl = null; };
    el.addEventListener('pointerdown', close);
    revT = setTimeout(close, 2500);
    if (bad) sfx('grumble'); else if (rv.stars < 5) sfx('sparkle');   // 5★ sparkle comes from audio (review event)
  };

  // ---------------------------------------------------------------- banners
  let banEl = null, banT = 0;
  ctx.banner = (text, kind = 'red', ms = 2600) => {
    if (banEl) { banEl.remove(); clearTimeout(banT); }
    const el = div('banner' + (kind === 'gold' ? ' gold' : ''), text);
    sceneUi.appendChild(el); banEl = el;
    banT = setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); if (banEl === el) banEl = null; }, ms);
  };

  // ---------------------------------------------------------------- game events
  const g = ctx.game;
  const on = (e, f) => g.on(e, (p) => { try { f(p || {}); } catch (err) { console.error('[ui] event ' + e, err); } });
  on('toast', (p) => ctx.toast(p.text, p.kind || 'info', p.icon));
  on('mom', (p) => ctx.mom(p.text));
  on('review', (p) => { const r = p.review || p; if (r && (r.stars >= 4 || r.stars <= 2)) ctx.reviewPop(r); });
  on('rush', (p) => { if (p.on) ctx.banner('GIỜ CAO ĐIỂM! KHÁCH ĐÔNG!', 'red'); });
  // v1.16 đơn ship
  on('shipOrder', (p) => { const o = p.order || {}; const n = (o.drinks || []).length; ctx.toast(`Có đơn ship: ${POT[o.pot]?.name || 'Lẩu'}${n ? ` + ${n} nước` : ''}. Nấu xong Shipper đi giao!`, 'info', 'eq_truck'); });
  on('shipDelivered', (p) => ctx.toast(`Shipper giao xong đơn ${POT[p.order?.pot]?.name || ''} (${p.mins} phút, ${p.stars}★) +${fmtMoney(p.amount)}`, p.stars >= 4 ? 'good' : 'info', 'eq_truck'));
  on('shipCancelled', () => ctx.toast('Khách hủy đơn ship vì chờ lâu quá!', 'bad', 'eq_truck'));
  on('lotteryLady', (p) => { if (p.on) ctx.toast('Cô bán vé số ghé quán kìa — chạm vào cô để mua vé nha!', 'info', 'ui_ticket'); });
  on('stockLow', (p) => ctx.toast(`Sắp hết ${ING[p.ing]?.name?.toLowerCase() || 'hàng'} rồi!`, 'bad', ING[p.ing]?.icon));
  on('stockOut', (p) => ctx.toast(`Hết ${ING[p.ing]?.name?.toLowerCase() || 'hàng'}! Mở Kho nhập thêm nha.`, 'bad', ING[p.ing]?.icon));
  on('expired', (p) => ctx.toast(`Đã bỏ ${p.total} phần hàng hết hạn (−${Math.round(p.value)}k) — mua vừa đủ thôi nha`, 'bad', 'ui_trash'));
  on('hired', (p) => ctx.toast(`${p.staff?.name || 'Nhân viên mới'} vào làm rồi!`, 'good', 'ui_staff'));
  on('staffLevel', (p) => {
    const nm = { spd: 'Nhanh nhẹn', skl: 'Tay nghề', chm: 'Dễ thương' }[p.stat] || '';
    ctx.toast(`${p.staff?.name || 'Nhân viên'} lên cấp! ${nm} +1`, 'good', 'ui_up');
  });
  on('questReady', (p) => {
    ctx.toast(p.kind === 'main' ? 'Mục tiêu xong rồi — bấm nhận thưởng nha!' : 'Nhiệm vụ ngày xong rồi — qua Quán nhận rương nha!', 'good', 'ui_gift');
    sfx('ting');
  });
  on('combo', (p) => { if (p.n >= 3) ctx.toast(`Combo x${p.n}!`, 'good', 'ui_fire', 'combo'); });
  on('comboBreak', (p) => { if (p.n >= 3) ctx.toast('Đứt combo rồi, cố lại nha!', 'info', 'emo_sweat', 'combo'); });
}
