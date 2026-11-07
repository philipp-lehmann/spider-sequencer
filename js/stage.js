/* Per-frame drawing of tracks, notes and playheads, plus the animation loop */
import { R0, R1 } from './constants.js';
import { ctx } from './audio.js';
import { state, selTrack, audible } from './state.js';
import { playing, beatAt, songOn, segAt, viewPos, hits } from './transport.js';
import { uOf, rOf, xy, snapA, quantU, angles, headAngle, barsMode } from './geometry.js';
import { view, disp, hitAt, reduceMotion, layers } from './view.js';
import { renderReadout } from './readout.js';
import { renderGrid } from './grid.js';
import { renderTrackPats } from './tracks.js';
import { renderPatterns, renderLane, placeSongHead } from './song.js';
import { mod1 } from './util.js';

const f1 = v => v.toFixed(1);

/* every place a track's notes appear on the circle, sorted by angle: [{ n, a, x, y }] */
function occurrences(tr, at) {
  const out = [];
  for (const n of tr.notes) {
    const r = rOf(disp.get(n) ?? uOf(n));
    for (const a of angles(tr, n, at)) { const [x, y] = xy(a, r); out.push({ n, a, x, y }); }
  }
  return out.sort((p, q) => p.a - q.a);
}
const points = occ => occ.map(o => f1(o.x) + ',' + f1(o.y)).join(' ');

/* hit flash; with repeated copies only the copy the playhead just passed lights up */
function pulse(o, head, now) {
  if (reduceMotion) return 0;
  const t = hitAt.get(o.n); if (t == null) return 0;
  if (barsMode() && mod1(head - o.a) > .1) return 0;
  const d = (now - t) / 220; return d >= 1 ? 0 : 1 - d;
}

function draw() {
  const { hover, drag } = view;
  const now = performance.now(), sel = selTrack();
  const { beat, seg, at } = viewPos();
  let h = '';

  /* other tracks: faint */
  for (const tr of state.tracks) {
    if (tr === sel) continue;
    const op = audible(tr) ? 1 : .35, occ = occurrences(tr, at), head = headAngle(tr, at);
    if (occ.length > 1) h += `<polygon points="${points(occ)}" fill="${tr.color}" fill-opacity="${.10 * op}" stroke="${tr.color}" stroke-opacity="${.9 * op}" stroke-width="2" stroke-linejoin="round"/>`;
    for (const o of occ) {
      const s = 5 + pulse(o, head, now) * 7;
      h += `<rect x="${f1(o.x - s)}" y="${f1(o.y - s)}" width="${2 * s}" height="${2 * s}" fill="${tr.color}" fill-opacity="${op}"/>`;
    }
    const [px, py] = xy(head, R1 + 12), [qx, qy] = xy(head, R1);
    h += `<line x1="${f1(qx)}" y1="${f1(qy)}" x2="${f1(px)}" y2="${f1(py)}" stroke="${tr.color}" stroke-width="6" stroke-opacity="${op}"/>`;
  }

  /* selected track: editable */
  if (sel) {
    const head = headAngle(sel, at), occ = occurrences(sel, at);
    const [a1, b1] = xy(head, R0), [a2, b2] = xy(head, R1 + 18);
    h += `<line class="ph" x1="${f1(a1)}" y1="${f1(b1)}" x2="${f1(a2)}" y2="${f1(b2)}"/>`;
    for (const o of occ) { const [sx, sy] = xy(o.a, R0); h += `<line class="stem" x1="${f1(sx)}" y1="${f1(sy)}" x2="${f1(o.x)}" y2="${f1(o.y)}"/>`; }
    const op = audible(sel) ? 1 : .45;
    if (occ.length > 1) h += `<polygon class="poly" points="${points(occ)}" fill="${sel.color}" fill-opacity="${.38 * op}"/>`;
    if (hover && !drag && !hover.onNote && hover.r > R0) {
      const [x, y] = xy(snapA(sel, hover.t, hover.shift), rOf(quantU(hover.u)));
      h += `<rect class="prev" x="${x - 10}" y="${y - 10}" width="20" height="20"/>`;
    }
    for (const o of occ) {
      const big = (drag && drag.note === o.n) || (hover && hover.onNote === o.n);
      const s = (big ? 12 : 9) + pulse(o, head, now) * 8;
      h += `<rect class="node" x="${f1(o.x - s)}" y="${f1(o.y - s)}" width="${2 * s}" height="${2 * s}" fill="${sel.color}" fill-opacity="${op}"/>`;
    }
  } else {
    h += `<text class="emptytxt" y="${-R0 - 40}" text-anchor="middle">Add a track to start</text>`;
  }

  /* hub: play / pause, or a delete target while dragging a note onto it */
  const del = drag && drag.type === 'node' && drag.overHub;
  h += `<circle class="hub${del ? ' del' : ''}" r="${R0 - 10}"/>`;
  if (del) h += `<path class="hubicon" d="M-14 -18 L0 -4 L14 -18 L18 -14 L4 0 L18 14 L14 18 L0 4 L-14 18 L-18 14 L-4 0 L-18 -14Z"/>`;
  else if (playing) h += `<rect class="hubicon" x="-15" y="-18" width="10" height="36"/><rect class="hubicon" x="5" y="-18" width="10" height="36"/>`;
  else h += `<path class="hubicon" d="M-12 -20 L20 0 L-12 20Z"/>`;

  layers.innerHTML = h;
  renderReadout(at);
  placeSongHead(beat, seg);
}

/* ease displayed radii towards their target after a pitch / volume mode switch */
function stepTween() {
  let anim = false; const k = reduceMotion ? 1 : .22;
  for (const tr of state.tracks) for (const n of tr.notes) {
    const tgt = uOf(n), c = disp.get(n);
    if (c == null || Math.abs(tgt - c) < .0015) { disp.set(n, tgt); continue; }
    disp.set(n, c + (tgt - c) * k); anim = true;
  }
  return anim;
}

let liveSlot = null;
function loop() {
  requestAnimationFrame(loop);
  if (ctx && hits.length) {
    const now = ctx.currentTime, p = performance.now();
    for (let i = hits.length - 1; i >= 0; i--) {
      if (hits[i].time <= now) { hitAt.set(hits[i].n, p); view.lastPulse = p; hits.splice(i, 1); }
    }
  }
  /* song mode: follow the playing block in the UI */
  if (playing && songOn()) {
    const seg = segAt(beatAt(ctx.currentTime)), key = seg ? seg.slot : -1;
    if (key !== liveSlot) {
      liveSlot = key;
      if (seg) { const id = seg.pat.id; state.pat = id; state.tracks.forEach(t => t.pat = id); view.lastReadout = ''; renderGrid(); renderTrackPats(); }
      renderPatterns(); renderLane();
    }
  } else if (liveSlot !== null) { liveSlot = null; renderPatterns(); renderLane(); }
  const anim = stepTween();
  if (playing || anim || view.needs || performance.now() - view.lastPulse < 260) { draw(); view.needs = false; }
}

export const startLoop = loop;
