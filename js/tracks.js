/* Track list in the side panel */
import { PAT_IDS, PALETTE, CLIP_BARS } from './constants.js';
import { PRESETS } from './presets.js';
import { ctx, bus } from './audio.js';
import { state, patById, clipOf, clipHas, trPat, patColor, attachNotes, cloneClip, isDrum, audible } from './state.js';
import { preview } from './transport.js';
import { view, invalidate } from './view.js';
import { save } from './storage.js';
import { pushHistory } from './history.js';
import { renderGrid } from './grid.js';
import { renderPatterns } from './song.js';
import { toast } from './toast.js';
import { ic } from './icons.js';
import { esc, uid } from './util.js';

const list = document.getElementById('tracks');
const OCTAVES = [1, 2, 3, 4, 5, 6];

const presetOpts = k => Object.entries(PRESETS).map(([key, p]) => `<option value="${key}"${key === k ? ' selected' : ''}>${p.l}</option>`).join('');
const barOpts = b => CLIP_BARS.map(v => `<option value="${v}"${v === b ? ' selected' : ''}>${v} bar${v > 1 ? 's' : ''}</option>`).join('');
const octOpts = b => OCTAVES.map(o => `<option value="${(o + 1) * 12}"${(o + 1) * 12 === b ? ' selected' : ''}>Oct ${o}</option>`).join('');

export function renderList() {
  if (!state.tracks.length) { list.innerHTML = `<li class="empty">No tracks yet. Add one, or load a starter set below.</li>`; return; }
  list.innerHTML = state.tracks.map((t, i) => `
  <li class="trk${audible(t) ? '' : ' off'}" data-id="${t.id}" aria-selected="${t.id === state.sel}" style="--c:${t.color}">
    <button class="chip" data-act="color" title="Change colour" aria-label="Change colour">${i < 9 ? i + 1 : ''}</button>
    <div class="r1">
      <input class="nm" data-act="name" value="${esc(t.name)}" aria-label="Track name" id="nm-${t.id}">
      <button data-act="mute" aria-pressed="${t.mute}" title="Mute" aria-label="Mute">${ic('volume-x')}</button>
      <button data-act="solo" aria-pressed="${t.solo}" title="Solo" aria-label="Solo">${ic('headphones')}</button>
      <button data-act="dup" title="Duplicate track" aria-label="Duplicate track">${ic('copy')}</button>
      <button data-act="del" title="Delete track" aria-label="Delete track">${ic('trash-2')}</button>
    </div>
    <div class="r2">
      <select class="pre" data-act="preset" aria-label="Sound" id="pre-${t.id}">${presetOpts(t.preset)}</select>
      <select data-act="bars" aria-label="Loop length" id="bars-${t.id}">${barOpts(t.bars)}</select>
      ${isDrum(t) ? '' : `<select data-act="oct" aria-label="Octave" id="oct-${t.id}">${octOpts(t.base)}</select>`}
      <label class="vol" title="Volume"><input type="range" min="0" max="1" step="0.01" value="${t.vol}" data-act="vol" aria-label="Volume" id="vol-${t.id}"></label>
    </div>
    <div class="r3" role="group" aria-label="Pattern for ${esc(t.name)}">${trackPatBtns(t)}<button class="tdup" data-act="tdup" title="Duplicate this track's pattern into its next empty slot" aria-label="Duplicate pattern">${ic('copy')}</button></div>
  </li>`).join('');
}

function trackPatBtns(t) {
  return PAT_IDS.map(id => `<button class="tp${clipHas(t, patById(id)) ? ' has' : ''}" data-act="tpat" data-pat="${id}" aria-pressed="${t.pat === id}" style="--pc:${patColor(id)}" title="Play pattern ${id} on this track">${id}</button>`).join('');
}

/* cheap refresh of the per-track pattern rows without re-rendering the list */
export function renderTrackPats() {
  list.querySelectorAll('.trk').forEach(li => {
    const t = state.tracks.find(x => x.id === li.dataset.id); if (!t) return;
    li.querySelectorAll('.tp').forEach(b => {
      const id = b.dataset.pat;
      b.setAttribute('aria-pressed', t.pat === id);
      b.classList.toggle('has', clipHas(t, patById(id)));
    });
    const bs = li.querySelector('[data-act="bars"]'); if (bs) bs.value = t.bars;
  });
}

/* call after notes were added or removed */
export function updateCount() { renderPatterns(); renderTrackPats(); invalidate(); }

const trackOf = el => { const li = el.closest('.trk'); return li && state.tracks.find(t => t.id === li.dataset.id); };

export function select(id) {
  if (state.sel === id) return;
  state.sel = id;
  list.querySelectorAll('.trk').forEach(li => li.setAttribute('aria-selected', li.dataset.id === id));
  renderGrid(); invalidate(); save();
}

function onClick(e) {
  const tr = trackOf(e.target); if (!tr) return;
  const el = e.target.closest('[data-act]'), act = el?.dataset.act;
  if (act === 'tpat') {
    tr.pat = el.dataset.pat; state.sel = null; select(tr.id);
    renderTrackPats(); renderPatterns(); renderGrid(); view.lastReadout = ''; invalidate(); save(); return;
  }
  if (act === 'tdup') {
    const i = PAT_IDS.indexOf(tr.pat), dst = [...state.patterns.slice(i + 1), ...state.patterns.slice(0, i)].find(p => !clipHas(tr, p));
    if (!dst) return toast(`All 8 patterns on ${tr.name} have notes. Clear one first.`);
    pushHistory(); const from = tr.pat; dst.clips[tr.id] = cloneClip(clipOf(tr, trPat(tr))); tr.pat = dst.id;
    select(tr.id); renderTrackPats(); renderPatterns(); renderGrid(); invalidate(); save();
    toast(`Duplicated ${tr.name} ${from} to ${dst.id}`, true); return;
  }
  if (act === 'mute' || act === 'solo') { tr[act] = !tr[act]; renderList(); save(); invalidate(); return; }
  if (act === 'color') {
    pushHistory(); tr.color = PALETTE[(PALETTE.indexOf(tr.color) + 1) % PALETTE.length];
    renderList(); select(tr.id); invalidate(); save(); return;
  }
  if (act === 'dup') {
    pushHistory();
    const c = attachNotes(JSON.parse(JSON.stringify(tr))); c.id = uid(); c.name = tr.name + ' copy'; c.solo = false;
    for (const p of state.patterns) if (p.clips[tr.id]) p.clips[c.id] = cloneClip(p.clips[tr.id]);
    c.color = PALETTE.find(p => !state.tracks.some(t => t.color === p)) || PALETTE[(PALETTE.indexOf(tr.color) + 1) % PALETTE.length];
    state.tracks.splice(state.tracks.indexOf(tr) + 1, 0, c); state.sel = c.id;
    renderList(); renderGrid(); invalidate(); save(); return;
  }
  if (act === 'del') {
    pushHistory(); const i = state.tracks.indexOf(tr); state.tracks.splice(i, 1);
    for (const p of state.patterns) delete p.clips[tr.id];
    if (state.sel === tr.id) state.sel = state.tracks[Math.min(i, state.tracks.length - 1)]?.id ?? null;
    renderList(); renderGrid(); invalidate(); save(); toast(`Deleted ${tr.name}`, true); return;
  }
  select(tr.id);
}

function onInput(e) {
  const tr = trackOf(e.target); if (!tr) return; const act = e.target.dataset.act;
  if (act === 'name') { tr.name = e.target.value; save(); view.lastReadout = ''; invalidate(); }
  if (act === 'vol') { tr.vol = +e.target.value; if (ctx) bus(tr); save(); }
}

function onChange(e) {
  const tr = trackOf(e.target); if (!tr) return; const act = e.target.dataset.act;
  if (act === 'name' || act === 'vol') return;
  pushHistory();
  if (act === 'preset') {
    const was = isDrum(tr); tr.preset = e.target.value;
    if (PRESETS[tr.preset].base) tr.base = PRESETS[tr.preset].base;
    if (was !== isDrum(tr)) renderList(); else { const o = document.getElementById('oct-' + tr.id); if (o) o.value = tr.base; }
    if (ctx) preview(tr, { t: 0, p: .5, v: .8 });
  }
  if (act === 'bars') tr.bars = +e.target.value;
  if (act === 'oct') tr.base = +e.target.value;
  renderGrid(); invalidate(); save();
}

function addTrack() {
  pushHistory();
  const used = new Set(state.tracks.map(t => t.color));
  const t = attachNotes({ id: uid(), name: 'Track ' + (state.tracks.length + 1), preset: 'pluck',
    color: PALETTE.find(p => !used.has(p)) || PALETTE[state.tracks.length % PALETTE.length],
    vol: .8, base: 48, mute: false, solo: false, pat: state.pat });
  state.patterns[0].clips[t.id] = { bars: 1, notes: [] };
  state.tracks.push(t); state.sel = t.id;
  renderList(); renderGrid(); invalidate(); save();
}

export function initTracks() {
  list.addEventListener('click', onClick);
  list.addEventListener('focusin', e => { const tr = trackOf(e.target); if (tr) select(tr.id); });
  list.addEventListener('input', onInput);
  list.addEventListener('change', onChange);
  document.getElementById('addTrk').onclick = addTrack;
}
