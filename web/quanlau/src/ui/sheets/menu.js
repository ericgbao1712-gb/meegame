// Sheet 2 — Thực đơn: 7 hotpots (enable, recipe level, mastery) + drinks + (v1.6) món ăn kèm, tráng miệng.
import { h, div, span, ico } from '../dom.js';
import { act, sfx, S } from '../ctx.js';
import * as D from '../data.js';
import * as C from '../../config.js';
import { fmtShort, fmtMoney } from '../../core/format.js';
import { secTitle, noteBox, celebrate, floatAt, toggle, costBtn, pips, stars } from './common.js';

function potCard(p, api, fresh) {
  const info = D.recipeInfo(p.id);
  const s = S();
  if (!info.unlocked) {
    return div('card pot locked',
      div('pot-top', div('pot-ico', ico(p.icon, 48, 'dim')),
        div('pot-info', h('b', null, p.name), span('muted', 'Mở ở Lv ' + p.unlockLv),
          div('recipe', p.recipe.map((i) => ico(D.ING[i].icon, 16, 'dim')))),
        ico('ui_lock', 32)));
  }
  const on = !!info.enabled;
  const card = div('card pot' + (on ? '' : ' off') + (fresh ? ' fresh' : ''));
  const rc = div('recipe');
  p.recipe.forEach((i) => {
    const out = D.stock(i) < 1;
    rc.appendChild(div('ri' + (out ? ' out' : ''), ico(D.ING[i].icon, 16)));
  });
  card.appendChild(div('pot-top',
    div('pot-ico', ico(p.icon, 48)),
    div('pot-info',
      div('pn', h('b', null, p.name), fresh ? span('newtag', 'Mới!') : null),
      div('pp', span('num', fmtShort(info.price)), span('muted', '/nồi')),
      rc),
    toggle(on, () => { const r = act('toggleMenuItem', p.id); if (r.ok !== false) api.rerender(); }, 'Bán ' + p.name)));
  // recipe level + mastery
  const maxed = info.cost == null;
  card.appendChild(div('pot-mid',
    div('lv', span('lb', 'Công thức'), pips(info.lvl, info.max), span('num', `${info.lvl}/${info.max}`)),
    div('mast', span('lb', 'Sổ công thức'), stars(info.mastery, 4, 16, 'gold'),
      span('muted sm', info.nextMastery ? `${info.sold}/${info.nextMastery} nồi` : `đã bán ${info.sold} nồi`))));
  const bot = div('pot-bot');
  bot.appendChild(span('muted sm', maxed ? 'Công thức đã đạt tối đa!' : `Lên cấp ${info.lvl + 1}: giá bán ${fmtShort(info.nextPrice)}, nước dùng ngon hơn`));
  if (!maxed) {
    const b = costBtn(info.cost, {
      can: info.canUpgrade, label: 'Nâng ▲',
      onClick: (btn) => { const r = act('upgradeRecipe', p.id); if (r.ok === false) return; celebrate(btn); floatAt(btn, 'Lên cấp ' + (r.lvl ?? info.lvl + 1) + '!', '#e08e2b'); api.rerender(); },
    });
    bot.appendChild(b);
  }
  card.appendChild(bot);
  return card;
}

export const menuSheet = {
  title: 'Thực đơn',
  icon: 'ui_menu',
  build(body, api) {
    api.noTabs();
    const s = S();
    const enabled = C.HOTPOTS.filter((p) => s.menu?.[p.id] && D.potUnlocked(p.id)).length;
    body.appendChild(secTitle('Các món lẩu', `${enabled} món đang bán`));
    const fresh = [];
    C.HOTPOTS.forEach((p) => {
      const isNew = p.unlockLv > 1 && D.potUnlocked(p.id) && !D.seen('pot:' + p.id);
      if (isNew) fresh.push(p.id);
      body.appendChild(potCard(p, api, isNew));
    });
    fresh.forEach((id) => D.markSeen('pot:' + id));

    body.appendChild(secTitle('Nước uống', 'tự tính vốn, không cần nhập kho'));
    C.DRINKS.forEach((d) => {
      const ok = D.drinkUnlocked(d.id);
      body.appendChild(div('card row drink' + (ok ? '' : ' locked'),
        ico(d.icon, 32, ok ? '' : 'dim'),
        div('grow', h('b', null, d.name), span('muted', ok ? `Vốn ${fmtShort(d.cost)} · lời ${fmtShort(d.price - d.cost)}` : 'Mở ở Lv ' + d.unlockLv)),
        ok ? div('dp', span('num', fmtShort(d.price))) : ico('ui_lock', 32)));
    });
    // v1.6 món ăn kèm + tráng miệng: bật/tắt từng món; món tắt thì khách không gọi và quản kho không nhập
    const extraRow = (it, price) => {
      const unl = D.ingUnlocked(it.id);
      const lvOk = s.level >= it.unlockLv;
      const tool = it.needs ? C.UPGRADES.find((u) => u.id === it.needs) : null;
      const on = s.menu?.[it.id] !== false;
      if (!unl) {
        return div('card row drink extra locked',
          ico(it.icon, 32, 'dim'),
          div('grow', h('b', null, it.name), span('muted', lvOk && tool ? `Cần mua ${tool.name} (Nâng cấp)` : 'Mở ở Lv ' + it.unlockLv)),
          div('dp', span('num dim', fmtShort(price))), ico('ui_lock', 32));
      }
      const have = D.stock(it.id);
      return div('card row drink extra' + (on ? '' : ' off'),
        ico(it.icon, 32),
        div('grow', h('b', null, it.name),
          span('muted', `Vốn ${fmtShort(it.cost)} · lời ${fmtShort(price - it.cost)} · kho ${have}`)),
        div('dp', span('num', fmtShort(price))),
        toggle(on, () => { const r = act('toggleExtraItem', it.id); if (r.ok !== false) api.rerender(); }, 'Bán ' + it.name));
    };
    const sides = C.INGREDIENTS.filter((i) => i.side);
    const sidesSelling = sides.filter((i) => D.ingUnlocked(i.id) && s.menu?.[i.id] !== false).length;
    body.appendChild(secTitle('Món ăn kèm', `${sidesSelling} món đang bán · khách gọi cùng nồi lẩu`));
    const nextLv = Math.min(...sides.filter((i) => i.unlockLv > s.level).map((i) => i.unlockLv), Infinity);
    sides.filter((i) => i.unlockLv <= s.level || i.unlockLv === nextLv)
      .forEach((i) => body.appendChild(extraRow(i, D.sidePrice(i.id))));
    const more = sides.filter((i) => i.unlockLv > nextLv).length;
    if (more) body.appendChild(span('muted sm extra-more', `Còn ${more} món ăn kèm mở ở các cấp sau — xem ở bảng "Hành trình lên cấp".`));

    const desserts = C.INGREDIENTS.filter((i) => i.dessert);
    const dsSelling = desserts.filter((i) => D.ingUnlocked(i.id) && s.menu?.[i.id] !== false).length;
    body.appendChild(secTitle('Tráng miệng', `${dsSelling} món đang bán · khách gọi sau khi ăn lẩu`));
    desserts.forEach((i) => body.appendChild(extraRow(i, i.extraPrice)));

    body.appendChild(noteBox('ui_info', 'Mỗi nồi lẩu cần **đủ nguyên liệu trong kho** mới nấu được. Món nào hết hàng sẽ **mờ** ở bếp. Món ăn kèm, tráng miệng **tắt** thì khách không gọi và quản kho không nhập.', ''));
  },
};
