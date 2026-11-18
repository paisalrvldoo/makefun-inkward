import { playArtSound } from './audio/artSounds.js';
import { playFinaleSound } from './audio/finaleSounds.js';
import { playJuiceSound } from './audio/juiceSounds.js';
import { createMusic } from './audio/music.js';

export function createAudio() {
  let context = null;
  let output = null;
  let muted = false;
  let lastStroke = 0;
  let ambientSource = null, ambientGain = null, ambientLfo = null;
  function unlock() {
    if (!context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        context = new AudioContext(); output = context.createGain();
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -12; compressor.ratio.value = 3; compressor.attack.value = 0.006; compressor.release.value = 0.2;
        output.gain.value = muted ? 0 : 0.72; output.connect(compressor).connect(context.destination);
      }
    }
    if (context?.state === 'suspended') context.resume().catch(() => {});
  }
  function tone(frequency, duration, volume = 0.12, type = 'sine', delay = 0) {
    if (!context || muted || context.state !== 'running') return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(gain).connect(output);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }
  function rustle(duration, volume, cutoff, delay = 0) {
    if (!context || muted || context.state !== 'running') return;
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
    source.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = cutoff; gain.gain.value = volume;
    source.connect(filter).connect(gain).connect(output); source.start(context.currentTime + delay);
  }

  // Karplus-Strong plucked string (koto-like): noise burst into a repeating delay line.
  function pluck(frequency, velocity = 0.55, delay = 0) {
    if (!context || muted || context.state !== 'running') return;
    const start = context.currentTime + delay;
    const delayTime = 1 / frequency;
    const delayNode = context.createDelay(Math.max(0.04, delayTime * 1.15));
    const feedback = context.createGain();
    const pluckGain = context.createGain();
    const bandpass = context.createBiquadFilter();
    delayNode.delayTime.setValueAtTime(delayTime, start);
    feedback.gain.setValueAtTime(0.82 + velocity * 0.10, start);
    feedback.gain.exponentialRampToValueAtTime(0.001, start + 0.60);
    pluckGain.gain.setValueAtTime(velocity * 0.12, start);
    pluckGain.gain.exponentialRampToValueAtTime(0.001, start + 0.55);
    bandpass.type = 'bandpass';
    bandpass.frequency.value = frequency;
    bandpass.Q.value = 2.5;
    const sampleCount = Math.max(3, Math.floor(context.sampleRate * delayTime * 0.7));
    const noise = context.createBuffer(1, sampleCount, context.sampleRate);
    const noiseData = noise.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) noiseData[i] = (Math.random() * 2 - 1) * (1 - i / noiseData.length);
    const noiseSource = context.createBufferSource();
    noiseSource.buffer = noise;
    noiseSource.connect(bandpass).connect(pluckGain);
    pluckGain.connect(delayNode).connect(feedback).connect(delayNode);
    pluckGain.connect(output);
    noiseSource.start(start);
  }

  // Deep taiko drum: low thud plus filtered noise strike.
  function taiko(velocity = 0.7, delay = 0) {
    if (!context || muted || context.state !== 'running') return;
    const start = context.currentTime + delay;
    tone(53, 0.38, velocity * 0.28, 'triangle', delay);
    tone(48, 0.25, velocity * 0.18, 'sine', delay + 0.03);
    rustle(0.14, velocity * 0.22, 360, delay);
    rustle(0.09, velocity * 0.11, 650, delay + 0.02);
  }

  function startAmbient() {
    if (!context || muted || context.state !== 'running' || ambientSource) return;
    const bufferSize = Math.floor(context.sampleRate * 4);
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
    ambientSource = context.createBufferSource();
    ambientSource.buffer = buffer;
    ambientSource.loop = true;
    const bandpass = context.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 340;
    bandpass.Q.value = 0.8;
    ambientGain = context.createGain();
    ambientGain.gain.value = 0.008;
    ambientLfo = context.createOscillator();
    ambientLfo.type = 'sine';
    ambientLfo.frequency.value = 0.09;
    const lfoGain = context.createGain();
    lfoGain.gain.value = 120;
    ambientLfo.connect(lfoGain).connect(bandpass.frequency);
    ambientSource.connect(bandpass).connect(ambientGain).connect(output);
    ambientSource.start();
    ambientLfo.start();
  }

  function stopAmbient() {
    if (ambientSource) {
      try { ambientSource.stop(); } catch {}
      ambientSource = null;
    }
    if (ambientLfo) {
      try { ambientLfo.stop(); } catch {}
      ambientLfo = null;
    }
    ambientGain = null;
  }

  const music = createMusic(tone, rustle, pluck, taiko, () => context && !muted && context.state === 'running' ? context.currentTime : null);
  let ambientRunning = false;
  return {
    unlock,
    music,
    update: state => {
      music.update(state);
      if (!muted && context && context.state === 'running') {
        if (!ambientRunning) { startAmbient(); ambientRunning = true; }
      } else {
        if (ambientRunning) { stopAmbient(); ambientRunning = false; }
      }
    },
    get muted() { return muted; },
    toggle() {
      muted = !muted;
      if (context) output.gain.setTargetAtTime(muted ? 0 : 0.72, context.currentTime, 0.015);
      if (muted) { stopAmbient(); ambientRunning = false; }
      return muted;
    },
    play(name, value = 1) {
      if (playJuiceSound(name, value, tone, rustle, pluck)) return;
      if (playFinaleSound(name, value, tone, rustle)) return;
      if (name.startsWith('art:')) {
        playArtSound(name.slice(4), tone, rustle);
      } else if (name === 'stroke') {
        if (!context || context.currentTime - lastStroke < 0.13) return;
        lastStroke = context.currentTime;
        tone(220 + value % 5 * 55, 0.18, 0.035, 'triangle');
      } else if (name === 'seal') {
        tone(85, 0.25, 0.25, 'triangle');
        const base = 330 + value * 12;
        [base, base * 1.3, base * 2, base * 2.7].forEach((f, i) => tone(f, 0.45, 0.065, 'sine', i * 0.035));
      } else if (name === 'bigSeal') {
        tone(48, 0.35, 0.2, 'triangle'); rustle(0.24, 0.2, 800);
        taiko(0.75);
      } else if (name === 'petals') {
        rustle(0.16, 0.045, 2400);
      } else if (name === 'combo') {
        const pitch = 440 + value * 44;
        tone(pitch, 0.28, 0.075, 'sine'); tone(pitch * 1.5, 0.2, 0.03, 'sine', 0.04);
      } else if (name === 'wallHit') {
        rustle(0.08, 0.06, 1300); tone(92, 0.08, 0.04, 'triangle');
      } else if (name === 'bellHit') {
        tone(110, 0.7, 0.17, 'triangle'); tone(311, 0.6, 0.075); rustle(0.2, 0.1, 1700);
      } else if (name === 'thunder') {
        rustle(0.12, 0.1, 4000); tone(1760, 0.16, 0.035, 'sawtooth');
      } else if (name === 'scrollIntro' || name === 'bossIntro') {
        tone(73, 0.6, 0.12, 'triangle'); [294, 440, 588].forEach((f, i) => tone(f, 0.8, 0.06, 'sine', i * 0.13));
        // Boss intros get a taiko strike.
        if (name === 'bossIntro') taiko(0.6);
      } else if (name === 'warning') {
        [0, 0.18, 0.36].forEach(delay => tone(147, 0.12, 0.08, 'triangle', delay));
      } else if (['storm', 'roar', 'charge'].includes(name)) {
        rustle(0.3, 0.12, name === 'storm' ? 3500 : 700); tone(name === 'charge' ? 82 : 55, 0.4, 0.13, 'triangle');
        if (name === 'roar') taiko(0.72, 0.04);
      } else if (name === 'omen') {
        [660, 880, 1100].forEach((f, i) => tone(f, 0.5, 0.065, 'sine', i * 0.07));
      } else if (name === 'wrath') {
        tone(65 + value * 9, 0.4, 0.14, 'triangle');
        tone(147, 0.25, 0.07, 'sawtooth', 0.08);
        if (value >= 4) taiko(0.5);
      } else if (name === 'bell') {
        [294, 588, 882].forEach(f => tone(f, 1.2, 0.09));
      } else if (name === 'dash' || name === 'splash') {
        rustle(0.15, 0.05, name === 'dash' ? 3000 : 1000);
        tone(155, 0.25, 0.13, 'triangle');
        tone(330, 0.15, 0.045, 'sine', 0.04);
      } else if (name === 'win' || name === 'draft') {
        [330, 440, 550, 660].forEach((f, i) => tone(f, 0.7, 0.09, 'triangle', i * 0.15));
      } else if (name === 'lose') {
        [294, 220, 147].forEach((f, i) => tone(f, 0.7, 0.1, 'sine', i * 0.2));
      } else tone(550, 0.12, 0.05, 'triangle');
    },
  };
}