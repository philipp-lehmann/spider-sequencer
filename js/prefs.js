/* App settings. Saved per browser, separate from the project, so they are not part of
   export / import, undo or starter sets. */
const KEY = 'spider-seq-prefs';

export const prefs = {
  circle: 'loop',  // 'loop' | 'bars', see geometry.js
  preview: true,   // play notes while adding or dragging them
};

const valid = {
  circle: v => v === 'loop' || v === 'bars',
  preview: v => typeof v === 'boolean',
};

try {
  const saved = JSON.parse(localStorage.getItem(KEY)) || {};
  for (const k of Object.keys(prefs)) if (valid[k](saved[k])) prefs[k] = saved[k];
} catch (e) { /* storage blocked or corrupt: keep defaults */ }

export function setPref(key, value) {
  if (!valid[key](value)) return;
  prefs[key] = value;
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) { /* storage blocked */ }
}
