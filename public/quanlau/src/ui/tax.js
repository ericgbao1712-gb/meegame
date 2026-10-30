// v1.14 Thuế: tab Quán ▸ Thuế (kỳ đang tính, thông báo cần đóng, lịch sử) + bảng nhắc buổi sáng khi gần / quá hạn.
import { h, div, span, ico } from './dom.js';
import { ctx, act, S, sfx } from './ctx.js';
import * as D from './data.js';
import * as C from '../config.js';
import { fmtMoney } from '../core/format.js';
import { frame } from './modals.js';
import { secTitle, noteBox, lockCard, celebrate } from './sheets/common.js';

const T = C.TAX;
const info = () => ctx.game.get?.taxInfo?.() || null;
const pctTxt = (r) => String(Math.round(r * 1000) / 10).replace('.', ',') + '%';
const dueTxt = (b) => b.overdue ? `quá hạn ${-b.daysLeft} ngày` : b.daysLeft === 0 ? 'hạn chót hôm nay' : `còn ${b.daysLeft} ngày`;

function pay(onDone) {
  const r = act('payTax');
  if (r.ok === false) return false;
  sfx('cash');
  ctx.toast(`Đã đóng thuế ${fmtMoney(r.total)}${r.fee ? ` (gồm ${fmtMoney(r.fee)} tiền phạt)` : ''}. Biên lai cất trong sổ thuế.`, 'good', 'ui_check');
  onDone?.();
  return true;
}

function billCard(b, onPaid) {
  const tone = b.overdue ? 'red' : b.daysLeft <= T.remindDays ? 'gold' : '';
  const btn = h('button', { class: 'btn red block', type: 'button', disabled: S().money + 1e-9 < b.total }, ico('ui_coin', 24), 'Đóng thuế ' + fmtMoney(b.total));
  btn.addEventListener('click', () => { if (pay(onPaid)) celebrate(btn); });
  return div('card tax-bill ' + tone,
    div('tb-head', ico('ui_book', 32), div('grow', h('b', null, `Thông báo thuế ngày ${b.from}–${b.to}`), span('muted sm', `Hạn đóng: hết ngày ${b.dueDay} · ${dueTxt(b)}`))),
    div('tb-rows',
      div('tb-row', span('', 'Doanh thu trong kỳ'), span('num', fmtMoney(b.base))),
      div('tb-row', span('', `Thuế khoán ${pctTxt(T.rate)}`), span('num', fmtMoney(b.amount))),
      b.fee > 0 ? div('tb-row red', span('', `Phạt trễ hạn (${Math.round(T.lateFeePerDay * 100)}%/ngày)`), span('num', fmtMoney(b.fee))) : null,
      div('tb-row total', span('', 'Cần đóng'), span('num', fmtMoney(b.total)))),
    b.overdue ? span('bk-err', `Trễ thêm ${b.forceDay - S().day} ngày nữa là ${T.officer} tới thu luôn, phạt thêm ${Math.round(T.forceFine * 100)}%.`) : null,
    S().money + 1e-9 < b.total ? span('bk-err', `Két chỉ còn ${fmtMoney(S().money)}, bán thêm rồi đóng nha.`) : null,
    btn);
}

/** Quán ▸ Thuế */
export function taxView(body, api) {
  if (!D.featureOn('tax')) {
    body.appendChild(lockCard('Thuế', `Từ Lv ${T && C.FEATURES.tax} quán làm ăn ổn định, phường bắt đầu thu thuế khoán. Tới lúc đó chưa phải đóng.`, 'ui_book'));
    return;
  }
  const t = info();
  if (!t) return;
  body.appendChild(noteBox('ui_book', `Quán nộp **thuế khoán ${pctTxt(t.rate)} doanh thu** (tiền lẩu, nước, món kèm, tráng miệng; không tính tiền tip). Cứ **${t.periodDays} ngày** có một thông báo thuế, hạn đóng **${T.graceDays} ngày**. Trễ hạn bị phạt ${Math.round(T.lateFeePerDay * 100)}% mỗi ngày.`, ''));
  if (t.bill) body.appendChild(billCard(t.bill, () => api.rerender()));
  body.appendChild(secTitle('Kỳ đang tính', `ngày ${t.since}–${t.periodEnd}`));
  const left = Math.max(0, t.periodEnd - S().day + (S().phase === 'report' ? 0 : 1));
  body.appendChild(div('card tax-est',
    div('tb-row', span('', 'Doanh thu đã cộng (tới hết hôm qua)'), span('num', fmtMoney(t.base))),
    div('tb-row', span('', 'Thuế tạm tính'), span('num', fmtMoney(t.estimate))),
    span('muted sm', left > 0 ? `Hết ngày ${t.periodEnd} có thông báo thuế (còn ${left} ngày bán).` : 'Hết hôm nay là có thông báo thuế.')));
  if (t.history.length) {
    body.appendChild(secTitle('Biên lai đã đóng', t.history.length + ' lần'));
    body.appendChild(div('card tax-hist', ...t.history.map((r) => div('tb-row',
      span('', `Ngày ${r.from}–${r.to}`, r.forced ? span('chip red sm-chip', 'Bị thu') : r.early ? span('chip jade sm-chip', 'Sớm') : null),
      span('num', fmtMoney(r.amount + (r.fee || 0)) + (r.fee ? ` (phạt ${fmtMoney(r.fee)})` : ''))))));
  }
}

/** Bảng nhắc buổi sáng: thông báo thuế còn ≤ remindDays ngày hoặc đã quá hạn. Mỗi ngày nhắc một lần. */
export function maybeRemindTax(force = false) {
  const s = S();
  if (!s.started || s.phase !== 'prep') return null;
  const t = info();
  const b = t && t.bill;
  if (!b || b.daysLeft > T.remindDays) return null;
  if (!force && (s.flags?.ui?.taxRemind | 0) === s.day) return null;
  ctx.game.act.setFlag?.('taxRemind', s.day);
  return ctx.modal({
    id: 'taxRemind', cls: 'taxremind', priority: 12, sound: 'whoosh',
    build: (m) => {
      const [head, body] = frame(b.overdue ? 'Quá hạn đóng thuế!' : 'Sắp tới hạn đóng thuế', { icon: 'ui_book', onClose: () => m.close('x') });
      body.append(
        div('tr-lead', ico('ui_mom', 48), h('p', null, b.overdue
          ? `Con ơi, tiền thuế ngày ${b.from}–${b.to} trễ hạn ${-b.daysLeft} ngày rồi, mỗi ngày bị phạt thêm đó. Đóng liền đi con!`
          : b.daysLeft === 0 ? `Hôm nay là hạn chót đóng thuế ngày ${b.from}–${b.to} rồi con. Đóng luôn cho khỏi bị phạt nha!`
            : `Còn ${b.daysLeft} ngày nữa là tới hạn đóng thuế ngày ${b.from}–${b.to}. Đóng sớm cho yên tâm nha con!`)),
        billCard(b, () => m.close('paid')),
        h('button', { class: 'btn paper block', type: 'button', onclick: () => { sfx('click'); m.close('later'); } }, b.overdue ? 'Để sau (vẫn bị phạt)' : 'Để sau'));
      return [head, body];
    },
  });
}

export function initTax(game) {
  const on = (e, f) => game.on(e, (p) => { try { f(p || {}); } catch (err) { console.error('[tax] ' + e, err); } });
  on('phase', (p) => { if (p.phase === 'prep') setTimeout(() => maybeRemindTax(), 900); });
  on('taxForced', (p) => ctx.toast(`${T.officer} đã thu thuế quá hạn ${fmtMoney(p.amount)} + phạt ${fmtMoney(p.fee)}.`, 'bad', 'ui_book'));
  setTimeout(() => maybeRemindTax(), 2500);   // mở game vào buổi sáng (sau trang chào)
}
