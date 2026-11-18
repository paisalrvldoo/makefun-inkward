import { updateEffects } from '../render/fx.js';

export function beginDefeat(state) {
  state.defeat = { age: 0, duration: 1.85 };
  state.resultsTime = 0; state.resultsBeat = -1;
  state.soundEvents.push({ name: 'lose' });
}

export function advanceDefeat(state, dt) {
  if (state.mode !== 'lose' || !state.defeat || state.defeat.age >= state.defeat.duration) return;
  state.defeat.age = Math.min(state.defeat.duration, state.defeat.age + dt);
  updateEffects(state, dt * 0.55);
  if (state.defeat.age === state.defeat.duration) state.soundEvents.push({ name: 'resultsReveal' });
}

export function skipDefeat(state) {
  if (!state.defeat || state.defeat.age >= state.defeat.duration) return false;
  state.defeat.age = state.defeat.duration;
  return true;
}
