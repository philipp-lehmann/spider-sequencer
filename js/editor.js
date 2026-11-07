/* Pointer editing on the circle: add, drag, delete, rotate notes; click the hub to play / pause */
import { R0, R1 } from './constants.js';
import { ensureAudio } from './audio.js';
import { state, selTrack, isDrum, noteMidi } from './state.js';
import { toggle, preview, viewPos } from './transport.js';
import { uOf, rOf, xy, toSvg, polar, snapA, toClipT, angles, circleBars, setU } from './geometry.js';
import { view, disp, invalidate, svg } from './view.js';
import { serialize, save } from './storage.js';
import { pushHistory } from './history.js';
import { updateCount } from './tracks.js';
import { mod1 } from './util.js';
import { feature } from './features.js';
import { prefs } from './prefs.js';

const HIT_RADIUS = 24, DOUBLE_TAP_MS = 330;
/* Settings > Preview sound */
const previewOn = () => !feature('previewSetting') || prefs.preview;
let lastTap = {}, pendingSnap = null;

/* closest note to an SVG point, checking every copy of it on the circle */
export function nearest(tr, pt, max) {
  const { at } = viewPos();
  let best = null, bd = max;
  for (const n of tr.notes) {
    const r = rOf(uOf(n));
    for (const a of angles(tr, n, at)) {
      const [x, y] = xy(a, r); const d = Math.hypot(x - pt.x, y - pt.y);
      if (d < bd) { bd = d; best = n; }
    }
  }
  return best;
}

/* circle angle under the pointer -> snapped clip position */
const clipT = (tr, a, free) => toClipT(tr, snapA(tr, a, free), viewPos().at);

export function removeNote(tr, n) {
  const i = tr.notes.indexOf(n); if (i >= 0) tr.notes.splice(i, 1);
  updateCount();
}

function onDown(e) {
  if (e.button === 2) return;
  ensureAudio();
  const pt = toSvg(e), p = polar(pt), tr = selTrack();
  svg.setPointerCapture(e.pointerId); e.preventDefault();
  if (p.r < R0 - 4) { view.drag = { type: 'hub' }; return; }
  if (!tr) return;
  pendingSnap = serialize();
  const hit = nearest(tr, pt, HIT_RADIUS), now = performance.now();
  if (e.altKey && tr.notes.length) { view.drag = { type: 'rot', t0: p.t, orig: tr.notes.map(n => n.t), tr }; return; }
  if (hit) {
    if (lastTap.n === hit && now - lastTap.time < DOUBLE_TAP_MS && !lastTap.created) {
      pushHistory(pendingSnap); removeNote(tr, hit); lastTap = {}; view.drag = null; save(); invalidate(); return;
    }
    lastTap = { n: hit, time: now, created: false };
    view.drag = { type: 'node', note: hit, tr, lastMidi: null };
  } else {
    if (p.r > R1 + 30) { view.drag = null; return; }
    const n = { t: clipT(tr, p.t, e.shiftKey || state.snap === 0), p: .5, v: .8 }; setU(n, p.u); disp.set(n, uOf(n));
    tr.notes.push(n); updateCount(); if (previewOn()) preview(tr, n);
    lastTap = { n, time: now, created: true };
    view.drag = { type: 'node', note: n, tr, lastMidi: noteMidi(tr, n), created: true };
  }
  invalidate();
}

function onMove(e) {
  const pt = toSvg(e), p = polar(pt), tr = selTrack(), drag = view.drag;
  view.hover = { ...p, shift: e.shiftKey, onNote: tr && !drag ? nearest(tr, pt, HIT_RADIUS) : null };
  svg.style.cursor = p.r < R0 - 4 ? 'pointer' : (view.hover.onNote ? 'grab' : (drag ? 'grabbing' : 'crosshair'));
  if (drag && drag.type === 'node') {
    const n = drag.note; drag.overHub = p.r < R0;
    n.t = clipT(drag.tr, p.t, e.shiftKey); setU(n, p.u); disp.set(n, uOf(n));
    const m = isDrum(drag.tr) ? Math.round(n.p * 24) : noteMidi(drag.tr, n);
    if (state.mode === 'pitch' && m !== drag.lastMidi) { drag.lastMidi = m; if (!drag.overHub && previewOn()) preview(drag.tr, n); }
  } else if (drag && drag.type === 'rot') {
    let dt = mod1(p.t - drag.t0 + .5) - .5; /* in circle turns */
    if (!e.shiftKey && state.snap) { const g = circleBars(drag.tr) * state.snap; dt = Math.round(dt * g) / g; }
    dt *= circleBars(drag.tr) / drag.tr.bars; /* -> clip turns */
    drag.tr.notes.forEach((n, i) => n.t = mod1(drag.orig[i] + dt));
  }
  invalidate();
}

function endDrag(e) {
  const drag = view.drag; if (!drag) return;
  const p = e && e.clientX != null ? polar(toSvg(e)) : { r: 999 };
  if (drag.type === 'hub' && p.r < R0) toggle();
  if (drag.type === 'node' && drag.overHub) removeNote(drag.tr, drag.note);
  if (drag.type !== 'hub' && pendingSnap && pendingSnap !== serialize()) { pushHistory(pendingSnap); save(); }
  pendingSnap = null; view.drag = null; invalidate();
}

export function initEditor() {
  svg.addEventListener('pointerdown', onDown);
  svg.addEventListener('pointermove', onMove);
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);
  svg.addEventListener('pointerleave', () => { if (!view.drag) { view.hover = null; invalidate(); } });
  svg.addEventListener('contextmenu', e => {
    e.preventDefault(); const tr = selTrack(); if (!tr) return;
    const hit = nearest(tr, toSvg(e), HIT_RADIUS);
    if (hit) { pushHistory(); removeNote(tr, hit); save(); invalidate(); }
  });
}
