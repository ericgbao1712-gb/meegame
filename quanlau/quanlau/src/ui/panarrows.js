// v1.3: ‹ › buttons on the scene edges + zoom buttons.
// when the shop is wider than the view (khu mở rộng hai bên).
// The corner tables used to sit half off-screen with nothing telling the player the view can be dragged.
import { h } from './dom.js';
import { sfx } from './ctx.js';

export function mountPanArrows(sceneUi, renderer) {
  const mk = (cls, label, dir) => {
    const b = h('button', { class: 'pan-arrow ' + cls, 'aria-label': label }, dir < 0 ? '‹' : '›');
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const cam = renderer && renderer.camera;
      if (!cam) return;
      sfx('click');
      cam.focus(cam.cx + dir * cam.viewW * 0.75, cam.cy);
    });
    sceneUi.appendChild(b);
    return b;
  };
  const left = mk('l', 'Xem bên trái', -1), right = mk('r', 'Xem bên phải', 1);
  // v1.3: zoom − / ⌂ / + (also mouse wheel and two-finger pinch on the scene)
  const zb = (label, txt, fn) => { const b = h('button', { class: 'zoom-b', 'aria-label': label }, txt); b.addEventListener('click', (e) => { e.stopPropagation(); fn(); }); return b; };
  const zin = zb('Phóng to', '+', () => { if (renderer.zoomBy(1)) sfx('click'); });
  const zout = zb('Thu nhỏ', '−', () => { if (renderer.zoomBy(-1)) sfx('click'); });
  const zhome = zb('Vừa màn hình', '⌂', () => { renderer.zoomTo(1); sfx('click'); setTimeout(() => renderer.camera.home(), 380); });
  sceneUi.appendChild(h('div', { class: 'zoom-box' }, zout, zhome, zin));
  let acc = 0;
  function update(dt) {
    acc += dt; if (acc < 0.15) return; acc = 0;
    const cam = renderer && renderer.camera;
    const ext = cam && cam.canPanX ? (cam.extX || [0, cam.coreW]) : null;
    const z = renderer.zoomInfo;
    zin.disabled = z.zoom >= z.max - 0.005; zout.disabled = z.zoom <= z.min + 0.005; zhome.disabled = Math.abs(z.zoom - 1) < 0.005;
    left.hidden = !ext || cam.x0 <= ext[0] + 2;
    right.hidden = !ext || cam.x0 + cam.viewW >= ext[1] - 2;
  }
  return { update };
}
