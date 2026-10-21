// Day report (TECH_SPEC §9.4): animated tally → stars → best review → level progress → tomorrow's forecast → "Ngày mới".
import * as C from '../../config.js';
import { h, div, span, ico } from '../dom.js';
import { ctx, act, S, sfx } from '../ctx.js';
import * as D from '../data.js';
import { fmtMoney, fmtRating, weekday } from '../../core/format.js';
import { frame } from '../modals.js';
import { stars, portrait, noteBox } from '../sheets/common.js';
import { countUp, createTimeline, wxName } from './kit.js';

const COST_LABEL = { ingredients: 'Nguyên liệu', broth: 'Nước lẩu', drinks: 'Nước uống', salary: 'Lương nhân viên', rent: 'Thuê mặt bằng', marketing: 'Quảng bá', lottery: 'Vé số & đoán số', liquidation: 'Lỗ thanh lý hàng cũ', tax: 'Thuế' };
const COST_ICON = { ingredients: 'ui_kho', broth: 'ui_fire', drinks: 'drk_trada', salary: 'ui_staff', rent: 'ui_home', marketing: 'ui_megaphone', lottery: 'ui_ticket', liquidation: 'ui_coin', tax: 'ui_book' };
const MINUS = '−';

const money = (v) => fmtMoney(Math.round(v * 1000) / 1000);

export function openReport(rep) {
  rep = rep || S().report;
  if (!rep) return null;
  return ctx.modal({ id: 'report', cls: 'report', dismissible: false, priority: 10, sound: 'whoosh', build: (m) => build(m, rep) });
}

function tallyRow(r) {
  const val = span('rv num', r.kind === 'minus' ? MINUS + money(0) : '+' + money(0));
  return { el: div('rp-row ' + r.kind + (r.dim ? ' dim' : ''), span('rl', ico(r.icon, 16), r.label), val), val, ...r };
}

function build(m, rep) {
  const s = S();
  const wx = rep.weather || s.weather;
  const ev = D.eventInfo(rep.event);
  const subBits = [weekday(rep.day), wxName(wx)];
  if (ev) subBits.push(ev.name);
  const [head, body] = frame(`Hết ngày ${rep.day}!`, { icon: D.wxIcon(wx), sub: subBits.filter(Boolean).join(' · ') });

  // ---------------------------------------------------------------- tally
  const lines = [];
  lines.push({ label: 'Doanh thu', v: rep.revenue || 0, kind: 'plus', icon: 'ui_coin' });
  if ((rep.tips || 0) > 0) lines.push({ label: 'Tiền tip', v: rep.tips, kind: 'plus', icon: 'ui_heart' });
  const lot = rep.lottery || {};
  if (lot.won > 0) lines.push({ label: 'Lãnh thưởng vé số', v: lot.won, kind: 'plus', icon: 'ui_ticket' });   // v1.15 tiền đã bấm nhận hôm nay
  Object.keys(rep.costs || {}).forEach((k) => {
    if (rep.costs[k] > 0.0005) lines.push({ label: COST_LABEL[k] || k, v: rep.costs[k], kind: 'minus', icon: COST_ICON[k] || 'ui_coin' });
  });
  const rows = lines.map(tallyRow);
  const profit = rep.profit ?? 0;
  const loss = profit < 0;
  const profitVal = span('num rp-big' + (loss ? ' loss' : ''), money(0));
  const profitRow = div('rp-profit', span('pl', loss ? 'LỖ HÔM NAY' : 'LỢI NHUẬN'), profitVal);
  const tally = div('card rp-tally', ...rows.map((r) => r.el), div('rp-sep'), profitRow);
  profitRow.classList.add('pre');

  // ---------------------------------------------------------------- the rest (revealed one by one)
  const secs = [];
  const sec = (el) => { el.classList.add('rp-sec'); secs.push(el); return el; };

  // stars + rating change
  const avg = rep.avgStars || 0;
  const rb = rep.ratingBefore, ra = rep.ratingAfter;
  const rdiff = ra != null && rb != null ? ra - rb : 0;
  sec(div('card rp-stars',
    div('rs-l', span('muted sm', 'Khách chấm hôm nay'), rep.served > 0 && avg > 0 ? stars(Math.round(avg), 5, 32) : span('muted', 'Chưa có đánh giá'),
      rep.served > 0 && avg > 0 ? span('num rs-avg', fmtRating(avg)) : null),
    ra != null ? div('rs-r', span('muted sm', 'Đánh giá quán'),
      div('rs-rate', ico('ui_star', 32), span('num', fmtRating(ra)), rdiff > 0.04 ? span('rs-d up', ico('ui_up', 16), '+' + fmtRating(rdiff)) : rdiff < -0.04 ? span('rs-d down', ico('ui_down', 16), MINUS + fmtRating(-rdiff)) : null)) : null));

  // stat chips
  const chips = [];
  chips.push(span('chip', ico('ui_staff', 16), `Phục vụ ${rep.served || 0}`));
  if (rep.angry > 0) chips.push(span('chip red', ico('emo_angry', 16), `Bỏ về ${rep.angry}`));
  if (rep.fiveStars > 0) chips.push(span('chip gold', ico('ui_star', 16), `5 sao ×${rep.fiveStars}`));
  if (rep.comboMax >= 2) chips.push(span('chip jade', ico('ui_fire', 16), `Combo ×${rep.comboMax}`));
  if (rep.potsSold > 0) chips.push(span('chip', ico('ui_menu', 16), `${rep.potsSold} nồi lẩu`));
  if (rep.drinksSold > 0) chips.push(span('chip', ico('drk_trada', 16), `${rep.drinksSold} nước`));
  sec(div('rp-chips', chips));

  // best review
  const br = rep.bestReview;
  if (br) {
    sec(div('card rp-review',
      div('rv-top', span('rv-t', ico('ui_review', 16), 'Lời khen nổi bật'), stars(br.stars, 5, 16)),
      h('p', { class: 'rv-q' }, '“' + (br.text || '') + '”'),
      span('muted sm', '— ' + (br.name || 'Khách'))));
  }

  // new regulars
  if (rep.newKinds?.length) {
    const wrap = div('card rp-new', div('rn-t', ico('ui_book', 16), h('b', null, 'Khách mới trong Sổ khách!')));
    const row = div('rn-row');
    rep.newKinds.forEach((k) => row.appendChild(div('rn-k', portrait(D.customerLook(k, 1), 48, 'bk'), span('', C.CUSTOMERS[k]?.name || k))));
    wrap.appendChild(row);
    sec(wrap);
  }

  // level progress
  const lvUp = rep.levelAfter > rep.levelBefore;
  const xpAfter = rep.xpAfter ?? s.xp, xpNeed = rep.xpNeed ?? D.levelInfo().need;
  sec(div('card rp-level' + (lvUp ? ' up' : ''),
    div('rl-top', span('lvbadge', 'Lv ' + (rep.levelAfter ?? s.level)), lvUp ? span('chip gold', ico('ui_up', 16), `Lên cấp ${rep.levelBefore} → ${rep.levelAfter}`) : span('muted sm', 'Kinh nghiệm'), span('num rl-xp', `${Math.round(xpAfter)}/${xpNeed}`)),
    div('bar', h('i', { style: { '--p': Math.min(100, (xpAfter / Math.max(1, xpNeed)) * 100) } }))));

  // tomorrow
  const fc = rep.forecast || {};
  const fev = D.eventInfo(fc.event);
  const resv = rep.reservationsTomorrow?.length || 0;
  sec(div('card rp-fc',
    div('fc-ic', ico(D.wxIcon(fc.weather), 48)),
    div('grow', h('b', null, 'Dự báo ngày mai'),
      h('p', null, fc.text || (wxName(fc.weather) ? 'Ngày mai: ' + wxName(fc.weather) + '.' : '')),
      fev || resv ? div('chips', fev ? span('chip gold', ico('ui_star', 16), fev.name) : null, resv ? span('chip jade', ico('ui_reserve', 16), `${resv} bàn đặt trước`) : null) : null)));

  // v1.16 đơn ship
  const shp = rep.ship || {};
  if (shp.orders > 0) sec(noteBox('eq_truck', `**Đơn ship:** giao ${shp.delivered}/${shp.orders} đơn, thu **${fmtMoney(shp.revenue)}**${shp.cancelled ? ` · ${shp.cancelled} đơn bị hủy vì chờ lâu` : ''}.`, shp.cancelled ? 'red' : 'jade'));
  // v1.15 vé số: tối nay quay, sáng mai dò
  if ((lot.tickets || 0) + (lot.bets || 0) > 0) sec(noteBox('ui_ticket', `Đã quay xổ số! ${lot.tickets ? `**${lot.tickets} vé số**` : ''}${lot.tickets && lot.bets ? ' và ' : ''}${lot.bets ? `**${lot.bets} phiếu đoán số**` : ''} chờ dò. Sáng mai vào **Quán ▸ Vé số** để dò và nhận thưởng nha.`, 'gold'));
  // v1.14 thuế + khách chê đắt
  if (rep.tax && rep.tax.bill) {
    const b = rep.tax.bill, left = b.dueDay - (rep.day || s.day);
    sec(noteBox('ui_book', `**Thông báo thuế** ngày ${b.from}–${b.to}: **${fmtMoney(b.amount)}**, hạn đóng hết ngày ${b.dueDay}${left > 0 ? ` (còn ${left} ngày)` : left === 0 ? ' (hôm nay)' : ` (quá hạn ${-left} ngày)`}. Đóng ở **Quán ▸ Thuế**.`, left < 0 ? 'red' : 'gold'));
  }
  if (rep.priceLost > 0) sec(noteBox('ui_coin', `**${rep.priceLost} nhóm khách** chê đắt bỏ về hôm nay. Xem lại ở **Thực đơn ▸ Giá bán** nha.`, rep.priceLost >= 5 ? 'red' : ''));

  // Má / goal hint
  if (rep.goalHint) sec(noteBox('ui_mom', rep.goalHint, 'gold'));
  const firstTip = ctx.tutorial?.reportTip?.();
  if (firstTip) sec(noteBox('ui_info', firstTip, 'jade'));

  // ---------------------------------------------------------------- footer button
  const go = h('button', { class: 'btn red lg block next', 'aria-label': 'Ngày mới' }, 'Ngày mới ▶');
  go.addEventListener('click', () => {
    const r = act('startNextDay');
    if (r.ok === false) return;
    sfx('confirm');
    m.close('next');
    ctx.tutorial?.onAction?.('nextDay');
  });
  const foot = div('mfoot rp-foot', go);
  foot.classList.add('hide');

  body.append(tally, ...secs);

  // ---------------------------------------------------------------- timeline
  const tl = createTimeline();
  let t = 260;
  const counters = [];
  rows.forEach((r) => {
    const at = t;
    tl.at(at, (instant) => {
      r.el.classList.add('show');
      const fmt = (v) => (r.kind === 'minus' ? MINUS : '+') + money(v);
      const c = countUp(r.val, r.v, { dur: instant ? 0 : 380, fmt });
      counters.push(c);
      if (!instant) sfx('tick');
    });
    t += 340;
  });
  t += 120;
  tl.at(t, (instant) => {
    tally.querySelector('.rp-sep').classList.add('show');
    profitRow.classList.remove('pre'); profitRow.classList.add('show');
    const c = countUp(profitVal, profit, { dur: instant ? 0 : 1000, fmt: (v) => (v < 0 ? MINUS : '') + money(Math.abs(v)),
      onDone: () => { if (!instant && !ctx.reduced) { profitVal.classList.add('pop'); sfx(profit > 0 ? 'cash' : 'click'); } } });
    counters.push(c);
  });
  t += ctx.reduced ? 0 : 1050;
  secs.forEach((el) => {
    tl.at(t, () => { el.classList.add('show'); try { el.scrollIntoView({ block: 'nearest', behavior: ctx.reduced ? 'auto' : 'smooth' }); } catch (e) { /* ignore */ } });
    t += 170;
  });
  tl.at(t + 80, () => { foot.classList.remove('hide'); foot.classList.add('show'); });
  tl.onDone(() => { counters.forEach((c) => c.finish()); foot.classList.remove('hide'); });
  setTimeout(() => { if (!m.closed) tl.start(); }, 60);

  // tap anywhere on the box (except the button) to skip the animation
  m.el.addEventListener('pointerdown', (e) => { if (!go.contains(e.target)) tl.skip(); });
  const prev = m.spec.onClose;
  m.spec.onClose = (why) => { tl.stop(); prev?.(why); };

  return [head, body, foot];
}
