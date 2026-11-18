import { distance } from '../config.js';
import { addRing } from '../render/fx.js';

// Drummers stop to charge a visible pulse: stunning them cancels the charge.
// Needle moths orbit the shrine, then dive along a fixed, dodgeable line.
export function tacticalVelocity(state, enemy, dt, dx, dy, length, speed) {
  if (enemy.kind === 'drummer') {
    enemy.beatCooldown = Math.max(0, (enemy.beatCooldown ?? 3.5) - dt);
    if (enemy.beatCooldown <= 0 && length < 330) {
      enemy.beatWindup = (enemy.beatWindup ?? 0.85) - dt;
      enemy.animation = 'attack';
      if (enemy.beatWindup > 0) return { vx: 0, vy: 0 };
      for (const ally of state.enemies) if (!ally.dead && ally !== enemy && distance(ally, enemy) < 155) ally.haste = 2.5;
      addRing(state, enemy.x, enemy.y, 155, '#f3b04d', 0.65);
      state.soundEvents.push({ name: 'warning' });
      enemy.beatWindup = null; enemy.beatCooldown = 4.5;
    }
  }
  if (enemy.kind === 'moth') {
    enemy.diveCooldown = Math.max(0, (enemy.diveCooldown ?? 2.5) - dt);
    if (enemy.dive) {
      enemy.dive.life -= dt;
      if (enemy.dive.life <= 0) { enemy.dive = null; enemy.diveCooldown = 3; }
      else return { vx: enemy.dive.dx * speed * 3.8, vy: enemy.dive.dy * speed * 3.8 };
    }
    if (enemy.diveCooldown <= 0) {
      if (!enemy.diveMark) enemy.diveMark = { x: state.bell.x, y: state.bell.y, time: 0.7, total: 0.7 };
      enemy.diveMark.time -= dt; enemy.animation = 'attack';
      if (enemy.diveMark.time > 0) return { vx: 0, vy: 0 };
      enemy.dive = { dx: dx / length, dy: dy / length, life: 0.8 };
      enemy.diveMark = null;
      state.soundEvents.push({ name: 'dash' });
    }
    // A tangent component makes a visibly different approach from cranes.
    return { vx: (dx * 0.42 - dy * 0.95) / length * speed, vy: (dy * 0.42 + dx * 0.95) / length * speed };
  }
  return null;
}
export function cancelTacticalAttack(enemy) {
  if (enemy.kind === 'drummer') { enemy.beatWindup = null; enemy.beatCooldown = 2; }
  if (enemy.kind === 'moth') { enemy.diveMark = null; enemy.dive = null; enemy.diveCooldown = 1.5; }
}
