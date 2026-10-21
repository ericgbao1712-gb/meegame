// Sheet 5 — Quán: sub-tabs (Nhiệm vụ, Trang trí, Đánh giá, Sổ khách, Mở rộng, Quảng bá, Chi nhánh).
import { h, div, span, ico } from '../dom.js';
import { ctx, act, G, S, sfx } from '../ctx.js';
import * as D from '../data.js';
import * as C from '../../config.js';
import { decoIconURL, portraitURL } from '../../art/index.js';
import { fmtShort, fmtMoney, fmtRating, fmtClock } from '../../core/format.js';
import { secTitle, noteBox, stars, celebrate, floatAt, costBtn, lockCard, portrait } from './common.js';
import { questsView } from './quests.js';
import { expandView, branchesView } from './expand.js';
import { leaderboardView } from '../cloud.js';
import { taxView } from '../tax.js';
import { lotteryView } from '../lottery.js';
import { boxView } from '../blindbox.js';

// ------------------------------------------------------------------ Trang trí
function decoThumb(id, size = 48) {
  const img = h('img', { class: 'pix deco-thumb', width: size, height: size, alt: '' });
  img.draggable = false;
  try { img.src = decoIconURL(id, Math.max(1, Math.round(size / 24))); } catch (e) { /* ignore */ }
  return img;
}

function decoView(body, api) {
  const s = S();
  if (!D.featureOn('deco')) { body.appendChild(lockCard('Trang trí quán', `Mở ở Lv ${C.FEATURES.deco}. Đèn lồng, cây kiểng, tranh Đông Hồ… làm quán xinh hơn, khách vui hơn.`, 'ui_deco')); return; }
  const amb = G().get?.ambience?.() ?? 0;
  body.appendChild(div('card amb', ico('ui_heart', 32), div('grow', div('amb-t', h('b', null, 'Không khí quán'), span('num', Math.round(amb * 100) + '%')),
    div('bar ' + (amb > 0.66 ? '' : 'jade'), h('i', { style: { '--p': amb * 100 } })), span('muted sm', 'Không khí đẹp thì khách kiên nhẫn và tip nhiều hơn.')),));
  const owned = new Set(s.deco?.owned || []);
  C.DECO_CATS.forEach((cat) => {
    const eq = s.deco?.equipped?.[cat.id];
    const eqDef = C.DECO.find((d) => d.id === eq);
    body.appendChild(secTitle(cat.name, eqDef && !eqDef.default ? 'đang dùng: ' + eqDef.name : 'chưa trang trí'));
    const grid = div('deco-grid');
    C.DECO.filter((d) => d.cat === cat.id && (!d.box || owned.has(d.id))).forEach((d) => {   // v1.18 đồ Hộp mù: chỉ hiện khi đã rút được
      const isEq = eq === d.id, isOwned = owned.has(d.id);
      const tierLock = (d.minTier || 1) > D.tierNow();
      const lvLock = (d.lv || 1) > (s.level || 1);
      const card = div('card deco' + (isEq ? ' on' : '') + (!isOwned && (tierLock || lvLock || d.source) ? ' locked' : ''));
      card.appendChild(div('deco-pic', decoThumb(d.id, 48), d.amb ? span('chip amb', '+' + d.amb) : null));
      card.appendChild(h('b', { class: 'dn' }, d.default ? 'Không dùng' : d.name));
      if (d.desc) card.appendChild(span('muted sm dd', d.desc));
      if (d.light && !d.default) card.appendChild(span('muted sm dd', `Độ sáng +${Math.round(d.light * 100)} (buổi tối càng rõ)`));
      const act_ = div('deco-act');
      if (isEq) act_.appendChild(span('chip jade', ico('ui_check', 16), 'Đang dùng'));
      else if (isOwned) {
        const b = h('button', { class: 'btn paper sm' }, d.default ? 'Gỡ ra' : 'Dùng');
        b.addEventListener('click', () => { const r = act('equipDeco', d.id); if (r.ok === false) return; sfx('click'); ctx.tutorial?.onAction?.('deco'); api.rerender(); });
        act_.appendChild(b);
      } else if (d.source) act_.appendChild(span('chip', ico('ui_gift', 16), d.source === 'login' ? 'Quà điểm danh' : d.source === 'box' ? 'Hộp mù' : 'Quà tặng'));
      else if (tierLock) act_.appendChild(span('chip red', ico('ui_lock', 16), C.TIERS[d.minTier - 1].name));
      else if (lvLock) act_.appendChild(span('chip red', ico('ui_lock', 16), 'Lv ' + d.lv));
      else {
        act_.appendChild(costBtn(d.price, {
          can: s.money >= d.price, label: 'Mua',
          onClick: (btn) => { const r = act('buyDeco', d.id); if (r.ok === false) return; celebrate(btn); floatAt(btn, 'Xinh quá!', '#e08e2b'); ctx.tutorial?.onAction?.('deco'); api.rerender(); },
        }));
      }
      card.appendChild(act_);
      grid.appendChild(card);
    });
    body.appendChild(grid);
  });
}

// ------------------------------------------------------------------ Đánh giá
function reviewsView(body, api) {
  const s = S();
  const r = s.rating || { avg: 3.5, count: 0, recent: [] };
  const hist = [0, 0, 0, 0, 0];
  (r.recent || []).forEach((x) => { const k = Math.max(1, Math.min(5, Math.round(x))); hist[k - 1]++; });
  const total = hist.reduce((a, b) => a + b, 0) || 1;
  const card = div('card rate');
  card.appendChild(div('rate-big', span('num big', fmtRating(r.avg)), div('rate-st', stars(Math.round(r.avg), 5, 16, 'gold'), span('muted sm', r.count + ' lượt đánh giá'))));
  const hs = div('hist');
  for (let k = 5; k >= 1; k--) hs.appendChild(div('hrow', span('hl', k + '★'), div('bar thin noshine ' + (k >= 4 ? 'leaf' : k === 3 ? '' : 'red'), h('i', { style: { '--p': (hist[k - 1] / total) * 100 } })), span('num hv', String(hist[k - 1]))));
  card.appendChild(hs);
  body.appendChild(card);
  if (s.viral?.days > 0) body.appendChild(noteBox('ui_fire', `Quán đang **${s.viral.mult >= 1 ? 'nổi trên mạng' : 'bị chê trên mạng'}** — khách ${s.viral.mult >= 1 ? 'đông' : 'ít'} hơn trong ${s.viral.days} ngày nữa.`, s.viral.mult >= 1 ? 'jade' : 'red'));
  body.appendChild(secTitle('Khách nói gì?', (s.reviews || []).length ? 'bấm Cảm ơn để nhận XP' : null));
  const list = (s.reviews || []).slice(0, 30);
  if (!list.length) { body.appendChild(div('nodata', 'Chưa có ai đánh giá. Phục vụ khách vui vẻ là có liền nha!')); return; }
  list.forEach((rv) => {
    const card2 = div('card rv' + (rv.stars >= 4 ? '' : rv.stars <= 2 ? ' red' : ''));
    let pic = null;
    try { pic = portrait(D.customerLook(rv.kind || 'sinhvien', 1), 48); } catch (e) { /* ignore */ }
    card2.appendChild(div('rv-top', pic, div('grow', div('rv-n', h('b', null, rv.name || 'Khách'), stars(rv.stars, 5, 16, 'gold')), span('muted sm', `Ngày ${rv.day} · ${fmtClock(rv.clock || 720)}${rv.pot && D.POT[rv.pot] ? ' · ' + D.POT[rv.pot].name : ''}`))));
    card2.appendChild(h('p', { class: 'rv-t' }, '“' + (rv.text || '') + '”'));
    if (rv.thanked) card2.appendChild(div('rv-act', span('chip jade', ico('ui_heart', 16), 'Đã cảm ơn')));
    else {
      const b = h('button', { class: 'btn paper sm' }, ico('ui_heart', 16), 'Cảm ơn ', span('num', '+' + C.LEVEL.thankXp * (C.LEVEL.xpGainMult || 1) + ' XP'));
      b.addEventListener('click', () => { const x = act('thankReview', rv.id); if (x.ok === false) return; sfx('sparkle'); ctx.fx?.puff(ctx.fx.centerOf(b)); api.rerender(); });
      card2.appendChild(div('rv-act', b));
    }
    body.appendChild(card2);
  });
}

// ------------------------------------------------------------------ Sổ khách
function bookView(body) {
  const s = S();
  const kinds = Object.entries(C.CUSTOMERS);
  const met = kinds.filter(([k]) => (s.book?.kinds?.[k] || 0) > 0).length;
  body.appendChild(secTitle('Sổ khách quen', `đã gặp ${met}/${kinds.length}`));
  body.appendChild(div('bar jade', h('i', { style: { '--p': (met / kinds.length) * 100 } })));
  const grid = div('book-grid');
  kinds.forEach(([k, def]) => {
    const n = s.book?.kinds?.[k] || 0;
    const card = div('card bk' + (n ? '' : ' unmet'));
    card.appendChild(div('bk-pic', portrait(D.customerLook(k, 1), 64)));
    card.appendChild(h('b', { class: 'bn' }, n ? def.name : '???'));
    card.appendChild(n ? span('chip jade', '×' + n) : span('muted sm', def.minTier > 1 ? 'Từ ' + C.TIERS[def.minTier - 1].name : 'Chưa gặp'));
    if (n && def.desc) card.appendChild(span('muted sm bd', def.desc));
    grid.appendChild(card);
  });
  body.appendChild(grid);
}

// ------------------------------------------------------------------ Quảng bá
function mktView(body, api) {
  const s = S();
  const prep = s.phase === 'prep';
  if (!prep) body.appendChild(noteBox('ui_clock', 'Quảng bá chỉ chạy được **vào buổi sáng** trước khi mở hàng nha.', 'gold'));
  if ((s.viral?.days || 0) > 0 && (s.viral?.mult || 1) >= 1) body.appendChild(noteBox('ui_fire', `Quán đang nổi trên mạng! Khách đông ×${String(s.viral.mult).replace('.', ',')} thêm ${s.viral.days} ngày.`, 'jade'));
  C.MARKETING.forEach((m) => {
    const cost = C.marketingCost(m, D.tierNow());
    const locked = s.level < m.unlockLv;
    const done = !!s.marketingToday?.[m.id];
    const card = div('card mkt' + (locked ? ' locked' : done ? ' jade' : ''));
    card.appendChild(div('mk-top', ico(m.icon, 48, locked ? 'dim' : ''), div('grow', h('b', null, m.name), h('p', null, m.desc))));
    const bot = div('mk-bot');
    if (locked) bot.appendChild(span('chip red', ico('ui_lock', 16), 'Mở ở Lv ' + m.unlockLv));
    else if (done) bot.appendChild(span('chip jade', ico('ui_check', 16), 'Đã chạy hôm nay'));
    else bot.appendChild(costBtn(cost > 0 ? cost : null, {
      can: prep && s.money >= cost, label: cost > 0 ? 'Chạy' : 'Chạy miễn phí', cls: 'red',
      onClick: (btn) => { const r = act('buyMarketing', m.id); if (r.ok === false) return; celebrate(btn); floatAt(btn, 'Khách sắp đông!', '#e2433b'); api.rerender(); },
    }));
    card.appendChild(bot);
    body.appendChild(card);
  });
}

// ------------------------------------------------------------------ container
const TABS = [
  { id: 'quests', label: 'Nhiệm vụ', icon: 'ui_quest' },
  { id: 'giaitri', label: 'Giải trí', icon: 'ui_hopmu' },   // v1.18 Vé số + Hộp mù (ngay sau Nhiệm vụ)
  { id: 'deco', label: 'Trang trí', icon: 'ui_deco' },
  { id: 'reviews', label: 'Đánh giá', icon: 'ui_review' },
  { id: 'book', label: 'Sổ khách', icon: 'ui_book' },
  { id: 'expand', label: 'Mở rộng', icon: 'ui_shop' },
  { id: 'mkt', label: 'Quảng bá', icon: 'ui_megaphone' },
  { id: 'branches', label: 'Chi nhánh', icon: 'ui_map' },
  { id: 'tax', label: 'Thuế', icon: 'ui_book' },          // v1.14
  { id: 'rank', label: 'Xếp hạng', icon: 'ui_trophy' },   // v1.8
];
const VIEWS = { quests: questsView, deco: decoView, reviews: reviewsView, book: bookView, expand: expandView, mkt: mktView, branches: branchesView, tax: taxView, giaitri: funView, rank: leaderboardView };

// v1.18 tab Giải trí: Vé số + Hộp mù
let fun = 'veso';
function funView(body, api) {
  const li = G().get?.lotteryInfo?.(), bi = G().get?.boxInfo?.();
  const seg = div('seg-row fun-seg');
  [['veso', 'Vé số', 'ui_ticket', !!li && (li.waiting > 0 || li.unclaimed > 0)], ['hopmu', 'Hộp mù', 'ui_hopmu', !!bi && bi.unlocked && bi.freeLeft > 0]].forEach(([id, label, icon, dot]) => {
    seg.appendChild(h('button', { class: 'seg' + (fun === id ? ' on' : ''), type: 'button', onclick: () => { if (fun === id) return; fun = id; sfx('click'); api.rerender(); } }, ico(icon, 16), label, dot ? h('i', { class: 'dot' }) : null));
  });
  body.appendChild(seg);
  (fun === 'hopmu' ? boxView : lotteryView)(body, api);
}

function tabDots() {
  const s = S(); const d = {};
  const mq = D.mainQuest();
  d.quests = !!mq.done || D.dailyList().some((t) => t.done && !t.claimed && !t.failed) || !!(G().get?.loginInfo?.()?.canClaim && s.started);
  d.reviews = (s.reviews || []).some((r) => r.stars >= 5 && !r.thanked);
  d.deco = D.featureOn('deco') && C.DECO.some((x) => !x.default && !x.source && x.price > 0 && (x.minTier || 1) <= D.tierNow() && (x.lv || 1) <= (s.level || 1) && !(s.deco?.owned || []).includes(x.id) && s.money >= x.price);
  d.expand = !!G().get?.tierInfo?.()?.canExpand;
  { const b = G().get?.taxInfo?.()?.bill; d.tax = !!b && b.daysLeft <= C.TAX.remindDays; }   // v1.14
  { const li = G().get?.lotteryInfo?.(), bi = G().get?.boxInfo?.(); d.giaitri = (!!li && (li.waiting > 0 || li.unclaimed > 0)) || (!!bi && bi.unlocked && bi.freeLeft > 0); }   // v1.15 / v1.18
  return d;
}

export const shopSheet = {
  title: 'Quán của mình',
  icon: 'ui_shop',
  build(body, api) {
    let sub = api.sub;
    if (sub === 'veso' || sub === 'hopmu') { fun = sub; sub = 'giaitri'; }   // v1.18 link cũ tới Vé số / link Hộp mù
    if (!VIEWS[sub]) sub = 'quests';
    const dots = tabDots();
    api.tabs(TABS.map((t) => ({ ...t, dot: !!dots[t.id], locked: (t.id === 'branches' && D.tierNow() < 5) || (t.id === 'tax' && !D.featureOn('tax')) || (t.id === 'giaitri' && !D.featureOn('lottery') && !D.featureOn('blindbox') && !(G().get?.lotteryInfo?.()?.list?.length)) })), sub, (id) => api.setSub(id));
    VIEWS[sub](body, api);
  },
};
