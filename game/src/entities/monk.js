import { BELL, FIELD, MONK, clamp, distance } from '../config.js';
import { artLevel } from '../arts/levels.js';

export function createMonk() {
  return { x: BELL.x, y: BELL.y + 93, vx: 0, vy: -1, dashTime: 0, dashCooldown: 0, hurtTime: 0, walk: 0 };
}
export function updateMonk(state, input, dt) {
  const monk = state.monk;
  let dx = Number(input.keys.has('KeyD') || input.keys.has('ArrowRight')) - Number(input.keys.has('KeyA') || input.keys.has('ArrowLeft'));
  let dy = Number(input.keys.has('KeyS') || input.keys.has('ArrowDown')) - Number(input.keys.has('KeyW') || input.keys.has('ArrowUp'));
  const length = Math.hypot(dx, dy);
  if (length) { dx /= length; dy /= length; monk.vx = dx; monk.vy = dy; monk.walk += dt * 12; }
  monk.dashCooldown = Math.max(0, monk.dashCooldown - dt);
  monk.hurtTime = Math.max(0, monk.hurtTime - dt);
  if (input.pressed.has('Space') && monk.dashCooldown <= 0) {
    if (!length) {
      const aim = distance(monk, input.pointer) || 1;
      monk.vx = (input.pointer.x - monk.x) / aim;
      monk.vy = (input.pointer.y - monk.y) / aim;
    }
    monk.dashTime = MONK.dashTime;
    monk.dashCooldown = MONK.dashCooldown / (1 + artLevel(state, 'willow') * 0.7);
    state.soundEvents.push({ name: 'dash' });
  }
  if (monk.dashTime > 0) {
    monk.dashTime -= dt;
    dx = monk.vx; dy = monk.vy;
    state.ghosts.push({ x: monk.x, y: monk.y, life: 0.3 });
    for (const enemy of state.enemies) {
      if (!enemy.dead && distance(monk, enemy) < enemy.radius + 25) {
        enemy.stun = Math.max(enemy.stun, 1.5);
        enemy.x += dx * 7; enemy.y += dy * 7;
      }
    }
  }
  const speed = monk.dashTime > 0 ? MONK.dashSpeed : MONK.speed;
  monk.x = clamp(monk.x + dx * speed * dt, FIELD.x + 23, FIELD.x + FIELD.w - 23);
  monk.y = clamp(monk.y + dy * speed * dt, FIELD.y + 23, FIELD.y + FIELD.h - 23);
}
