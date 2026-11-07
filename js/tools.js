/* Buttons under the circle: rotate, random, clear, undo */
import { selTrack, isDrum, levels } from './state.js';
import { gridN } from './geometry.js';
import { invalidate } from './view.js';
import { save } from './storage.js';
import { pushHistory, undo } from './history.js';
import { updateCount } from './tracks.js';
import { toast } from './toast.js';
import { clamp, mod1 } from './util.js';

function rotate(dir) {
  const tr = selTrack(); if (!tr || !tr.notes.length) return;
  pushHistory(); const g = gridN(tr);
  tr.notes.forEach(n => n.t = mod1(n.t + dir / g));
  save(); invalidate();
}

function randomize() {
  const tr = selTrack(); if (!tr) return; pushHistory();
  const N = gridN(tr), drum = isDrum(tr), dens = drum ? .32 : .38, L = levels() - 1, notes = [];
  let last = Math.floor(Math.random() * (L * .5));
  for (let i = 0; i < N; i++) {
    if (Math.random() > (i % 4 === 0 ? dens + .25 : dens)) continue;
    last = clamp(last + Math.round((Math.random() - .5) * 6), 0, L);
    notes.push({ t: i / N, p: drum ? .5 : last / L, v: +(.35 + Math.random() * .65).toFixed(2) });
  }
  if (!notes.length) notes.push({ t: 0, p: .5, v: .9 });
  tr.notes = notes; updateCount(); save(); invalidate();
}

function clearNotes() {
  const tr = selTrack(); if (!tr || !tr.notes.length) return;
  pushHistory(); tr.notes = []; updateCount(); save(); invalidate();
  toast(`Cleared ${tr.name}`, true);
}

export function initTools() {
  document.getElementById('rotL').onclick = () => rotate(-1);
  document.getElementById('rotR').onclick = () => rotate(1);
  document.getElementById('rand').onclick = randomize;
  document.getElementById('clear').onclick = clearNotes;
  document.getElementById('undo').onclick = undo;
}
