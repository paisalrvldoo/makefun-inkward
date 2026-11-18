import { BELL, FIELD, MONK, clamp, distance } from '../config.js';
import { artLevel } from '../arts/levels.js';
import { takeAction } from '../controls/buffer.js';
import { castArt } from '../fx/skillCasts.js';

import { hasRelic } from '../arts/relics.js';
import { addRing } from '../render/fx.js';

import { landingDust } from '../fx/footsteps.js';

export function createMonk() {
  return { x: BELL.x, y: BELL.y + 93, vx: 0, vy: -1, dashTime: 0, dashCooldown: 0, hurtTime: 0, hitFlash: 0, recoil: 0, recoilX: 0, recoilY: 0, walk: 0, stepTime: 0, landingTime: 0 };
}
export function updateMonk(state, input, dt) {
  const monk = state.monk, wasDashing = monk.dashTime > 0;
  monk.landingTime = Math.max(0, monk.landingTime - dt);
  monk.stepTime = Math.max(0, monk.stepTime - dt);
  let dx = Number(input.keys.has('KeyD') || input.keys.has('ArrowRight')) - Number(input.keys.has('KeyA') || input.keys.has('ArrowLeft'));
  let dy = Number(input.keys.has('KeyS') || input.keys.has('ArrowDown')) - Number(input.keys.has('KeyW') || input.keys.has('ArrowUp'));
  const length = Math.hypot(dx, dy);
  if (length) { dx /= length; dy /= length; monk.vx = dx; monk.vy = dy; monk.walk += dt * 12; }
  monk.dashCooldown = Math.max(0, monk.dashCooldown - dt);
  monk.hurtTime = Math.max(0, monk.hurtTime - dt);
  monk.hitFlash = Math.max(0, monk.hitFlash - dt);
  const dash = takeAction(state, 'dash', monk.dashCooldown <= 1e-6);
  if (dash) {
    if (!length) {
      const aim = distance(monk, dash.point) || 1;
      monk.vx = (dash.point.x - monk.x) / aim;
      monk.vy = (dash.point.y - monk.y) / aim;
    }
    if (hasRelic(state, 'dewBead')) { state.bell.wardTime = Math.max(state.bell.wardTime, 1.2); addRing(state, state.bell.x, state.bell.y, 62, '#8dd8f3'); state.soundEvents.push({ name: 'bell' }); }
    monk.dashTime = MONK.dashTime;
    monk.recoil = 0;
    monk.dashCooldown = MONK.dashCooldown / (1 + artLevel(state, 'willow') * 0.7);
    if (artLevel(state, 'willow')) castArt(state, 'willow', monk, { angle: Math.atan2(monk.vy, monk.vx), force: true });
    state.soundEvents.push({ name: 'dash' });
  }
  if (monk.dashTime > 0) {
    monk.dashTime -= dt;
    dx = monk.vx; dy = monk.vy;
    state.ghosts.push({ x: monk.x, y: monk.y, life: 0.3, willow: Boolean(artLevel(state, 'willow')) });
    for (const enemy of state.enemies) {
      if (!enemy.dead && distance(monk, enemy) < enemy.radius + 25) {
        enemy.stun = Math.max(enemy.stun, 1.5);
        enemy.hitFlash = 0.09;
        enemy.x += dx * 7; enemy.y += dy * 7;
      }
    }
  }
  const speed = monk.dashTime > 0 ? MONK.dashSpeed : MONK.speed;
  const recoil = monk.recoil / 0.16;
  monk.x = clamp(monk.x + (dx * speed + monk.recoilX * recoil) * dt, FIELD.x + 23, FIELD.x + FIELD.w - 23);
  monk.y = clamp(monk.y + (dy * speed + monk.recoilY * recoil) * dt, FIELD.y + 23, FIELD.y + FIELD.h - 23);
  monk.recoil = Math.max(0, monk.recoil - dt);
  if (wasDashing && monk.dashTime <= 0) { monk.dashTime = 0; monk.landingTime = 0.2; landingDust(state, monk, true); }
  else if (length && !monk.dashTime && monk.stepTime <= 0) { monk.stepTime = 0.22; landingDust(state, monk); }
}
