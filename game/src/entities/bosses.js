import { FIELD, distance, clamp } from '../config.js';
import { addRing, floatText, burst } from '../render/fx.js';
import { spawnYokai, wallCollision } from './yokai.js';

import { ONI } from './bossProfiles.js';
import { finalPhase, beginFinalPhase, warnFrostDivide, executeFrostDivide } from './finalBoss.js';
export { ONI } from './bossProfiles.js';

export const ATTACK_NAMES = { storm: 'INK STORM', charge: 'BELL CHARGE', roar: 'WALL-EATING ROAR', divide: 'FROST DIVIDE' };
export const bossPhase = enemy => enemy.boss === 'frost' ? finalPhase(enemy) : Math.min(2, Math.floor((1 - enemy.hp / enemy.maxHp) * 3));
export function spawnBoss(state, kind, point) {
  const stats = ONI[kind];
  const enemy = {
    ...point, y: Math.max(point.y, FIELD.y + 142), ...stats, kind: 'oni', boss: kind, id: state.nextId++, maxHp: stats.hp,
    radius: kind === 'reed' || kind === 'lantern' ? 35 : 43, phase: 0, age: 0, stun: 0, hitTime: 0, hitFlash: 0, animation: 'idle', blocked: 0, dead: false, pulse: 2.6,
    sealLock: 0, exposed: 0, telegraph: null, actionTime: 0, cycle: 0, charge: null,
    cinematicTime: 0,
  };
  state.enemies.push(enemy);
  floatText(state, point.x, FIELD.y + 208, stats.short + ' AWAKENS', stats.color, 22);
  state.soundEvents.push({ name: 'bossIntro' });
  if (kind === 'frost' && state.scroll === 8) beginFinalPhase(state, enemy, true);
  return enemy;
}
export function bossLoopDamage(enemy, enclosedCount) {
  if (enemy.sealLock > 0 || enemy.cinematicTime > 0) return 0;
  const vulnerable = enemy.stun > 0 || enemy.exposed > 0;
  if (enemy.boss === 'frost' && !vulnerable && enclosedCount < 3) return 0;
  const base = vulnerable || (['ember', 'lantern', 'cinder'].includes(enemy.boss) && enemy.telegraph?.kind === 'charge') ? 2 : 1;
  return base + Math.min(3, Math.floor((enclosedCount - 1) / 2));
}
function warnAttack(state, enemy) {
  if (enemy.boss === 'frost' && bossPhase(enemy) === 2) { warnFrostDivide(state, enemy); return; }
  const phase = bossPhase(enemy), attacks = enemy.attacks[phase];
  const kind = attacks[enemy.cycle++ % attacks.length];
  enemy.telegraph = { kind, time: 2.1, total: 2.1, x: enemy.x, y: enemy.y, end: { x: state.bell.x, y: state.bell.y }, radius: kind === 'roar' ? 200 : 128 };
  state.soundEvents.push({ name: 'warning', value: phase });
}
function executeAttack(state, enemy, telegraph) {
  const phase = bossPhase(enemy);
  if (telegraph.kind === 'divide') {
    executeFrostDivide(state, enemy, telegraph);
  } else if (telegraph.kind === 'storm') {
    const count = (enemy.stormCount || 4) + phase * 2;
    for (let i = 0; i < count; i++) {
      const a = i / count * Math.PI * 2 + enemy.cycle * 0.7;
      const point = { x: clamp(enemy.x + Math.cos(a) * 104, FIELD.x + 30, FIELD.x + FIELD.w - 30), y: clamp(enemy.y + Math.sin(a) * 100, FIELD.y + 105, FIELD.y + FIELD.h - 30) };
      spawnYokai(state, enemy.minions[i % enemy.minions.length], point);
      state.spawned++; state.total++;
    }
    burst(state, enemy.x, enemy.y, 45, enemy.color);
  } else if (telegraph.kind === 'roar') {
    for (const stroke of state.strokes) if (stroke.points.some(p => distance(p, enemy) < telegraph.radius)) { stroke.integrity -= 0.6; stroke.flash = 0.45; }
    addRing(state, enemy.x, enemy.y, telegraph.radius, enemy.color, 1);
  } else {
    const length = distance(enemy, telegraph.end) || 1;
    enemy.charge = { dx: (telegraph.end.x - enemy.x) / length, dy: (telegraph.end.y - enemy.y) / length };
    enemy.actionTime = 0.5;
  }
  enemy.exposed = 2.8;
  enemy.pulse = telegraph.kind === 'divide' ? 2.7 : Math.max(2.5, (enemy.tempo || 5.2) - phase * 0.6);
  floatText(state, enemy.x, enemy.y - 60, ATTACK_NAMES[telegraph.kind], enemy.color, 18);
  state.soundEvents.push({ name: telegraph.kind });
}
export function updateBosses(state, dt) {
  for (const enemy of state.enemies) {
    if (enemy.kind !== 'oni' || enemy.dead) continue;
    if (enemy.cinematicTime > 0) continue;
    enemy.sealLock = Math.max(0, enemy.sealLock - dt);
    enemy.exposed = Math.max(0, enemy.exposed - dt);
    if (enemy.stun > 0) { enemy.actionTime = 0; enemy.charge = null; continue; }
    if (enemy.actionTime > 0) {
      enemy.actionTime -= dt;
      const next = { x: enemy.x + enemy.charge.dx * 230 * dt, y: enemy.y + enemy.charge.dy * 230 * dt };
      if (wallCollision(state, enemy, next, dt)) {
        enemy.actionTime = 0; enemy.charge = null; enemy.stun = 1.8; enemy.exposed = 2.8;
        floatText(state, enemy.x, enemy.y - 60, 'CHARGE BROKEN · EXPOSED', enemy.color, 18);
        state.soundEvents.push({ name: 'splash' });
      } else {
        enemy.x = clamp(next.x, FIELD.x + enemy.radius, FIELD.x + FIELD.w - enemy.radius);
        enemy.y = clamp(next.y, FIELD.y + enemy.radius, FIELD.y + FIELD.h - enemy.radius);
      }
      continue;
    }
    if (enemy.telegraph) {
      enemy.telegraph.time -= dt;
      if (enemy.telegraph.time <= 0) { executeAttack(state, enemy, enemy.telegraph); enemy.telegraph = null; }
    } else { enemy.pulse -= dt; if (enemy.pulse <= 0) warnAttack(state, enemy); }
  }
}
