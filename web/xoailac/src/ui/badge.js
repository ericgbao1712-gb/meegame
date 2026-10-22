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
  el.append(span('adm-ring'), inner || span(''), span('adm-ring2'),
    span('adm-gem g1'), span('adm-gem g2'), span('adm-gem g3'), span('adm-gem g4'),
    span('adm-ribbon', span('adm-rb-txt', 'ADMIN')));
  return el;
}
/** chọn ảnh từ máy → người dùng tự kéo / phóng to để cắt khung tròn → JPEG size×size → data URL (null nếu huỷ / lỗi) */
export function pickSquareImage(size = 512) {   // v1.25f ảnh 512×512, có bước tự cắt
  return new Promise((resolve) => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (!f) { resolve(null); return; }
      const url = URL.createObjectURL(f), im = new Image();
      im.onload = () => { cropDialog(im, size).then((out) => { URL.revokeObjectURL(url); resolve(out); }); };
      im.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      im.src = url;
    };
    inp.click();
  });
}
function cropDialog(im, size) {
  return new Promise((resolve) => {
    const V = Math.min(300, Math.floor(window.innerWidth * 0.78));      // cạnh khung xem (px CSS)
    const R = V * 0.44;                                                  // bán kính vòng cắt
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const W = im.naturalWidth, H = im.naturalHeight;
    const base = (2 * R) / Math.min(W, H);                              // zoom 1 = cạnh ngắn vừa khít vòng tròn
    let zoom = 1, cx = W / 2, cy = H / 2;                                // tâm vòng tròn theo toạ độ ảnh
    const wrap = document.createElement('div'); wrap.className = 'adm-crop';
    wrap.innerHTML = '<div class="adm-crop-card"><b class="adm-crop-t">Cắt ảnh khung admin</b>'
      + '<span class="adm-crop-s">Kéo ảnh để chỉnh vị trí, kéo thanh (hoặc chụm 2 ngón) để phóng to.</span>'
      + '<div class="adm-crop-view"><canvas></canvas></div>'
      + '<label class="adm-crop-z"><span>−</span><input type="range" min="1" max="5" step="0.01" value="1"><span>+</span></label>'
      + '<div class="adm-crop-b"><button type="button" class="btn paper sm" data-a="no">Huỷ</button><button type="button" class="btn jade sm" data-a="ok">Lưu ảnh</button></div></div>';
    document.body.appendChild(wrap);
    const cv = wrap.querySelector('canvas'), g = cv.getContext('2d'), rng = wrap.querySelector('input');
    cv.width = cv.height = Math.round(V * dpr); cv.style.width = cv.style.height = V + 'px';
    const scale = () => base * zoom;
    const clampC = () => { const half = R / scale(); cx = Math.max(half, Math.min(W - half, cx)); cy = Math.max(half, Math.min(H - half, cy)); };
    const draw = () => {
      clampC();
      const sc = scale();
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = '#2a1a14'; g.fillRect(0, 0, V, V);
      g.imageSmoothingQuality = 'high';
      g.drawImage(im, V / 2 - cx * sc, V / 2 - cy * sc, W * sc, H * sc);
      g.fillStyle = 'rgba(20,10,6,.62)'; g.beginPath(); g.rect(0, 0, V, V); g.arc(V / 2, V / 2, R, 0, Math.PI * 2, true); g.fill();
      g.strokeStyle = '#ffd34d'; g.lineWidth = 3; g.beginPath(); g.arc(V / 2, V / 2, R, 0, Math.PI * 2); g.stroke();
    };
    const pts = new Map(); let pinch0 = 0, zoom0 = 1;
    cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); zoom0 = zoom; } });
    cv.addEventListener('pointermove', (e) => {
      const p = pts.get(e.pointerId); if (!p) return;
      if (pts.size === 1) { cx -= (e.clientX - p.x) / scale(); cy -= (e.clientY - p.y) / scale(); }
      p.x = e.clientX; p.y = e.clientY;
      if (pts.size === 2 && pinch0) { const [a, b] = [...pts.values()]; zoom = Math.max(1, Math.min(5, zoom0 * Math.hypot(a.x - b.x, a.y - b.y) / pinch0)); rng.value = zoom; }
      draw();
    });
    const up = (e) => { pts.delete(e.pointerId); if (pts.size < 2) pinch0 = 0; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', (e) => { e.preventDefault(); zoom = Math.max(1, Math.min(5, zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08))); rng.value = zoom; draw(); }, { passive: false });
    rng.addEventListener('input', () => { zoom = +rng.value; draw(); });
    const done = (ok) => {
      let out = null;
      if (ok) {
        try {
          const c = document.createElement('canvas'); c.width = c.height = size;
          const x = c.getContext('2d'), half = R / scale();
          x.imageSmoothingQuality = 'high';
          x.drawImage(im, cx - half, cy - half, half * 2, half * 2, 0, 0, size, size);
          let q = 0.92; out = c.toDataURL('image/jpeg', q);
          while (out.length > 1400000 && q > 0.5) { q -= 0.08; out = c.toDataURL('image/jpeg', q); }
        } catch (e) { out = null; }
      }
      wrap.remove(); resolve(out);
    };
    wrap.querySelector('[data-a=ok]').addEventListener('click', () => done(true));
    wrap.querySelector('[data-a=no]').addEventListener('click', () => done(false));
    wrap.addEventListener('click', (e) => { if (e.target === wrap) done(false); });
    draw();
  });
}
