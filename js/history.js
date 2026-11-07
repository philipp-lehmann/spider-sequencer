/* Undo stack of serialized snapshots, and swapping in a whole new state */
import { setState } from './state.js';
import { serialize, deserialize, save } from './storage.js';
import { ctx, setDelayTime } from './audio.js';
import { reanchor } from './transport.js';
import { syncHeader } from './header.js';
import { renderList } from './tracks.js';
import { renderGrid } from './grid.js';
import { renderPatterns, renderLane } from './song.js';
import { invalidate } from './view.js';
import { toast } from './toast.js';

const MAX = 80;
const stack = [];

export function pushHistory(snap = serialize()) {
  stack.push(snap);
  if (stack.length > MAX) stack.shift();
}

export function undo() {
  const s = stack.pop();
  if (!s) return toast('Nothing to undo');
  applyState(deserialize(s));
}

export function applyState(s) {
  reanchor();
  setState(s);
  if (ctx) setDelayTime();
  syncHeader(); renderList(); renderGrid(); renderPatterns(); renderLane(); invalidate(); save();
}
