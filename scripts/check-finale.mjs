import assert from 'node:assert/strict';
import { STEP } from '../game/src/config.js';
import { createState, startRun } from '../game/src/world/state.js';
import { updateWorld } from '../game/src/world/update.js';
import { spawnBoss, updateBosses, bossLoopDamage } from '../game/src/entities/bosses.js';
import { spawnYokai, damageBell } from '../game/src/entities/yokai.js';
import { finalPhase, inFrostLane } from '../game/src/entities/finalBoss.js';
import { sealLoop } from '../game/src/ink/seal.js';
import { replayInput } from '../game/src/shots.js';

function finalWorld() {
  const state = createState(1); startRun(state); state.scroll = 8; state.queue = []; state.spawnTime = 1000;
  const boss = spawnBoss(state, 'frost', { x: 270, y: 350 });
  return { state, boss, input: replayInput() };
}
function advance(state, input, seconds) {
  for (let i = 0; i < Math.ceil(seconds / STEP); i++) { updateWorld(state, input, STEP); input.clearFrame(); }
}
function loop(state, boss, minions = 0) {
  for (let i = 0; i < minions; i++) spawnYokai(state, 'crane', { x: boss.x + i * 3, y: boss.y });
  boss.stun = 1; boss.sealLock = 0;
  sealLoop(state, Array.from({ length: 49 }, (_, i) => ({ x: boss.x + Math.cos(i / 48 * Math.PI * 2) * 68, y: boss.y + Math.sin(i / 48 * Math.PI * 2) * 68 })));
}
{
  const { state, boss, input } = finalWorld();
  const start = state.runTime; advance(state, input, 1);
  assert.ok(state.runTime - start < 0.25 && state.climax.age >= 0.98, 'Phase cinema uses a real clock and slows the simulation');
  assert.equal(bossLoopDamage(boss, 9), 0, 'A cinematic ward cannot lose its next phase');
  advance(state, input, 1.4); assert.equal(state.climax, null);
  loop(state, boss, 7);
  assert.equal(boss.hp, 7); assert.equal(finalPhase(boss), 1); assert.equal(state.climax.phase, 1);
  advance(state, input, 2.5); loop(state, boss, 7);
  assert.equal(boss.hp, 3); assert.equal(finalPhase(boss), 2); assert.equal(state.climax.phase, 2);
  advance(state, input, 2.5);
  boss.stun = 0; boss.telegraph = null; boss.pulse = 0;
  updateBosses(state, STEP);
  const first = boss.telegraph;
  assert.equal(first.kind, 'divide'); assert.equal(first.lanes.length, 4);
  assert.ok(!first.lanes.some(lane => inFrostLane(state.bell, lane)), 'Frost lanes leave the shrine centre readable');
  state.monk.x = first.lanes[0].from.x; state.monk.y = 360; state.monk.hurtTime = 0; state.monk.dashTime = 0;
  const ink = state.ink; updateBosses(state, 1.7);
  assert.equal(state.ink, ink - 9); assert.ok(state.monk.hurtTime > 0 && boss.exposed > 0, 'The distinct pattern hits and then offers recovery');
  boss.pulse = 0; updateBosses(state, STEP);
  assert.notEqual(boss.telegraph.lanes[0].from.x, boss.telegraph.lanes[0].to.x, 'The next desperation pattern changes direction');
  state.monk.x = 500; state.monk.y = boss.telegraph.lanes[1].from.y; state.monk.dashTime = 0.1; state.monk.hurtTime = 0;
  const dashInk = state.ink; updateBosses(state, 1.7);
  assert.equal(state.ink, dashInk, 'Dash i-frames cross the final pattern safely');
  boss.hp = 1; loop(state, boss);
  assert.equal(state.mode, 'seal'); assert.ok(state.enemies.every(enemy => enemy.dead)); assert.equal(state.queue.length, 0);
  const score = state.score, clock = state.time, particles = state.particles.length;
  advance(state, input, 0.15);
  assert.equal(state.time, clock); assert.equal(state.particles.length, particles, 'The final hit freezes the painted frame');
  advance(state, input, 0.2);
  assert.ok(state.finalSeal.burst && state.soundEvents.some(event => event.name === 'finalSlash'));
  assert.ok(state.particles.some(particle => particle.petal) && state.rings.some(ring => ring.radius > 800));
  advance(state, input, 3);
  assert.equal(state.mode, 'win'); assert.ok(state.score > score);
  const total = state.score; advance(state, input, 1); assert.equal(state.score, total, 'The final reward settles once');
}
{
  const { state, boss } = finalWorld();
  boss.x = state.bell.x - 45; boss.y = state.bell.y; state.bell.wardTime = 0;
  damageBell(state, boss);
  assert.equal(boss.dead, false); assert.equal(state.bell.hp, 8, 'The final boss must be sealed; touching the bell cannot grant victory');
}
console.log('Finale OK: enforced phases, real-clock slow motion, alternating frost lanes, recovery/i-frames, final freeze/slash, mass release and one-time victory');
