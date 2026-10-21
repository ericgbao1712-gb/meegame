// v1.16 Bảng "Có gì mới": người chơi đã có quán thấy một lần sau mỗi bản cập nhật lớn (flags.ui.seenNews < NEWS.ver).
// Người chơi mới (tạo quán sau bản này) không thấy. Mỗi mục có nút đi tới đúng chỗ trong game.
import { h, div, span, ico } from './dom.js';
import { ctx, S, sfx } from './ctx.js';
import * as C from '../config.js';
import { frame } from './modals.js';
import { confettiFor } from './screens/kit.js';

export const NEWS = {
  ver: 116,
  title: 'Có gì mới trong Lẩu Ơi!',
  items: [
    { icon: 'ui_ticket', title: 'Vé số có số + Dò vé', lv: C.FEATURES.lottery,
      text: 'Cô bán vé số ghé quán: chạm vào cô để mua vé 6 số. Hết ngày quay xổ số, sáng hôm sau vào **Quán ▸ Vé số** để **dò vé** và bấm **Nhận thưởng**. Giải đặc biệt 100 triệu!',
      go: ['shop', 'veso'], goLabel: 'Xem Vé số' },
    { icon: 'ui_ticket', title: 'Trò Đoán số', lv: C.FEATURES.lottery,
      text: `Chọn một số 00–99, đặt tiền cược. Tối đó 2 số cuối giải đặc biệt trùng số của bạn thì nhận **gấp ${C.LOTTERY.guess.payout} lần**. Nút "Chơi Đoán số" ở tab Vé số.` },
    { icon: 'eq_truck', title: 'Nhận đơn ship + Shipper', lv: C.FEATURES.ship,
      text: `Thuê **Shipper** (Nhân viên) là quán nhận đơn ship qua điện thoại. Phiếu **Ship** lên bếp như phiếu thường, nấu xong shipper chạy xe giao tận nhà, khách trả thêm ${C.SHIP.fee}k phí ship. Giao càng nhanh càng được nhiều sao.`,
      go: ['staff', null], goLabel: 'Thuê Shipper' },
    { icon: 'ui_coin', title: 'Tự đặt giá bán', lv: C.FEATURES.pricing,
      text: 'Thực đơn ▸ **Giá bán**: chỉnh giá từng món hoặc cả thực đơn ±5%, ±10%. Rẻ thì đông khách, đắt thì lời nhiều nhưng có người chê.' },
    { icon: 'ui_book', title: 'Đóng thuế', lv: C.FEATURES.tax,
      text: 'Quán lớn rồi thì đóng thuế khoán 4,5% doanh thu, 7 ngày một lần. Gần tới hạn Má sẽ nhắc, trễ hạn bị phạt.' },
  ],
  footer: 'Các mốc mở khóa đã được sắp xếp lại cho đều tay hơn. Xem ở bảng **Hành trình lên cấp**.',
};

const rich = (t) => {   // **đậm**
  const out = [];
  String(t).split(/(\*\*[^*]+\*\*)/).forEach((p) => { if (!p) return; out.push(p.startsWith('**') ? h('b', null, p.slice(2, -2)) : p); });
  return out;
};

export function openWhatsNew({ force = false } = {}) {
  const s = S();
  if (!force && (!s.started || (s.flags?.ui?.seenNews | 0) >= NEWS.ver)) return null;
  ctx.game.act.setFlag?.('seenNews', NEWS.ver);
  const lv = s.level || 1;
  const hd = ctx.modal({
    id: 'whatsnew', cls: 'whatsnew', priority: 25, sound: 'levelup',
    build: (m) => {
      const [head, body] = frame(NEWS.title, { icon: 'ui_gift', onClose: () => m.close('x') });
      body.append(
        div('wn-hero', span('wn-kick', 'BẢN CẬP NHẬT MỚI'), h('b', null, 'Vé số, Đoán số & Đơn ship!')),
        ...NEWS.items.map((it) => div('card wn-item',
          ico(it.icon, 32),
          div('grow',
            div('wn-t', h('b', null, it.title), span('chip ' + (lv >= it.lv ? 'jade' : 'gold') + ' wn-lv', lv >= it.lv ? 'Đã mở' : 'Mở ở Lv ' + it.lv)),
            h('p', null, ...rich(it.text)),
            it.go && lv >= it.lv ? h('button', { class: 'btn paper sm', type: 'button', onclick: () => { sfx('click'); m.close('go'); ctx.openSheet(it.go[0], it.go[1] || undefined); } }, it.goLabel + ' ▸') : null))),
        h('p', { class: 'muted sm wn-foot' }, ...rich(NEWS.footer)),
        h('button', { class: 'btn red lg block', type: 'button', onclick: () => { sfx('confirm'); m.close('ok'); } }, 'Đã hiểu, chơi thôi!'));
      return [head, body];
    },
  });
  if (hd) { try { confettiFor(hd, { count: 60 }); } catch (e) { /* ignore */ } }
  return hd;
}

// Đợi trang chào / màn đăng nhập / hướng dẫn đóng hết rồi mới hiện (không bị che phía sau).
const BLOCKERS = '.splash, .cover, .cl-gate, .coach:not([hidden]), #modal-root .mbox';
export function initWhatsNew() {
  let tries = 0;
  const tick = () => {
    try {
      const s = S();
      if (!s.started || (s.flags?.ui?.seenNews | 0) >= NEWS.ver || tries++ > 400) return;
      if (document.querySelector(BLOCKERS) || document.hidden) { setTimeout(tick, 700); return; }
      openWhatsNew();
    } catch (e) { console.error('[whatsnew]', e); }
  };
  setTimeout(tick, 1500);
}
