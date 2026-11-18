import assert from 'node:assert/strict';
import { createState, startRun } from '../game/src/world/state.js';
import { updateWorld } from '../game/src/world/update.js';
import { spawnBoss, updateBosses } from '../game/src/entities/bosses.js';
import { spawnYokai, damageBell } from '../game/src/entities/yokai.js';
import { sealLoop } from '../game/src/ink/seal.js';
import { releaseWhiteout, updateFrostWaves } from '../game/src/entities/frostPattern.js';
import { replayInput } from '../game/src/shots.js';
import { ENDING_DURATION, updateEnding, skipEnding, scoreReveal } from '../game/src/scenes/ending.js';

const s = createState(17); startRun(s); s.scroll = 8; s.queue = [];
spawnBoss(s, 'frost', { x: 360, y: 330 });
const boss = s.enemies[0];
assert.equal(s.climax.phase, 0);
const polygon = [{ x: 250, y: 220 }, { x: 470, y: 220 }, { x: 470, y: 440 }, { x: 250, y: 440 }];
for (const hp of [6, 3, 0]) {
  boss.stun = 1; boss.sealLock = 0;
  for (let i = 0; i < 8; i++) spawnYokai(s, 'crane', { x: 320 + i * 3, y: 350 });
  sealLoop(s, polygon);
  assert.equal(boss.hp, hp, 'Large loops cannot skip a final boss phase');
  if (hp) {
    assert.equal(s.climax.kind, 'phase');
    s.climax = null;
  }
}
assert.equal(s.climax.kind, 'seal'); assert.ok(s.finalSealed);
assert.ok(s.enemies.every(e => e.dead), 'Final seal releases the crowd');
const time = s.runTime;
updateWorld(s, replayInput(), 0.1);
assert.equal(s.runTime, time, 'Final seal freeze holds simulation time');
assert.equal(s.mode, 'play', 'Results wait for the final impact');
for (let i = 0; i < 180; i++) updateWorld(s, replayInput(), 1 / 60);
assert.equal(s.mode, 'win'); assert.ok(s.ended && s.bell.hp > 0);
assert.equal(s.scrollScores.reduce((a, b) => a + b, 0), s.score);
const score = s.score, unlocks = [...s.unlocks];
assert.ok(s.ending && s.ending.time < 1, 'A natural win starts at dawn');
s.soundEvents = []; s.ending.time = 0;
updateEnding(s, ENDING_DURATION + 3);
assert.equal(s.soundEvents.filter(e => e.name === 'cleanBell').length, 1);
assert.equal(s.soundEvents.filter(e => e.name === 'unroll').length, 8, 'Every seasonal scroll rings in once');
assert.equal(s.soundEvents.filter(e => e.name === 'gradeStamp').length, 1);
assert.equal(scoreReveal(s), 1); assert.equal(s.score, score); assert.deepEqual(s.unlocks, unlocks);
updateEnding(s, 1); assert.equal(s.soundEvents.filter(e => e.name === 'unroll').length, 8, 'Cues never repeat');
s.ending.time = 1; s.resultTime = 0;
assert.ok(skipEnding(s)); assert.equal(s.resultTime, 3); assert.equal(s.mode, 'win'); assert.equal(s.score, score);
assert.equal(skipEnding(s), false, 'Skipping again does not replay cues');

const frost = createState(9); frost.scroll = 8; spawnBoss(frost, 'frost', { x: 300, y: 300 });
const oni = frost.enemies[0]; oni.hp = 3; oni.pulse = 0; oni.stun = 0;
updateBosses(frost, 0.01); assert.equal(oni.telegraph.kind, 'whiteout');
updateBosses(frost, 2.2); assert.equal(frost.frostWaves.length, 2); assert.ok(oni.exposed > 0);
const checkWave = (protection = '') => {
  const state = createState(1); state.monk.x = 380; state.monk.y = 300;
  if (protection === 'dash') state.monk.dashTime = 0.5;
  if (protection === 'wall') state.strokes.push({ points: [{ x: 345, y: 300 }, { x: 351, y: 300 }], life: 1, integrity: 1 });
  releaseWhiteout(state, { x: 300, y: 300 }, { angle: -Math.PI / 6 });
  for (let i = 0; i < 18; i++) updateFrostWaves(state, 1 / 60);
  return state;
};
assert.equal(checkWave().ink, 88, 'Whiteout has real ink damage');
assert.equal(checkWave('dash').ink, 100, 'Dash evades the whiteout');
assert.equal(checkWave('wall').ink, 100, 'Painted walls break dangerous spokes');
oni.x = frost.bell.x + 20; oni.y = frost.bell.y;
damageBell(frost, oni); assert.ok(!oni.dead && oni.exposed > 0, 'Final boss cannot disappear by colliding with the bell');
console.log('Climax OK: mandatory phases, distinct whiteout, dash/wall counters, final freeze/release and scored victory');
