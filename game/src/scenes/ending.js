export const ENDING_DURATION = 12.6;
export const EPILOGUE = ['The bell kept no tally of the dark.', 'At dawn, it rang for every soul.'];

const CUES = [
  { time: 0.16, name: 'endingBell' }, { time: 1.6, name: 'dawn' },
  ...Array.from({ length: 8 }, (_, i) => ({ time: 4.4 + i * 0.62, name: 'unroll', value: i })),
];

export function beginEnding(state) {
  state.ending = { age: 0, duration: ENDING_DURATION, cue: 0 };
  state.resultsTime = 0; state.resultsBeat = -1;
}

export function skipEnding(state) {
  if (!state.ending || state.ending.age >= state.ending.duration) return false;
  state.ending.age = state.ending.duration; state.ending.cue = CUES.length;
  state.soundEvents.push({ name: 'win' }, { name: 'resultsReveal' });
  return true;
}

export function advanceEnding(state, dt) {
  if (!['win', 'lose'].includes(state.mode)) return;
  if (state.mode === 'lose' && state.defeat?.age < state.defeat?.duration) return;
  if (state.ending && state.ending.age < state.ending.duration) {
    state.ending.age = Math.min(state.ending.duration, state.ending.age + dt);
    while (state.ending.cue < CUES.length && state.ending.age >= CUES[state.ending.cue].time) {
      const cue = CUES[state.ending.cue++]; state.soundEvents.push({ name: cue.name, value: cue.value });
    }
    if (state.ending.age === state.ending.duration) state.soundEvents.push({ name: 'win' }, { name: 'resultsReveal' });
    return;
  }
  state.resultsTime += dt;
  const beat = state.resultsTime < 0.65 ? -1 : Math.min(8, Math.floor((state.resultsTime - 0.65) / 0.2));
  if (beat > state.resultsBeat) {
    state.resultsBeat = beat;
    state.soundEvents.push({ name: beat === 8 ? 'scoreSlam' : 'scoreTick', value: beat });
  }
}

export function skipResults(state) {
  state.resultsTime = Math.max(state.resultsTime, 4.5); state.resultsBeat = 8;
}
