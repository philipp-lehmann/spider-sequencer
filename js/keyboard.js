import { PAT_IDS } from './constants.js';
import { state, selTrack } from './state.js';
import { toggle } from './transport.js';
import { view } from './view.js';
import { save } from './storage.js';
import { pushHistory, undo } from './history.js';
import { select } from './tracks.js';
import { selectPattern } from './song.js';
import { removeNote } from './editor.js';

export function initKeyboard() {
  document.addEventListener('keydown', e => {
    const typing = /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName) && e.target.type !== 'range';
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); undo(); return; }
    if (typing) return;
    if (e.code === 'Space') { e.preventDefault(); toggle(); return; }
    if (e.shiftKey && /^Digit[1-8]$/.test(e.code)) { selectPattern(PAT_IDS[+e.code.slice(5) - 1]); return; }
    if (/^[1-9]$/.test(e.key)) { const t = state.tracks[+e.key - 1]; if (t) select(t.id); return; }
    if ((e.key === 'Backspace' || e.key === 'Delete') && view.hover?.onNote) {
      pushHistory(); removeNote(selTrack(), view.hover.onNote); view.hover.onNote = null; save();
    }
  });
}
