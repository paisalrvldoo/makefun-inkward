export function createAudio() {
  let context = null;
  let muted = false;
  let lastStroke = 0;
  function unlock() {
    if (!context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) context = new AudioContext();
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
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }
  function rustle(duration, volume, cutoff) {
    if (!context || muted || context.state !== 'running') return;
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
    source.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = cutoff; gain.gain.value = volume;
    source.connect(filter).connect(gain).connect(context.destination); source.start();
  }
  return {
    unlock,
    get muted() { return muted; },
    toggle() { muted = !muted; return muted; },
    play(name, value = 1) {
      if (name === 'stroke') {
        if (!context || context.currentTime - lastStroke < 0.13) return;
        lastStroke = context.currentTime;
        tone(220 + value % 5 * 55, 0.18, 0.035, 'triangle');
      } else if (name === 'seal') {
        tone(85, 0.25, 0.25, 'triangle');
        [440, 550, 660, 880].forEach((f, i) => tone(f, 0.45, 0.065, 'sine', i * 0.035));
      } else if (name === 'bigSeal') {
        tone(48, 0.35, 0.2, 'triangle'); rustle(0.24, 0.2, 800);
      } else if (name === 'petals') {
        rustle(0.16, 0.045, 2400);
      } else if (name === 'combo') {
        tone(440 + value * 55, 0.28, 0.075, 'sine'); tone(880, 0.2, 0.035, 'sine', 0.05);
      } else if (name === 'wallHit') {
        rustle(0.08, 0.06, 1300); tone(92, 0.08, 0.04, 'triangle');
      } else if (name === 'bellHit') {
        tone(110, 0.7, 0.17, 'triangle'); tone(311, 0.6, 0.075); rustle(0.2, 0.1, 1700);
      } else if (name === 'thunder') {
        rustle(0.12, 0.1, 4000); tone(1760, 0.16, 0.035, 'sawtooth');
      } else if (name === 'scrollIntro' || name === 'bossIntro') {
        tone(73, 0.6, 0.12, 'triangle'); [294, 440, 588].forEach((f, i) => tone(f, 0.8, 0.06, 'sine', i * 0.13));
      } else if (name === 'warning') {
        [0, 0.18, 0.36].forEach(delay => tone(147, 0.12, 0.08, 'triangle', delay));
      } else if (['storm', 'roar', 'charge'].includes(name)) {
        rustle(0.3, 0.12, name === 'storm' ? 3500 : 700); tone(name === 'charge' ? 82 : 55, 0.4, 0.13, 'triangle');
      } else if (name === 'omen') {
        [660, 880, 1100].forEach((f, i) => tone(f, 0.5, 0.065, 'sine', i * 0.07));
      } else if (name === 'wrath') {
        tone(65 + value * 9, 0.4, 0.14, 'triangle');
        tone(147, 0.25, 0.07, 'sawtooth', 0.08);
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
