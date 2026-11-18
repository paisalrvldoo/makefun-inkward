import assert from 'node:assert/strict';
import { STEP } from '../game/src/config.js';
import { createState, startRun } from '../game/src/world/state.js';
import { spawnYokai, damageBell } from '../game/src/entities/yokai.js';
import { spawnBoss, updateBosses } from '../game/src/entities/bosses.js';
import { beginStroke, paintPoint, endStroke } from '../game/src/ink/strokes.js';
import { updateWorld, finishRun, nextScroll } from '../game/src/world/update.js';
import { splashInk } from '../game/src/arts/brushArts.js';
import { replayInput, stageShot } from '../game/src/shots.js';
import { raiseWrath, updateWrath, wrathLevel, wrathMultiplier } from '../game/src/world/wrath.js';
import { beginOmen, finishOmen } from '../game/src/world/omens.js';
import { draftArts, chooseArt, BRUSH_ARTS } from '../game/src/arts/brushArts.js';
import { chooseRoad } from '../game/src/world/path.js';
import { readBest, readProgress, recordRun, selectBellSkin, UNLOCKS } from '../game/src/save.js';
import { formatSeed, newRunSeed } from '../game/src/rng.js';

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
  assert.ok(wall.erosion?.life > 0, 'Live wall collisions retain their tactical warning point');
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
const title = stageShot('title').state;
assert.equal(title.mode, 'title'); assert.equal(title.score, 0);
assert.ok(title.best > 0 && title.best === title.previousBestRun.score, 'The title dossier shows an earned previous best');
assert.equal(cover.scroll, 6); assert.equal(cover.mode, 'play');
assert.ok(cover.best > cover.score && cover.arts.length === 5 && cover.combo >= 6);
assert.equal(wrathLevel(cover), 3);
assert.ok(cover.enemies.length >= 12 && new Set(cover.enemies.map(e => e.kind)).size >= 4);
assert.ok(cover.enemies.some(e => e.kind === 'oni' && e.telegraph && e.hp < e.maxHp));
assert.ok(cover.strokes.length >= 3 && cover.strokes.length <= 4 && cover.monk.dashTime > 0 && cover.ghosts.length >= 2);
assert.equal(cover.omen.progress, 1); assert.equal(cover.bell.hp, cover.bell.maxHp - 2);
assert.ok(cover.activeStroke && !cover.activeStroke.closed, 'Cover leaves a real mouse loop open for the next tactical decision');
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
assert.equal(win.scrollScores.length, 8);
assert.ok(win.scrollScores.every(score => score > 0), 'Each cleared scroll has a real score bar');
assert.equal(win.scrollScores.reduce((sum, score) => sum + score, 0), win.score, 'Scroll bars include every score and victory bonus');
assert.equal(loss.scrollScores.reduce((sum, score) => sum + score, 0), loss.score, 'Loss charts include the unfinished scroll');
assert.ok(win.previousBestRun.score > 0 && win.previousBestRun.score < win.score, 'Victory beats an earned previous attempt');
assert.equal(win.previousBestRun.scrollScores.reduce((sum, score) => sum + score, 0), win.previousBestRun.score, 'The ghost keeps all eight scores from the actual previous run');
{
  const originalStorage = globalThis.localStorage, store = new Map();
  globalThis.localStorage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, String(value)) };
  try {
    store.set('inkward.best.v1', '125');
    assert.equal(readBest(), 125, 'Existing v1 best scores migrate without a reset');
    const recordedRuns = win.progress.runs;
    recordRun(win); recordRun(win);
    const progress = readProgress();
    assert.equal(progress.runs, recordedRuns, 'Persisting an ended run twice does not increment its count');
    assert.equal(progress.wins, 1);
    assert.deepEqual(progress.unlocks, UNLOCKS.map(u => u.id), 'A real eight-scroll win unlocks the next-run rewards');
    assert.deepEqual(progress.bestRun.scrollScores, win.scrollScores, 'The best record saves all eight real scroll scores');
    assert.equal(progress.bestRun.seed, win.seed);
    assert.notEqual(win.previousBestRun.score, progress.bestRun.score, 'A new best retains the older ghost for the results chart');
    assert.ok(selectBellSkin(progress, 'moon'));
    const again = createState(2, readBest(), 'monk', readProgress());
    assert.equal(again.bell.skin, 'moon', 'The selected skin survives a fresh state');
    startRun(again); finishRun(again, false); recordRun(again);
    assert.equal(again.newBest, false); assert.deepEqual(again.newUnlocks, []);
    assert.equal(readProgress().wins, 1); assert.equal(readProgress().runs, recordedRuns + 1);
    assert.deepEqual(again.previousBestRun, progress.bestRun, 'The next run loads the persisted ghost record');
    assert.deepEqual(readProgress().unlocks, progress.unlocks, 'A later loss retains victory unlocks');
    const offered = new Set();
    for (let i = 0; i < 40; i++) { draftArts(again); again.draft.forEach(a => offered.add(a.id)); }
    assert.ok(offered.has('moonInk') && offered.has('afterglow'), 'Unlocked arts enter real drafts');
    store.set('inkward.progress.v2', '{broken');
    assert.deepEqual(readProgress().unlocks, [], 'A corrupt profile safely starts fresh');
    store.set('inkward.best.v1', 'Infinity');
    assert.equal(readBest(), 0, 'Invalid scores cannot become immortal records');
  } finally {
    if (originalStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = originalStorage;
  }
}
{
  const normal = world(), moon = world();
  moon.arts = ['moonInk']; moon.artLevels.moonInk = 2; moon.bell.wardTime = 3;
  for (const state of [normal, moon]) { beginStroke(state, { x: 200, y: 300 }); paintPoint(state, { x: 400, y: 300 }); endStroke(state); }
  assert.ok(Math.abs((100 - moon.ink) / (100 - normal.ink) - 0.7) < 0.001, 'Moonlit ink reduces actual ward painting cost');
  const prayer = world(); prayer.arts = ['afterglow']; prayer.artLevels.afterglow = 2; prayer.bell.hp = 8;
  updateWorld(prayer, replayInput(), STEP);
  assert.equal(prayer.mode, 'draft'); assert.equal(prayer.bell.hp, 10, 'Afterglow repairs the bell on a real scroll clear');
}
console.log('Progression OK: eight score bars, legacy/corrupt saves, persistent one-time victory unlocks, next-run arts and Moon Bell');
{
  const swarm = world(), quiet = world();
  for (const state of [swarm, quiet]) {
    state.bell.hp = 8; updateWorld(state, replayInput(), STEP);
    state.draft = [BRUSH_ARTS.find(a => a.id === 'breath')];
    assert.equal(nextScroll(state), false, 'The next scroll requires a real road selection');
    assert.equal(chooseArt(state, 0), false, 'Art choices wait for the road');
    assert.equal(chooseRoad(state, 'invented'), false);
  }
  assert.ok(chooseRoad(swarm, 'swarm'));
  chooseRoad(quiet, 'quiet'); chooseRoad(quiet, 'swarm'); chooseRoad(quiet, 'quiet');
  assert.equal(quiet.bell.hp, 8, 'Changing road choices cannot farm bell repairs');
  for (const state of [swarm, quiet]) { assert.ok(chooseArt(state, 0)); assert.ok(nextScroll(state)); }
  assert.equal(swarm.queue.length, 31); assert.equal(quiet.queue.length, 24, 'Swarm adds 30% ordinary spirits plus one boss');
  assert.equal(swarm.artLevels.breath, 2); assert.equal(swarm.maxInk, 160, 'Swarm grants a real extra art level and its capacity');
  assert.equal(quiet.artLevels.breath, 1); assert.equal(quiet.bell.hp, 10);
  assert.equal(swarm.route[1], 'swarm'); assert.equal(quiet.route[1], 'quiet');
  assert.equal(chooseRoad(quiet, 'swarm'), false, 'Walked roads are immutable during play');
  const fresh = createState(1);
  assert.deepEqual(fresh.route, ['shrine', null, null, null, null, null, null, null], 'A new run clears its walked path');
  swarm.queue = []; swarm.enemies = []; updateWorld(swarm, replayInput(), STEP);
  chooseRoad(swarm, 'swarm'); swarm.draft = [BRUSH_ARTS.find(a => a.id === 'breath')];
  chooseArt(swarm, 0); nextScroll(swarm);
  assert.equal(swarm.artLevels.breath, 3, 'Road bonuses respect the art level cap');
  assert.equal(swarm.queue.filter(t => t.kind === 'oni').length, 1, 'Boss roads still contain exactly one Oni');
}
assert.ok(draft.route.slice(0, 5).every(Boolean));
assert.ok(draft.route.includes('swarm') && draft.route.includes('quiet'), 'Draft replay walks both branches through real choices');
console.log('Path OK: required selection, real wave/level/heal effects, immutable walked nodes, cap and boss count');
for (const value of [0, -1, 4294967296, 4294967297, NaN, '123456789']) {
  const state = createState(value), same = createState(state.seed);
  assert.deepEqual(state.queue, same.queue, 'Displayed normalized seeds reproduce the same spirit queue');
  assert.equal(Number(formatSeed(state.seed)), state.seed);
}
let previousSeed = 1;
for (let i = 0; i < 16; i++) {
  const seed = newRunSeed(previousSeed);
  assert.ok(seed > 0 && seed <= 0xffffffff && seed !== previousSeed, 'Fresh seeds are valid and change the previous run');
  previousSeed = seed;
}
console.log('Replay hooks OK: stable displayed seeds, fresh rerolls and a persisted previous-best ghost');
console.log(`Core OK: wall collision/erosion, ink limits/refund, multi-seal, oni grace, fox split, draft, win (${win.score}), loss (${loss.score})`);
