/* Per-frame drawing of tracks, notes and playheads, plus the animation loop */
import { R0, R1 } from './constants.js';
import { ctx } from './audio.js';
import { state, selTrack, audible } from './state.js';
import { playing, pausedBeat, beatAt, songOn, segAt, hits } from './transport.js';
import { uOf, rOf, xy, snapT, quantU } from './geometry.js';
import { view, disp, hitAt, reduceMotion, layers } from './view.js';
import { renderReadout } from './readout.js';
import { renderGrid } from './grid.js';
import { renderTrackPats } from './tracks.js';
import { renderPatterns, renderLane, placeSongHead } from './song.js';
import { mod1 } from './util.js';

const pos = n => xy(n.t, rOf(disp.get(n) ?? uOf(n)));

function polyPath(tr) {
  return [...tr.notes].sort((a, b) => a.t - b.t)
    .map(n => { const [x, y] = pos(n); return x.toFixed(1) + ',' + y.toFixed(1); }).join(' ');
}

function pulse(n, now) {
  if (reduceMotion) return 0;
  const t = hitAt.get(n); if (t == null) return 0;
  const d = (now - t) / 220; return d >= 1 ? 0 : 1 - d;
}

function draw() {
  const { hover, drag } = view;
  const now = performance.now(), beat = playing ? beatAt(ctx.currentTime) : pausedBeat, sel = selTrack();
  const seg = songOn() ? segAt(beat) : null, at = seg ? beat - seg.start : beat;
  let h = '';

  /* other tracks: faint */
  for (const tr of state.tracks) {
    if (tr === sel) continue;
    const op = audible(tr) ? 1 : .35;
    if (tr.notes.length > 1) h += `<polygon points="${polyPath(tr)}" fill="${tr.color}" fill-opacity="${.10 * op}" stroke="${tr.color}" stroke-opacity="${.9 * op}" stroke-width="2" stroke-linejoin="round"/>`;
    for (const n of tr.notes) {
      const [x, y] = pos(n), s = 5 + pulse(n, now) * 7;
      h += `<rect x="${(x - s).toFixed(1)}" y="${(y - s).toFixed(1)}" width="${2 * s}" height="${2 * s}" fill="${tr.color}" fill-opacity="${op}"/>`;
    }
    const L = tr.bars * 4, [px, py] = xy(mod1(at / L), R1 + 12), [qx, qy] = xy(mod1(at / L), R1);
    h += `<line x1="${qx.toFixed(1)}" y1="${qy.toFixed(1)}" x2="${px.toFixed(1)}" y2="${py.toFixed(1)}" stroke="${tr.color}" stroke-width="6" stroke-opacity="${op}"/>`;
  }

  /* selected track: editable */
  if (sel) {
    const L = sel.bars * 4, pt = mod1(at / L);
    const [a1, b1] = xy(pt, R0), [a2, b2] = xy(pt, R1 + 18);
    h += `<line class="ph" x1="${a1.toFixed(1)}" y1="${b1.toFixed(1)}" x2="${a2.toFixed(1)}" y2="${b2.toFixed(1)}"/>`;
    for (const n of sel.notes) {
      const [x, y] = pos(n), [sx, sy] = xy(n.t, R0);
      h += `<line class="stem" x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`;
    }
    const op = audible(sel) ? 1 : .45;
    if (sel.notes.length > 1) h += `<polygon class="poly" points="${polyPath(sel)}" fill="${sel.color}" fill-opacity="${.38 * op}"/>`;
    if (hover && !drag && !hover.onNote && hover.r > R0) {
      const [x, y] = xy(snapT(sel, hover.t, hover.shift), rOf(quantU(hover.u)));
      h += `<rect class="prev" x="${x - 10}" y="${y - 10}" width="20" height="20"/>`;
    }
    for (const n of sel.notes) {
      const [x, y] = pos(n);
      const big = (drag && drag.note === n) || (hover && hover.onNote === n);
      const s = (big ? 12 : 9) + pulse(n, now) * 8;
      h += `<rect class="node" x="${(x - s).toFixed(1)}" y="${(y - s).toFixed(1)}" width="${2 * s}" height="${2 * s}" fill="${sel.color}" fill-opacity="${op}"/>`;
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
