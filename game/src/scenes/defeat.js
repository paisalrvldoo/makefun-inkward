import { updateEffects, burst } from '../render/fx.js';

export const DEFEAT_DURATION = 1.65;
export const defeatActive = state => state.mode === 'lose' && state.defeat && state.defeat.time < DEFEAT_DURATION;
export function beginDefeat(state) {
  state.defeat = { time: 0 }; state.resultTime = 0;
  burst(state, state.bell.x, state.bell.y, 80, '#171c24');
}
export function updateDefeat(state, dt) {
  if (state.mode !== 'lose' || !state.defeat) return;
  const before = state.defeat.time;
  state.defeat.time += dt;
  updateEffects(state, dt);
  const oldResult = state.resultTime;
  state.resultTime += Math.max(0, state.defeat.time - Math.max(before, DEFEAT_DURATION));
  if (oldResult < 2.2 && state.resultTime >= 2.2) state.soundEvents.push({ name: 'gradeStamp' });
}
export function skipDefeat(state) {
  state.defeat.time = Math.max(DEFEAT_DURATION, state.defeat.time); state.resultTime = 3;
}
