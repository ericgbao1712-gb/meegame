// Sheet 1 — Kho: capacity, auto-restock, per-ingredient buying.
import { h, div, span, ico } from '../dom.js';
import { ctx, act, sfx, S } from '../ctx.js';
import * as D from '../data.js';
import * as C from '../../config.js';
import { fmtShort } from '../../core/format.js';
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

export const khoSheet = {
  title: 'Kho hàng',
  icon: 'ui_kho',
  build(body, api) {
    api.noTabs();
    const s = S();
    const info = D.khoInfo();
    const free = Math.max(0, info.cap - info.used);
    const open = D.isOpenPhase();
    const upKho = C.UPGRADES.find((u) => u.id === 'kho');
    const khoName = upKho.levels?.[s.upgrades?.kho || 0] || 'Kho';
    const pct = info.cap ? Math.min(100, (info.used / info.cap) * 100) : 0;

    // ---- capacity
    body.appendChild(div('card cap' + (free === 0 ? ' red' : ''),
      div('cap-top', ico('ui_kho', 32), div('cap-t', h('b', null, khoName), span('muted', free === 0 ? 'Kho đầy rồi nha!' : `Còn trống ${free} phần`)),
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
      const unlocked = D.ingUnlocked(id);
      if (!unlocked) {
        if (ing.broth) return;
        const need = ing.needs && s.level >= ing.unlockLv ? C.UPGRADES.find((u) => u.id === ing.needs) : null;   // v1.1 tráng miệng
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
      const nextLv = Math.min(...sides.filter((i) => i.unlockLv > (s.level || 1)).map((i) => i.unlockLv), Infinity);
      body.appendChild(secTitle('Món ăn kèm', 'khách gọi cùng nồi lẩu'));
      sides.filter((i) => i.unlockLv <= (s.level || 1) || i.unlockLv === nextLv).forEach(row);
    }
    body.appendChild(secTitle('Tráng miệng', 'khách gọi sau khi ăn lẩu'));
    C.INGREDIENTS.filter((i) => i.dessert).forEach(row);
  },
};
