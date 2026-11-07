/* Transport and look-ahead scheduler.
   Time is measured in beats. anchorTime/anchorBeat map AudioContext time to beats so tempo changes stay seamless. */
import { ctx, ensureAudio, bus, setDelayTime } from './audio.js';
import { PRESETS } from './presets.js';
import { state, patById, patLen, clipOf, trPat, audible, noteMidi, mtof } from './state.js';
import { clamp, mod1 } from './util.js';
import { save } from './storage.js';
import { syncPlayBtn } from './header.js';
import { invalidate } from './view.js';

export let playing = false, pausedBeat = 0;
let anchorTime = 0, anchorBeat = 0, schedBeat = 0, timer = null;
/* scheduled notes waiting to light up in the view: { n, time } */
export const hits = [];

export const beatAt = t => anchorBeat + (t - anchorTime) * state.bpm / 60;
const timeAt = b => anchorTime + (b - anchorBeat) * 60 / state.bpm;

/* re-pin the beat clock to now, before the tempo or the state changes */
export function reanchor() {
  if (!playing) return;
  const now = ctx.currentTime; anchorBeat = beatAt(now); anchorTime = now;
}
export function setPausedBeat(b) { pausedBeat = b; }

export function play() {
  ensureAudio(); playing = true; anchorTime = ctx.currentTime + .06; anchorBeat = pausedBeat; schedBeat = pausedBeat;
  timer = setInterval(tick, 25); tick(); syncPlayBtn(); invalidate();
}
export function pause() {
  if (!playing) return;
  pausedBeat = beatAt(ctx.currentTime); playing = false; clearInterval(timer); hits.length = 0; syncPlayBtn(); invalidate();
}
export function toggle() { playing ? pause() : play(); }
export function rewind() {
  if (playing) { anchorBeat = 0; anchorTime = ctx.currentTime + .03; schedBeat = 0; hits.length = 0; } else pausedBeat = 0;
  invalidate();
}
export function setBpm(v, fromUndo) {
  v = clamp(Math.round(+v || 120), 40, 240);
  reanchor();
  state.bpm = v; if (ctx) setDelayTime();
  document.getElementById('bpm').value = v;
  if (!fromUndo) save();
}

/* timeline: pattern mode loops the edited pattern; song mode walks the song blocks and loops the whole song */
export const songOn = () => state.playMode === 'song' && state.song.length > 0;
function songLen() { return state.song.reduce((s, x) => s + patLen(patById(x.pat)) * x.reps, 0); }
function segments(b0, b1) {
  const out = [];
  if (songOn()) {
    const S = songLen();
    for (let c = Math.floor(b0 / S); c * S < b1; c++) {
      let off = c * S;
      state.song.forEach((sl, i) => {
        const p = patById(sl.pat), P = patLen(p);
        for (let r = 0; r < sl.reps; r++) { if (off < b1 && off + P > b0) out.push({ start: off, len: P, pat: p, slot: i, rep: r, songStart: c * S }); off += P; }
      });
    }
  }
  return out;
}
export function segAt(beat) { return segments(beat, beat + 1e-6)[0]; }

function tick() {
  const end = beatAt(ctx.currentTime + .12);
  if (songOn()) {
    for (const seg of segments(schedBeat, end)) {
      const lo = Math.max(schedBeat, seg.start), hi = Math.min(end, seg.start + seg.len);
      for (const tr of state.tracks) schedClip(tr, clipOf(tr, seg.pat), seg.start, lo, hi);
    }
  } else for (const tr of state.tracks) schedClip(tr, clipOf(tr, trPat(tr)), 0, schedBeat, end);
  schedBeat = end;
}

/* pattern mode: each track loops its own clip from beat 0; song mode: clips restart at every block */
function schedClip(tr, clip, origin, lo, hi) {
  if (!audible(tr) || !clip.notes.length) return;
  const L = clip.bars * 4, sorted = [...clip.notes].sort((a, b) => a.t - b.t);
  sorted.forEach((n, i) => {
    const nb = n.t * L;
    for (let k = Math.max(0, Math.ceil((lo - origin - nb) / L - 1e-9)); origin + k * L + nb < hi; k++) {
      const b = origin + k * L + nb; if (b < lo) continue;
      const next = sorted[(i + 1) % sorted.length], gap = (mod1(next.t - n.t) || 1) * L;
      const time = Math.max(timeAt(b), ctx.currentTime), dur = Math.min(gap * 60 / state.bpm * .92, PRESETS[tr.preset].max);
      trigger(tr, n, time, dur); hits.push({ n, time });
    }
  });
}

function trigger(tr, n, time, dur) {
  const P = PRESETS[tr.preset], out = bus(tr);
  if (P.drum) P.play(time, Math.pow(2, n.p - .5), n.v, dur, out);
  else P.play(time, mtof(noteMidi(tr, n)), n.v, dur, out);
}
export function preview(tr, n) {
  if (!ctx || !tr) return;
  trigger(tr, n, ctx.currentTime + .01, Math.min(.25, PRESETS[tr.preset].max));
}
