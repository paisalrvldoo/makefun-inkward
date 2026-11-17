import { FIELD } from '../config.js';
import { spawnYokai } from '../entities/yokai.js';
import { floatText } from '../render/fx.js';

export const wrathLevel = state => Math.min(5, Math.floor(state.wrath + 0.00001));
export const wrathMultiplier = state => 1 + wrathLevel(state) * 0.2;
function summonHunter(state) {
  const lane = Math.floor(state.rng() * 4), position = 0.15 + state.rng() * 0.7;
  const point = lane === 0 ? { x: FIELD.x + FIELD.w * position, y: FIELD.y + 100 }
    : lane === 1 ? { x: FIELD.x + FIELD.w - 24, y: FIELD.y + FIELD.h * position }
      : lane === 2 ? { x: FIELD.x + FIELD.w * position, y: FIELD.y + FIELD.h - 24 }
        : { x: FIELD.x + 24, y: FIELD.y + FIELD.h * position };
  const hunter = spawnYokai(state, 'fox', point);
  hunter.hunter = true; hunter.value = 240; hunter.speed *= 1.2;
  state.spawned++; state.total++; state.huntersSpawned++;
}
export function raiseWrath(state, count) {
  const before = wrathLevel(state);
  state.wrath = Math.min(5, state.wrath + 0.7 + Math.min(0.3, count * 0.08));
  state.lastSealTime = state.runTime;
  const level = wrathLevel(state);
  state.peakWrath = Math.max(state.peakWrath, level);
  if (state.queue.length) for (let i = before; i < level; i++) summonHunter(state);
  if (level > before) {
    floatText(state, state.monk.x, state.monk.y - 60, `WRATH ${level} · SCORE ×${wrathMultiplier(state).toFixed(1)}`, '#bb4436', 19);
    state.soundEvents.push({ name: 'wrath', value: level });
    if (level === 5) { state.huntBanner = 2.4; state.hunts++; }
  }
}
export function updateWrath(state, dt) {
  state.huntBanner = Math.max(0, state.huntBanner - dt);
  if (state.runTime - state.lastSealTime > 3) state.wrath = Math.max(0, state.wrath - dt * 0.3);
  const level = wrathLevel(state);
  if (level === 5) state.huntTime += dt;
  state.hunterTimer -= dt;
  if (level && state.hunterTimer <= 0 && state.queue.length && state.enemies.filter(e => e.hunter).length < level) {
    summonHunter(state); state.hunterTimer = 7 - level * 0.8;
  }
}
