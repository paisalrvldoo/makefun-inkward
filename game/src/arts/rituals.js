import { distance, inField } from '../config.js';
import { spawnYokai } from '../entities/yokai.js';
import { burst, addRing, floatText } from '../render/fx.js';
import { artLevel } from './levels.js';
import { takeAction } from '../controls/buffer.js';
import { castArt, ritualImpact } from '../fx/skillCasts.js';

export function splashInk(state, point) {
  if (state.splashCooldown > 1e-6 || !inField(point)) return;
  state.splashCooldown = 4;
  addRing(state, point.x, point.y, 85, '#537f72', 0.6);
  burst(state, point.x, point.y, 20, '#537f72');
  for (const enemy of [...state.enemies]) {
    if (enemy.dead || distance(enemy, point) > 85 + enemy.radius) continue;
    enemy.stun = Math.max(enemy.stun, 2.2);
    enemy.hitFlash = 0.1; enemy.hitTime = 0.15;
    if (enemy.kind === 'fox' && !enemy.small) {
      enemy.small = true; enemy.radius *= 0.7; enemy.value = 90;
      const child = spawnYokai(state, 'fox', { x: enemy.x + 22, y: enemy.y - 16 }, true);
      child.hunter = Boolean(enemy.hunter);
      child.stun = 2.2;
      state.spawned++; state.total++;
      floatText(state, enemy.x, enemy.y - 25, 'FOX-FIRE SPLIT', '#c85c42', 16);
    }
  }
  state.soundEvents.push({ name: 'splash' });
}
export function updateArts(state, input, dt) {
  for (const key of ['splashCooldown', 'qCooldown', 'eCooldown']) state[key] = Math.max(0, state[key] - dt);
  const splash = takeAction(state, 'splash', state.splashCooldown <= 1e-6);
  if (splash) splashInk(state, splash.point);
  if (takeAction(state, 'lotus', state.qCooldown <= 1e-6)) {
    const level = artLevel(state, 'lotus');
    state.qCooldown = Math.max(6, 14 - level * 3);
    for (const enemy of state.enemies) enemy.stun = Math.max(enemy.stun, 2.5 + level * 1.4);
    castArt(state, 'lotus', state.monk, { radius: 530, force: true });
    ritualImpact(state, 'lotus');
    floatText(state, state.monk.x, state.monk.y - 35, 'LOTUS HUSH', '#7191a6', 23);
  }
  if (takeAction(state, 'ward', state.eCooldown <= 1e-6)) {
    const level = artLevel(state, 'mending');
    state.eCooldown = Math.max(8, 18 - level * 4);
    state.bell.wardTime = 8.5 + level * 1.5;
    const range = 155 + level * 55;
    for (const enemy of state.enemies) {
      const length = distance(enemy, state.bell) || 1;
      if (length < range) {
        enemy.x += (enemy.x - state.bell.x) / length * 65;
        enemy.y += (enemy.y - state.bell.y) / length * 65;
        enemy.stun = Math.max(enemy.stun, 2);
      }
    }
    castArt(state, 'mending', state.bell, { radius: range, force: true });
    ritualImpact(state, 'mending');
    floatText(state, state.bell.x, state.bell.y - 55, 'BELL WARD', '#b68a36', 23);
  }
}
