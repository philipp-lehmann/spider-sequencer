/* Header strip: transport, play mode, BPM, radius mode, snap, key; plus the starter set loader */
import { NAMES, SCALES, SNAPS, MODES } from './constants.js';
import { ctx, setDelayTime } from './audio.js';
import { state } from './state.js';
import { playing, toggle, rewind, setBpm, setPausedBeat } from './transport.js';
import { invalidate } from './view.js';
import { save } from './storage.js';
import { pushHistory, applyState } from './history.js';
import { renderGrid } from './grid.js';
import { renderPatterns, renderLane } from './song.js';
import { SETS, buildSet } from './sets.js';
import { toast } from './toast.js';
import { ic } from './icons.js';

const $ = id => document.getElementById(id);

/* segmented button group */
function seg(el, items, cur, on) {
  el.innerHTML = items.map(([v, l]) => `<button data-v="${v}" aria-pressed="${String(v) === String(cur)}">${l}</button>`).join('');
  el.onclick = e => { const b = e.target.closest('button'); if (b) on(b.dataset.v); };
}

export function syncHeader() {
  $('bpm').value = state.bpm;
  seg($('modeSeg'), MODES, state.mode, v => { state.mode = v; syncHeader(); renderGrid(); invalidate(); save(); });
  seg($('snapSeg'), SNAPS, state.snap, v => { state.snap = +v; syncHeader(); renderGrid(); invalidate(); save(); });
  seg($('playSeg'), [['pattern', 'Pattern'], ['song', 'Song']], state.playMode, v => {
    if (v === 'song' && !state.song.length) toast('The song is empty. Add a block with + in the Song row.');
    state.playMode = v; if (!playing) setPausedBeat(0);
    syncHeader(); renderPatterns(); renderLane(); invalidate(); save();
  });
  $('root').value = state.root; $('scale').value = state.scale;
  if (ctx) setDelayTime();
}

export function syncPlayBtn() {
  renderPatterns();
  const b = $('play');
  b.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  b.innerHTML = ic(playing ? 'pause' : 'play');
}

export function initHeader() {
  $('root').innerHTML = NAMES.map((n, i) => `<option value="${i}">${n}</option>`).join('');
  $('scale').innerHTML = Object.entries(SCALES).map(([k, s]) => `<option value="${k}">${s.l}</option>`).join('');
  $('setSel').innerHTML = Object.entries(SETS).map(([k, s]) => `<option value="${k}">${s.l}</option>`).join('');

  $('root').onchange = e => { pushHistory(); state.root = +e.target.value; renderGrid(); invalidate(); save(); };
  $('scale').onchange = e => { pushHistory(); state.scale = e.target.value; renderGrid(); invalidate(); save(); };
  $('bpm').onchange = e => setBpm(e.target.value);
  document.querySelectorAll('[data-bpm]').forEach(b => b.onclick = e => setBpm(state.bpm + (+b.dataset.bpm) * (e.shiftKey ? 10 : 1)));
  $('play').onclick = toggle;
  $('rew').onclick = rewind;
  $('loadSet').onclick = () => {
    pushHistory();
    const k = $('setSel').value, s = buildSet(k);
    s.mode = state.mode; s.snap = state.snap;
    applyState(s); setBpm(s.bpm);
    toast(`Loaded ${SETS[k].l}`, true);
  };
}
