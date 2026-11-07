/* App state and the helpers that read it.
   `state` is a live binding: other modules always see the current object, but only setState() may replace it. */
import { SCALES, NAMES, PAT_IDS, PALETTE } from './constants.js';
import { PRESETS } from './presets.js';

export let state = { bpm: 120, mode: 'pitch', circle: 'loop', snap: 16, root: 9, scale: 'minor', tracks: [], sel: null, patterns: [], pat: 'A', song: [], playMode: 'pattern' };
export function setState(s) { state = s; }

/* number of pitch rings: two octaves of the scale plus the top root */
export const levels = () => SCALES[state.scale].iv.length * 2 + 1;
export const selTrack = () => state.tracks.find(t => t.id === state.sel) || null;

export const patById = id => state.patterns.find(p => p.id === id) || state.patterns[0];
export const editPat = () => patById(state.pat);
export const patLen = p => p.bars * 4;
export const patColor = id => PALETTE[PAT_IDS.indexOf(id) % PALETTE.length];
export const trPat = tr => patById(tr.pat);

function defaultBars(tr) {
  for (const p of state.patterns) { const c = p.clips[tr.id]; if (c) return c.bars; }
  return 1;
}
/* a clip = one track's notes inside one pattern; each clip has its own loop length */
export function clipOf(tr, p) { return p.clips[tr.id] || (p.clips[tr.id] = { bars: defaultBars(tr), notes: [] }); }
export const clipHas = (tr, p) => !!(p.clips[tr.id] && p.clips[tr.id].notes.length);
export const patHas = p => state.tracks.some(t => clipHas(t, p));
export const syncedPat = () => { const ids = new Set(state.tracks.map(t => t.pat)); return ids.size === 1 ? [...ids][0] : null; };

/* tr.notes / tr.bars always point at the track's current pattern */
export function attachNotes(tr) {
  Object.defineProperty(tr, 'notes', { configurable: true, enumerable: false,
    get() { return clipOf(this, trPat(this)).notes; }, set(v) { clipOf(this, trPat(this)).notes = v; } });
  Object.defineProperty(tr, 'bars', { configurable: true, enumerable: false,
    get() { return clipOf(this, trPat(this)).bars; }, set(v) { clipOf(this, trPat(this)).bars = v; } });
  return tr;
}
export function emptyPatterns(bars) { return PAT_IDS.map(id => ({ id, bars, clips: {} })); }
export const cloneClip = c => ({ bars: c.bars, notes: c.notes.map(n => ({ ...n })) });

/* pitch */
export function noteMidi(tr, n) {
  const iv = SCALES[state.scale].iv, L = levels(), d = Math.round(n.p * (L - 1));
  return tr.base + state.root + Math.floor(d / iv.length) * 12 + iv[d % iv.length];
}
export const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
export const midiName = m => NAMES[m % 12] + (Math.floor(m / 12) - 1);

export const isDrum = tr => PRESETS[tr.preset].drum;
export const audible = tr => { const solo = state.tracks.some(t => t.solo); return !tr.mute && (!solo || tr.solo); };
