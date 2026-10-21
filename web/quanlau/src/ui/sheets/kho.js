// Sheet 1 — Kho: capacity, auto-restock, per-ingredient buying.
import { h, div, span, ico } from '../dom.js';
import { ctx, act, sfx, S } from '../ctx.js';
import * as D from '../data.js';
import * as C from '../../config.js';
import { fmtShort, fmtMoney } from '../../core/format.js';
import { secTitle, noteBox, celebrate, floatAt, toggle, unitPrice } from './common.js';

function packBtn(id, label, n, price, free, money, rowEl, api) {
  const afford = Math.floor((money + 1e-9) / Math.max(0.01, price));
  const can = free > 0 && afford > 0;
  const real = Math.max(0, Math.min(n, free, afford));
  const cost = real * price;
  const b = h('button', { class: 'btn jade sm pack' + (can ? '' : ' off'), 'aria-label': `Mua ${label} ${D.ING[id].name}` },
    span('lb', label),
    span('pr', real > 0 ? [ico('ui_coin', 16), span('num', fmtShort(cost))] : span('num', '—')));
  b.addEventListener('click', () => {
    const r = act('buyIngredient', id, n);
    if (r.ok === false) return;
    celebrate(b, { sound: 'cash' });
    floatAt(b, '+' + (r.bought ?? real) + ' ' + D.ING[id].short.toLowerCase(), '#2f9a8a');
    ctx.flashMoney?.();
    ctx.tutorial?.onAction?.('buy');
    api.rerender();
  });
  return b;
}

const g = () => ctx.game.get || {};

// ---------------------------------------------------------------- v1.10 Thanh lý hàng cũ (mang từ Xoài Lắc v2.6)
const RATE_TXT = (r) => Math.round(r * 100) + '% vốn';
const LEFT_TXT = (d) => (d <= 0 ? 'hết hạn sau hôm nay' : d === 1 ? 'còn 1 ngày' : `còn ${d} ngày`);
function liquidateView(body, api) {
  const s = S(), L = C.LIQUIDATE;
  const morning = s.phase === 'prep';
  const ids = C.INGREDIENTS.map((i) => i.id).filter((id) => D.stock(id) > 0);
  const quote = (id, n) => g().liquidateQuote?.(id, n) || { ok: false, n: 0, money: 0, basis: 0, groups: [] };
  const old = (id) => g().oldStock?.(id) || 0;
  body.appendChild(noteBox('ui_coin', `**${L.buyer}** mua lại hàng tồn, lô cũ nhất trước. Giá thu: hàng **${LEFT_TXT(0)}** ${RATE_TXT(L.rates[0])}, **còn 1 ngày** ${RATE_TXT(L.rates[1])}, **còn lâu hơn** ${RATE_TXT(L.rates[2])}. Luôn thấp hơn giá mua: bán là chịu lỗ, nhưng đỡ hơn để hư bỏ.`, ''));
  if (!morning) body.appendChild(noteBox('ui_lock', `Chỉ thanh lý được **buổi sáng, trước khi mở hàng** (${L.buyer} ở chợ).`, 'gold'));
  if (!ids.length) { body.appendChild(div('nodata', 'Kho trống, không có gì để thanh lý.')); return; }

  const sell = (id, n, btn) => {
    const r = act('liquidate', id, n);
    if (r.ok === false) { sfx('error'); return; }
    sfx('cash'); if (btn) floatAt(btn, '+' + fmtShort(r.money), '#2f9a8a');
    ctx.toast(`Đã bán ${r.n} phần ${D.ING[id].name.toLowerCase()}: thu ${fmtMoney(r.money)} (lỗ ${fmtMoney(r.loss)} so với vốn)`, 'info', 'ui_coin');
    api.rerender();
  };
  // everything that expires after today, in one go
  const oldIds = ids.filter((id) => old(id) > 0);
  if (oldIds.length) {
    let n = 0, money = 0, basis = 0;
    for (const id of oldIds) { const q = quote(id, old(id)); n += q.n; money += q.money; basis += q.basis; }
    const all = h('button', { class: 'btn red sm', disabled: !morning }, `Bán hết · +${fmtShort(money)}`);
    all.addEventListener('click', () => ctx.confirm({
      title: 'Thanh lý hàng sắp hết hạn?', icon: 'ui_coin', yes: 'Bán hết', no: 'Thôi',
      text: `Bán ${n} phần (${oldIds.length} món) ${LEFT_TXT(0)}: thu ${fmtMoney(money)}, vốn ${fmtMoney(basis)}. Không mua lại được với giá này đâu nha.`,
      onYes: () => { let got = 0, lost = 0; for (const id of oldIds) { const r = act('liquidate', id, old(id)); if (r.ok !== false) { got += r.money; lost += r.loss; } } sfx('cash'); ctx.toast(`Đã thanh lý hàng sắp hạn: thu ${fmtMoney(got)} (lỗ ${fmtMoney(lost)})`, 'info', 'ui_coin'); api.rerender(); },
    }));
    body.appendChild(div('card lq-sum red', ico('ui_clock', 32),
      div('grow', h('b', null, `${n} phần ${LEFT_TXT(0)}`), span('muted sm', `Thu về ${fmtMoney(money)} · vốn ${fmtMoney(basis)}`)), all));
  }
  body.appendChild(secTitle('Hàng trong kho', 'lô cũ bán trước'));
  ids.sort((a, b) => (old(b) > 0) - (old(a) > 0) || D.stock(b) - D.stock(a));
  for (const id of ids) {
    const def = D.ING[id], have = D.stock(id), o = old(id);
    const one = quote(id, 1);
    const unitNow = one.n ? one.money : 0, basisNow = one.n ? one.basis : 0;
    const chips = quote(id).groups.map((gp) => span('chip' + (gp.left <= 0 ? ' red' : gp.left === 1 ? ' gold' : ''), `${gp.n} ${LEFT_TXT(gp.left)} · ${RATE_TXT(gp.rate)}`));
    const btn = (label, n) => {
      const q = quote(id, n);
      const b = h('button', { class: 'btn paper sm lq-b', disabled: !morning || !q.ok }, label, span('lq-m', '+' + fmtShort(q.money)));
      b.addEventListener('click', () => sell(id, n, b));
      return b;
    };
    const btns = div('lq-btns', btn('Bán 1', 1), have >= 5 ? btn('Bán 5', 5) : null, o > 0 && o !== have ? btn(`Bán ${o} sắp hạn`, o) : null, btn(`Bán hết ${have}`, have));
    body.appendChild(div('card lq-row' + (o > 0 ? ' old' : ''),
      div('lq-top', ico(def.icon, 32), div('grow', h('b', null, def.name),
        span('muted sm', `Kho ${have} phần · lô cũ nhất thu ${fmtShort(unitNow)}/phần (vốn ${fmtShort(basisNow)})`)), span('num lq-n', String(have))),
      div('lq-chips', ...chips), btns));
  }
}

export const khoSheet = {
  title: 'Kho hàng',
  icon: 'ui_kho',
  build(body, api) {
    // v1.10: hai tab — nhập hàng (như cũ) và thanh lý hàng cũ
    const hasOld = S().phase === 'prep' && C.INGREDIENTS.some((i) => (g().oldStock?.(i.id) || 0) > 0);
    const sub = api.sub === 'thanhly' ? 'thanhly' : 'nhap';
    api.tabs([{ id: 'nhap', label: 'Nhập hàng', icon: 'ui_kho' }, { id: 'thanhly', label: 'Thanh lý', icon: 'ui_coin', dot: hasOld }], sub, (id) => api.setSub(id));
    if (sub === 'thanhly') { liquidateView(body, api); return; }
    const s = S();
    const info = D.khoInfo();
    const free = Math.max(0, info.cap - info.used);
    const open = D.isOpenPhase();
    const upKho = C.UPGRADES.find((u) => u.id === 'kho');
    const khoName = upKho.levels?.[s.upgrades?.kho || 0] || 'Kho';
    const pct = info.cap ? Math.min(100, (info.used / info.cap) * 100) : 0;

    // ---- capacity
    body.appendChild(div('card cap' + (free === 0 ? ' red' : ''),
      div('cap-top', ico('ui_kho', 32), div('cap-t', h('b', null, khoName), span('muted', free === 0 ? 'Kho đầy rồi nha! Bán bớt hàng cũ ở tab Thanh lý.' : `Còn trống ${free} phần`)),
        div('cap-n', span('num', String(info.used)), span('num dim', '/' + info.cap))),
      div('bar ' + (pct >= 100 ? 'red' : pct > 80 ? '' : 'leaf'), h('i', { style: { '--p': pct } }))));

    // ---- notes
    if (open) body.appendChild(noteBox('ui_info', 'Đang bán vẫn **nhập thêm được** — sắp hết món nào thì mua bổ sung món đó nha!', 'gold'));
    else body.appendChild(noteBox('ui_kho', 'Đồ tươi chỉ để được **2 ngày**, mì và nước lẩu **5 ngày** — mua vừa đủ kẻo bỏ phí nha.', 'jade'));
    if (s.event === 'haisan') body.appendChild(noteBox('ui_megaphone', 'Hải sản rớt giá! **Tôm, mực, cá rẻ hơn 35%** ở chợ hôm nay.', 'jade'));

    // ---- auto restock
    const hasMgr = D.hasStaff('quankho'), hasSup = (s.upgrades?.supplier || 0) > 0;
    if (hasMgr) {
      body.appendChild(noteBox('role_quankho', 'Quản kho lo nhập hàng mỗi sáng, **không mất phí giao**.', 'jade'));
    } else if (hasSup) {
      const on = !!s.autoRestock;
      body.appendChild(div('card row auto' + (on ? ' jade' : ''),
        ico('eq_truck', 32),
        div('grow', h('b', null, 'Tự nhập hàng mỗi sáng'), span('muted', 'Mối chợ giao đủ theo hôm qua, phí ' + Math.round((C.UPGRADES.find((u) => u.id === 'supplier').fee) * 100) + '%')),
        toggle(on, (v) => { const r = act('setAutoRestock', v); if (r.ok !== false) api.rerender(); }, 'Tự nhập hàng')));
    }

    // ---- broth, then ingredients (locked broths are left out: they arrive with their hotpot)
    const row = (ing) => {
      const id = ing.id;
      if (D.boxHidden(ing)) return;   // v1.18 món Hộp mù chưa có
      const unlocked = D.ingUnlocked(id);
      if (!unlocked) {
        if (ing.broth) return;
        const need = ing.needs && C.lvOk(s, ing) ? C.UPGRADES.find((u) => u.id === ing.needs) : null;   // v1.1 tráng miệng
        body.appendChild(div('card ing locked',
          div('ing-top', div('ing-ico', ico(ing.icon, 32, 'dim')), div('ing-name', h('b', null, ing.name), span('muted', need ? `Cần mua ${need.name} (Nâng cấp)` : 'Mở ở Lv ' + ing.unlockLv)), ico('ui_lock', 32))));
        return;
      }
      const price = D.buyPrice(id);
      const trend = s.market?.trend?.[id] || 0;
      const have = D.stock(id);
      const expT = have > 0 ? Math.min(have, D.expiringToday(id)) : 0;
      const row = div('card ing' + (have === 0 ? ' out' : have < 3 ? ' low' : ''));
      row.appendChild(div('ing-top',
        div('ing-ico', ico(ing.icon, 32)),
        div('ing-name', h('b', null, ing.name),
          span('px' + (trend > 0 ? ' up' : trend < 0 ? ' down' : ''), unitPrice(price) + '/phần', trend ? ico(trend > 0 ? 'ui_up' : 'ui_down', 16) : null),
          span('hsd' + (expT ? ' warn' : ''), expT ? `HSD ${D.shelfOf(id)} ngày · ${expT} phần hết hạn sau hôm nay` : `HSD ${D.shelfOf(id)} ngày`)),
        div('ing-stock', span('num' + (have === 0 ? ' zero' : ''), String(have)), h('small', null, 'trong kho'))));
      {
        const btns = div('ing-btns');
        C.MARKET.packs.forEach((n) => btns.appendChild(packBtn(id, '+' + n, n, price, free, s.money, row, api)));
        row.appendChild(btns);
      }
      body.appendChild(row);
    };
    body.appendChild(secTitle('Nước lẩu', 'giá chợ hôm nay'));
    C.INGREDIENTS.filter((i) => i.broth).forEach(row);
    body.appendChild(secTitle('Nguyên liệu', 'giá chợ hôm nay'));
    C.INGREDIENTS.filter((i) => !i.broth && !i.dessert && !i.side).forEach(row);
    // v1.4 món ăn kèm: what the shop can sell now + the next batch still locked (not all 16 at once)
    {
      const sides = C.INGREDIENTS.filter((i) => i.side);
      const nextLv = Math.min(...sides.filter((i) => !i.box && i.unlockLv > (s.level || 1)).map((i) => i.unlockLv), Infinity);
      body.appendChild(secTitle('Món ăn kèm', 'khách gọi cùng nồi lẩu'));
      sides.filter((i) => C.lvOk(s, i) || i.unlockLv === nextLv).forEach(row);
    }
    body.appendChild(secTitle('Tráng miệng', 'khách gọi sau khi ăn lẩu'));
    C.INGREDIENTS.filter((i) => i.dessert).forEach(row);
  },
};
