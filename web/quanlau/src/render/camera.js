// Camera: integer upscale rule, centring, clamped pan with inertia (TECH_SPEC §7).
// World units everywhere (1 unit = DETAIL×DETAIL detail-buffer pixels). The camera stores the world point shown in the
// centre of the viewport; `x0/y0` are the (fractional) world coordinates of the viewport's top-left corner.

const MAX_CSS_PER_WORLD = 6;      // never blow the scene up past ~6 CSS px per world px on huge screens
const FRICTION = 5.5;             // inertia decay per second
const STOP_SPEED = 3;             // world px / s

export function createCamera(detail = 1) {
  const cam = {
    // viewport (device px) and derived values
    W: 0, H: 0, dpr: 1, scale: 2,
    viewW: 0, viewH: 0,           // visible world size (fractional)
    coreW: 144, coreH: 168,
    cx: 72, cy: 84,               // centre of the view in world px
    vx: 0, vy: 0,                 // inertia, world px / s
    x0: 0, y0: 0,                 // top-left of the view (fractional world px)
    canPanX: false, canPanY: false,
    zoomF: 1, zoomMin: 1, zoomMax: 1,  // v1.3: player zoom multiplier and its bounds
    homed: false,
    follow: null,                 // { x, y, k } smooth focus target
    topKeep: 0,
    extX: null,                   // v1.1 [x0, x1] world range a wide shop (khu mở rộng) may be panned over                   // world y that the home framing must keep in view (the shop sign) when the view is shorter than the scene
  };

  /** Integer scale (device px per world px) for a viewport and a scene core. */
  cam.pickScale = (W, H, coreW, coreH, dpr) => {
    let s = Math.max(2, Math.floor(W / coreW));
    // not even 85% of the scene's height fits: step down while at least 90% of its width would remain visible
    while (s > 2 && H / s < 0.85 * coreH && W / (s - 1) >= 0.9 * coreW) s--;
    // the detail buffer holds `detail` px per world px: a scale divisible by it keeps every detail px a whole number of
    // device px (no uneven pixel rows). Prefer the next such scale when it still shows >= 90% of the core's width
    // (and does not break the 85% height rule); otherwise keep the choice above.
    if (detail > 1 && s % detail !== 0) {
      const up = Math.ceil(s / detail) * detail;
      if (W / up >= 0.9 * coreW && H / up >= 0.85 * coreH) s = up;
    }
    let cap = Math.round(MAX_CSS_PER_WORLD * dpr);
    if (detail > 1 && cap > detail) cap -= cap % detail;
    return Math.max(2, Math.min(s, cap));
  };

  /** Re-fit after a resize or a scene change. Keeps the user's pan when only the viewport changed. */
  cam.setViewport = (W, H, dpr, coreW, coreH, resetPan, topKeep = 0, extX = null) => {
    const prevScale = cam.scale;
    cam.W = W; cam.H = H; cam.dpr = dpr; cam.coreW = coreW; cam.coreH = coreH; cam.topKeep = topKeep; cam.extX = extX;
    // v1.3: player zoom is a smooth multiplier on the automatic integer scale (1 = default framing)
    const auto = cam.pickScale(W, H, coreW, coreH, dpr);
    // zoom out at most to the whole shop (incl. the wings) plus a little sky and road (owner's reference framing)
    const spanW = (extX ? extX[1] - extX[0] : coreW) + 60, spanH = coreH + 100;
    const lo = Math.min(auto, Math.max(W / spanW, H / spanH, 1));
    const hi = Math.max(auto, Math.min(Math.round(12 * dpr), auto * 3));
    cam.zoomMin = lo / auto; cam.zoomMax = hi / auto;
    let sc = Math.max(lo, Math.min(hi, auto * (cam.zoomF || 1)));
    if (Math.abs(sc - Math.round(sc)) < 0.04) sc = Math.round(sc);   // land on whole pixels when close: crisp art
    cam.scale = sc;
    cam.viewW = W / cam.scale; cam.viewH = H / cam.scale;
    cam.canPanX = cam.viewW < (extX ? extX[1] - extX[0] : coreW) - 0.5;
    cam.canPanY = cam.viewH < coreH - 0.5;
    if (resetPan || !cam.homed || prevScale !== cam.scale) cam.home();
    else cam.clamp();
    cam.update(0);
  };

  /** Default framing: centred on the core horizontally; the bottom (street + entrance) when taller than the view,
   *  scrolled up just enough to keep the whole shop sign (`topKeep`) in view when the sign sits near the top. */
  cam.home = () => {
    cam.vx = cam.vy = 0; cam.follow = null; cam.homed = true;
    cam.cx = cam.coreW / 2;
    cam.cy = cam.canPanY ? Math.min(cam.coreH - cam.viewH, Math.max(0, cam.topKeep)) + cam.viewH / 2 : cam.coreH * 0.5 - (cam.viewH - cam.coreH) * 0.05;
    cam.clamp();
  };

  cam.clamp = () => {
    const x0 = cam.extX ? cam.extX[0] : 0, x1 = cam.extX ? cam.extX[1] : cam.coreW;
    if (cam.canPanX) cam.cx = Math.min(x1 - cam.viewW / 2, Math.max(x0 + cam.viewW / 2, cam.cx));
    else cam.cx = cam.coreW / 2;
    if (cam.canPanY) cam.cy = Math.min(cam.coreH - cam.viewH / 2, Math.max(cam.viewH / 2, cam.cy));
    else cam.cy = cam.coreH * 0.5 - (cam.viewH - cam.coreH) * 0.05;
  };

  cam.panBy = (dx, dy) => {
    if (cam.canPanX) cam.cx += dx;
    if (cam.canPanY) cam.cy += dy;
    cam.follow = null;
    cam.clamp();
  };

  cam.fling = (vx, vy) => { cam.vx = cam.canPanX ? vx : 0; cam.vy = cam.canPanY ? vy : 0; cam.follow = null; };
  cam.stop = () => { cam.vx = cam.vy = 0; cam.follow = null; };

  /** Smoothly bring a world point to the middle of the view (clamped). */
  cam.focus = (x, y) => { cam.vx = cam.vy = 0; cam.follow = { x, y }; };

  /** Is the world point inside the view (with a margin)? */
  cam.sees = (x, y, m = 0) => x >= cam.x0 + m && x <= cam.x0 + cam.viewW - m && y >= cam.y0 + m && y <= cam.y0 + cam.viewH - m;

  cam.update = (dt) => {
    if (cam.follow) {
      const f = cam.follow, k = 1 - Math.exp(-8 * dt);
      const px = cam.cx, py = cam.cy;
      if (cam.canPanX) cam.cx += (f.x - cam.cx) * k;
      if (cam.canPanY) cam.cy += (f.y - cam.cy) * k;
      cam.clamp();
      if (Math.abs(cam.cx - px) + Math.abs(cam.cy - py) < 0.01 && dt > 0) cam.follow = null;
    } else if (cam.vx || cam.vy) {
      const px = cam.cx, py = cam.cy;
      cam.cx += cam.vx * dt; cam.cy += cam.vy * dt;
      cam.clamp();
      if (cam.cx === px) cam.vx = 0;     // hit a wall
      if (cam.cy === py) cam.vy = 0;
      const d = Math.exp(-FRICTION * dt);
      cam.vx *= d; cam.vy *= d;
      if (Math.abs(cam.vx) < STOP_SPEED) cam.vx = 0;
      if (Math.abs(cam.vy) < STOP_SPEED) cam.vy = 0;
    }
    cam.x0 = cam.cx - cam.viewW / 2;
    cam.y0 = cam.cy - cam.viewH / 2;
  };

  /** world → device px (relative to the canvas), fractional origin included */
  cam.toDeviceX = (x) => (x - cam.x0) * cam.scale;
  cam.toDeviceY = (y) => (y - cam.y0) * cam.scale;

  return cam;
}
