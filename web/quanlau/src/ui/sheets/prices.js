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

export function pricesView(body, api) {
  if (!D.featureOn('pricing')) { body.appendChild(lockCard('Tự đặt giá bán', `Mở ở Lv ${C.FEATURES.pricing}. Tới lúc đó món bán theo giá gợi ý.`, 'ui_coin')); return; }
  const dm = ctx.game.get?.menuPriceDemand?.() ?? 1;
  const pct = Math.round((dm - 1) * 100);
  body.appendChild(noteBox('ui_coin', `Rẻ thì đông khách nhưng lời ít, đắt thì lời nhiều mỗi nồi nhưng có người chê bỏ về. Mặt bằng giá hiện tại: khách ghé **${pct >= 0 ? '+' : '−'}${Math.abs(pct)}%**.`, pct > 3 ? 'jade' : pct < -3 ? 'red' : ''));
  const pots = C.HOTPOTS.filter((p) => D.potUnlocked(p.id));
  body.appendChild(bulkCard(api, pots));
  body.appendChild(secTitle('Từng món lẩu', pots.length + ' món'));
  pots.forEach((p) => { const c = priceCard(p, api); if (c) body.appendChild(c); });
  body.appendChild(noteBox('ui_info', 'Nước uống, món ăn kèm và tráng miệng bán theo giá cố định. Khách **đặt bàn trước** không bỏ về vì giá.', ''));
}
