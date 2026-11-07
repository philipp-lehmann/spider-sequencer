/* Static background of the circle: pitch / volume rings, time spokes, beat labels */
import { R0, R1, SCALES } from './constants.js';
import { state, selTrack, levels, isDrum, midiName } from './state.js';
import { rOf, xy, circleBars } from './geometry.js';
import { gridG } from './view.js';

export function renderGrid() {
  const tr = selTrack(); let h = `<circle class="disc" r="${R1}"/>`;
  if (state.mode === 'pitch') {
    const L = levels(), n = SCALES[state.scale].iv.length;
    for (let d = 0; d < L; d++) {
      const r = rOf(d / (L - 1)), root = d % n === 0;
      h += `<circle class="ring${root ? ' root' : ''}" r="${r.toFixed(1)}"/>`;
      if (root && tr && !isDrum(tr)) h += `<text class="rlab" x="-8" y="${(-r + 4).toFixed(1)}" text-anchor="end">${midiName(tr.base + state.root + (d / n) * 12)}</text>`;
    }
    if (tr && isDrum(tr)) h += `<text class="rlab" x="-8" y="${-rOf(.5) + 4}" text-anchor="end">tune 0</text><text class="rlab" x="-8" y="${-R1 + 16}" text-anchor="end">high</text><text class="rlab" x="-8" y="${-R0 - 6}" text-anchor="end">low</text>`;
  } else {
    for (const u of [.25, .5, .75, 1]) { const r = rOf(u); h += `<circle class="ring${u === 1 ? ' root' : ''}" r="${r}"/><text class="rlab" x="-8" y="${-r + 16}" text-anchor="end">${u * 100}%</text>`; }
  }
  if (tr) {
    const bars = circleBars(tr), free = !state.snap, div = free ? 16 : state.snap, N = bars * div;
    for (let i = 0; i < N; i++) {
      const [x1, y1] = xy(i / N, R0), [x2, y2] = xy(i / N, R1);
      const cls = i % div === 0 ? 'bar' : (i % (div / 4) === 0 ? 'beat' : '');
      h += `<line class="spk ${cls}${free && !cls ? ' free' : ''}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
    }
    const beats = bars * 4;
    for (let b = 0; b < beats; b++) {
      if (beats > 16 && b % 4) continue;
      const [x, y] = xy(b / beats, R1 + 34);
      const lab = beats > 16 ? String(b / 4 + 1) : (bars > 1 ? `${Math.floor(b / 4) + 1}.${b % 4 + 1}` : String(b + 1));
      h += `<text class="glab" x="${x.toFixed(1)}" y="${(y + 5).toFixed(1)}" text-anchor="middle">${lab}</text>`;
    }
  }
  h += `<circle class="rim" r="${R1}"/><circle class="rim" r="${R0}"/>`;
  gridG.innerHTML = h;
}
