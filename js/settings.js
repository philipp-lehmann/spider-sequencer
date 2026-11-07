/* Settings dialog. Each row belongs to a feature flag and disappears when that flag is off;
   the gear button disappears when no row is left. */
import { prefs, setPref } from './prefs.js';
import { CIRCLES } from './constants.js';
import { feature, pruneFeatures } from './features.js';
import { seg } from './header.js';
import { renderGrid } from './grid.js';
import { invalidate } from './view.js';
import { ic } from './icons.js';

/* key: pref name, feature: flag, options: [[value, label]] */
const ROWS = [
  { key: 'circle', feature: 'circleBars', title: 'Circle',
    desc: 'Loop: one turn is one loop of the track, so short loops go round faster. 4 bars: one turn is always 4 bars, all tracks share one playhead and short loops repeat.',
    options: CIRCLES, apply: () => { renderGrid(); invalidate(); } },
  { key: 'preview', feature: 'previewSetting', title: 'Preview sound',
    desc: 'Play notes while adding or dragging them.',
    options: [[true, 'On'], [false, 'Off']] },
];

const rowsOn = () => ROWS.filter(r => feature(r.feature));

function rowHtml(r) {
  return `<div class="flex flex-wrap items-center gap-x-6 gap-y-3 border-b-2 border-ink p-3.5" data-feature="${r.feature}">
    <div class="min-w-48 flex-1"><div class="font-semibold">${r.title}</div><div class="mt-0.5 text-xs leading-normal text-muted">${r.desc}</div></div>
    <div class="row seg flex" data-key="${r.key}"></div>
  </div>`;
}

function renderRow(sc, r) {
  const el = sc.querySelector(`[data-key="${r.key}"]`); if (!el) return;
  seg(el, r.options, prefs[r.key], v => {
    const value = r.options.find(([o]) => String(o) === v)[0]; /* data-v is a string, get the typed value back */
    setPref(r.key, value); r.apply?.(); renderRow(sc, r);
  });
}

function openSettings() {
  const sc = document.createElement('div'); sc.className = 'scrim';
  sc.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="Settings"><h3>Settings</h3>
    <div class="settings">${ROWS.map(rowHtml).join('')}</div>
    <div class="acts"><span class="msg"></span><button data-a="x">${ic('x')}Close</button></div></div>`;
  pruneFeatures(sc);
  ROWS.forEach(r => renderRow(sc, r));
  document.body.appendChild(sc);
  sc.querySelector('[data-a="x"]').focus();
  const close = () => { sc.remove(); document.getElementById('settingsBtn').focus(); };
  sc.addEventListener('click', e => { if (e.target === sc || e.target.closest('[data-a="x"]')) close(); });
  sc.addEventListener('keydown', e => { if (e.key === 'Escape') close(); e.stopPropagation(); });
}

export function initSettings() {
  const btn = document.getElementById('settingsBtn');
  if (!rowsOn().length) { btn.remove(); return; }
  btn.onclick = openSettings;
}
