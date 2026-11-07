/* Starter sets.
   tracks: [name, preset, loop bars, opts]
   pats:   id -> { bars, n: { trackName: [[step16 | t (when opts.free), scale degree, velocity]] } } */
import { SCALES, PALETTE } from './constants.js';
import { PRESETS } from './presets.js';
import { state, emptyPatterns, attachNotes } from './state.js';
import { uid } from './util.js';

export const SETS = {
  techno: { l: 'Minimal Techno', bpm: 124, root: 9, scale: 'minor',
    tracks: [['Kick', 'kick', 1], ['Hats', 'hat', 1], ['Clap', 'clap', 1], ['Acid', 'acid', 1], ['Pad', 'pad', 4, { vol: .6 }]],
    pats: {
      A: { bars: 4, n: { Kick: [[0, 7, .95], [4, 7, .95], [8, 7, .95], [12, 7, .95]],
        Hats: [[2, 9, .85], [6, 9, .85], [10, 9, .85], [14, 9, .85], [3, 7, .3], [7, 7, .4], [11, 7, .3], [15, 7, .55], [13, 7, .25]],
        Clap: [[4, 7, .75], [12, 7, .8]],
        Acid: [[0, 0, .95], [2, 0, .45], [3, 7, .8], [5, 2, .6], [6, 0, .4], [8, 3, 1], [10, 0, .5], [11, 4, .7], [13, 7, .9], [14, 6, .5]],
        Pad: [[0, 4, .5], [16, 6, .45], [32, 8, .5], [48, 7, .45]] } },
      B: { bars: 4, n: { Hats: [[2, 9, .55], [6, 9, .55], [10, 9, .55], [14, 9, .6], [15, 7, .3]],
        Acid: [[0, 0, .6], [3, 7, .5], [8, 3, .7], [11, 4, .5], [14, 7, .6]],
        Pad: [[0, 4, .55], [16, 6, .5], [32, 8, .55], [48, 9, .5]] } },
      C: { bars: 1, n: { Kick: [[0, 7, .9], [4, 7, .9], [8, 7, .9], [10, 7, .7], [12, 7, .8], [13, 7, .85], [14, 7, .9], [15, 7, 1]],
        Hats: [[2, 9, .85], [6, 9, .85], [10, 9, .85], [14, 9, .85]],
        Clap: [[12, 7, .6], [14, 7, .8], [15, 7, 1]],
        Acid: [[0, 0, .95], [3, 7, .8], [6, 9, .7], [8, 10, .9], [11, 12, .8], [14, 13, 1]] } },
    },
    song: [['B', 1], ['A', 2], ['C', 1], ['B', 1], ['A', 2], ['C', 1]] },
  ambient: { l: 'Ambient Drift', bpm: 76, root: 2, scale: 'dorian',
    tracks: [['Pad', 'pad', 4, { vol: .7 }], ['Bells', 'bell', 3, { free: true }], ['Sub', 'sub', 2], ['Dust', 'hat', 1, { vol: .6 }]],
    pats: {
      A: { bars: 12, n: { Pad: [[0, 2, .55], [20, 4, .5], [40, 6, .55], [52, 5, .45]],
        Bells: [[.03, 9, .6], [.17, 11, .45], [.29, 7, .7], [.46, 12, .4], [.58, 8, .65], [.77, 14, .5], [.88, 10, .4]],
        Sub: [[0, 0, .8], [16, 3, .7], [24, 4, .6]],
        Dust: [[2, 5, .25], [5, 9, .4], [9, 4, .2], [11, 11, .35], [14, 7, .45]] } },
      B: { bars: 4, n: { Pad: [[0, 5, .5], [24, 7, .5], [44, 4, .5]],
        Bells: [[.08, 12, .5], [.33, 10, .45], [.61, 13, .55], [.9, 9, .4]],
        Sub: [[0, 5, .7], [16, 4, .7]] } },
    },
    song: [['A', 1], ['B', 2], ['A', 1]] },
  arp: { l: 'Arp Machine', bpm: 112, root: 4, scale: 'pentMinor',
    tracks: [['Arp', 'pluck', 1], ['Lead', 'lead', 2, { vol: .6 }], ['Kick', 'kick', 1], ['Toms', 'tom', 1], ['Sub', 'sub', 2]],
    pats: {
      A: { bars: 2, n: { Arp: [0, 4, 7, 10, 9, 7, 4, 2, 0, 5, 8, 10, 8, 5, 3, 2].map((d, i) => [i, d, i % 4 === 0 ? .95 : .55]),
        Lead: [[0, 7, .7], [6, 8, .6], [12, 6, .6], [16, 5, .7], [24, 4, .6], [28, 6, .6]],
        Kick: [[0, 5, .95], [7, 5, .6], [10, 5, .85]],
        Toms: [[3, 2, .6], [11, 4, .6], [14, 6, .7]],
        Sub: [[0, 0, .8], [12, 0, .6], [16, 3, .8], [28, 2, .6]] } },
      B: { bars: 2, n: { Arp: [0, 2, 4, 7, 4, 2, 5, 8, 10, 8, 5, 3, 7, 5, 3, 1].map((d, i) => [i, d, i % 4 === 0 ? .95 : .55]),
        Lead: [[0, 9, .7], [8, 8, .6], [16, 7, .7], [20, 6, .6], [24, 5, .6]],
        Kick: [[0, 5, .95], [4, 5, .9], [8, 5, .95], [12, 5, .9]],
        Toms: [[3, 2, .6], [6, 3, .5], [11, 4, .6], [13, 5, .6], [14, 6, .7], [15, 8, .8]],
        Sub: [[0, 3, .8], [16, 2, .8]] } },
      C: { bars: 2, n: { Arp: [0, 4, 7, 10, 9, 7, 4, 2, 0, 5, 8, 10, 8, 5, 3, 2].map((d, i) => [i, d, .4 + .3 * (i % 4 === 0)]) } },
    },
    song: [['C', 2], ['A', 2], ['B', 2], ['A', 2], ['C', 1]] },
};

export function buildSet(key) {
  const s = SETS[key], L = SCALES[s.scale].iv.length * 2;
  const tracks = s.tracks.map(([name, preset], i) => ({ id: uid(), name, preset, color: PALETTE[i % PALETTE.length],
    vol: s.tracks[i][3]?.vol ?? .8, base: PRESETS[preset].base ?? 36, mute: false, solo: false, pat: 'A' }));
  const patterns = emptyPatterns(s.pats.A.bars);
  for (const [pid, pd] of Object.entries(s.pats)) {
    const p = patterns.find(x => x.id === pid); p.bars = pd.bars;
    s.tracks.forEach(([name, , bars, o = {}], i) => {
      const raw = pd.n[name]; if (!raw) return;
      p.clips[tracks[i].id] = { bars, notes: raw.map(([pos, deg, v]) => ({ t: o.free ? pos : pos / (bars * 16), p: deg / L, v })) };
    });
  }
  s.tracks.forEach(([, , bars], i) => { if (!patterns[0].clips[tracks[i].id]) patterns[0].clips[tracks[i].id] = { bars, notes: [] }; });
  tracks.forEach(attachNotes);
  return { bpm: s.bpm, mode: state.mode, snap: state.snap, root: s.root, scale: s.scale, tracks, sel: tracks[0].id,
    patterns, pat: 'A', song: s.song.map(([pat, reps]) => ({ pat, reps })), playMode: 'pattern' };
}
