/* Synth voices. Each preset's play(time, freqOrTune, velocity, duration, out) schedules one note. */
import { ctx, noiseBuf } from './audio.js';

function ampEnv(t, a, d, s, r, dur, peak) {
  const g = ctx.createGain(), p = g.gain, end = Math.max(t + dur, t + a + .005);
  p.setValueAtTime(0, t); p.linearRampToValueAtTime(peak, t + a);
  p.setTargetAtTime(peak * s, t + a, d / 3); p.setTargetAtTime(0, end, r / 4);
  return { g, stop: end + r * 1.6 + .05 };
}

function osc(type, freq, t, stop, dest, gain = 1, detune = 0) {
  const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; o.detune.value = detune;
  const g = ctx.createGain(); g.gain.value = gain; o.connect(g); g.connect(dest); o.start(t); o.stop(stop);
  return o;
}

function noise(t, stop, dest) {
  const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true; n.connect(dest);
  n.start(t, Math.random() * .5); n.stop(stop);
}

/* spec: { level, amp:[a,d,s,r], f?:{base,env,q,decay|rise}, oscs:[[type, ratio, gain, detune]] } */
function subtractive(spec) {
  return (t, freq, vel, dur, out) => {
    const A = spec.amp, e = ampEnv(t, A[0], A[1], A[2], A[3], dur, spec.level * (.25 + .75 * vel));
    let dest = e.g;
    if (spec.f) {
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = spec.f.q;
      const top = Math.min(spec.f.base + spec.f.env * (.3 + .7 * vel), 16000);
      if (spec.f.rise) { f.frequency.setValueAtTime(spec.f.base, t); f.frequency.setTargetAtTime(top, t, spec.f.rise / 3); }
      else { f.frequency.setValueAtTime(top, t); f.frequency.setTargetAtTime(spec.f.base, t + .002, spec.f.decay / 3); }
      f.connect(e.g); dest = f;
    }
    for (const o of spec.oscs) osc(o[0], freq * (o[1] || 1), t, e.stop, dest, o[2] ?? 1, o[3] || 0);
    e.g.connect(out);
  };
}

export const PRESETS = {
  sub: { l: 'Sub Bass', drum: false, base: 24, max: 1.6, send: 0,
    play: subtractive({ level: .75, amp: [.005, .3, .85, .08], oscs: [['sine', 1, 1], ['triangle', 2, .12]] }) },
  acid: { l: 'Acid', drum: false, base: 36, max: .5, send: .12,
    play: subtractive({ level: .4, amp: [.003, .25, .55, .05], f: { base: 160, env: 3200, q: 13, decay: .2 }, oscs: [['sawtooth', 1, 1]] }) },
  pluck: { l: 'Pluck', drum: false, base: 48, max: .6, send: .3,
    play: subtractive({ level: .32, amp: [.002, .28, 0, .2], f: { base: 500, env: 4200, q: 2, decay: .14 }, oscs: [['sawtooth', 1, .7, -8], ['sawtooth', 1, .7, 8], ['square', .5, .35]] }) },
  pad: { l: 'Pad', drum: false, base: 48, max: 5, send: .42,
    play: subtractive({ level: .2, amp: [.5, .8, .75, 1.6], f: { base: 500, env: 1400, q: 1, rise: 1.2 }, oscs: [['sawtooth', 1, .6, -14], ['sawtooth', 1, .6, 0], ['sawtooth', 1, .6, 14], ['sawtooth', .5, .4]] }) },
  lead: { l: 'Lead', drum: false, base: 60, max: 1.2, send: .25,
    play: subtractive({ level: .22, amp: [.01, .18, .7, .15], f: { base: 1200, env: 2600, q: 4, decay: .25 }, oscs: [['square', 1, .7], ['sawtooth', 1, .6, 7]] }) },
  bell: { l: 'FM Bell', drum: false, base: 60, max: 3, send: .4, play: (t, freq, vel, dur, out) => {
    const e = ampEnv(t, .002, 1.4, 0, 1, dur, .3 * (.3 + .7 * vel)); const stop = t + 2.6;
    const c = ctx.createOscillator(); c.frequency.value = freq;
    const m = ctx.createOscillator(); m.frequency.value = freq * 3.5;
    const mg = ctx.createGain(); mg.gain.setValueAtTime(freq * (2 + 5 * vel), t); mg.gain.setTargetAtTime(0, t, .35);
    m.connect(mg); mg.connect(c.frequency); c.connect(e.g); e.g.connect(out);
    c.start(t); m.start(t); c.stop(stop); m.stop(stop);
  } },
  tom: { l: 'Tom (pitched)', drum: false, base: 36, max: .6, send: .12, play: (t, freq, vel, dur, out) => {
    const g = ctx.createGain(); g.gain.setValueAtTime(.9 * vel, t); g.gain.setTargetAtTime(0, t, .09);
    const o = ctx.createOscillator(); o.frequency.setValueAtTime(freq * 2.2, t); o.frequency.exponentialRampToValueAtTime(freq, t + .06);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + .6);
  } },
  kick: { l: 'Kick', drum: true, max: .5, send: 0, play: (t, tune, vel, dur, out) => {
    const g = ctx.createGain(); g.gain.setValueAtTime(1.1 * vel, t); g.gain.setTargetAtTime(0, t + .02, .11);
    const o = ctx.createOscillator(); o.frequency.setValueAtTime(170 * tune, t); o.frequency.exponentialRampToValueAtTime(44 * tune, t + .11);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + .7);
    const c = ctx.createGain(); c.gain.setValueAtTime(.4 * vel, t); c.gain.setTargetAtTime(0, t, .004);
    osc('square', 900, t, t + .03, c); c.connect(out);
  } },
  snare: { l: 'Snare', drum: true, max: .4, send: .08, play: (t, tune, vel, dur, out) => {
    const g = ctx.createGain(); g.gain.setValueAtTime(.6 * vel, t); g.gain.setTargetAtTime(0, t, .05);
    const bp = ctx.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = 1400 * tune; bp.connect(g); noise(t, t + .4, bp);
    const tg = ctx.createGain(); tg.gain.setValueAtTime(.5 * vel, t); tg.gain.setTargetAtTime(0, t, .03);
    osc('triangle', 190 * tune, t, t + .2, tg); tg.connect(out);
    g.connect(out);
  } },
  hat: { l: 'Hi-Hat', drum: true, max: .3, send: .05, play: (t, tune, vel, dur, out) => {
    const g = ctx.createGain(); g.gain.setValueAtTime(.35 * vel, t); g.gain.setTargetAtTime(0, t, .012 + .03 * vel);
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000 * tune; hp.connect(g);
    noise(t, t + .3, hp); g.connect(out);
  } },
  clap: { l: 'Clap', drum: true, max: .4, send: .15, play: (t, tune, vel, dur, out) => {
    const g = ctx.createGain(), p = g.gain; p.setValueAtTime(0, t);
    for (const o of [0, .011, .023]) { p.setValueAtTime(.6 * vel, t + o); p.setTargetAtTime(0, t + o, .006); }
    p.setValueAtTime(.45 * vel, t + .034); p.setTargetAtTime(0, t + .034, .07);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1300 * tune; bp.Q.value = 1.4; bp.connect(g);
    noise(t, t + .5, bp); g.connect(out);
  } },
};
