/* JSON export format (version 3) and localStorage persistence. Older v1 / v2 files still load. */
import { PAT_IDS, PAT_BARS, CLIP_BARS, PALETTE, SCALES } from './constants.js';
import { PRESETS } from './presets.js';
import { state, emptyPatterns, attachNotes } from './state.js';
import { clamp, mod1, uid } from './util.js';

const STORAGE_KEY = 'spider-seq';
const cleanNote = n => ({ t: +n.t.toFixed(5), p: +n.p.toFixed(4), v: +n.v.toFixed(3) });

export function serialize() {
  const ids = new Set(state.tracks.map(t => t.id));
  return JSON.stringify({ version: 3, bpm: state.bpm, mode: state.mode, snap: state.snap, root: state.root, scale: state.scale, sel: state.sel,
    pat: state.pat, playMode: state.playMode, song: state.song,
    tracks: state.tracks.map(t => ({ id: t.id, name: t.name, preset: t.preset, color: t.color, vol: t.vol, base: t.base, mute: t.mute, solo: t.solo, pat: t.pat })),
    patterns: state.patterns.map(p => ({ id: p.id, bars: p.bars,
      clips: Object.fromEntries(Object.entries(p.clips).filter(([id]) => ids.has(id)).map(([id, c]) => [id, { bars: c.bars, notes: c.notes.map(cleanNote) }])) })) });
}

export function deserialize(json) {
  const o = typeof json === 'string' ? JSON.parse(json) : json;
  if (!o || !Array.isArray(o.tracks)) throw new Error('No "tracks" array found');
  const readNote = n => ({ t: mod1(+n.t || 0), p: clamp(+n.p || 0, 0, 1), v: clamp(+n.v || .8, .02, 1) });
  const okBars = b => CLIP_BARS.includes(b) ? b : 1;
  const gpat = PAT_IDS.includes(o.pat) ? o.pat : 'A';
  const tracks = o.tracks.map((t, i) => ({ id: t.id || uid(), name: String(t.name ?? 'Track ' + (i + 1)), preset: PRESETS[t.preset] ? t.preset : 'pluck',
    color: t.color || PALETTE[i % PALETTE.length], vol: clamp(+t.vol || .8, 0, 1),
    base: +t.base || PRESETS[t.preset]?.base || 36, mute: !!t.mute, solo: !!t.solo, pat: PAT_IDS.includes(t.pat) ? t.pat : gpat }));
  const tBars = o.tracks.map(t => okBars(t.bars));
  const patterns = emptyPatterns(Math.max(1, ...tBars));
  if (Array.isArray(o.patterns)) {
    for (const pd of o.patterns) {
      const p = patterns.find(x => x.id === pd.id); if (!p) continue;
      if (PAT_BARS.includes(pd.bars)) p.bars = pd.bars;
      if (pd.clips) for (const [id, c] of Object.entries(pd.clips)) p.clips[id] = { bars: okBars(c.bars), notes: (c.notes || []).map(readNote) };
      else for (const [id, ns] of Object.entries(pd.notes || {})) { /* version 2: notes per pattern, bars per track */
        const i = tracks.findIndex(t => t.id === id);
        p.clips[id] = { bars: i >= 0 ? tBars[i] : 1, notes: (ns || []).map(readNote) };
      }
    }
  } else { /* version 1: notes lived on the tracks */
    tracks.forEach((t, i) => { patterns[0].clips[t.id] = { bars: tBars[i], notes: (o.tracks[i].notes || []).map(readNote) }; });
  }
  tracks.forEach((t, i) => { if (!patterns.some(p => p.clips[t.id])) patterns[0].clips[t.id] = { bars: tBars[i], notes: [] }; });
  tracks.forEach(attachNotes);
  const song = (Array.isArray(o.song) ? o.song : []).filter(s => PAT_IDS.includes(s.pat)).map(s => ({ pat: s.pat, reps: clamp(Math.round(+s.reps || 1), 1, 16) }));
  return { bpm: clamp(+o.bpm || 120, 40, 240), mode: o.mode === 'volume' ? 'volume' : 'pitch', snap: [16, 8, 4, 0].includes(o.snap) ? o.snap : 16,
    root: clamp(+o.root || 0, 0, 11), scale: SCALES[o.scale] ? o.scale : 'minor', tracks, sel: tracks.some(t => t.id === o.sel) ? o.sel : tracks[0]?.id ?? null,
    patterns, pat: gpat, song, playMode: o.playMode === 'song' ? 'song' : 'pattern' };
}

let saveT;
export function save() {
  clearTimeout(saveT);
  saveT = setTimeout(() => { try { localStorage.setItem(STORAGE_KEY, serialize()); } catch (e) { /* storage blocked */ } }, 250);
}

export function load() {
  try { const s = localStorage.getItem(STORAGE_KEY); return s ? deserialize(s) : null; } catch (e) { return null; }
}
