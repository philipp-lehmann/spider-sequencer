/* Polar geometry: the angle a (0..1) is time, u (0..1) the distance from the hub / pitch or volume.

   Two circle modes (prefs.circle, set in Settings):
   - 'loop': the circle is one loop of the track, so a 1-bar and a 4-bar track run at different speeds.
     Circle angle and clip position (note.t) are the same thing.
   - 'bars': the circle is always CIRCLE_BARS bars, so every track runs at the same speed and shorter
     loops repeat around it (1 bar = 4 copies, 90° each). The circle shows the window of
     CIRCLE_BARS bars that contains the playhead, so 3- and 8-bar loops show what plays in that window. */
import { TAU, R0, R1 } from './constants.js';
import { state, levels } from './state.js';
import { clamp, mod1 } from './util.js';
import { svg } from './view.js';
import { feature } from './features.js';
import { prefs } from './prefs.js';

export const CIRCLE_BARS = 4;
const WINDOW = CIRCLE_BARS * 4; /* beats */

export const uOf = n => state.mode === 'pitch' ? n.p : n.v;
export const rOf = u => R0 + u * (R1 - R0);
export const xy = (t, r) => { const a = t * TAU - Math.PI / 2; return [r * Math.cos(a), r * Math.sin(a)]; };

export function toSvg(e) {
  const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
  return p.matrixTransform(svg.getScreenCTM().inverse());
}
export function polar(pt) {
  const r = Math.hypot(pt.x, pt.y);
  return { r, t: mod1((Math.atan2(pt.y, pt.x) + Math.PI / 2) / TAU), u: clamp((r - R0) / (R1 - R0), 0, 1) };
}

/* ---------- circle mode ---------- */
export const barsMode = () => feature('circleBars') && prefs.circle === 'bars';
/* bars shown around the full circle for this track */
export const circleBars = tr => barsMode() ? CIRCLE_BARS : tr.bars;
const winStart = at => barsMode() ? Math.floor(at / WINDOW) * WINDOW : 0;

/* circle angles at which note n appears, given the play position `at` (in beats) */
export function angles(tr, n, at) {
  if (!barsMode()) return [n.t];
  const L = tr.bars * 4, w0 = winStart(at), nb = n.t * L, out = [];
  for (let b = Math.ceil((w0 - nb) / L - 1e-9) * L + nb; b < w0 + WINDOW - 1e-9; b += L) out.push((b - w0) / WINDOW);
  return out;
}
/* circle angle -> clip position (note.t) */
export function toClipT(tr, a, at) {
  if (!barsMode()) return a;
  const L = tr.bars * 4;
  return mod1(Math.round((winStart(at) + a * WINDOW) % L / L * 1e6) / 1e6);
}
/* playhead angle on the circle */
export const headAngle = (tr, at) => mod1(at / (circleBars(tr) * 4));

/* ---------- snapping ---------- */
/* grid steps per clip, used for rotate / random */
export const gridN = (tr, free) => tr.bars * (free || !state.snap ? 16 : state.snap);
/* snap a circle angle to the grid */
export function snapA(tr, a, free) {
  if (free || !state.snap) return a;
  const g = circleBars(tr) * state.snap; return mod1(Math.round(a * g) / g);
}
export function quantU(u) {
  if (state.mode === 'pitch') { const L = levels() - 1; return Math.round(u * L) / L; }
  return Math.max(.02, Math.round(u * 50) / 50);
}
export function setU(n, u) { if (state.mode === 'pitch') n.p = quantU(u); else n.v = quantU(u); }
