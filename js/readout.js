/* Status line under the circle: hovered / dragged note, or the selected track's summary */
import { R0 } from './constants.js';
import { PRESETS } from './presets.js';
import { state, selTrack, isDrum, midiName, noteMidi } from './state.js';
import { snapA, toClipT, quantU } from './geometry.js';
import { view } from './view.js';
import { esc, mod1 } from './util.js';

const el = document.getElementById('readout');

function posLabel(tr, t) {
  const b = t * tr.bars * 4, bar = Math.floor(b / 4) + 1, beat = Math.floor(b % 4) + 1, s = (b * 4) % 4;
  return `${bar}.${beat}.${Math.abs(s - Math.round(s)) < .01 ? Math.round(s) % 4 + 1 : (s + 1).toFixed(2)}`;
}

function noteDesc(tr, n) {
  const pitch = isDrum(tr) ? `tune ${(n.p - .5 >= 0 ? '+' : '') + ((n.p - .5) * 12).toFixed(0)} st` : midiName(noteMidi(tr, n));
  return `${posLabel(tr, n.t)} · ${pitch} · vel ${Math.round(n.v * 100)}%`;
}

export function renderReadout(pos) {
  const { hover, drag } = view;
  const tr = selTrack(); let txt; const c = tr ? tr.color : 'transparent';
  if (!tr) txt = 'No track selected';
  else if (drag && drag.note) txt = noteDesc(tr, drag.note);
  else if (hover && hover.onNote) txt = noteDesc(tr, hover.onNote);
  else if (hover && hover.r > R0) {
    const n = { t: toClipT(tr, snapA(tr, hover.t, hover.shift), pos), p: state.mode === 'pitch' ? quantU(hover.u) : .5, v: state.mode === 'volume' ? quantU(hover.u) : .8 };
    txt = state.mode === 'pitch'
      ? `${posLabel(tr, n.t)} · ${isDrum(tr) ? 'tune' : midiName(noteMidi(tr, n))}`
      : `${posLabel(tr, n.t)} · vel ${Math.round(n.v * 100)}%`;
  } else {
    txt = `${tr.pat} · bar ${Math.floor(mod1(pos / (tr.bars * 4)) * tr.bars) + 1}/${tr.bars} · ${tr.name} · ${PRESETS[tr.preset].l} · ${tr.notes.length} notes`;
  }
  const key = c + txt; if (key === view.lastReadout) return; view.lastReadout = key;
  el.innerHTML = `<span class="sw" style="background:${c}"></span><span>${esc(txt)}</span>`;
}
