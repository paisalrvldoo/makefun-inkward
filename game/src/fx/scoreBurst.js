import { clamp } from '../config.js';

// Presentation reads the settled score. It never changes combat or the ledger.
export function beginScoreBurst(state, centre, total, count) {
  const multiplier = state.combo * (1 + Math.floor(state.wrath + 0.00001) * 0.2);
  state.scoreBurst = { x: clamp(centre.x, 195, 817), y: clamp(centre.y - 32, 305, 595), age: 0, beat: -1, total, count, base: total / multiplier, multiplier, combo: state.combo };
  state.scoreShown = Math.min(state.scoreShown ?? state.score, state.score - total);
}
export function updateScoreBurst(state, dt) {
  state.scoreShown += (state.score - state.scoreShown) * Math.min(1, dt * 9);
  if (Math.abs(state.score - state.scoreShown) < 1) state.scoreShown = state.score;
  const fx = state.scoreBurst;
  if (!fx) return;
  fx.age += dt;
  const beat = Math.min(8, Math.floor(fx.age / 0.075));
  while (fx.beat < beat) {
    fx.beat++;
    state.soundEvents.push({ name: fx.beat === 8 ? 'sealSlam' : 'sealTick', value: fx.beat });
    if (fx.beat === 8) state.shake = Math.max(state.shake, Math.min(6, 2 + Math.log10(Math.max(1, fx.total)) * 0.7));
  }
  if (fx.age >= 1.8) state.scoreBurst = null;
}
