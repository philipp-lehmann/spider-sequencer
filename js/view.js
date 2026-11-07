/* Shared view state for the circular editor. Kept on one object so any module can update it. */
export const view = {
  needs: true,      // redraw on the next frame
  hover: null,      // { r, t, u, shift, onNote }
  drag: null,       // { type: 'hub' | 'node' | 'rot', ... }
  lastPulse: 0,     // performance.now() of the last note hit
  lastReadout: '',  // reset to force the readout to re-render
};
export const invalidate = () => { view.needs = true; };

/* displayed radius per note (tweens between pitch and volume mode) and last hit time per note */
export const disp = new WeakMap(), hitAt = new WeakMap();

export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

export const svg = document.getElementById('stage');
export const gridG = document.getElementById('grid');
export const layers = document.getElementById('layers');
