// v1.15 Vé số + Đoán số: tab Quán ▸ Vé số (kết quả, dò vé, nhận thưởng), bảng cô bán vé số, màn Đoán số 3 bước.
import { h, div, span, ico } from './dom.js';
import { ctx, act, S, sfx } from './ctx.js';
import * as D from './data.js';
import * as C from '../config.js';
import { fmtMoney, fmtShort } from '../core/format.js';
import { frame } from './modals.js';
import { secTitle, noteBox, lockCard, celebrate, floatAt } from './sheets/common.js';
import { confettiFor, vibrate } from './screens/kit.js';

const info = () => ctx.game.get?.lotteryInfo?.() || null;
const TIER = Object.fromEntries(C.LOTTERY.tiers.map((t) => [t.id, t]));
const tierName = (id) => (id === 'doan' ? 'Trúng Đoán số' : TIER[id] ? TIER[id].name : '');
let justChecked = new Set();

/** Số khớp ở cuối vé với giải đã trúng (để tô vàng các số đó). */
function matchLen(it) {
  if (it.kind === 'cuoc') return it.prize > 0 ? 2 : 0;
  return it.tier && TIER[it.tier] ? TIER[it.tier].digits : 0;
}

/** Một tờ vé số (hoặc phiếu đoán số). */
function ticketEl(it, { onCheck, onClaim } = {}) {
  const checked = it.status === 'checked' || it.status === 'claimed';
  const m = checked ? matchLen(it) : 0;
  const ds = it.num.split('').map((c, i) => span('tk-d' + (m && i >= it.num.length - m ? ' hit' : ''), c));
  const head = it.kind === 'cuoc'
    ? div('tk-h', span('', 'PHIẾU ĐOÁN SỐ'), span('', 'Ngày ' + it.day))
    : div('tk-h', span('', 'XỔ SỐ LẨU ƠI'), span('', 'Ngày ' + it.day));
  let foot;
  if (it.status === 'wait') foot = span('tk-st muted', 'Tối nay quay số');
  else if (it.status === 'drawn') foot = h('button', { class: 'btn jade sm', type: 'button', onclick: () => onCheck?.(it.id) }, 'Dò vé');
  else if (it.status === 'checked' && it.prize > 0) foot = h('button', { class: 'btn red sm', type: 'button', onclick: (e) => onClaim?.(it.id, e.currentTarget) }, ico('ui_coin', 16), 'Nhận ' + fmtShort(it.prize));
  else if (it.status === 'checked') foot = span('tk-st', 'Trật rồi');
  else if (it.status === 'claimed') foot = span('tk-st ok', 'Đã nhận ' + fmtShort(it.prize));
  else foot = span('tk-st muted', 'Hết hạn lãnh');
  return div('ticket ' + it.kind + ' st-' + it.status + (checked && it.prize > 0 ? ' win' : '') + (justChecked.has(it.id) ? ' just' : ''),
    head,
    div('tk-num', ds),
    div('tk-foot', checked && it.prize > 0 ? span('tk-tier', tierName(it.tier)) : span('', ''), foot));
}

/** Bảng kết quả một ngày. */
function resultBoard(day, r) {
  const rows = C.LOTTERY.tiers.slice().reverse().map((t) => div('rb-row tier-' + t.id,
    span('rb-n', t.name), div('rb-v', (r[t.id] || []).map((x) => span('num rb-x', x))), span('num rb-p', fmtShort(t.prize))));
  return div('card rboard',
    div('rb-head', ico('ui_ticket', 32), div('grow', h('b', null, 'Kết quả xổ số ngày ' + day), span('muted sm', 'Vé trúng khi các số CUỐI của vé trùng một số trong bảng'))),
    div('rb-rows', rows),
    span('muted sm rb-db', `Đoán số: 2 số cuối giải đặc biệt là ${String((r.db && r.db[0]) || '').slice(-2) || '—'}`));
}

function doCheck(id, api) {
  const r = act('checkTickets', id);
  if (r.ok === false) return;
  justChecked = new Set(r.items.map((x) => x.id));
  setTimeout(() => { justChecked = new Set(); }, 1500);
  if (r.won > 0) { sfx('levelup'); ctx.toast(`Trúng ${r.won} vé! Bấm "Nhận" để lãnh thưởng nha.`, 'good', 'ui_ticket'); vibrate([30, 40, 30]); }
  else { sfx('pop'); ctx.toast(r.items.length > 1 ? `Dò ${r.items.length} vé, trật hết rồi. Mai thử lại nha!` : 'Trật rồi, mai thử lại nha!', 'info', 'ui_ticket'); }
  api?.rerender?.();
}
function doClaim(id, btn, api) {
  const r = act('claimPrize', id);
  if (r.ok === false) return;
  sfx('cash');
  if (btn) { celebrate(btn); floatAt(btn, '+' + fmtShort(r.total), '#e08e2b'); }
  try { ctx.fx?.coins({ x: window.innerWidth / 2, y: window.innerHeight * 0.5 }, ctx.moneyAnchor?.(), Math.min(r.total, 3000), () => ctx.flashMoney?.()); } catch (e) { /* ignore */ }
  ctx.toast(`Đã nhận ${fmtMoney(r.total)} tiền thưởng vé số!`, 'good', 'ui_coin');
  if (r.total >= 3000) openBigWin(r.total);
  api?.rerender?.();
}

/** Trúng lớn: bảng chúc mừng. */
function openBigWin(total) {
  const hd = ctx.modal({
    id: 'bigwin', cls: 'celebrate', priority: 30, queue: false, sound: 'levelup',
    build: (m) => div('mbody cel', div('rays on'),
      div('cel-top', ico('ui_ticket', 64), span('cel-kicker', 'XỔ SỐ'), h('b', { class: 'cel-title' }, 'TRÚNG LỚN!')),
      div('off-box', ico('ui_coin', 48), span('num off-big', fmtMoney(total))),
      h('p', { class: 'cel-sub' }, 'Má nói: trúng rồi thì để dành mở rộng quán nha con!'),
      h('button', { class: 'btn red lg block', type: 'button', onclick: () => m.close('ok') }, 'Vui quá!')),
  });
  if (hd) { try { confettiFor(hd, { count: 120 }); } catch (e) { /* ignore */ } }
}

/** Quán ▸ Vé số */
export function lotteryView(body, api) {
  const li = info();
  if (!li) return;
  if (!D.featureOn('lottery') && !li.list.length) { body.appendChild(lockCard('Vé số', `Mở ở Lv ${C.FEATURES.lottery}. Lúc đó cô bán vé số sẽ ghé quán.`, 'ui_ticket')); return; }
  const reapi = { rerender: () => api.rerender() };
  // hành động nhanh
  const acts = [];
  if (li.waiting) acts.push(h('button', { class: 'btn jade', type: 'button', onclick: () => doCheck(null, reapi) }, 'Dò tất cả ' + li.waiting + ' vé'));
  if (li.unclaimed) acts.push(h('button', { class: 'btn red', type: 'button', onclick: (e) => doClaim(null, e.currentTarget, reapi) }, ico('ui_coin', 16), 'Nhận hết thưởng'));
  body.appendChild(div('card lt-top',
    div('set-row', ico('ui_ticket', 32), div('grow', h('b', null, li.waiting ? `Có ${li.waiting} vé chờ dò!` : li.unclaimed ? `Có ${li.unclaimed} vé trúng chờ lãnh!` : 'Sổ vé số'),
      span('muted sm', `Hôm nay: mua ${li.boughtToday}/${li.maxPerDay} vé · đoán số ${li.betsToday}/${li.maxBets} lần. Hết ngày quay số, sáng mai dò.`))),
    acts.length ? div('lt-acts', acts) : null,
    h('button', { class: 'btn paper block', type: 'button', onclick: () => { sfx('click'); openGuess(); } }, '🎯 Chơi Đoán số')));
  if (!li.ladyHere) body.appendChild(noteBox('ui_info', `Mua vé số khi **cô bán vé số** ghé quán (chạm vào cô). ${fmtShort(li.ticketPrice)} một tờ, mỗi ngày tối đa ${li.maxPerDay} tờ.`, ''));
  // kết quả + vé theo ngày
  if (!li.list.length) { body.appendChild(div('nodata', 'Chưa có vé nào. Chạm vào cô bán vé số khi cô ghé quán để mua nha.')); return; }
  const waitToday = li.list.filter((x) => x.status === 'wait');
  if (waitToday.length) {
    body.appendChild(secTitle('Vé hôm nay', 'tối nay quay số'));
    body.appendChild(div('tk-grid', waitToday.map((it) => ticketEl(it))));
  }
  for (const d of li.days) {
    const items = li.list.filter((x) => x.day === d && x.status !== 'wait');
    if (!items.length) continue;
    body.appendChild(secTitle('Ngày ' + d, `lãnh thưởng trước hết ngày ${d + C.LOTTERY.claimDays - 1}`));
    body.appendChild(resultBoard(d, li.results[d]));
    body.appendChild(div('tk-grid', items.map((it) => ticketEl(it, { onCheck: (id) => doCheck(id, reapi), onClaim: (id, b) => doClaim(id, b, reapi) }))));
  }
  body.appendChild(noteBox('ui_mom', 'Vé số chơi cho vui thôi nha con: trung bình mua 10 đồng chỉ về lại chừng 8 đồng. Đừng bỏ tiền vốn vô đây!', 'gold'));
}

/** Chạm vào cô bán vé số. */
export function openLady() {
  return ctx.modal({
    id: 'veso', cls: 'veso', priority: 15, queue: false, sound: 'pop',
    build: (m) => {
      const [head, body] = frame('Cô bán vé số', { icon: 'ui_ticket', onClose: () => m.close('x') });
      const draw = () => {
        body.textContent = '';
        const li = info();
        if (!li) return;
        const today = li.list.filter((x) => x.kind === 've' && x.status === 'wait');
        const left = li.maxPerDay - li.boughtToday;
        const buy = (n, btn) => {
          let got = 0;
          for (let i = 0; i < n; i++) { const r = act('buyLottery'); if (r.ok === false) break; got++; }
          if (got) { sfx('cash'); if (btn) floatAt(btn, '+' + got + ' vé', '#e08e2b'); }
          if (!li.ladyHere || got === 0) { /* message toasted by act */ }
          draw();
        };
        body.append(
          div('tr-lead', ico('ui_mom', 48), h('p', null, li.ladyHere ? 'Mua vé số đi con, tối nay xổ rồi! Mười ngàn một tờ, trúng thì có tiền mở rộng quán.' : 'Cô đi bán chỗ khác rồi. Lần sau cô ghé nha!')),
          today.length ? div('tk-grid', today.map((it) => ticketEl(it))) : null,
          li.ladyHere ? div('lt-acts',
            h('button', { class: 'btn red', type: 'button', disabled: left <= 0, onclick: (e) => buy(1, e.currentTarget) }, 'Mua 1 tờ · ' + fmtShort(li.ticketPrice)),
            h('button', { class: 'btn paper', type: 'button', disabled: left <= 1, onclick: (e) => buy(left, e.currentTarget) }, `Mua ${left > 1 ? left : ''} tờ còn lại`)) : null,
          span('muted sm', left > 0 ? `Hôm nay còn mua được ${left} tờ.` : 'Hôm nay mua đủ 5 tờ rồi.'),
          h('button', { class: 'btn jade block', type: 'button', onclick: () => { sfx('click'); m.close('guess'); openGuess(); } }, '🎯 Chơi Đoán số (đặt cược)'));
      };
      draw();
      return [head, body];
    },
  });
}

/** Đoán số: 3 bước rõ ràng — chọn số, chọn tiền cược, xem trúng được bao nhiêu → Đặt cược. */
export function openGuess() {
  const li0 = info();
  if (!li0) return null;
  if (!D.featureOn('lottery')) { ctx.toast(`Xổ số mở ở Lv ${C.FEATURES.lottery} nha!`, 'info', 'ui_lock'); return null; }
  let num = Math.floor(Math.random() * 100), amt = 0;
  return ctx.modal({
    id: 'guess', cls: 'guess', priority: 16, queue: false, sound: 'whoosh',
    build: (m) => {
      const [head, body] = frame('Đoán số', { icon: 'ui_ticket', onClose: () => m.close('x') });
      const draw = () => {
        body.textContent = '';
        const li = info();
        const lim = li.betLimit, pay = li.payout;
        amt = Math.max(0, Math.min(amt, lim));
        const leftBets = li.maxBets - li.betsToday;
        const closed = S().phase === 'report';
        const nn = String(num).padStart(2, '0');
        const setNum = (v) => { num = (v + 100) % 100; sfx('tick'); draw(); };
        const setAmt = (v) => { amt = Math.max(0, Math.min(lim, Math.round(v))); sfx('tick'); draw(); };
        const digit = (place) => div('gd-col',
          h('button', { class: 'gd-arrow', type: 'button', 'aria-label': 'Tăng', onclick: () => setNum(num + place) }, '▲'),
          span('num gd-d', place === 10 ? nn[0] : nn[1]),
          h('button', { class: 'gd-arrow', type: 'button', 'aria-label': 'Giảm', onclick: () => setNum(num - place) }, '▼'));
        const slider = h('input', { type: 'range', class: 'slider gd-slider', min: '0', max: String(Math.max(1, lim)), step: '10', value: String(amt), 'aria-label': 'Tiền cược' });
        slider.style.setProperty('--p', lim ? (amt / lim) * 100 : 0);
        slider.addEventListener('input', () => { amt = +slider.value; draw(); });
        const chip = (v, label) => h('button', { class: 'chip-b' + (amt === v ? ' on' : ''), type: 'button', disabled: v > lim, onclick: () => setAmt(v) }, label);
        body.append(
          div('gd-rule', h('b', null, 'Cách chơi'),
            div('gd-steps',
              div('gd-step', span('gd-n', '1'), span('', 'Chọn một số từ 00 đến 99')),
              div('gd-step', span('gd-n', '2'), span('', 'Chọn tiền cược')),
              div('gd-step', span('gd-n', '3'), span('', `Tối nay quay số: 2 số cuối giải đặc biệt trùng số của bạn thì nhận gấp ${pay} lần tiền cược`)))),
          div('gd-sec', span('gd-lab', 'Bước 1 · Số của bạn'),
            div('gd-pick', digit(10), digit(1),
              h('button', { class: 'btn paper sm', type: 'button', onclick: () => setNum(Math.floor(Math.random() * 100)) }, 'Số ngẫu nhiên'))),
          div('gd-sec', span('gd-lab', 'Bước 2 · Tiền cược'),
            span('num gd-amt' + (amt ? '' : ' none'), amt ? fmtMoney(amt) : 'Chưa cược'),
            slider,
            div('gd-chips', chip(0, 'Không cược'), ...li.chips.map((v) => chip(v, fmtShort(v))), chip(lim, 'Tối đa · ' + fmtShort(lim))),
            div('gd-step-row',
              h('button', { class: 'pstep', type: 'button', disabled: amt <= 0, onclick: () => setAmt(amt - 10) }, '−'),
              span('num gd-amt-s', fmtShort(amt)),
              h('button', { class: 'pstep', type: 'button', disabled: amt >= lim, onclick: () => setAmt(amt + 10) }, '+'))),
          div('gd-sec gd-sum', span('gd-lab', 'Bước 3 · Kết quả có thể'),
            div('gd-out win', span('', `Trúng (2 số cuối là ${nn})`), span('num', amt ? '+' + fmtMoney(amt * pay) : '—')),
            div('gd-out lose', span('', 'Trật'), span('num', amt ? '−' + fmtMoney(amt) : '—')),
            div('gd-out', span('', 'Cơ hội trúng'), span('num', '1 phần 100'))),
          span('muted sm gd-note', `Cược tối đa ${fmtShort(lim)} (không quá ${Math.round(C.LOTTERY.guess.maxShare * 100)}% tiền đang có, tối đa ${fmtShort(C.LOTTERY.guess.maxBet)}). Hôm nay còn ${Math.max(0, leftBets)} lượt.`),
          closed ? span('bk-err', 'Đã quay số hôm nay rồi, sang ngày mới mới cược được nha.') : null,
          h('button', { class: 'btn red lg block', type: 'button', disabled: closed || !amt || leftBets <= 0, onclick: (e) => {
            const r = act('placeBet', num, amt);
            if (r.ok === false) return;
            sfx('cash'); celebrate(e.currentTarget);
            ctx.toast(`Đã cược ${fmtMoney(amt)} vào số ${nn}. Tối nay quay số, sáng mai vào Quán ▸ Vé số để dò!`, 'info', 'ui_ticket');
            amt = 0; draw();
          } }, amt ? `Đặt cược ${fmtShort(amt)} vào số ${nn}` : 'Chọn tiền cược để đặt'),
          span('muted xs gd-mom', 'Má dặn: chơi cho vui thôi, đừng cược tiền vốn nha con.'));
      };
      draw();
      return [head, body];
    },
  });
}

/** Sáng ra: có vé chờ dò → nhắc một lần mỗi ngày. */
export function initLottery(game) {
  const on = (e, f) => game.on(e, (p) => { try { f(p || {}); } catch (err) { console.error('[lottery] ' + e, err); } });
  const nudge = () => {
    const s = S(), li = info();
    if (!s.started || s.phase !== 'prep' || !li || !li.waiting) return;
    if ((s.flags?.ui?.lotNudge | 0) === s.day) return;
    ctx.game.act.setFlag?.('lotNudge', s.day);
    ctx.modal({
      id: 'lotNudge', cls: 'lotnudge', priority: 11, sound: 'whoosh',
      build: (m) => {
        const [hd, bd] = frame('Có kết quả xổ số rồi!', { icon: 'ui_ticket', onClose: () => m.close('x') });
        bd.append(div('tr-lead', ico('ui_mom', 48), h('p', null, `Tối qua xổ số rồi con! Còn ${li.waiting} vé chưa dò kìa. Dò thử coi trúng không nè.`)),
          h('button', { class: 'btn red lg block', type: 'button', onclick: () => { sfx('click'); m.close('go'); ctx.openSheet('shop', 'veso'); } }, 'Dò vé ngay'),
          h('button', { class: 'btn paper block', type: 'button', onclick: () => m.close('later') }, 'Để sau'));
        return [hd, bd];
      },
    });
  };
  on('phase', (p) => { if (p.phase === 'prep') setTimeout(nudge, 1400); });
  setTimeout(nudge, 3200);
}
