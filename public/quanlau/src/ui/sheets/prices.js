// v1.14 Thực đơn ▸ Giá bán (mang từ Xoài Lắc v2.5): tự đặt giá từng món + chỉnh giá CẢ THỰC ĐƠN một lần.
// Mỗi món một thẻ: tên, giá gợi ý, vốn, nút − / +, lời mỗi nồi, bao nhiêu % khách chê đắt.
import { h, div, span, ico } from '../dom.js';
import { ctx, act, sfx, S } from '../ctx.js';
import * as D from '../data.js';
import * as C from '../../config.js';
import { fmtShort } from '../../core/format.js';
import { noteBox, lockCard, unitPrice, secTitle, floatAt } from './common.js';

function priceCard(p, api) {
  const pi = ctx.game.get?.priceInfo?.(p.id);
  if (!pi) return null;
  const set = (v) => {
    const r = act('setPrice', p.id, v);
    if (r.ok === false) return;
    sfx('click'); api.rerender();
  };
  const step = (d) => {
    const v = pi.price + d;
    return h('button', {
      class: 'pstep', type: 'button', disabled: v < pi.min || v > pi.max,
      'aria-label': (d > 0 ? 'Tăng ' : 'Giảm ') + Math.abs(d) + 'k', onclick: () => set(Math.max(pi.min, Math.min(pi.max, v))),
    }, d > 0 ? '+' : '−');
  };
  const band = { cheap: ['jade', 'Rẻ'], normal: ['gold', 'Vừa'], pricey: ['red', 'Cao'] }[pi.band] || ['gold', 'Vừa'];
  const on = !!S().menu?.[p.id];
  return div('card pc-card band-' + pi.band + (on ? '' : ' off'),
    div('pc-top',
      ico(p.icon, 32, 'pc-ico'),
      div('pc-name', h('b', null, p.name), span('muted sm', `Gợi ý ${fmtShort(pi.ref)} · vốn ~${unitPrice(pi.cost)}${on ? '' : ' · đang tắt'}`)),
      div('pc-ctl', step(-1), span('num pc-v', fmtShort(pi.price)), step(1))),
    div('pc-info',
      span('chip ' + band[0], band[1]),
      span(pi.profit > 0 ? 'pe-ok' : 'pe-bad', 'Lời ' + unitPrice(pi.profit) + '/nồi'),
      span('muted', pi.refuse > 0.005 ? '≈ ' + Math.round(pi.refuse * 100) + '% khách chê đắt' : 'Không ai chê đắt'),
      h('span', { class: 'pc-fast' },
        h('button', { class: 'plink', type: 'button', onclick: () => set(Math.max(pi.min, pi.price - 5)) }, '−5'),
        h('button', { class: 'plink', type: 'button', onclick: () => set(Math.min(pi.max, pi.price + 5)) }, '+5'),
        pi.custom ? h('button', { class: 'plink', type: 'button', onclick: () => set(null) }, 'Về gợi ý') : null)));
}

/** Chỉnh cả thực đơn một lần: −10% −5% +5% +10% (so với giá đang bán) và "Về giá gợi ý". */
function bulkCard(api, pots) {
  const infos = pots.map((p) => ctx.game.get?.priceInfo?.(p.id)).filter(Boolean);
  const onMenu = infos.filter((pi) => S().menu?.[pi.id]);
  const avg = onMenu.length ? onMenu.reduce((a, pi) => a + pi.ratio, 0) / onMenu.length : 1;
  const idx = Math.round((avg - 1) * 100);
  const anyCustom = infos.some((pi) => pi.custom);
  const run = (pct, btn) => {
    const r = act('setAllPrices', pct);
    if (r.ok === false) return;
    sfx(pct == null ? 'click' : pct > 0 ? 'cash' : 'pop');
    if (btn) floatAt(btn, pct == null ? 'Về gợi ý' : (pct > 0 ? '+' : '') + pct + '%', pct != null && pct < 0 ? '#2f9a8a' : '#e08e2b');
    ctx.toast(pct == null ? 'Cả thực đơn đã về giá gợi ý.'
      : `Đã ${pct > 0 ? 'tăng' : 'giảm'} giá ${r.changed} món ${Math.abs(pct)}%${r.capped ? ` (${r.capped} món chạm giới hạn giá)` : ''}.`, 'info', 'ui_menu');
    api.rerender();
  };
  const btns = C.PRICING.bulkSteps.map((pct) => {
    const b = h('button', { class: 'btn sm ' + (pct < 0 ? 'jade' : 'red') + ' bulk-b', type: 'button' }, (pct > 0 ? '+' : '−') + Math.abs(pct) + '%');
    b.addEventListener('click', () => run(pct, b));
    return b;
  });
  return div('card bulk-card',
    div('set-row', ico('ui_menu', 32), div('grow', h('b', null, 'Chỉnh giá cả thực đơn'),
      span('muted sm', idx === 0 ? 'Đang bán đúng giá gợi ý.' : `Cả thực đơn đang ${idx > 0 ? 'cao' : 'thấp'} hơn gợi ý ${Math.abs(idx)}%.`))),
    div('bulk-row', btns),
    h('button', { class: 'btn paper sm block', type: 'button', disabled: !anyCustom, onclick: () => run(null) }, 'Tất cả về giá gợi ý'));
}

let priceTab = 'mon';
function ticketCard(t, api) {
  const set = (v) => { const r = act('setFunPrice', t.id, v); if (r.ok === false) return; sfx('click'); api.rerender(); };
  const step = (d) => {
    const v = t.price + d;
    return h('button', { class: 'pstep', type: 'button', disabled: !t.open || v < t.min || v > t.max, 'aria-label': (d > 0 ? 'Tăng ' : 'Giảm ') + Math.abs(d) + 'k',
      onclick: () => set(Math.max(t.min, Math.min(t.max, v))) }, d > 0 ? '+' : '−');
  };
  const band = { cheap: ['jade', 'Rẻ'], normal: ['gold', 'Vừa'], pricey: ['red', 'Cao'] }[t.band] || ['gold', 'Vừa'];
  const pct = Math.round((t.demand - 1) * 100);
  const def = C.FUN.tickets[t.id];
  return div('card pc-card band-' + t.band + (t.open ? '' : ' off'),
    div('pc-top',
      ico(t.icon, 32, 'pc-ico'),
      div('pc-name', h('b', null, t.name), span('muted sm', t.open ? `Gợi ý ${fmtShort(t.ref)}/người · ${t.floor === 1 ? 'tầng trệt' : 'trên lầu'}` : (t.floor === 1 ? 'Mở Photo Studio ở Nâng cấp ▸ Phòng giải trí' : 'Mở Karaoke trên lầu ở Nâng cấp ▸ Phòng giải trí'))),
      div('pc-ctl', step(-1), span('num pc-v', fmtShort(t.price)), step(1))),
    div('pc-info',
      span('chip ' + band[0], band[1]),
      span(pct >= 0 ? 'pe-ok' : 'pe-bad', (pct >= 0 ? 'Khách +' : 'Khách −') + Math.abs(pct) + '%'),
      span('muted', t.open ? (t.playing ? `Đang chơi: ${t.playing} người` : `${t.spots} chỗ chơi`) : def.desc),
      t.open ? h('span', { class: 'pc-fast' },
        h('button', { class: 'plink', type: 'button', onclick: () => set(Math.max(t.min, t.price - 5)) }, '−5'),
        h('button', { class: 'plink', type: 'button', onclick: () => set(Math.min(t.max, t.price + 5)) }, '+5'),
        t.custom ? h('button', { class: 'plink', type: 'button', onclick: () => set(null) }, 'Về gợi ý') : null) : null));
}
function ticketsView(body, api, fi) {
  body.appendChild(noteBox('ui_ticket', `Khách mua vé ở cổng riêng bên phải quán rồi vào chơi. Vé rẻ thì đông, vé đắt thì vắng. Bày thêm đồ trong phòng (Quán ▸ Trang trí ▸ Karaoke & Photo) để có thêm chỗ chơi và đông khách hơn. Hôm nay: **${fi.today.tickets} vé · ${fmtShort(fi.today.revenue)}**.`, fi.level ? 'jade' : ''));
  body.appendChild(secTitle('Giá vé', 'mỗi người'));
  for (const id of Object.keys(fi.tickets)) body.appendChild(ticketCard(fi.tickets[id], api));
  // v1.24 thực đơn trong phòng: mở trong Hộp mù, khách đang chơi tự gọi thêm (giá cố định)
  const own = fi.menu.filter((m) => m.owned).length;
  body.appendChild(secTitle('Thực đơn trong phòng', `${own}/${fi.menu.length} món · hôm nay bán ${fi.today.menu || 0}`));
  body.appendChild(noteBox('ui_hopmu', 'Mồi nhậu, trái cây, bia, rượu, nước uống **mở trong Hộp mù**. Khách vào hát / chụp ảnh sẽ gọi thêm các món đã mở (Karaoke gọi bia rượu, mồi; Photo gọi nước, trái cây).', ''));
  const grid = div('fnm-grid');
  for (const cat of Object.keys(C.FUN.menuCats)) {
    for (const m of fi.menu.filter((x) => x.cat === cat)) {
      grid.appendChild(div('card fnm' + (m.owned ? '' : ' locked'), ico(m.icon, 32), div('grow', h('b', null, m.name),
        span('muted sm', C.FUN.menuCats[cat] + ' · ' + (m.rooms.length > 1 ? 'cả 2 phòng' : m.rooms[0] === 2 ? 'Karaoke' : 'Photo'))),
        m.owned ? span('chip gold num', fmtShort(m.price)) : span('chip', ico('ui_lock', 16), 'Hộp mù')));
    }
  }
  body.appendChild(grid);
}

export function pricesView(body, api) {
  if (!D.featureOn('pricing')) { body.appendChild(lockCard('Tự đặt giá bán', `Mở ở Lv ${C.FEATURES.pricing}. Tới lúc đó món bán theo giá gợi ý.`, 'ui_coin')); return; }
  // v1.20 tab nhỏ: Món lẩu / Vé khu vui chơi (Karaoke & Photo, nhà hàng 2 lầu)
  const fi = ctx.game.get?.funInfo?.();
  if (fi && fi.unlocked) {
    const tabs = div('bx-filter deco-tabs');
    [['mon', 'Món lẩu'], ['ve', 'Vé Karaoke & Photo']].forEach(([id, label]) => tabs.appendChild(h('button', {
      class: 'chip' + (priceTab === id ? ' ink' : ''), type: 'button', onclick: () => { if (priceTab === id) return; priceTab = id; sfx('click'); api.rerender(); },
    }, label)));
    body.appendChild(tabs);
    if (priceTab === 've') { ticketsView(body, api, fi); return; }
  }
  const dm = ctx.game.get?.menuPriceDemand?.() ?? 1;
  const pct = Math.round((dm - 1) * 100);
  body.appendChild(noteBox('ui_coin', `Rẻ thì đông khách nhưng lời ít, đắt thì lời nhiều mỗi nồi nhưng có người chê bỏ về. Mặt bằng giá hiện tại: khách ghé **${pct >= 0 ? '+' : '−'}${Math.abs(pct)}%**.`, pct > 3 ? 'jade' : pct < -3 ? 'red' : ''));
  const pots = C.HOTPOTS.filter((p) => D.potUnlocked(p.id));
  body.appendChild(bulkCard(api, pots));
  body.appendChild(secTitle('Từng món lẩu', pots.length + ' món'));
  pots.forEach((p) => { const c = priceCard(p, api); if (c) body.appendChild(c); });
  body.appendChild(noteBox('ui_info', 'Nước uống, món ăn kèm và tráng miệng bán theo giá cố định. Khách **đặt bàn trước** không bỏ về vì giá.', ''));
}
