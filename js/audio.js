/* Web Audio graph: master compressor, shared delay send, one gain bus per track */
import { state } from './state.js';
import { PRESETS } from './presets.js';

export let ctx = null, master, delayIn, noiseBuf;
let delayNode;
const buses = new Map();

export function ensureAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -12; comp.ratio.value = 4; comp.attack.value = .004; comp.release.value = .2;
  master = ctx.createGain(); master.gain.value = .7; master.connect(comp); comp.connect(ctx.destination);

  delayIn = ctx.createGain(); delayNode = ctx.createDelay(2);
  const fb = ctx.createGain(); fb.gain.value = .38;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
  const wet = ctx.createGain(); wet.gain.value = .55;
  delayIn.connect(delayNode); delayNode.connect(lp); lp.connect(fb); fb.connect(delayNode); lp.connect(wet); wet.connect(master);
  setDelayTime();

  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}

/* dotted eighth, follows the tempo */
export function setDelayTime() {
  if (delayNode) delayNode.delayTime.setTargetAtTime(.75 * 60 / state.bpm, ctx.currentTime, .05);
}

export function bus(tr) {
  let b = buses.get(tr.id);
  if (!b) {
    const g = ctx.createGain(), s = ctx.createGain();
    g.connect(master); g.connect(s); s.connect(delayIn);
    b = { g, s }; buses.set(tr.id, b);
  }
  b.g.gain.setTargetAtTime(tr.vol * tr.vol, ctx.currentTime, .02);
  b.s.gain.value = PRESETS[tr.preset].send || 0;
  return b.g;
}
