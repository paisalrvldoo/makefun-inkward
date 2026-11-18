export const ENDING_DURATION = 9.5;
export const EPILOGUE = ['I left no name upon the gate.', 'Only a bell, and room for spring.'];
export const endingActive = state => state.mode === 'win' && state.ending && state.ending.time < ENDING_DURATION;

export function beginEnding(state) {
  state.ending = { time: 0, from: { x: state.monk.x, y: state.monk.y }, skipped: false };
  state.resultTime = 0;
}

export function updateEnding(state, dt) {
  if (state.mode !== 'win' || !state.ending) return;
  const before = state.ending.time, after = before + dt;
  state.ending.time = after;
  const cue = (time, name, value = 1) => {
    if (before < time && after >= time) state.soundEvents.push({ name, value });
  };
  cue(0.45, 'cleanBell');
  for (let i = 0; i < 8; i++) cue(3.1 + i * 0.42, 'unroll', i);
  cue(ENDING_DURATION, 'victoryFanfare');
  for (let i = 0; i < 10; i++) cue(ENDING_DURATION + 0.2 * (i + 1), 'scoreTick', i);
  for (let i = 0; i < state.newUnlocks.length; i++) cue(ENDING_DURATION + 2.25 + i * 0.12, 'legacy', i);
  state.resultTime += Math.max(0, after - Math.max(before, ENDING_DURATION));
  if (before < ENDING_DURATION + 2.2 && after >= ENDING_DURATION + 2.2) state.soundEvents.push({ name: 'gradeStamp' });
}

// Consume the skip input so the same R/Enter/tap never starts a run accidentally.
export function skipEnding(state) {
  if (!endingActive(state) && state.resultTime >= 3) return false;
  if (endingActive(state)) state.soundEvents.push({ name: 'victoryFanfare' });
  state.ending.time = Math.max(ENDING_DURATION, state.ending.time);
  state.ending.skipped = true; state.resultTime = 3;
  state.soundEvents.push({ name: 'gradeStamp' });
  return true;
}

export const scoreReveal = state => {
  const t = Math.max(0, Math.min(1, (state.resultTime ?? 3) / 2.2));
  return 1 - (1 - t) ** 3;
};
