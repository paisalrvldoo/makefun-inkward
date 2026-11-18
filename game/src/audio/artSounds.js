// Frequencies, envelopes and intervals give every art its own synthesized voice.
export const ART_SOUNDS = {
  vermilion: { notes: [180, 720, 1440], step: 0.018, duration: 0.12, type: 'sawtooth', noise: [0.07, 0.06, 4800] },
  breath: { notes: [196, 294, 392], step: 0.09, duration: 0.42, type: 'sine', noise: [0.23, 0.025, 900] },
  twin: { notes: [330, 349, 660, 698], step: 0.045, duration: 0.23, type: 'triangle' },
  thunder: { notes: [55, 1760, 880], step: 0.025, duration: 0.17, type: 'sawtooth', noise: [0.18, 0.1, 5000] },
  willow: { notes: [440, 660, 990], step: 0.035, duration: 0.16, type: 'sine', noise: [0.13, 0.04, 3300] },
  gold: { notes: [1047, 1319, 1568, 2093], step: 0.055, duration: 0.24, type: 'sine' },
  well: { notes: [587, 440, 294, 147], step: 0.06, duration: 0.3, type: 'sine', noise: [0.16, 0.025, 600] },
  stone: { notes: [65, 98, 130], step: 0.025, duration: 0.2, type: 'triangle', noise: [0.1, 0.07, 650] },
  feather: { notes: [1568, 1976], step: 0.09, duration: 0.2, type: 'sine', noise: [0.09, 0.022, 6000] },
  echo: { notes: [523, 523, 523], step: 0.16, duration: 0.38, type: 'sine' },
  lotus: { notes: [262, 392, 523, 784], step: 0.055, duration: 0.65, type: 'sine' },
  mending: { notes: [220, 440, 554, 880], step: 0.015, duration: 0.85, type: 'triangle' },
  moonInk: { notes: [740, 988, 1480], step: 0.08, duration: 0.48, type: 'sine' },
  afterglow: { notes: [349, 440, 523, 698], step: 0.12, duration: 0.7, type: 'triangle' },
};
export function playArtSound(id, tone, rustle) {
  const sound = ART_SOUNDS[id];
  if (!sound) return;
  sound.notes.forEach((frequency, i) => tone(frequency, sound.duration, 0.055 / (1 + i * 0.22), sound.type, i * sound.step));
  if (sound.noise) rustle(...sound.noise);
}
