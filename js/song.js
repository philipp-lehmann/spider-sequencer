/* "All tracks" pattern row and the song lane */
import { PAT_IDS, PAT_BARS } from './constants.js';
import { state, patById, editPat, patLen, patColor, patHas, syncedPat, cloneClip } from './state.js';
import { playing, songOn, setPausedBeat } from './transport.js';
import { view, invalidate } from './view.js';
import { save } from './storage.js';
import { pushHistory } from './history.js';
import { renderGrid } from './grid.js';
import { renderTrackPats, updateCount } from './tracks.js';
import { toast } from './toast.js';

const patBtns = document.getElementById('patBtns'), lane = document.getElementById('lane');
const $ = id => document.getElementById(id);
let selSlot = -1;

export function renderPatterns() {
  const sync = syncedPat();
  patBtns.innerHTML = state.patterns.map((p, i) => `<button class="pb${patHas(p) ? ' has' : ''}" style="--pc:${patColor(p.id)}" data-pat="${p.id}" aria-pressed="${p.id === sync}" title="Switch all tracks to pattern ${p.id} (Shift+${i + 1})">${p.id}</button>`).join('');
  $('patBars').value = editPat().bars;
  $('patBars').title = `How long pattern ${state.pat} lasts in the song`;
  $('slotAddLbl').textContent = state.pat;
}

/* sync: every track jumps to the same pattern */
export function selectPattern(id) {
  if (!id) return;
  state.pat = id; state.tracks.forEach(t => t.pat = id); view.lastReadout = '';
  renderPatterns(); renderTrackPats(); renderGrid(); invalidate(); save();
}

function slotStart(i) {
  let b = 0;
  for (let k = 0; k < i; k++) { const s = state.song[k]; b += patLen(patById(s.pat)) * s.reps; }
  return b;
}

export function renderLane() {
  if (!state.song.length) { lane.innerHTML = `<span class="lane-empty">Empty song. Pick a pattern and press + to add it.</span>`; selSlot = -1; return; }
  selSlot = Math.min(selSlot, state.song.length - 1);
  lane.innerHTML = state.song.map((s, i) => {
    const p = patById(s.pat), w = Math.max(56, p.bars * s.reps * 14);
    return `<button class="blk" data-slot="${i}" style="--pc:${patColor(s.pat)};width:${w}px" aria-selected="${i === selSlot}" title="Pattern ${s.pat}, ${p.bars} bar${p.bars > 1 ? 's' : ''} × ${s.reps}"><span>${s.pat}</span><small>×${s.reps}</small></button>`;
  }).join('') + `<span id="songHead"${songOn() ? '' : ' hidden'}></span>`;
}

export function placeSongHead(beat, seg) {
  const h = $('songHead');
  if (!h || !songOn() || !seg || seg.slot == null) { if (h) h.hidden = true; return; }
  const b = lane.querySelector(`[data-slot="${seg.slot}"]`); if (!b) return;
  const sl = state.song[seg.slot], frac = (seg.rep * seg.len + (beat - seg.start)) / (seg.len * sl.reps);
  h.hidden = false; h.style.left = (b.offsetLeft + frac * b.offsetWidth - 1).toFixed(1) + 'px';
}

function songEdit(fn) { pushHistory(); fn(); renderLane(); invalidate(); save(); }
const swap = (a, b) => { const s = state.song; [s[a], s[b]] = [s[b], s[a]]; };

export function initSong() {
  $('patBars').innerHTML = PAT_BARS.map(b => `<option value="${b}">${b} bar${b > 1 ? 's' : ''}</option>`).join('');
  patBtns.addEventListener('click', e => { const b = e.target.closest('[data-pat]'); if (b) selectPattern(b.dataset.pat); });
  $('patBars').onchange = e => { pushHistory(); editPat().bars = +e.target.value; renderLane(); invalidate(); save(); };
  $('patCopy').onclick = () => {
    const i = PAT_IDS.indexOf(state.pat), src = editPat();
    const dst = [...state.patterns.slice(i + 1), ...state.patterns.slice(0, i)].find(p => !patHas(p));
    if (!dst) return toast('All 8 patterns have notes. Clear one first.');
    pushHistory(); dst.bars = src.bars; dst.clips = Object.fromEntries(Object.entries(src.clips).map(([id, c]) => [id, cloneClip(c)]));
    selectPattern(dst.id); toast(`Duplicated ${src.id} to ${dst.id}`, true);
  };
  $('patClear').onclick = () => {
    const p = editPat(); if (!patHas(p)) return;
    pushHistory(); Object.values(p.clips).forEach(c => c.notes = []); updateCount(); save();
    toast(`Cleared pattern ${p.id}`, true);
  };

  lane.addEventListener('click', e => {
    const b = e.target.closest('[data-slot]'); if (!b) return;
    selSlot = +b.dataset.slot;
    selectPattern(state.song[selSlot].pat);
    if (!playing && state.playMode === 'song') setPausedBeat(slotStart(selSlot));
    renderLane(); renderPatterns(); renderGrid(); invalidate();
  });
  $('slotAdd').onclick = () => songEdit(() => { state.song.push({ pat: state.pat, reps: 1 }); selSlot = state.song.length - 1; });
  $('slotL').onclick = () => { if (selSlot < 1) return; songEdit(() => { swap(selSlot - 1, selSlot); selSlot--; }); };
  $('slotR').onclick = () => { if (selSlot < 0 || selSlot >= state.song.length - 1) return; songEdit(() => { swap(selSlot, selSlot + 1); selSlot++; }); };
  $('slotMinus').onclick = () => { const s = state.song[selSlot]; if (!s || s.reps <= 1) return; songEdit(() => s.reps--); };
  $('slotPlus').onclick = () => { const s = state.song[selSlot]; if (!s || s.reps >= 16) return; songEdit(() => s.reps++); };
  $('slotDel').onclick = () => { if (selSlot < 0) return; songEdit(() => { state.song.splice(selSlot, 1); selSlot = Math.min(selSlot, state.song.length - 1); }); };
}
