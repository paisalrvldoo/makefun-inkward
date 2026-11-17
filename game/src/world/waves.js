import { FIELD } from '../config.js';
import { getScroll } from './scrolls.js';
import { spawnYokai } from '../entities/yokai.js';
import { spawnBoss } from '../entities/bosses.js';

export function makeThreatQueue(state) {
  const scroll = getScroll(state);
  const queue = [];
  for (let i = 0; i < scroll.count; i++) {
    const kind = scroll.types[Math.floor(state.rng() * scroll.types.length)];
    queue.push({ kind, lane: Math.floor(state.rng() * 4), position: 0.14 + state.rng() * 0.72, wave: Math.floor(i / Math.ceil(scroll.count / 3)) + 1 });
    if (scroll.boss && i === Math.floor(scroll.count * 0.55)) queue.push({ kind: 'oni', boss: scroll.boss, lane: 0, position: 0.5, wave: 2 });
  }
  return queue;
}
export function spawnPoint(threat) {
  const { lane, position } = threat;
  if (lane === 0) return { x: FIELD.x + FIELD.w * position, y: FIELD.y + 19 };
  if (lane === 1) return { x: FIELD.x + FIELD.w - 19, y: FIELD.y + FIELD.h * position };
  if (lane === 2) return { x: FIELD.x + FIELD.w * position, y: FIELD.y + FIELD.h - 19 };
  return { x: FIELD.x + 19, y: FIELD.y + FIELD.h * position };
}
export function updateWaves(state, dt) {
  if (!state.queue.length) return;
  state.spawnTime -= dt;
  if (state.spawnTime > 0) return;
  const threat = state.queue.shift();
  const point = spawnPoint(threat);
  if (threat.kind === 'oni') spawnBoss(state, threat.boss, point);
  else spawnYokai(state, threat.kind, point);
  state.spawned++;
  state.spawnTime = getScroll(state).interval;
}
