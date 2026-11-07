/* Export / import JSON dialog and the help dialog */
import { serialize, deserialize } from './storage.js';
import { pushHistory, applyState } from './history.js';
import { setBpm } from './transport.js';
import { toast } from './toast.js';
import { ic } from './icons.js';
import { pruneFeatures } from './features.js';

function modal(title, text, editable) {
  const sc = document.createElement('div'); sc.className = 'scrim';
  sc.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${title}"><h3>${title}</h3>
    <textarea id="jsonbox" spellcheck="false" ${editable ? 'placeholder="Paste a pattern JSON here"' : 'readonly'}></textarea>
    <div class="acts"><span class="msg" id="mmsg"></span>${editable ? `<button data-a="ok">${ic('upload')}Load</button>` : `<button data-a="copy">${ic('copy')}Copy JSON</button>`}<button data-a="x">${ic('x')}Close</button></div></div>`;
  document.body.appendChild(sc);
  const ta = sc.querySelector('textarea'); ta.value = text; ta.focus(); if (!editable) ta.select();
  const msg = sc.querySelector('#mmsg'), close = () => sc.remove();
  sc.addEventListener('click', async e => {
    if (e.target === sc) return close();
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'x') close();
    if (a === 'copy') {
      try { await navigator.clipboard.writeText(ta.value); msg.textContent = 'Copied'; }
      catch (_) { ta.select(); msg.textContent = 'Press ⌘/Ctrl+C to copy'; }
    }
    if (a === 'ok') {
      try { const s = deserialize(ta.value); pushHistory(); applyState(s); setBpm(s.bpm); close(); toast('Pattern loaded', true); }
      catch (err) { msg.textContent = 'Could not read that: ' + err.message; }
    }
  });
  sc.addEventListener('keydown', e => { if (e.key === 'Escape') close(); e.stopPropagation(); });
}

const HELP = `
<h4>Editing notes</h4><dl>
<dt>Add</dt><dd>Click an empty spot inside the circle. Keep holding to drag it into place.</dd>
<dt>Move</dt><dd>Drag a note. Around the circle is time, distance from the center is pitch or volume.</dd>
<dt>Delete</dt><dd>Double-click or right-click a note, drop it on the center, or hover it and press <kbd>Delete</kbd>.</dd>
<dt>Rotate</dt><dd>Hold <kbd>Alt</kbd>/<kbd>⌥</kbd> and drag to turn the whole track, or use the rotate buttons under the circle.</dd>
<dt>Pitch / Volume</dt><dd>Pitch snaps to the scale set under Key. On drum sounds, pitch tunes the drum. Each note keeps both values, so switching never loses anything.</dd></dl>
<h4>Timing</h4><dl>
<dt>Snap</dt><dd>1/16, 1/8 and 1/4 lock notes to the grid. Free places them exactly where you drop them.</dd>
<dt>Shift</dt><dd>Hold while placing or dragging to ignore the grid for that note.</dd>
<dt>Loop length</dt><dd>Each track's pattern has its own length (1–8 bars). Different lengths give you polyrhythms.</dd>
<div data-feature="circleBars"><dt>Circle</dt><dd>Loop: one turn is one loop of the track, so short loops go round faster. 4 bars: one turn is always 4 bars, all tracks share one playhead and short loops repeat (a 1-bar loop shows four times). Editing any copy changes all of them.</dd></div></dl>
<h4>Patterns</h4><dl>
<dt>Per track</dt><dd>Each track has eight patterns, A–H, in the bottom row of its card. A line under a letter means that pattern has notes.</dd>
<dt>All tracks</dt><dd>The letters under the circle switch every track to the same pattern at once. Duplicate and Clear there act on that pattern for all tracks.</dd>
<dt>Duplicate</dt><dd>The copy icon in a track's pattern row copies that one pattern into the track's next empty slot.</dd></dl>
<h4>Song</h4><dl>
<dt>Build</dt><dd>Press + to append the current All-tracks pattern. Select a block to move it, change its repeats or remove it.</dd>
<dt>Length</dt><dd>The bars menu in the All-tracks row sets how long that pattern lasts in the song.</dd>
<dt>Play</dt><dd>Switch Play to Song. Every track follows the blocks in order and the song loops at the end. Click a block while stopped to start from there.</dd></dl>
<h4>Keyboard</h4><dl>
<dt><kbd>Space</kbd></dt><dd>Play / pause</dd>
<dt><kbd>1</kbd>–<kbd>9</kbd></dt><dd>Select a track</dd>
<dt><kbd>Shift</kbd>+<kbd>1</kbd>–<kbd>8</kbd></dt><dd>Switch all tracks to pattern A–H</dd>
<dt><kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>Z</kbd></dt><dd>Undo</dd></dl>`;

function openHelp() {
  const sc = document.createElement('div'); sc.className = 'scrim';
  sc.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="Help"><h3>How it works</h3><div class="help">${HELP}</div><div class="acts"><span class="msg"></span><button data-a="x">${ic('x')}Close</button></div></div>`;
  pruneFeatures(sc);
  document.body.appendChild(sc);
  sc.querySelector('[data-a="x"]').focus();
  const close = () => { sc.remove(); document.getElementById('helpBtn').focus(); };
  sc.addEventListener('click', e => { if (e.target === sc || e.target.closest('[data-a="x"]')) close(); });
  sc.addEventListener('keydown', e => { if (e.key === 'Escape') close(); e.stopPropagation(); });
}

export function initDialogs() {
  document.getElementById('helpBtn').onclick = openHelp;
  document.getElementById('exportBtn').onclick = () => modal('Export pattern', JSON.stringify(JSON.parse(serialize()), null, 1), false);
  document.getElementById('importBtn').onclick = () => modal('Import pattern', '', true);
}
