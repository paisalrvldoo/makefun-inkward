import assert from 'node:assert/strict';
import { STEP } from '../game/src/config.js';
import { createState, startRun } from '../game/src/world/state.js';
import { spawnYokai, damageBell } from '../game/src/entities/yokai.js';
import { spawnBoss, updateBosses } from '../game/src/entities/bosses.js';
import { beginStroke, paintPoint, endStroke } from '../game/src/ink/strokes.js';
import { updateWorld } from '../game/src/world/update.js';
import { splashInk } from '../game/src/arts/brushArts.js';
import { replayInput, stageShot } from '../game/src/shots.js';
import { raiseWrath, updateWrath, wrathLevel, wrathMultiplier } from '../game/src/world/wrath.js';
import { beginOmen, finishOmen } from '../game/src/world/omens.js';
import { draftArts } from '../game/src/arts/brushArts.js';

function world() { const state = createState(1); startRun(state); state.queue = []; return state; }
function circle(state, x, y, radius = 64) {
  beginStroke(state, { x: x + radius, y });
  for (let i = 1; i <= 48; i++) paintPoint(state, { x: x + Math.cos(i / 48 * Math.PI * 2) * radius, y: y + Math.sin(i / 48 * Math.PI * 2) * radius });
  endStroke(state); state.waitRelease = false;
}
{
  const state = world(), enemy = spawnYokai(state, 'kappa', { x: 374, y: 411 });
  beginStroke(state, { x: 450, y: 240 }); paintPoint(state, { x: 450, y: 610 }); endStroke(state);
  const wall = state.strokes[0], initialInk = state.ink;
  assert.ok(initialInk < 80, 'Long strokes spend ink');
  for (let i = 0; i < 4 / STEP; i++) updateWorld(state, replayInput(), STEP);
  assert.ok(enemy.x < 433, 'A real yokai cannot cross a live ink wall');
  assert.ok(wall.integrity < 1, 'Blocked yokai erode the wall');
  assert.equal(state.bell.hp, 12, 'Wall protection preserves the bell');
}
{
  const state = world(); spawnYokai(state, 'kappa', { x: 240, y: 340 }); spawnYokai(state, 'crane', { x: 256, y: 360 });
  circle(state, 248, 350);
  assert.equal(state.sealed, 2, 'Closed loops seal every enclosed spirit');
  assert.ok(state.score >= 180); assert.ok(state.ink > 85, 'Seals refund ink');
  circle(state, 730, 350); assert.equal(state.sealed, 2, 'Empty loops never invent a kill');
}
{
  const state = world(); spawnBoss(state, 'moss', { x: 260, y: 350 });
  circle(state, 260, 350); assert.equal(state.enemies[0].hp, 5);
  circle(state, 260, 350); assert.equal(state.enemies[0].hp, 5, 'Oni seal grace prevents instantaneous repeated damage');
}
{
  const state = world(); spawnBoss(state, 'ember', { x: 370, y: 350 });
  beginStroke(state, { x: 425, y: 230 }); paintPoint(state, { x: 425, y: 570 }); endStroke(state);
  const boss = state.enemies[0]; boss.charge = { dx: 1, dy: 0 }; boss.actionTime = 0.5;
  for (let i = 0; i < 40; i++) updateBosses(state, STEP);
  assert.ok(boss.x < 425, 'Ink walls stop an Oni charge');
  assert.equal(boss.charge, null); assert.ok(boss.exposed > 0 && boss.stun > 0);
}
{
  const state = world(); spawnYokai(state, 'fox', { x: 260, y: 350 }); splashInk(state, { x: 260, y: 350 });
  assert.equal(state.enemies.length, 2, 'Fox-fire splits on a splash');
  assert.ok(state.enemies.every(e => e.stun > 0));
}
{
  const state = world(); state.ink = 8;
  beginStroke(state, { x: 200, y: 200 }); paintPoint(state, { x: 850, y: 200 });
  assert.equal(state.ink, 0, 'Ink cannot go below zero');
  assert.ok(state.strokes[0].points.at(-1).x < 330, 'Painting stops at the affordable endpoint');
}
const win = stageShot('win').state, loss = stageShot('end').state, draft = stageShot('draft').state;
const cover = stageShot('play').state;
assert.equal(cover.scroll, 6); assert.equal(cover.mode, 'play');
assert.ok(cover.best > cover.score && cover.arts.length === 5 && cover.combo >= 6);
assert.equal(wrathLevel(cover), 3);
assert.ok(cover.enemies.length >= 12 && new Set(cover.enemies.map(e => e.kind)).size >= 4);
assert.ok(cover.enemies.some(e => e.kind === 'oni' && e.telegraph && e.hp < e.maxHp));
assert.ok(cover.strokes.length >= 3 && cover.strokes.length <= 4 && cover.monk.dashTime > 0 && cover.ghosts.length >= 2);
assert.equal(cover.omen.progress, 1); assert.equal(cover.bell.hp, cover.bell.maxHp - 2);
{
  const state = world(), enemy = spawnYokai(state, 'lantern', { x: 520, y: 411 });
  const input = replayInput(); input.pressed.add('KeyE'); updateWorld(state, input, STEP);
  damageBell(state, enemy);
  assert.equal(state.bell.hp, 12, 'Bell Ward deflects an attacker while active');
  assert.ok(!enemy.dead && enemy.stun > 0, 'Deflection returns the spirit to the fight');
}
{
  const state = world();
  for (let i = 0; i < 3; i++) spawnYokai(state, 'crane', { x: 260 + i * 9, y: 350 });
  circle(state, 270, 350);
  assert.ok(state.omen.complete); assert.equal(state.omenScore, 2400);
  finishOmen(state, true); finishOmen(state, true);
  assert.equal(state.omenHistory.length, 1, 'Omens settle once');
  state.scroll = 2; beginOmen(state); finishOmen(state, true); draftArts(state);
  assert.equal(state.draft.length, 4, 'Unharmed omen grants a fourth real draft choice');
}
{
  const state = world();
  for (let i = 0; i < 4; i++) spawnYokai(state, 'kappa', { x: 260 + i * 8, y: 350 });
  circle(state, 270, 350);
  assert.ok(state.hitStop > 0 && state.particles.some(p => p.petal), 'Big seals have hit-stop and petals');
  const time = state.runTime; updateWorld(state, replayInput(), STEP);
  assert.equal(state.runTime, time, 'Hit-stop briefly freezes real simulation');
  assert.ok(state.floats.some(f => /SEALED ×4 \+/.test(f.text)), 'Seal score floats include the group and points');
}
{
  const state = world(); state.queue = [{ kind: 'kappa' }];
  for (let i = 0; i < 6; i++) raiseWrath(state, 4);
  assert.equal(wrathLevel(state), 5); assert.equal(wrathMultiplier(state), 2);
  assert.equal(state.enemies.filter(e => e.hunter).length, 5, 'Each WRATH level adds a monk hunter');
  assert.ok(state.huntBanner > 0);
  state.queue = []; state.runTime = 10;
  for (let i = 0; i < 35 / STEP; i++) updateWrath(state, STEP);
  assert.equal(wrathLevel(state), 0, 'WRATH cools when the player stops sealing');
  const count = state.enemies.length; raiseWrath(state, 4);
  assert.equal(state.enemies.length, count, 'Wave-end seals cannot summon replacement hunters');
}
assert.equal(win.mode, 'win'); assert.equal(win.scroll, 8); assert.ok(win.bell.hp > 0);
assert.equal(loss.mode, 'lose'); assert.equal(loss.bell.hp, 0);
assert.equal(draft.mode, 'draft'); assert.equal(draft.scroll, 5);
assert.equal(draft.arts.length, 5); assert.equal(draft.draft.length, 4);
assert.ok(draft.bonusDraft, 'The scroll-five unharmed omen unlocks a fourth choice');
assert.ok(draft.omenHistory.some(o => o.scroll === 4 && o.complete), 'The replay earns the crane omen with a real group seal');
assert.ok(draft.omenHistory.some(o => o.scroll === 5 && o.complete), 'The replay earns the scroll-five no-hit omen');
assert.equal(stageShot('win').state.score, win.score, 'Fixed-seed replays are deterministic');
console.log(`Core OK: wall collision/erosion, ink limits/refund, multi-seal, oni grace, fox split, draft, win (${win.score}), loss (${loss.score})`);
