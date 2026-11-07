export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const mod1 = x => ((x % 1) + 1) % 1;
export const uid = () => 't' + Math.random().toString(36).slice(2, 9);
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
