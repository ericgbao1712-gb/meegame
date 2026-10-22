// v1.25 (từ Lẩu Ơi) khung avatar + thẻ tên ADMIN vàng hoàng gia — chỉ tài khoản admin (máy chủ gắn cờ admin)
import { span } from './dom.js';

// ───────────── v1.25 khung avatar + thẻ tên ADMIN (vàng hoàng gia) — chỉ tài khoản admin (máy chủ gắn cờ admin) ─────────────
const SVGNS = 'http://www.w3.org/2000/svg';
function crownSvg(cls = 'adm-crown') {
  const s = document.createElementNS(SVGNS, 'svg');
  s.setAttribute('viewBox', '0 0 16 12'); s.setAttribute('class', cls); s.setAttribute('aria-hidden', 'true');
  s.innerHTML = '<path d="M1 4 L4.5 7 L8 1 L11.5 7 L15 4 L13.5 11 L2.5 11 Z" fill="#ffd34d" stroke="#7a3b00" stroke-width="1" stroke-linejoin="round"/>'
    + '<rect x="2.5" y="9" width="11" height="2" fill="#e8a50f"/><circle cx="8" cy="1.4" r="1.2" fill="#ff4d6d" stroke="#7a3b00" stroke-width=".6"/>'
    + '<circle cx="1.2" cy="4" r="1" fill="#4dd2ff" stroke="#7a3b00" stroke-width=".5"/><circle cx="14.8" cy="4" r="1" fill="#4dd2ff" stroke="#7a3b00" stroke-width=".5"/>'
    + '<circle cx="8" cy="8" r="1.1" fill="#ff4d6d"/>';
  return s;
}
/** thẻ tên ADMIN: vương miện + chữ ADMIN trên nền vàng có vệt sáng chạy */
export function adminTag({ big = false } = {}) {
  const el = span('adm-tag' + (big ? ' big' : ''), span('adm-shine'));
  el.prepend(crownSvg());
  el.appendChild(span('adm-txt', 'ADMIN'));
  el.title = 'Quản trị viên MeeGame';
  return el;
}
/** khung avatar hoàng gia (v1.25b: bỏ vương miện) — viền vàng kép chạm hoa văn, 4 đá quý, dải ruy băng chữ ADMIN ở chân khung */
export function adminFrame(inner, { size = 44 } = {}) {
  const el = span('adm-frame');
  el.style.setProperty('--sz', size + 'px');
  el.append(span('adm-ring'), span('adm-ring2'), inner || span(''),
    span('adm-gem g1'), span('adm-gem g2'), span('adm-gem g3'), span('adm-gem g4'),
    span('adm-ribbon', span('adm-rb-txt', 'ADMIN')));
  return el;
}
/** chọn ảnh từ máy → cắt vuông giữa, thu nhỏ size×size, nén JPEG → data URL (null nếu bỏ chọn / lỗi) */
export function pickSquareImage(size = 384) {   // v1.25d ảnh nét hơn (384×384)
  return new Promise((resolve) => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (!f) { resolve(null); return; }
      const url = URL.createObjectURL(f), im = new Image();
      im.onload = () => {
        try {
          const c = document.createElement('canvas'); c.width = c.height = size;
          const g = c.getContext('2d'), m = Math.min(im.naturalWidth, im.naturalHeight);
          g.imageSmoothingQuality = 'high';
          g.drawImage(im, (im.naturalWidth - m) / 2, (im.naturalHeight - m) / 2, m, m, 0, 0, size, size);
          let q = 0.92, out = c.toDataURL('image/jpeg', q);
          while (out.length > 1400000 && q > 0.5) { q -= 0.08; out = c.toDataURL('image/jpeg', q); }   // v1.25d tối đa ~1MB
          resolve(out);
        } catch (e) { resolve(null); }
        URL.revokeObjectURL(url);
      };
      im.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      im.src = url;
    };
    inp.click();
  });
}
