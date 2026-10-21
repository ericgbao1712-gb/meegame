// v1.18 Hộp mù (Quán ▸ Giải trí ▸ Hộp mù). Bố cục theo mẫu chủ game: lưới bộ sưu tập tô màu theo độ hiếm,
// tỉ lệ, bảo hiểm, mảnh, Đổi mảnh, Tỉ lệ & luật, Mở 1 / Mở 10 hộp, Mở miễn phí hôm nay.
import { h, div, span, ico } from './dom.js';
import { ctx, act, G, S, sfx } from './ctx.js';
import * as D from './data.js';
import * as C from '../config.js';
import { fmtMoney, fmtShort } from '../core/format.js';
import { frame } from './modals.js';
import { lockCard, floatAt } from './sheets/common.js';
import { confettiFor, vibrate } from './screens/kit.js';
import { decoIconURL, lookPreviewURL, makeStaffLook, makeOwnerLook, skinPreviewURL } from '../art/index.js';

const RAR = C.BOX.rar;
const RCLS = ['', 'r1', 'r2', 'r3', 'r4'];
const KIND = {
  food: 'Món ăn mới', drink: 'Đồ uống mới', uniform: 'Đồng phục', look: 'Kiểu chủ quán', pot: 'Kiểu nồi lẩu',
  table: 'Kiểu bàn ghế', deco: 'Đồ trang trí', badge: 'Thẻ thành tích',
};
const FILTERS = [
  { id: 'all', label: 'Tất cả' }, { id: 'mon', label: 'Món', kinds: ['food', 'drink'] }, { id: 'ao', label: 'Trang phục', kinds: ['uniform', 'look'] },
  { id: 'noi', label: 'Nồi & bàn', kinds: ['pot', 'table'] }, { id: 'deco', label: 'Trang trí', kinds: ['deco'] }, { id: 'the', label: 'Thẻ', kinds: ['badge'] },
];
let filter = 'all';
const info = () => G().get?.boxInfo?.() || null;

function img(src, size, cls = '') {
  const im = h('img', { class: 'pix ' + cls, width: size, height: size, alt: '' });
  im.draggable = false;
  try { im.src = src; } catch (e) { /* ignore */ }
  return im;
}
/** Hình của một món trong bộ sưu tập. */
export function itemPic(it, size = 40) {
  try {
    switch (it.kind) {
      case 'food': return ico(D.ING[it.ref]?.icon || 'ui_menu', size);
      case 'drink': return ico(D.DRINK[it.ref]?.icon || 'drk_trada', size);
      case 'uniform': return img(lookPreviewURL(makeStaffLook('phucvu', 1, it.ref, 'tron'), 2), size, 'bx-look');
      case 'look': return img(lookPreviewURL(makeOwnerLook(it.ref, Math.max(1, S().tier || 1)), 2), size, 'bx-look');
      case 'pot': case 'table': return img(skinPreviewURL(it.kind, it.ref, 3), size);
      case 'deco': return img(decoIconURL(it.ref, Math.max(1, Math.round(size / 24))), size);
      case 'badge': return span('bx-emoji', it.emoji);
      default: return ico('ui_gift', size);
    }
  } catch (e) { return ico('ui_gift', size); }
}
const equipped = (it, bi) => (it.kind === 'badge' && bi.badge === it.id) || (it.kind === 'pot' && bi.pot === it.ref) || (it.kind === 'table' && bi.table === it.ref);

/** Quán ▸ Giải trí ▸ Hộp mù */
export function boxView(body, api) {
  const bi = info();
  if (!bi) return;
  if (!bi.unlocked) { body.appendChild(lockCard('Hộp mù', `Mở ở Lv ${C.FEATURES.blindbox}. Rút hộp ra món ăn độc quyền, đồng phục, nồi lẩu, đồ trang trí và thẻ thành tích lên bảng xếp hạng.`, 'ui_gift')); return; }
  const s = S();
  body.appendChild(div('card bx-head',
    ico('ui_gift', 32),
    div('grow', h('b', null, 'Hộp mù Lẩu Ơi'), span('muted sm', `Sưu tầm ${bi.owned}/${bi.total} món · đã mở ${bi.opened} hộp`),
      div('bar', h('i', { style: { '--p': Math.round(bi.owned / bi.total * 100) } })))));
  // lọc
  const fr = div('bx-filter');
  FILTERS.forEach((f) => fr.appendChild(h('button', { class: 'chip' + (filter === f.id ? ' on' : ''), type: 'button', onclick: () => { filter = f.id; sfx('click'); api.rerender(); } }, f.label)));
  body.appendChild(fr);
  // lưới bộ sưu tập (xếp theo độ hiếm như mẫu)
  const fk = FILTERS.find((f) => f.id === filter)?.kinds;
  const grid = div('bx-grid');
  C.BOX.items.filter((it) => !fk || fk.includes(it.kind)).slice().sort((a, b) => a.r - b.r).forEach((it) => {
    const n = bi.got[it.id] || 0;
    const cell = h('button', { class: 'bx-cell ' + RCLS[it.r] + (n ? ' got' : ' miss') + (equipped(it, bi) ? ' eq' : ''), type: 'button', title: n ? it.name : '???', 'aria-label': n ? it.name : 'Chưa có' },
      n ? itemPic(it, 36) : span('bx-q', '?'),
      n > 1 ? span('bx-n', '×' + n) : null,
      equipped(it, bi) ? span('bx-eq', '✓') : null);
    cell.addEventListener('click', () => { sfx('click'); openItem(it, api); });
    grid.appendChild(cell);
  });
  body.appendChild(grid);
  // tỉ lệ
  body.appendChild(div('bx-rates', ...RAR.map((r) => span('bx-rate ' + RCLS[r.id], (r.id === 4 ? '✨ ' : '') + r.name + ' ' + r.rate + '%'))));
  body.appendChild(div('bx-pity',
    div('bx-pc', span('', '🎯'), span('', 'Hiếm chắc chắn sau ', h('b', null, String(bi.rareIn)), ' hộp')),
    div('bx-pc', span('', '✨'), span('', 'Bí ẩn chắc chắn sau ', h('b', null, String(bi.mystIn)), ' hộp'))));
  body.appendChild(div('bx-tools',
    span('bx-shard', '🧩 Mảnh: ', h('b', null, String(bi.shards))),
    h('button', { class: 'btn paper sm', type: 'button', onclick: () => { sfx('click'); openExchange(api); } }, '🧩 Đổi mảnh'),
    h('button', { class: 'btn paper sm', type: 'button', onclick: () => { sfx('click'); openRules(); } }, '📋 Tỉ lệ & luật')));
  const can1 = s.money >= bi.price, can10 = s.money >= bi.price10;
  body.appendChild(div('bx-buy',
    h('button', { class: 'bx-btn one', type: 'button', disabled: !can1, onclick: (e) => doOpen(1, false, e.currentTarget, api) }, h('b', null, 'Mở 1 hộp'), span('', fmtShort(bi.price))),
    h('button', { class: 'bx-btn ten', type: 'button', disabled: !can10, onclick: (e) => doOpen(10, false, e.currentTarget, api) }, h('b', null, 'Mở 10 hộp'), span('', fmtShort(bi.price10)))));
  body.appendChild(h('button', { class: 'bx-btn free' + (bi.freeLeft ? '' : ' used'), type: 'button', disabled: !bi.freeLeft, onclick: (e) => doOpen(1, true, e.currentTarget, api) },
    ico('ui_ticket', 24), h('b', null, bi.freeLeft ? 'Mở miễn phí hôm nay' : 'Mai quay lại mở miễn phí nha')));
  body.appendChild(span('muted sm bx-foot', `💰 Bạn có ${fmtMoney(s.money)} · đã chi ${fmtMoney(bi.spent)} cho hộp mù · 10 hộp chỉ tính tiền 9.`));
}

function doOpen(n, free, btn, api) {
  const r = act('openBox', n, free);
  if (r.ok === false) { sfx('error'); return; }
  sfx('whoosh'); vibrate(20);
  openReveal(r.got, api);
  api.rerender();
}

/** Bảng mở hộp: lật từng món. */
function openReveal(got, api) {
  const best = Math.max(...got.map((g) => g.r));
  const hd = ctx.modal({
    id: 'bxreveal', cls: 'bxreveal', priority: 30, queue: false, sound: best >= 3 ? 'levelup' : 'pop',
    build: (m) => {
      const [head, body] = frame(got.length > 1 ? `Mở ${got.length} hộp` : 'Mở hộp mù', { icon: 'ui_gift', onClose: () => m.close('x') });
      const wrap = div('bx-reveal' + (got.length === 1 ? ' single' : ''));
      got.forEach((g, i) => {
        const it = C.BOX_ITEM[g.id];
        const card = div('bx-rc ' + RCLS[g.r], div('bx-rc-in',
          div('bx-rc-back', ico('ui_gift', 32)),
          div('bx-rc-front', itemPic(it, got.length === 1 ? 72 : 40), h('b', null, it.name),
            span('bx-rc-r', RAR[g.r - 1].name), g.dup ? span('bx-rc-dup', '+' + g.shards + ' mảnh') : span('bx-rc-new', 'MỚI'))));
        card.style.setProperty('--d', (i * (got.length > 1 ? 0.12 : 0) + 0.25) + 's');
        wrap.appendChild(card);
      });
      const news = got.filter((g) => !g.dup).map((g) => C.BOX_ITEM[g.id]);
      body.append(...[wrap,
        news.length ? h('p', { class: 'muted sm bx-hint' }, hintFor(news)) : null,
        h('button', { class: 'btn red lg block', type: 'button', onclick: () => { sfx('confirm'); m.close('ok'); } }, 'Nhận quà')].filter(Boolean));
      return [head, body];
    },
  });
  if (hd && best >= 3) { try { confettiFor(hd, { count: best >= 4 ? 140 : 70 }); } catch (e) { /* ignore */ } }
}
function hintFor(news) {
  const k = new Set(news.map((x) => x.kind));
  const t = [];
  if (k.has('food') || k.has('drink')) t.push('Món mới đã lên Thực đơn (món ăn kèm, tráng miệng cần dụng cụ bếp tương ứng).');
  if (k.has('deco')) t.push('Đồ trang trí mới: vào Quán ▸ Trang trí bấm Dùng.');
  if (k.has('uniform') || k.has('look')) t.push('Trang phục mới: vào Nhân viên ▸ Đồng phục.');
  if (k.has('pot') || k.has('table')) t.push('Kiểu nồi / bàn: chạm vào món trong bộ sưu tập để dùng.');
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
      const [head, body] = frame(n ? it.name : 'Món bí ẩn', { icon: 'ui_gift', onClose: () => m.close('x') });
      const rer = () => { m.close('ok'); api.rerender(); };
      const btns = [];
      if (n) {
        if (['badge', 'pot', 'table'].includes(it.kind)) {
          const on = equipped(it, bi);
          btns.push(h('button', { class: 'btn ' + (on ? 'paper' : 'jade') + ' block', type: 'button', onclick: () => { const r = act('equipBox', it.id, !on); if (r.ok !== false) { sfx('confirm'); rer(); } } }, on ? 'Thôi dùng' : it.kind === 'badge' ? 'Đeo lên bảng xếp hạng' : 'Dùng cho cả quán'));
        }
        if (it.kind === 'deco') btns.push(h('button', { class: 'btn jade block', type: 'button', onclick: () => { m.close('go'); ctx.openSheet('shop', 'deco'); } }, 'Tới Trang trí ▸'));
        if (it.kind === 'uniform' || it.kind === 'look') btns.push(h('button', { class: 'btn jade block', type: 'button', onclick: () => { m.close('go'); ctx.openSheet('staff', 'team'); } }, 'Tới Đồng phục ▸'));
        if (it.kind === 'food' || it.kind === 'drink') btns.push(h('button', { class: 'btn jade block', type: 'button', onclick: () => { m.close('go'); ctx.openSheet('menu'); } }, 'Xem Thực đơn ▸'));
      } else {
        btns.push(h('button', { class: 'btn red block', type: 'button', disabled: bi.shards < cost, onclick: () => { const r = act('exchangeBox', it.id); if (r.ok !== false) { sfx('cash'); m.close('ok'); openReveal(r.got, api); api.rerender(); } } }, `🧩 Đổi ${cost} mảnh (có ${bi.shards})`));
      }
      body.append(...[
        div('bx-big ' + RCLS[it.r] + (n ? '' : ' miss'), n ? itemPic(it, 72) : span('bx-q big', '?')),
        div('bx-meta', span('bx-rate ' + RCLS[it.r], RAR[it.r - 1].name), span('chip', KIND[it.kind])),
        h('p', { class: 'muted sm' }, n ? describe(it) : 'Chưa rút được món này. Mở hộp mù hoặc gom mảnh để đổi.'),
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
    case 'table': return 'Bàn ghế cả quán đổi sang kiểu này.';
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
      const [head, body] = frame('Đổi mảnh', { icon: 'ui_gift', sub: `Bạn có ${bi.shards} mảnh`, onClose: () => m.close('x') });
      const miss = C.BOX.items.filter((x) => !(bi.got[x.id] > 0)).sort((a, b) => a.r - b.r);
      if (!miss.length) body.appendChild(div('nodata', 'Bạn sưu tầm đủ hết rồi! Quá đỉnh.'));
      miss.forEach((it) => {
        const cost = RAR[it.r - 1].cost;
        body.appendChild(div('card row bx-exr',
          div('bx-mini ' + RCLS[it.r], itemPic(it, 32)),
          div('grow', h('b', null, it.name), span('muted sm', RAR[it.r - 1].name + ' · ' + KIND[it.kind])),
          h('button', { class: 'btn sm ' + (bi.shards >= cost ? 'red' : 'paper'), type: 'button', disabled: bi.shards < cost, onclick: () => {
            const r = act('exchangeBox', it.id); if (r.ok === false) return; sfx('cash'); m.close('ok'); openReveal(r.got, api); api.rerender();
          } }, '🧩 ' + cost)));
      });
      return [head, body];
    },
  });
}

function openRules() {
  ctx.modal({
    id: 'bxrules', cls: 'bxrules', priority: 20, queue: false, sound: 'pop',
    build: (m) => {
      const [head, body] = frame('Tỉ lệ & luật Hộp mù', { icon: 'ui_book', onClose: () => m.close('x') });
      const count = (r) => C.BOX.items.filter((x) => x.r === r).length;
      const bi = info();
      body.append(
        h('table', { class: 'bx-table' },
          h('thead', null, h('tr', null, h('th', null, 'Độ hiếm'), h('th', null, 'Tỉ lệ'), h('th', null, 'Số món'), h('th', null, 'Đổi mảnh'))),
          h('tbody', null, ...RAR.map((r) => h('tr', null, h('td', null, span('bx-rate ' + RCLS[r.id], (r.id === 4 ? '✨ ' : '') + r.name)), h('td', null, r.rate + '%'), h('td', null, String(count(r.id))), h('td', null, r.cost + ' 🧩'))))),
        h('ul', { class: 'bx-rules' },
          h('li', null, `1 hộp ${fmtShort(bi.price)} · 10 hộp ${fmtShort(bi.price10)} (tính tiền 9 hộp) · mỗi ngày 1 hộp miễn phí. Giá theo cấp quán.`),
          h('li', null, `Cứ ${C.BOX.pityRare} hộp chắc chắn có ít nhất 1 món Hiếm trở lên.`),
          h('li', null, `Mở đủ ${C.BOX.pityMyst} hộp chắc chắn có món ✨ Bí ẩn.`),
          h('li', null, `Món trùng thành mảnh: ${RAR.map((r) => r.name + ' +' + r.shard).join(', ')}.`),
          h('li', null, 'Phần quà: món ăn / đồ uống độc quyền bán được trong quán, màu đồng phục, kiểu chủ quán, kiểu nồi lẩu, kiểu bàn ghế, đồ trang trí có hiệu ứng, thẻ thành tích hiện trên bảng xếp hạng.'),
          h('li', null, 'Không bán lại, không chuyển cho người khác, không đổi ra tiền.')),
        h('button', { class: 'btn red block', type: 'button', onclick: () => m.close('ok') }, 'Quay lại'));
      return [head, body];
    },
  });
}
