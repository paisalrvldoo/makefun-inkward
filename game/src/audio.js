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
      } else if (name === 'bell') {
        [294, 588, 882].forEach(f => tone(f, 1.2, 0.09));
      } else if (name === 'dash' || name === 'splash') {
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
