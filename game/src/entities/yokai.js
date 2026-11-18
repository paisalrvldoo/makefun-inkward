import { FIELD, distance, clamp } from '../config.js';
import { wallCollision } from '../systems/inkWalls.js';
export { wallCollision } from '../systems/inkWalls.js';
import { burst, floatText, addRing } from '../render/fx.js';
import { difficulty } from '../world/difficulty.js';
import { artLevel } from '../arts/levels.js';
import { wrathMultiplier } from '../world/wrath.js';
import { recordOmenBellHit } from '../world/omens.js';
import { dissolveSpirit, hurtMonk } from '../fx/characterStates.js';

import { tacticalVelocity, cancelTacticalAttack } from './tacticalYokai.js';
import { ascensionModifiers } from '../world/ascension.js';

export const YOKAI = {
  kappa: { name: 'KAPPA', detail: 'Lunges toward the bell', color: '#63846d', speed: 30, radius: 17, value: 100 },
  lantern: { name: 'LANTERN', detail: 'Floats through ink walls', color: '#c47a48', speed: 26, radius: 17, value: 160 },
  umbrella: { name: 'UMBRELLA', detail: 'Hops in sudden bursts', color: '#997294', speed: 28, radius: 19, value: 130 },
  fox: { name: 'FOX-FIRE', detail: 'Splits when splashed', color: '#c85c42', speed: 36, radius: 16, value: 180 },
  eater: { name: 'INK-EATER', detail: 'Devours painted walls', color: '#526068', speed: 23, radius: 22, value: 200 },
  drummer: { name: 'REED DRUMMER', detail: 'Stun its pulse to stop nearby spirits speeding up', color: '#dc9d42', speed: 22, radius: 21, value: 240 },
  moth: { name: 'NEEDLE MOTH', detail: 'Orbits, marks a lane, then dives at the bell', color: '#7bbbd5', speed: 32, radius: 16, value: 220 },
  crane: { name: 'PAPER CRANE', detail: 'Weaves toward the shrine', color: '#8c9792', speed: 40, radius: 13, value: 80 },
};
export function spawnYokai(state, kind, point, small = false) {
  const stats = YOKAI[kind];
  const enemy = {
    ...point, ...stats, kind, id: state.nextId++, speed: stats.speed * (1 + (state.scroll - 1) * 0.065) * difficulty(state).speed * ascensionModifiers(state).speed,
    phase: state.rng() * Math.PI * 2, age: 0, stun: 0, hitTime: 0, hitFlash: 0, blocked: 0, dead: false, small, animation: 'idle', windup: 0, attackReady: false,
  };
  if (small) { enemy.radius *= 0.7; enemy.speed *= 1.2; enemy.value = 90; }
  state.enemies.push(enemy);
  addRing(state, point.x, point.y, 30, stats.color, 0.5);
  return enemy;
}
export function damageBell(state, enemy) {
  if (enemy.hunter) return;
  if (state.shopWards > 0) {
    state.shopWards--;
    addRing(state, state.bell.x, state.bell.y, 63, '#d8b5fa', 0.4);
    floatText(state, state.bell.x, state.bell.y - 35, 'WARD CHARM', '#d8b5fa', 16);
    state.soundEvents.push({ name: 'bell' }); return;
  }
  if (state.bell.wardTime > 0) {
    const dx = enemy.x - state.bell.x, dy = enemy.y - state.bell.y, length = Math.hypot(dx, dy) || 1;
    enemy.x += dx / length * 85; enemy.y += dy / length * 85;
    enemy.stun = 1.2; enemy.charge = null; enemy.actionTime = 0;
    addRing(state, state.bell.x, state.bell.y, 63, '#b68a36', 0.4);
    state.soundEvents.push({ name: 'bell' }); return;
  }
  if (enemy.boss === 'frost' && state.scroll === 8) {
    const length = distance(enemy, state.bell) || 1;
    enemy.x += (enemy.x - state.bell.x || 1) / length * 105; enemy.y += (enemy.y - state.bell.y) / length * 105;
    enemy.stun = 1.2; enemy.exposed = 2.8; enemy.charge = null; enemy.actionTime = 0;
  } else {
    enemy.dead = true; dissolveSpirit(state, enemy); state.cleared++;
  }
  state.bell.hp = Math.max(0, state.bell.hp - (enemy.kind === 'oni' ? 4 : 1));
  state.bellHitThisScroll = true;
  recordOmenBellHit(state, enemy.kind === 'oni' ? 4 : 1);
  state.bell.hitTime = 0.7;
  state.combo = 1; state.comboTime = 0;
  state.shake = 9; state.flash = 0.2;
  burst(state, state.bell.x, state.bell.y, 20, '#bb4436');
  floatText(state, state.bell.x, state.bell.y - 45, 'BELL CRACKED', '#bb4436', 22);
  state.soundEvents.push({ name: 'bellHit' });
}
export function updateYokai(state, dt) {
  for (const enemy of state.enemies) {
    if (enemy.dead) continue;
    enemy.age += dt;
    enemy.hitTime = Math.max(0, enemy.hitTime - dt);
    enemy.hitFlash = Math.max(0, (enemy.hitFlash || 0) - dt);
    enemy.stun = Math.max(0, enemy.stun - dt);
    enemy.animation = enemy.hitTime > 0 ? 'hit' : enemy.kind === 'oni' && (enemy.telegraph || enemy.actionTime > 0) ? 'attack' : 'idle';
    enemy.haste = Math.max(0, (enemy.haste || 0) - dt);
    if (enemy.stun > 0) cancelTacticalAttack(enemy);
    if (enemy.stun > 0 || enemy.cinematicTime > 0) continue;
    const target = enemy.hunter ? state.monk : state.bell;
    const dx = target.x - enemy.x, dy = target.y - enemy.y;
    const length = Math.hypot(dx, dy) || 1;
    if (enemy.kind !== 'oni' && length < (enemy.hunter ? enemy.radius + 25 : state.bell.radius + enemy.radius + 18) && !enemy.attackReady) {
      enemy.animation = 'attack';
      if (!enemy.windup) enemy.windup = 0.24;
      enemy.windup = Math.max(0, enemy.windup - dt);
      if (enemy.windup <= 0) enemy.attackReady = true;
      else continue;
    }
    if (enemy.kind !== 'oni' && enemy.attackReady) enemy.animation = 'attack';
    if (length > 115) { enemy.attackReady = false; enemy.windup = 0; }
    if (!enemy.hunter && length < state.bell.radius + enemy.radius - 3) { damageBell(state, enemy); continue; }
    if (enemy.kind === 'oni' && (enemy.telegraph || enemy.actionTime > 0)) continue;
    let speed = enemy.speed * (enemy.haste > 0 ? 1.5 : 1);
    if (enemy.kind === 'kappa' && Math.sin(enemy.age * 1.7 + enemy.phase) > 0.87) speed *= 2.3;
    if (enemy.kind === 'umbrella') speed *= Math.sin(enemy.age * 3 + enemy.phase) > 0.2 ? 2.2 : 0.2;
    let vx = dx / length * speed, vy = dy / length * speed;
    if (enemy.kind === 'crane' || enemy.kind === 'fox') {
      const weave = Math.sin(enemy.age * 2.6 + enemy.phase) * speed * 0.6;
      vx += -dy / length * weave; vy += dx / length * weave;
    }
    const tactical = tacticalVelocity(state, enemy, dt, dx, dy, length, speed);
    if (tactical) { vx = tactical.vx; vy = tactical.vy; }
    const next = { x: enemy.x + vx * dt, y: enemy.y + vy * dt };
    if (!wallCollision(state, enemy, next, dt)) { enemy.x = next.x; enemy.y = next.y; }
    if (enemy.dead) continue;
    enemy.x = clamp(enemy.x, FIELD.x + enemy.radius, FIELD.x + FIELD.w - enemy.radius);
    enemy.y = clamp(enemy.y, FIELD.y + enemy.radius, FIELD.y + FIELD.h - enemy.radius);
    if (!state.monk.stunned && state.monk.invincibleTime <= 0 && state.monk.dashTime <= 0 && distance(enemy, state.monk) < enemy.radius + 13) {
      hurtMonk(state, enemy);
      state.monk.invincibleTime = 1.5;
      state.ink = Math.max(0, state.ink - 9);
      enemy.stun = 0.7;
      state.monk.health = Math.max(0, state.monk.health - 1);
      if (state.monk.health < 1) { state.monk.stunned = true; state.monk.stunTimer = 2; state.monk.health = 0; state.bell.hp = Math.max(0, state.bell.hp - 1); state.bell.hitTime = 0.7; state.shake = 9; state.flash = 0.2; state.soundEvents.push({ name: 'bellHit' }); burst(state, state.bell.x, state.bell.y, 16, '#bb4436'); floatText(state, state.bell.x, state.bell.y - 45, 'MONK FELL · BELL CRACKED', '#bb4436', 18); }
      else { floatText(state, state.monk.x, state.monk.y - 22, '−1 HEALTH', '#bb4436', 16); }
      state.soundEvents.push({ name: 'splash' });
    }
  }
  state.enemies = state.enemies.filter(enemy => !enemy.dead);
}
