import { FIELD, INK, distance, clamp } from '../config.js';
import { nearestOnSegment } from '../ink/geometry.js';
import { burst, floatText, addRing } from '../render/fx.js';
import { difficulty } from '../world/difficulty.js';
import { artLevel } from '../arts/levels.js';
import { wrathMultiplier } from '../world/wrath.js';
import { recordOmenBellHit } from '../world/omens.js';
import { castArt } from '../fx/skillCasts.js';

export const YOKAI = {
  kappa: { name: 'KAPPA', detail: 'Lunges toward the bell', color: '#63846d', speed: 30, radius: 17, value: 100 },
  lantern: { name: 'LANTERN', detail: 'Floats through ink walls', color: '#c47a48', speed: 26, radius: 17, value: 160 },
  umbrella: { name: 'UMBRELLA', detail: 'Hops in sudden bursts', color: '#997294', speed: 28, radius: 19, value: 130 },
  fox: { name: 'FOX-FIRE', detail: 'Splits when splashed', color: '#c85c42', speed: 36, radius: 16, value: 180 },
  eater: { name: 'INK-EATER', detail: 'Devours painted walls', color: '#526068', speed: 23, radius: 22, value: 200 },
  crane: { name: 'PAPER CRANE', detail: 'Weaves toward the shrine', color: '#8c9792', speed: 40, radius: 13, value: 80 },
};
export function spawnYokai(state, kind, point, small = false) {
  const stats = YOKAI[kind];
  const enemy = {
    ...point, ...stats, kind, id: state.nextId++, speed: stats.speed * (1 + (state.scroll - 1) * 0.065) * difficulty(state).speed,
    phase: state.rng() * Math.PI * 2, age: 0, stun: 0, hitTime: 0, blocked: 0, dead: false, small,
  };
  if (small) { enemy.radius *= 0.7; enemy.speed *= 1.2; enemy.value = 90; }
  state.enemies.push(enemy);
  addRing(state, point.x, point.y, 30, stats.color, 0.5);
  return enemy;
}
export function damageBell(state, enemy) {
  if (enemy.hunter) return;
  if (state.bell.wardTime > 0) {
    const dx = enemy.x - state.bell.x, dy = enemy.y - state.bell.y, length = Math.hypot(dx, dy) || 1;
    enemy.x += dx / length * 85; enemy.y += dy / length * 85;
    enemy.stun = 1.2; enemy.charge = null; enemy.actionTime = 0;
    addRing(state, state.bell.x, state.bell.y, 63, '#b68a36', 0.4);
    state.soundEvents.push({ name: 'bell' }); return;
  }
  enemy.dead = true;
  state.cleared++;
  state.bell.hp = Math.max(0, state.bell.hp - (enemy.kind === 'oni' ? 4 : 1));
  recordOmenBellHit(state, enemy.kind === 'oni' ? 4 : 1);
  state.bell.hitTime = 0.7;
  state.combo = 1; state.comboTime = 0;
  state.shake = 9; state.flash = 0.2;
  burst(state, state.bell.x, state.bell.y, 20, '#bb4436');
  floatText(state, state.bell.x, state.bell.y - 45, 'BELL CRACKED', '#bb4436', 22);
  state.soundEvents.push({ name: 'bellHit' });
}
export function wallCollision(state, enemy, next, dt) {
  if (enemy.kind === 'lantern') return false;
  for (const stroke of state.strokes) {
    if (stroke.life <= 0 || stroke.integrity <= 0) continue;
    for (let i = 1; i < stroke.points.length; i++) {
      const nearest = nearestOnSegment(next, stroke.points[i - 1], stroke.points[i]);
      if (nearest.distance >= enemy.radius + INK.width / 2) continue;
      stroke.integrity -= dt * (enemy.kind === 'eater' ? 0.6 : enemy.kind === 'oni' ? 0.32 : 0.09) / (1 + artLevel(state, 'stone') * 0.25);
      stroke.erosion = { x: nearest.x, y: nearest.y, life: 0.75 };
      if (!stroke.soundCooldown) {
        stroke.flash = 0.25; stroke.soundCooldown = 0.6;
        state.soundEvents.push({ name: 'wallHit' });
        if (artLevel(state, 'vermilion')) castArt(state, 'vermilion', nearest, { angle: Math.atan2(stroke.points[i].y - stroke.points[i - 1].y, stroke.points[i].x - stroke.points[i - 1].x) });
        if (artLevel(state, 'stone')) castArt(state, 'stone', nearest, { radius: 32, interval: 1 });
      }
      enemy.blocked += dt;
      if (artLevel(state, 'vermilion')) {
        enemy.hitTime = 0.15;
        enemy.stun = Math.max(enemy.stun, 0.06);
        stroke.integrity += dt * 0.035;
        enemy.edgeDamage = (enemy.edgeDamage || 0) + dt * artLevel(state, 'vermilion');
        if (enemy.edgeDamage >= 1.6 && enemy.kind !== 'oni') {
          enemy.dead = true; state.sealed++; state.cleared++;
          const base = enemy.value * state.combo * (1 + artLevel(state, 'gold') * 0.3);
          const score = Math.round(base * wrathMultiplier(state));
          state.score += score; state.wrathScore += score - Math.round(base);
          if (enemy.hunter) state.huntersSealed++;
          burst(state, enemy.x, enemy.y, 22, '#bb4436');
          floatText(state, enemy.x, enemy.y - 30, 'VERMILION CUT', '#bb4436', 18);
          state.soundEvents.push({ name: 'seal' });
        }
      }
      // Slide tangentially along the ink instead of getting stuck forever.
      const a = stroke.points[i - 1], b = stroke.points[i];
      const length = distance(a, b) || 1;
      let tx = (b.x - a.x) / length, ty = (b.y - a.y) / length;
      const target = enemy.hunter ? state.monk : state.bell;
      if (tx * (target.x - enemy.x) + ty * (target.y - enemy.y) < 0) { tx *= -1; ty *= -1; }
      const slide = { x: enemy.x + tx * enemy.speed * dt * 0.45, y: enemy.y + ty * enemy.speed * dt * 0.45 };
      if (nearestOnSegment(slide, a, b).distance >= enemy.radius + INK.width / 2 - 2) {
        enemy.x = slide.x; enemy.y = slide.y;
      }
      return true;
    }
  }
  enemy.blocked = 0;
  return false;
}
export function updateYokai(state, dt) {
  for (const enemy of state.enemies) {
    if (enemy.dead) continue;
    enemy.age += dt;
    enemy.hitTime = Math.max(0, enemy.hitTime - dt);
    enemy.stun = Math.max(0, enemy.stun - dt);
    if (enemy.stun > 0) continue;
    const target = enemy.hunter ? state.monk : state.bell;
    const dx = target.x - enemy.x, dy = target.y - enemy.y;
    const length = Math.hypot(dx, dy) || 1;
    if (!enemy.hunter && length < state.bell.radius + enemy.radius - 3) { damageBell(state, enemy); continue; }
    if (enemy.kind === 'oni' && (enemy.telegraph || enemy.actionTime > 0)) continue;
    let speed = enemy.speed;
    if (enemy.kind === 'kappa' && Math.sin(enemy.age * 1.7 + enemy.phase) > 0.87) speed *= 2.3;
    if (enemy.kind === 'umbrella') speed *= Math.sin(enemy.age * 3 + enemy.phase) > 0.2 ? 2.2 : 0.2;
    let vx = dx / length * speed, vy = dy / length * speed;
    if (enemy.kind === 'crane' || enemy.kind === 'fox') {
      const weave = Math.sin(enemy.age * 2.6 + enemy.phase) * speed * 0.6;
      vx += -dy / length * weave; vy += dx / length * weave;
    }
    const next = { x: enemy.x + vx * dt, y: enemy.y + vy * dt };
    if (!wallCollision(state, enemy, next, dt)) { enemy.x = next.x; enemy.y = next.y; }
    enemy.x = clamp(enemy.x, FIELD.x + enemy.radius, FIELD.x + FIELD.w - enemy.radius);
    enemy.y = clamp(enemy.y, FIELD.y + enemy.radius, FIELD.y + FIELD.h - enemy.radius);
    if (state.monk.hurtTime <= 0 && state.monk.dashTime <= 0 && distance(enemy, state.monk) < enemy.radius + 13) {
      state.monk.hurtTime = 0.9;
      state.ink = Math.max(0, state.ink - 9);
      enemy.stun = 0.7;
      floatText(state, state.monk.x, state.monk.y - 22, '−9 INK', '#bb4436', 16);
      state.soundEvents.push({ name: 'splash' });
    }
  }
  state.enemies = state.enemies.filter(enemy => !enemy.dead);
}
