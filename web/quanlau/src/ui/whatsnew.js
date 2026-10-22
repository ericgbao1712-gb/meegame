// v1.16 Bảng "Có gì mới": người chơi đã có quán thấy một lần sau mỗi bản cập nhật lớn (flags.ui.seenNews < NEWS.ver).
// Người chơi mới (tạo quán sau bản này) không thấy. Mỗi mục có nút đi tới đúng chỗ trong game.
import { h, div, span, ico, store } from './dom.js';
import { ctx, S, sfx } from './ctx.js';
import * as C from '../config.js';
import { frame } from './modals.js';
import { confettiFor } from './screens/kit.js';

export const NEWS = {
  // owner 22/10: "bản thông báo chỉ hiển thị một lần" — mỗi bản cập nhật hiện ĐÚNG 1 lần (nhớ cả trong save lẫn trên máy).
  ver: 122,
  title: 'Có gì mới trong Lẩu Ơi!',
  hero: 'Đèn LED vũ trường + tự làm đơn ship!',
  items: [
    { icon: 'eq_truck', title: 'Đơn ship: tự làm + xác nhận', lv: C.FEATURES.ship, isNew: true,
      text: 'Đầu bếp không tự nấu phiếu **Ship** nữa: chủ quán chạm phiếu Ship, **tự soạn mâm** rồi bấm Phục vụ. Phiếu sáng vàng thì chạm lần nữa để **kiểm đơn & Xác nhận giao**, Shipper mới ra lấy hàng.' },
    { icon: 'ui_hopmu', title: 'Đèn LED vũ trường', lv: 28, isNew: true,
      text: 'Món mới **Cực hiếm** trong **Hộp mù**: lắp vào phòng Karaoke là đèn quét màu chạy theo nhạc khi quán mở. Buổi tối phòng **Karaoke & Photo** giờ sáng đèn rực rỡ.',
      go: ['shop', 'hopmu'], goLabel: 'Mở Hộp mù' },
    { icon: 'ui_ticket', title: 'Bán vé Karaoke & Photo', lv: 28,
      text: 'Khu vui chơi bên phải nhà hàng 2 lầu giờ có **khách mua vé ra vào**: chụp ảnh ở Photo Studio tầng trệt, đi **cầu thang mới** lên lầu hát Karaoke. Đặt giá vé ở **Thực đơn ▸ Giá bán ▸ Vé Karaoke & Photo**. Bày thêm đồ trong phòng để có thêm chỗ chơi.',
      go: ['menu', 'gia'], goLabel: 'Đặt giá vé' },
    { icon: 'ui_hopmu', title: 'Phòng giải trí + dãy bên 2 lầu', lv: 28,
      text: 'Nhà hàng 2 lầu mở rộng hai bên: **bên trái** thêm bàn ăn ở tầng trệt và **trên lầu**, **bên phải** là **Phòng giải trí**: Photo Studio tầng trệt, Karaoke trên lầu. 12 món đồ mới (phông chụp, đèn vòng, sân khấu, sofa, quả cầu disco…) nhận từ **Nhiệm vụ Level** và **Hộp mù**. Bày ở **Quán ▸ Trang trí ▸ Phòng giải trí**.',
      go: ['shop', 'deco'], goLabel: 'Xem Phòng giải trí' },
    { icon: 'ui_hopmu', title: 'Hộp mù', lv: C.FEATURES.blindbox,
      text: `Vào **Quán ▸ Giải trí ▸ Hộp mù**. Mỗi ngày mở **1 hộp miễn phí**. Ra món ăn độc quyền, đồng phục, kiểu chủ quán, **nồi lẩu và bàn ghế** đẹp, **robot phục vụ**, **đồ bếp và máy móc** (máy thái thịt, máy bán nước, Xưởng Viên Thả Lẩu…), đồ trang trí, và **thẻ thành tích** hiện trên bảng xếp hạng. Sưu tầm đủ ${C.BOX.items.length} món!`,
      go: ['shop', 'hopmu'], goLabel: 'Mở Hộp mù' },
    { icon: 'ui_ticket', title: 'Tab Giải trí + Giải năm vé số', lv: C.FEATURES.lottery,
      text: `Vé số và Hộp mù nằm chung tab **Giải trí**. Vé số có thêm **Giải năm ${C.LOTTERY.tiers.find((t) => t.id === 'nam').prize}k**: mua đều tay khoảng 2 ngày là có cơ hội trúng.`,
      go: ['shop', 'veso'], goLabel: 'Xem Vé số' },
    { icon: 'ui_xp', title: 'Lên cấp từ Lv 21', lv: 1,
      text: `Từ **Lv ${C.LEVEL.upFrom}** thanh XP cần thêm **${Math.round((C.LEVEL.upMult - 1) * 100)}%** để quán lớn lên vững hơn.` },
    { icon: 'ui_staff', title: 'Quán chứa tới 12 nhân viên', lv: C.STAFF.slotBonus[0][0],
      text: `Lên **Lv ${C.STAFF.slotBonus.map((x) => x[0]).join(', ')}** mỗi mốc mở thêm 1 chỗ nhân viên. Nhà hàng 2 tầng chứa được tối đa **${C.STAFF.maxSlots} người**. Có nhiệm vụ mới: đủ 10 và 12 nhân viên.`,
      go: ['staff', null], goLabel: 'Xem Nhân viên' },
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

// Đã xem chưa: nhớ cả trong save lẫn trên máy này (save trên mạng cũ hơn kéo về cũng không hiện lại).
const seenVer = (s) => Math.max(s.flags?.ui?.seenNews | 0, store.get('seenNews', 0) | 0);
export function openWhatsNew({ force = false } = {}) {
  const s = S();
  if (!force && (!s.started || seenVer(s) >= NEWS.ver)) return null;
  ctx.game.act.setFlag?.('seenNews', NEWS.ver);
  store.set('seenNews', NEWS.ver);
  const lv = s.level || 1;
  const hd = ctx.modal({
    id: 'whatsnew', cls: 'whatsnew', priority: 25, sound: 'levelup',
    build: (m) => {
      const [head, body] = frame(NEWS.title, { icon: 'ui_gift', onClose: () => m.close('x') });
      body.append(
        div('wn-hero', span('wn-kick', 'BẢN CẬP NHẬT MỚI'), h('b', null, NEWS.hero)),
        ...NEWS.items.map((it) => div('card wn-item',
          ico(it.icon, 32),
          div('grow',
            div('wn-t', h('b', null, it.title), it.isNew ? span('chip red wn-lv', 'MỚI') : null, span('chip ' + (lv >= it.lv ? 'jade' : 'gold') + ' wn-lv', lv >= it.lv ? 'Đã mở' : 'Mở ở Lv ' + it.lv)),
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
      if (!s.started || seenVer(s) >= NEWS.ver || tries++ > 400) return;
      if (document.querySelector(BLOCKERS) || document.hidden) { setTimeout(tick, 700); return; }
      openWhatsNew();
    } catch (e) { console.error('[whatsnew]', e); }
  };
  setTimeout(tick, 1500);
}
