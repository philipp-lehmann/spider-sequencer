/* Polar geometry: t (0..1) is the angle / time, u (0..1) the distance from the hub / pitch or volume */
import { TAU, R0, R1 } from './constants.js';
import { state, levels } from './state.js';
import { clamp, mod1 } from './util.js';
import { svg } from './view.js';

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

export const gridN = (tr, free) => tr.bars * (free || !state.snap ? 16 : state.snap);
export function snapT(tr, t, free) {
  if (free || !state.snap) return t;
  const g = gridN(tr); return mod1(Math.round(t * g) / g);
}
export function quantU(u) {
  if (state.mode === 'pitch') { const L = levels() - 1; return Math.round(u * L) / L; }
  return Math.max(.02, Math.round(u * 50) / 50);
}
export function setU(n, u) { if (state.mode === 'pitch') n.p = quantU(u); else n.v = quantU(u); }
