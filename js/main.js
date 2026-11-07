import { state, setState } from './state.js';
import { buildSet } from './sets.js';
import { serialize, load } from './storage.js';
import { play, pause } from './transport.js';
import { hydrateIcons } from './icons.js';
import { pruneFeatures } from './features.js';
import { initHeader, syncHeader, syncPlayBtn } from './header.js';
import { initTracks, renderList } from './tracks.js';
import { initTools } from './tools.js';
import { initEditor } from './editor.js';
import { initSong, renderPatterns, renderLane } from './song.js';
import { initDialogs } from './dialogs.js';
import { initKeyboard } from './keyboard.js';
import { renderGrid } from './grid.js';
import { startLoop } from './stage.js';

pruneFeatures();
hydrateIcons();
initHeader(); initTracks(); initTools(); initEditor(); initSong(); initDialogs(); initKeyboard();

setState(load() || buildSet('techno'));
syncHeader(); syncPlayBtn(); renderList(); renderGrid(); renderPatterns(); renderLane();
startLoop();

/* debugging hook */
window.__seq = { get state() { return state; }, play, pause, serialize };
