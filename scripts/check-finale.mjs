import assert from 'node:assert/strict';
import { STEP } from '../game/src/config.js';
import { createState, startRun } from '../game/src/world/state.js';
import { updateWorld, finishRun } from '../game/src/world/update.js';
import { spawnBoss, updateBosses, bossLoopDamage } from '../game/src/entities/bosses.js';
import { spawnYokai, damageBell } from '../game/src/entities/yokai.js';
import { finalPhase, inFrostLane } from '../game/src/entities/finalBoss.js';
import { sealLoop } from '../game/src/ink/seal.js';
import { replayInput } from '../game/src/shots.js';
import { beginEnding, advanceEnding, skipEnding, skipResults, ENDING_DURATION } from '../game/src/scenes/ending.js';
import { resultMotion } from '../game/src/screens/resultMotion.js';
import { createMusic, musicProfile } from '../game/src/audio/music.js';
import { advanceDefeat, skipDefeat } from '../game/src/scenes/defeat.js';

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
  assert.equal(state.ending.age, 0, 'The earned victory opens its ending before the record');
  const runTime = state.runTime, stats = [...state.scrollScores]; state.soundEvents = [];
  for (let i = 0; i < Math.ceil(ENDING_DURATION / STEP); i++) advanceEnding(state, STEP);
  assert.equal(state.ending.age, ENDING_DURATION); assert.equal(state.resultsTime, 0);
  assert.equal(state.soundEvents.filter(event => event.name === 'endingBell').length, 1);
  assert.deepEqual(state.soundEvents.filter(event => event.name === 'unroll').map(event => event.value), [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.equal(state.soundEvents.filter(event => event.name === 'win').length, 1);
  advanceEnding(state, 1); const partial = resultMotion(state);
  assert.ok(partial.score > 0 && partial.score < total && partial.stamp === 0, 'The score counts up before the grade lands');
  advanceEnding(state, 2); assert.equal(resultMotion(state).score, total); assert.equal(resultMotion(state).stamp, 1);
  assert.equal(state.score, total); assert.equal(state.runTime, runTime); assert.deepEqual(state.scrollScores, stats, 'Ending and animated maths preserve real run statistics');
  beginEnding(state); state.soundEvents = [];
  assert.ok(skipEnding(state)); assert.equal(skipEnding(state), false); skipResults(state);
  assert.equal(resultMotion(state).score, total); assert.equal(state.soundEvents.filter(event => event.name === 'win').length, 1, 'Skipping settles once without duplicating the fanfare');
}
{
  const { state, boss } = finalWorld();
  boss.x = state.bell.x - 45; boss.y = state.bell.y; state.bell.wardTime = 0;
  damageBell(state, boss);
  assert.equal(boss.dead, false); assert.equal(state.bell.hp, 8, 'The final boss must be sealed; touching the bell cannot grant victory');
}
{
  const state = createState(1); startRun(state);
  let clock = 0; const notes = [], drums = [];
  const music = createMusic((...args) => notes.push(args), (...args) => drums.push(args), () => clock);
  for (let i = 0; i < 120; i++) { music.update(state); clock += STEP; }
  const normal = musicProfile(state); assert.ok(music.active && music.scheduled > 2 && notes.length > 2);
  state.scroll = 8; const boss = spawnBoss(state, 'frost', { x: 270, y: 350 }); state.climax = null; boss.hp = 3;
  assert.ok(musicProfile(state).bpm > normal.bpm && musicProfile(state).intensity > normal.intensity);
  for (let i = 0; i < 120; i++) { music.update(state); clock += STEP; }
  assert.ok(drums.length > 3 && notes.some(note => note[0] === 49), 'The last scroll adds a distinct drum and bass layer');
  state.mode = 'pause'; const count = notes.length; clock += 30; music.update(state);
  assert.equal(music.active, false); assert.equal(notes.length, count, 'Paused music schedules no notes');
  state.mode = 'play'; music.update(state);
  assert.ok(notes.length - count < 8, 'Resuming avoids a burst of thirty seconds of missed notes');
}
{
  const state = createState(1); startRun(state); state.bell.hp = 0; finishRun(state, false);
  assert.equal(state.mode, 'lose'); assert.equal(state.defeat.age, 0);
  const score = state.score, time = state.runTime;
  advanceEnding(state, 1); assert.equal(state.resultsTime, 0, 'The defeat dissolves before its record unrolls');
  advanceDefeat(state, 0.3); assert.ok(state.defeat.age > 0);
  assert.ok(skipDefeat(state)); assert.equal(skipDefeat(state), false);
  advanceEnding(state, 3); assert.equal(resultMotion(state).score, score);
  assert.equal(state.runTime, time); assert.equal(state.score, score, 'Defeat polish preserves the run record');
}
console.log('Finale OK: enforced phases, slow motion, frost recovery/i-frames, final freeze/slash, eight-scroll epilogue, score/grade animation, music escalation/pause, defeat/retry and one-time records');
