import { FIELD, distance } from '../config.js';
import { burst, addRing, floatText } from '../render/fx.js';
import { hurtMonk } from '../fx/characterStates.js';
import { spawnYokai } from './yokai.js';

export const finalPhase = boss => boss.hp > 7 ? 0 : boss.hp > 3 ? 1 : 2;

// A strong build can reach a phase boundary in one seal, but every phase gets its turn.
export function finalSealHealth(boss, damage) {
  const boundary = boss.hp > 7 ? 7 : boss.hp > 3 ? 3 : 0;
  return Math.max(boundary, boss.hp - damage);
}

export function beginFinalPhase(state, boss, intro = false) {
  boss.phase = finalPhase(boss);
  boss.telegraph = null; boss.charge = null; boss.actionTime = 0;
  boss.cinematicTime = 2.3; boss.exposed = 0; boss.stun = Math.max(boss.stun, 0.5);
  state.climax = { age: 0, duration: 2.3, phase: boss.phase, intro, bossId: boss.id, name: boss.name, title: boss.phases[boss.phase], color: boss.color };
  state.bannerTime = 0;
  state.soundEvents.push({ name: 'finalPhase', value: intro ? 0 : boss.phase + 1 });
}

// Cinematic time advances in real seconds while the garden keeps accepting slow-motion input.
export function advanceClimax(state, dt) {
  const cinematic = state.climax;
  if (!cinematic) return 1;
  cinematic.age += dt;
  const boss = state.enemies.find(enemy => enemy.id === cinematic.bossId && !enemy.dead);
  if (boss) boss.cinematicTime = Math.max(0, cinematic.duration - cinematic.age);
  if (!boss || cinematic.age >= cinematic.duration) {
    state.climax = null;
    if (boss) { boss.exposed = 2.8; boss.stun = 0.35; boss.pulse = 1.1; }
    return 1;
  }
  return cinematic.age < 1.6 ? 0.18 : 0.45;
}

export function warnFrostDivide(state, boss) {
  const vertical = boss.cycle++ % 2 === 0;
  const lanes = [-205, -90, 90, 205].map(offset => vertical
    ? { from: { x: state.bell.x + offset, y: FIELD.y + 100 }, to: { x: state.bell.x + offset, y: FIELD.y + FIELD.h } }
    : { from: { x: FIELD.x, y: state.bell.y + offset }, to: { x: FIELD.x + FIELD.w, y: state.bell.y + offset } });
  boss.telegraph = { kind: 'divide', time: 1.65, total: 1.65, x: boss.x, y: boss.y, radius: 155, lanes };
  state.soundEvents.push({ name: 'warning', value: 2 });
}

export function inFrostLane(point, lane, width = 23) {
  return lane.from.x === lane.to.x
    ? Math.abs(point.x - lane.from.x) < width && point.y >= lane.from.y && point.y <= lane.to.y
    : Math.abs(point.y - lane.from.y) < width && point.x >= lane.from.x && point.x <= lane.to.x;
}

export function executeFrostDivide(state, boss, warning) {
  state.frostLanes.push({ lanes: warning.lanes, life: 0.55, maxLife: 0.55 });
  for (const stroke of state.strokes) {
    if (stroke.points.some(point => warning.lanes.some(lane => inFrostLane(point, lane, 30)))) { stroke.integrity -= 0.55; stroke.flash = 0.45; }
  }
  if (state.monk.dashTime <= 0 && state.monk.hurtTime <= 0 && warning.lanes.some(lane => inFrostLane(state.monk, lane))) {
    hurtMonk(state, boss); state.ink = Math.max(0, state.ink - 9);
    floatText(state, state.monk.x, state.monk.y - 35, 'FROST CUT · −9 INK', '#3d789e', 20);
  }
  // Four distant spirits keep loops rewarding; the centre remains a readable safe pocket.
  for (let i = 0; i < 4; i++) {
    const point = i < 2 ? { x: FIELD.x + 55, y: FIELD.y + 180 + i * 270 } : { x: FIELD.x + FIELD.w - 55, y: FIELD.y + 180 + (i - 2) * 270 };
    if (distance(point, state.bell) > 160) { spawnYokai(state, boss.minions[i], point); state.spawned++; state.total++; }
  }
  burst(state, boss.x, boss.y, 55, '#bce5ed');
  addRing(state, boss.x, boss.y, 210, '#a4dfea', 0.7);
  state.soundEvents.push({ name: 'frostDivide' });
}
