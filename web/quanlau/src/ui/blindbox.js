// v1.18 Hộp mù (Quán ▸ Giải trí ▸ Hộp mù): lưới bộ sưu tập tô màu theo độ hiếm, bảo hiểm có thanh tiến độ,
// mảnh sứ + đổi mảnh, luật chơi, mở 1 / 10 hộp, hộp miễn phí mỗi ngày. Phông chữ, nút, chip, icon đều của Lẩu Ơi.
import { h, div, span, ico } from './dom.js';
import { ctx, act, G, S, sfx } from './ctx.js';
import * as D from './data.js';
import * as C from '../config.js';
import { fmtMoney, fmtShort } from '../core/format.js';
import { frame } from './modals.js';
import { lockCard, floatAt, noteBox, celebrate } from './sheets/common.js';
import { confettiFor, vibrate } from './screens/kit.js';
import { badgePlate } from './badge.js';
import { decoIconURL, lookPreviewURL, makeStaffLook, makeOwnerLook, skinPreviewURL } from '../art/index.js';

const RAR = C.BOX.rar;
const RCLS = ['', 'r1', 'r2', 'r3', 'r4'];
const KIND = {
  food: 'Món ăn mới', drink: 'Đồ uống mới', uniform: 'Đồng phục', look: 'Kiểu chủ quán', pot: 'Kiểu nồi lẩu',
  table: 'Màu bàn', chair: 'Màu ghế', tform: 'Dáng bàn', cform: 'Dáng ghế', deco: 'Đồ trang trí', badge: 'Thẻ thành tích',
};
const FILTERS = [
  { id: 'all', label: 'Tất cả' }, { id: 'mon', label: 'Món', kinds: ['food', 'drink'] }, { id: 'ao', label: 'Trang phục', kinds: ['uniform', 'look'] },
  { id: 'noi', label: 'Nồi, bàn, ghế', kinds: ['pot', 'table', 'chair', 'tform', 'cform'] }, { id: 'deco', label: 'Trang trí', kinds: ['deco'], grp: '' }, { id: 'bep', label: 'Đồ bếp', kinds: ['deco'], grp: 'bep' }, { id: 'the', label: 'Thẻ', kinds: ['badge'] },
];
let filter = 'all';
let gridAnim = true;   // v1.18k: lưới chỉ chạy hiệu ứng nảy khi mới mở tab, không chạy lại sau mỗi lần mở hộp
let curSet = 'hop';   // v1.18e chỉ còn Hộp mù (Túi mù đã gộp vào)
const info = () => G().get?.boxInfo?.(curSet) || null;
const unit = () => (curSet === 'tui' ? 'túi' : 'hộp');
const setItems = () => C.BOX.items.filter((x) => x.set === curSet);

function img(src, size, cls = '') {
  const im = h('img', { class: 'pix ' + cls, width: size, height: size, alt: '' });
  im.draggable = false;
  try { im.src = src; } catch (e) { /* ignore */ }
  return im;
}
/** Thẻ thành tích: huy chương pixel (khung theo độ hiếm + icon trong game). */
export function medal(it, size = 40) {
  const m = div('bx-medal ' + RCLS[it.r]);
  m.style.setProperty('--s', size + 'px');
  m.appendChild(ico(it.icon || 'ui_star', Math.round(size * 0.55 / 8) * 8 || 16));
  return m;
}
/** Hình của một món trong bộ sưu tập. */
export function itemPic(it, size = 40) {
  try {
    switch (it.kind) {
      case 'food': return ico(D.ING[it.ref]?.icon || 'ui_menu', size);
      case 'drink': return ico(D.DRINK[it.ref]?.icon || 'drk_trada', size);
      case 'uniform': return img(lookPreviewURL(makeStaffLook('phucvu', 1, it.ref, 'tron'), 2), size, 'bx-look');
      case 'look': return img(lookPreviewURL(makeOwnerLook(it.ref, Math.max(1, S().tier || 1)), 2), size, 'bx-look');
      case 'pot': case 'table': case 'chair': case 'tform': case 'cform': return img(skinPreviewURL(it.kind, it.ref, 3), size);
      case 'deco': return img(decoIconURL(it.ref, Math.max(1, Math.round(size / 24))), size);
      case 'badge': return medal(it, size);
      default: return ico('ui_gift', size);
    }
  } catch (e) { return ico('ui_gift', size); }
}
const equipped = (it, bi) => (it.kind === 'badge' && bi.badge === it.id) || (it.kind === 'pot' && bi.pot === it.ref) || (it.kind === 'table' && bi.table === it.ref) || (it.kind === 'chair' && bi.chair === it.ref) || (it.kind === 'tform' && bi.tform === it.ref) || (it.kind === 'cform' && bi.cform === it.ref);

/** Quán ▸ Giải trí ▸ Hộp mù */
export function boxView(body, api, set = 'hop') {
  curSet = 'hop';
  const bi = info();
  if (!bi) return;
  if (!bi.unlocked) {
    body.appendChild(lockCard(bi.name, curSet === 'tui'
      ? `Mở ở Lv ${bi.unlockLv}. Túi mù ra đồ bếp, máy móc, tiện ích đặt được trong quán: máy thái thịt, máy bán nước, dây chuyền làm mì, Xưởng Viên Thả Lẩu…`
      : `Mở ở Lv ${bi.unlockLv}. Rút hộp ra món ăn độc quyền, đồng phục, nồi lẩu, đồ trang trí và thẻ thành tích lên bảng xếp hạng.`, bi.icon));
    return;
  }
  const s = S();
  body.appendChild(div('card bx-head',
    ico(bi.icon, 48),
    div('grow',
      h('b', { class: 'bx-title' }, bi.name + ' Lẩu Ơi'),
      div('bx-count', span('num', String(bi.owned)), span('muted', '/' + bi.total + ' món · đã mở '), span('num', String(bi.opened)), span('muted', ' ' + unit())),
      div('bar bx-bar', h('i', { style: { '--p': Math.round(bi.owned / bi.total * 100) } })))));
  // lọc
  const fr = div('bx-filter');
  if (curSet === 'hop') FILTERS.forEach((f) => fr.appendChild(h('button', { class: 'chip' + (filter === f.id ? ' ink' : ''), type: 'button', onclick: () => { filter = f.id; sfx('click'); api.rerender(); } }, f.label)));
  if (fr.childNodes.length) body.appendChild(fr);
  // lưới bộ sưu tập
  const F = FILTERS.find((f) => f.id === filter), fk = F?.kinds;
  const okGrp = (it) => !F || F.grp == null || (it.grp || '') === F.grp;
  const grid = div('bx-grid' + (gridAnim ? '' : ' still'));
  gridAnim = true;
  setItems().filter((it) => (!fk || fk.includes(it.kind)) && okGrp(it)).slice().sort((a, b) => a.r - b.r).forEach((it, i) => {
    const n = bi.got[it.id] || 0;
    const cell = h('button', { class: 'bx-cell ' + RCLS[it.r] + (n ? ' got' : ' miss') + (equipped(it, bi) ? ' eq' : ''), type: 'button', title: n ? it.name : '???', 'aria-label': n ? it.name : 'Chưa có' },
      n ? itemPic(it, 36) : ico('ui_lock', 16, 'bx-lock'),
      n > 1 ? span('bx-n num', '×' + n) : null,
      equipped(it, bi) ? ico('ui_check', 16, 'bx-eq') : null);
    cell.style.setProperty('--i', i);
    cell.addEventListener('click', () => { sfx('click'); openItem(it, api); });
    grid.appendChild(cell);
  });
  body.appendChild(grid);
  // tỉ lệ (chip trong game) + bảo hiểm có thanh tiến độ
  body.appendChild(div('bx-rates', ...RAR.map((r) => span('chip bx-rc-chip ' + RCLS[r.id], ico(r.icon, 16), r.name, span('num', r.rate + '%')))));
  const pity = (icon, label, at, max, cls) => div('card bx-pity ' + cls,
    ico(icon, 32),
    div('grow', div('bx-pity-t', span('', label), span('num', `${Math.min(at, max)}/${max}`)),
      div('bar thin noshine', h('i', { style: { '--p': Math.round(Math.min(at, max) / max * 100) } }))));
  body.appendChild(div('bx-pitys',
    pity('ui_star_half', 'Chắc chắn Hiếm', bi.rareAt, bi.pityRare, 'r2'),
    pity('ui_star', 'Chắc chắn Cực hiếm', bi.epicAt, bi.pityEpic, 'r3'),
    pity('ui_chest_gold', 'Chắc chắn Bí ẩn', bi.mystAt, bi.pityMyst, 'r4')));
  body.appendChild(div('card bx-tools',
    ico('ui_manh', 32),
    div('grow', span('muted sm', 'Mảnh sứ'), span('num bx-shards', String(bi.shards))),
    h('button', { class: 'btn paper sm', type: 'button', onclick: () => { sfx('click'); openExchange(api); } }, ico('ui_manh', 16), 'Đổi mảnh'),
    h('button', { class: 'btn paper sm', type: 'button', onclick: () => { sfx('click'); openRules(); } }, ico('ui_book', 16), 'Luật chơi')));
  const can1 = s.money >= bi.price, can10 = s.money >= bi.price10;
  body.appendChild(div('bx-buy',
    h('button', { class: 'btn red lg bx-open', type: 'button', disabled: !can1, onclick: (e) => doOpen(1, false, e.currentTarget, api) }, span('', 'Mở 1 ' + unit()), span('pr', ico('ui_coin', 16), span('num', fmtShort(bi.price)))),
    h('button', { class: 'btn dark lg bx-open', type: 'button', disabled: !can10, onclick: (e) => doOpen(10, false, e.currentTarget, api) }, span('', 'Mở 10 ' + unit()), span('pr', ico('ui_coin', 16), span('num', fmtShort(bi.price10))))));
  body.appendChild(h('button', { class: 'btn jade lg block bx-free' + (bi.freeLeft ? ' glow' : ''), type: 'button', disabled: !bi.freeLeft, onclick: (e) => doOpen(1, true, e.currentTarget, api) },
    ico(bi.icon, 32), bi.freeLeft ? 'Mở miễn phí hôm nay' : 'Mai mở miễn phí tiếp nha'));
  body.appendChild(noteBox('ui_mom', curSet === 'tui'
    ? `Túi mù toàn đồ bếp, máy móc cho quán con: rút được thì vào **Quán ▸ Trang trí** bấm **Dùng**. **10 túi rẻ hơn mua lẻ**, mỗi ngày **1 túi miễn phí**. Đã chi ${fmtMoney(bi.spent)}.`
    : `Má dặn: hộp mù mua cho vui thôi con, **10 hộp rẻ hơn mua lẻ**, mỗi ngày có **1 hộp miễn phí**. Đã chi ${fmtMoney(bi.spent)} cho hộp mù.`, 'gold'));
}

function doOpen(n, free, btn, api) {
  const r = act('openBox', n, free, curSet);
  if (r.ok === false) { sfx('error'); return; }
  sfx('whoosh'); vibrate(20);
  try { if (!free) floatAt(btn, '-' + fmtShort(r.cost), '#b8343a'); } catch (e) { /* ignore */ }
  openReveal(r.got, api);   // lưới cập nhật SAU khi đóng bảng (không vẽ lại 100+ ô lúc đang mở quà)
}

/** Bảng mở hộp: kiểu bảng chúc mừng của Lẩu Ơi (tia sáng + confetti), thẻ lật từng món. */
function openReveal(got, api) {
  const best = Math.max(...got.map((g) => g.r));
  const news = got.filter((g) => !g.dup).length;
  const hd = ctx.modal({
    id: 'bxreveal', cls: 'celebrate bxreveal', priority: 30, queue: false, sound: best >= 3 ? 'levelup' : 'confirm',
    onClose: () => { requestAnimationFrame(() => setTimeout(() => { gridAnim = false; api.rerender(); }, 0)); },
    build: (m) => {
      const wrap = div('bx-reveal' + (got.length === 1 ? ' single' : ''));
      got.forEach((g, i) => {
        const it = C.BOX_ITEM[g.id];
        const card = div('bx-rc ' + RCLS[g.r], div('bx-rc-in',
          div('bx-rc-back', ico(curSet === 'tui' ? 'ui_tuimu' : 'ui_hopmu', 32)),
          div('bx-rc-front', itemPic(it, got.length === 1 ? 72 : 36), h('b', null, it.name),
            span('bx-rc-r', RAR[g.r - 1].name), g.dup ? span('chip bx-rc-dup', ico('ui_manh', 16), '+' + g.shards) : span('chip red bx-rc-new', 'MỚI'))));
        card.style.setProperty('--d', (i * (got.length > 1 ? 0.12 : 0) + 0.3) + 's');
        wrap.appendChild(card);
      });
      const newItems = got.filter((g) => !g.dup).map((g) => C.BOX_ITEM[g.id]);
      return div('mbody cel', div('rays on'),
        div('cel-top', span('cel-kicker', curSet === 'tui' ? 'TÚI MÙ' : 'HỘP MÙ'), h('b', { class: 'cel-title' }, best >= 4 ? 'BÍ ẨN!' : best >= 3 ? 'CỰC HIẾM!' : news ? 'CÓ MÓN MỚI!' : 'MỞ HỘP!')),
        wrap,
        newItems.length ? h('p', { class: 'cel-sub bx-hint' }, hintFor(newItems)) : null,
        h('button', { class: 'btn red lg block', type: 'button', onclick: () => { sfx('confirm'); m.close('ok'); try { m.scrim.remove(); } catch (e) { /* ignore */ } } }, 'Nhận quà'));   // v1.18k đóng ngay, không đợi mờ dần
    },
  });
  if (hd) { try { confettiFor(hd, { count: best >= 4 ? 150 : best >= 3 ? 90 : 40 }); } catch (e) { /* ignore */ } }
}
function hintFor(news) {
  const k = new Set(news.map((x) => x.kind));
  const t = [];
  if (k.has('food') || k.has('drink')) t.push('Món mới đã lên Thực đơn (món ăn kèm, tráng miệng cần dụng cụ bếp tương ứng).');
  if (k.has('deco')) t.push('Đồ trang trí mới: vào Quán ▸ Trang trí bấm Dùng.');
  if (k.has('uniform') || k.has('look')) t.push('Trang phục mới: vào Nhân viên ▸ Đồng phục.');
  if (k.has('pot') || k.has('table') || k.has('chair') || k.has('tform') || k.has('cform')) t.push('Kiểu nồi / bàn / ghế: chạm vào món trong bộ sưu tập để dùng.');
  if (k.has('badge')) t.push('Thẻ thành tích hiện cạnh tên quán trên bảng xếp hạng.');
  return t.join(' ');
}

function openItem(it, api) {
  const bi = info();
  if (!bi) return;
  const n = bi.got[it.id] || 0, cost = RAR[it.r - 1].cost;
  ctx.modal({
    id: 'bxitem', cls: 'bxitem', priority: 20, queue: false, sound: 'pop',
    build: (m) => {
      const [head, body] = frame(n ? it.name : 'Món bí ẩn', { icon: it.set === 'tui' ? 'ui_tuimu' : 'ui_hopmu', onClose: () => m.close('x') });
      const rer = () => { m.close('ok'); api.rerender(); };
      const btns = [];
      if (n) {
        if (['badge', 'pot', 'table', 'chair', 'tform', 'cform'].includes(it.kind)) {
          const on = equipped(it, bi);
          btns.push(h('button', { class: 'btn ' + (on ? 'paper' : 'jade') + ' block', type: 'button', onclick: () => { const r = act('equipBox', it.id, !on); if (r.ok !== false) { sfx('confirm'); rer(); } } }, on ? 'Thôi dùng' : it.kind === 'badge' ? 'Đeo lên bảng xếp hạng' : 'Dùng cho cả quán'));
        }
        if (it.kind === 'deco') btns.push(h('button', { class: 'btn jade block', type: 'button', onclick: () => { m.close('go'); ctx.openSheet('shop', 'deco'); } }, 'Tới Trang trí ▸'));
        if (it.kind === 'uniform' || it.kind === 'look') btns.push(h('button', { class: 'btn jade block', type: 'button', onclick: () => { m.close('go'); ctx.openSheet('staff', 'team'); } }, 'Tới Đồng phục ▸'));
        if (it.kind === 'food' || it.kind === 'drink') btns.push(h('button', { class: 'btn jade block', type: 'button', onclick: () => { m.close('go'); ctx.openSheet('menu'); } }, 'Xem Thực đơn ▸'));
      } else {
        btns.push(h('button', { class: 'btn red block', type: 'button', disabled: bi.shards < cost, onclick: () => { const r = act('exchangeBox', it.id); if (r.ok !== false) { sfx('cash'); m.close('ok'); openReveal(r.got, api); } } }, ico('ui_manh', 16), `Đổi ${cost} mảnh (có ${bi.shards})`));
      }
      body.append(...[
        div('bx-big ' + RCLS[it.r] + (n ? '' : ' miss'), n ? itemPic(it, 72) : ico('ui_lock', 48, 'bx-lock')),
        div('bx-meta', span('chip bx-rc-chip ' + RCLS[it.r], ico(RAR[it.r - 1].icon, 16), RAR[it.r - 1].name), span('chip', KIND[it.kind])),
        it.kind === 'badge' ? div('bx-plate-pv', span('muted sm', 'Trên bảng xếp hạng:'), badgePlate(it.id, { big: true })) : null,
        h('p', { class: 'muted sm' }, n ? describe(it) : `Chưa rút được món này. Mở ${it.set === 'tui' ? 'túi mù' : 'hộp mù'} hoặc gom mảnh để đổi.`),
        n > 1 ? span('muted sm bx-dupn', `Đã rút ${n} lần (trùng thành mảnh).`) : null,
        ...btns].filter(Boolean));
      return [head, body];
    },
  });
}
function describe(it) {
  switch (it.kind) {
    case 'food': { const i = D.ING[it.ref]; const tool = i?.needs ? C.UPGRADES.find((u) => u.id === i.needs) : null; return `${i?.dessert ? 'Tráng miệng' : 'Món ăn kèm'} độc quyền: bán ${i?.extraPrice}k, vốn ${i?.cost}k.` + (tool ? ` Cần ${tool.name}.` : ''); }
    case 'drink': { const d = D.DRINK[it.ref]; return `Đồ uống độc quyền: bán ${d?.price}k, vốn ${d?.cost}k. Khách gọi kèm nồi lẩu.`; }
    case 'uniform': return 'Màu đồng phục độc quyền, chọn cho nhân viên hoặc chủ quán.';
    case 'look': return 'Kiểu chủ quán dùng được ngay, không cần đợi tới cấp.';
    case 'pot': return 'Mọi nồi lẩu trên bàn và trên bếp đổi sang kiểu này.';
    case 'table': return 'Mọi bàn lẩu trong quán đổi sang màu này (ghế chọn riêng ở Màu ghế).';
    case 'chair': return 'Mọi ghế ngồi quanh bàn đổi sang màu này (bàn chọn riêng ở Màu bàn).';
    case 'tform': return 'Mọi bàn trong quán đổi sang dáng này. Dùng chung được với Màu bàn.';
    case 'cform': return 'Mọi ghế quanh bàn đổi sang dáng này. Dùng chung được với Màu ghế.';
    case 'deco': { const d = C.DECO.find((x) => x.id === it.ref); return `Trang trí ${C.DECO_CATS.find((c) => c.id === d?.cat)?.name.toLowerCase() || ''}, không khí +${d?.amb || 0}.` + (d?.desc ? ' ' + d.desc : ''); }
    case 'badge': return 'Thẻ thành tích: đeo lên là hiện cạnh tên quán trên bảng xếp hạng.';
    default: return '';
  }
}

function openExchange(api) {
  ctx.modal({
    id: 'bxex', cls: 'bxex', priority: 20, queue: false, sound: 'pop',
    build: (m) => {
      const bi = info();
      const [head, body] = frame('Đổi mảnh sứ', { icon: 'ui_manh', sub: `Bạn có ${bi.shards} mảnh`, onClose: () => m.close('x') });
      const miss = setItems().filter((x) => !(bi.got[x.id] > 0)).sort((a, b) => a.r - b.r);
      if (!miss.length) body.appendChild(div('nodata', 'Bạn sưu tầm đủ hết rồi! Quá đỉnh.'));
      miss.forEach((it) => {
        const cost = RAR[it.r - 1].cost;
        body.appendChild(div('card row bx-exr',
          div('bx-mini ' + RCLS[it.r], itemPic(it, 32)),
          div('grow', h('b', null, it.name), span('muted sm', RAR[it.r - 1].name + ' · ' + KIND[it.kind])),
          h('button', { class: 'btn sm ' + (bi.shards >= cost ? 'red' : 'paper'), type: 'button', disabled: bi.shards < cost, onclick: () => {
            const r = act('exchangeBox', it.id); if (r.ok === false) return; sfx('cash'); m.close('ok'); openReveal(r.got, api);
          } }, ico('ui_manh', 16), span('num', String(cost)))));
      });
      return [head, body];
    },
  });
}

function openRules() {
  ctx.modal({
    id: 'bxrules', cls: 'bxrules', priority: 20, queue: false, sound: 'pop',
    build: (m) => {
      const bi = info();
      const [head, body] = frame('Luật chơi ' + bi.name, { icon: 'ui_book', onClose: () => m.close('x') });
      const count = (r) => setItems().filter((x) => x.r === r).length;
      const u = unit();
      body.append(
        h('table', { class: 'bx-table' },
          h('thead', null, h('tr', null, h('th', null, 'Độ hiếm'), h('th', null, 'Tỉ lệ'), h('th', null, 'Số món'), h('th', null, 'Trùng'), h('th', null, 'Đổi'))),
          h('tbody', null, ...RAR.map((r) => h('tr', null,
            h('td', null, span('chip bx-rc-chip ' + RCLS[r.id], ico(r.icon, 16), r.name)),
            h('td', null, span('num', r.rate + '%')), h('td', null, span('num', String(count(r.id)))),
            h('td', null, span('num', '+' + r.shard)), h('td', null, span('num', String(r.cost))))))),
        h('ul', { class: 'bx-rules' },
          h('li', null, `Giá theo cấp quán: bây giờ ${fmtShort(bi.price)} một ${u}, mở 10 ${u} ${fmtShort(bi.price10)} (rẻ hơn mua lẻ ${fmtShort(bi.price * 10 - bi.price10)}). Mỗi ngày trong game được mở 1 ${u} miễn phí.`),
          h('li', null, `Bảo hiểm: ${bi.pityRare} ${u} liền chưa ra Hiếm thì ${u} kế tiếp chắc chắn Hiếm trở lên; ${bi.pityEpic} ${u} chắc chắn Cực hiếm trở lên; ${bi.pityMyst} ${u} chắc chắn Bí ẩn. Ra món đó rồi thì đếm lại từ đầu.`),
          h('li', null, 'Ra món đã có thì thành mảnh sứ (cột "Trùng"). Mảnh dùng chung cho Hộp mù và Túi mù, gom để đổi đúng món còn thiếu (cột "Đổi").'),
          h('li', null, 'Món ăn, đồ uống độc quyền tự lên Thực đơn; món ăn kèm, tráng miệng cần dụng cụ bếp như món thường.'),
          h('li', null, 'Đồ trang trí vào Quán ▸ Trang trí để dùng, có món tăng khách, tip hoặc độ kiên nhẫn. Kiểu nồi, kiểu bàn, thẻ thành tích bấm vào món trong bộ sưu tập để dùng.'),
          h('li', null, 'Thẻ thành tích đang đeo hiện cạnh tên quán trên bảng xếp hạng.')),
        h('button', { class: 'btn red block', type: 'button', onclick: () => m.close('ok') }, 'Đã hiểu'));
      return [head, body];
    },
  });
}
