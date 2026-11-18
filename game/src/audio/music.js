const SCALE = [0, 3, 5, 7, 10, 12];
const MELODY = [0, 2, 4, 1, 3, 2, 5, 1, 4, 2, 3, 0];

// Original procedural score: sparse garden notes grow into a final-scroll pulse.
export function createMusic(tone, rustle) {
  let nextBeat = 0, beat = 0, seed = null, previousTime = -1;
  return state => {
    if (state.mode !== 'play' || state.finalSealed || state.climax) return;
    if (seed !== state.seed || state.runTime < previousTime) {
      seed = state.seed; beat = 0; nextBeat = state.runTime;
    }
    previousTime = state.runTime;
    if (state.runTime < nextBeat) return;
    const final = state.scroll === 8, intensity = Math.min(1, (state.scroll - 1) / 7 + state.wrath * 0.03);
    const phase = state.enemies.find(e => e.boss === 'frost')?.hp <= 3 ? 1 : 0;
    const step = MELODY[beat % MELODY.length], pitch = 146.83 * 2 ** (SCALE[step] / 12);
    tone(pitch * (final && beat % 2 ? 2 : 1), 0.5, 0.018 + intensity * 0.016, 'sine');
    if (beat % 4 === 0) tone(73.415, final ? 0.45 : 1.2, 0.026 + intensity * 0.013, 'triangle');
    if (final) {
      tone(49, 0.12, 0.045 + phase * 0.01, 'triangle');
      if (beat % 2) rustle(0.055, 0.025, 2700);
      if (phase) tone(pitch * 2, 0.2, 0.018, 'triangle');
    }
    beat++; nextBeat = state.runTime + (final ? 0.32 - phase * 0.055 : 0.76 - intensity * 0.25);
  };
}
