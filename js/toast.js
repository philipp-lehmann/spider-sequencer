import { undo } from './history.js';
import { ic } from './icons.js';
import { esc } from './util.js';

let toastT;
export function toast(msg, withUndo) {
  document.querySelector('.toast')?.remove(); clearTimeout(toastT);
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status');
  t.innerHTML = `<span>${esc(msg)}</span>${withUndo ? `<button>${ic('corner-up-left')}Undo</button>` : '<span></span>'}`;
  document.body.appendChild(t);
  if (withUndo) t.querySelector('button').onclick = () => { undo(); t.remove(); };
  toastT = setTimeout(() => t.remove(), 3200);
}
