// mountUI(game, { renderer, audio }) — builds the whole DOM UI (TECH_SPEC §9).
import { mountPanArrows } from './panarrows.js';
import { fmtShort } from '../core/format.js';
import { ctx } from './ctx.js';
import { createFx } from './fx.js';
import { reducedMotion, h, div } from './dom.js';
import { mountHud } from './hud.js';
import { mountNav } from './nav.js';
import { mountToasts } from './toast.js';
import { mountDock } from './dock.js';
import { mountPrep } from './prep.js';
import { mountSheets, updateSheets } from './sheets.js';
import { mountModalRoot, installModalApi } from './modals.js';
import { closePopover } from './popover.js';
import './sheets/index.js';
import { installModalScreens } from './screens/index.js';
import { createTutorial } from './tutorial.js';
import { mountDebug } from './debug.js';
import { initCloud } from './cloud.js';
import { initTax } from './tax.js';
import { initLottery, openLady } from './lottery.js';
import { initWhatsNew, openWhatsNew } from './whatsnew.js';

function ensure(id, parent, tag = 'div') {
  let el = document.getElementById(id);
  if (!el) { el = document.createElement(tag); el.id = id; parent.appendChild(el); }
  return el;
}

export function mountUI(game, { renderer, audio } = {}) {
  ctx.game = game; ctx.renderer = renderer || null; ctx.audio = audio || null;
  ctx.reduced = reducedMotion();
  ctx.haptics = game.state.settings?.haptics !== false;

  const app = document.getElementById('app') || document.body.appendChild(div('app'));
  const hud = ensure('hud', app, 'header');
  const wrap = ensure('scene-wrap', app, 'main');
  const sceneUi = ensure('scene-ui', wrap);
  const dock = ensure('dock', app, 'section');
  const nav = ensure('nav', app, 'nav');
  const sheetRoot = ensure('sheet-root', app);
  const modalRoot = ensure('modal-root', app);
  const toastRoot = ensure('toast-root', app);
  const fxRoot = ensure('fx-root', app);
  const coachRoot = ensure('coach-root', app);
  const popRoot = ensure('pop-root', app);
  // v1.18h: bảng (sheet) kết thúc đúng mép trên thanh menu dưới — đo chiều cao thật thay cho 62px cố định
  // (trên iPhone thanh menu cao hơn vài px nên thẻ cuối trong bảng bị các nút che mất mép dưới)
  try {
    const fitNav = () => { const h = nav.offsetHeight; if (h > 30) app.style.setProperty('--nav-h', h + 'px'); };
    fitNav();
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(fitNav).observe(nav);
    window.addEventListener('resize', fitNav);
  } catch (e) { /* giữ giá trị CSS */ }
  ctx.el = { app, hud, wrap, sceneUi, dock, nav, sheetRoot, modalRoot, toastRoot, fxRoot, coachRoot, pop: popRoot };
  window.matchMedia?.('(prefers-reduced-motion: reduce)')?.addEventListener?.('change', (e) => { ctx.reduced = e.matches; });

  // ---- pause bookkeeping (reasons are ref-counted, Core sees only 0→1 / 1→0)
  const counts = {};
  ctx.pauseFor = (r) => { counts[r] = (counts[r] || 0) + 1; if (counts[r] === 1) { try { game.act.pause?.(r); } catch (e) { console.error(e); } } };
  ctx.resumeFor = (r) => { if (!counts[r]) return; counts[r]--; if (counts[r] === 0) { try { game.act.resume?.(r); } catch (e) { console.error(e); } } };

  ctx.fx = createFx(fxRoot);

  // ---- modules
  mountModalRoot(modalRoot);
  installModalApi();
  const toasts = mountToasts({ toastRoot, sceneUi });
  const hudM = mountHud(hud);
  const navM = mountNav(nav);
  const dockM = mountDock(dock, sceneUi);
  const panM = mountPanArrows(sceneUi, renderer);
  const prepM = mountPrep(dock);
  mountSheets(sheetRoot);
  installModalScreens();
  ctx.tutorial = createTutorial({ coachRoot });
  const debug = mountDebug();
  try { initCloud(game); } catch (e) { console.error('[ui] cloud', e); }
  try { initTax(game); } catch (e) { console.error('[ui] tax', e); }   // v1.14
  try { initLottery(game); } catch (e) { console.error('[ui] lottery', e); }   // v1.15
  try { initWhatsNew(); } catch (e) { console.error('[ui] whatsnew', e); }   // v1.16 bảng Có gì mới   // v1.8

  // ---- layout vars: HUD / nav / dock heights → CSS, then tell the renderer
  const setVars = () => {
    const ar = app.getBoundingClientRect();
    app.style.setProperty('--hud-h', Math.round(hud.getBoundingClientRect().height) + 'px');
    app.style.setProperty('--nav-h', Math.round(nav.getBoundingClientRect().height) + 'px');
    app.style.setProperty('--toast-bottom', Math.round(ar.bottom - dock.getBoundingClientRect().top + 10) + 'px');
  };
  let rsT = 0;
  const ro = new ResizeObserver(() => { setVars(); clearTimeout(rsT); rsT = setTimeout(() => { try { renderer?.resize?.(); } catch (e) { console.error(e); } }, 60); });
  [hud, nav, dock, app].forEach((e) => ro.observe(e));
  setVars();

  // ---- game events → UI
  const on = (e, f) => game.on(e, (p) => { try { f(p || {}); } catch (err) { console.error('[ui] event ' + e, err); } });
  on('collected', (p) => {
    if (p.x == null || !renderer?.worldToClient) return;
    const from = renderer.worldToClient(p.x, p.y);
    ctx.fx.coins(from, ctx.moneyAnchor(), p.amount, () => ctx.flashMoney());
  });
  on('dayEnd', (p) => { closePopover(); ctx.closeSheet(); setTimeout(() => ctx.modals.report(p.report), ctx.reduced ? 100 : 700); });
  on('levelUp', (p) => ctx.modals.levelUp(p));
  on('tierUp', (p) => ctx.modals.tierUp(p));
  on('offline', (p) => ctx.modals.offline(p));
  on('ending', () => ctx.modals.ending());
  on('phase', (p) => { closePopover(); if (p.phase === 'open') ctx.closeSheet(); });
  on('xp', () => {});

  // ---- first-run flows
  setTimeout(() => {
    try { ctx.tutorial.boot(); } catch (e) { console.error('[ui] tutorial boot', e); }
    try { ctx.modals.bootChecks?.(); } catch (e) { console.error('[ui] bootChecks', e); }
  }, 60);

  // ---- per-frame
  function update(dt) {
    hudM.update(dt); navM.update(dt); dockM.update(dt); prepM.update(dt); panM.update(dt);
    updateSheets(dt); ctx.tutorial.update(dt); debug.update?.(dt);
  }
  function onScenePick(hit) {
    if (!hit) return;
    try {
      if (hit.type === 'table') {
        ctx.tableInfo?.(hit);
      } else if (hit.type === 'veso') openLady();   // v1.15 chạm cô bán vé số → bảng mua vé
    } catch (e) { console.error('[ui] scenePick', e); }
  }
  return { update, onScenePick, ctx };
}
