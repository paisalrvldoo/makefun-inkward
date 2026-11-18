import assert from 'node:assert/strict';
import { createState, startRun } from '../game/src/world/state.js';
import { updateWorld } from '../game/src/world/update.js';
import { spawnYokai, updateYokai, wallCollision } from '../game/src/entities/yokai.js';
import { spawnBoss, updateBosses, ONI } from '../game/src/entities/bosses.js';
import { SCROLLS } from '../game/src/world/scrolls.js';
import { releaseSpirit } from '../game/src/ink/seal.js';
import { beginStroke, paintPoint, endStroke, updateStrokes } from '../game/src/ink/strokes.js';
import { replayInput } from '../game/src/shots.js';
import { updateEffects } from '../game/src/render/fx.js';
import { activeSynergies } from '../game/src/arts/schools.js';
import { updateArts, chooseArt, BRUSH_ARTS } from '../game/src/arts/brushArts.js';
import { bufferActions } from '../game/src/controls/buffer.js';
import { ART_SOUNDS } from '../game/src/audio/artSounds.js';

function world(arts = []) { const s = createState(1); startRun(s); s.spawnTime = 100; s.arts = arts; return s; }
{
  const a = world(['breath']), b = world(['breath', 'feather']);
  for (const s of [a, b]) { s.ink = 10; updateStrokes(s, replayInput(), 1); }
  assert.ok(Math.abs((b.ink - 10) / (a.ink - 10) - 1.2) < 1e-9, 'FLOW gives exactly 20% more refill');
  const upgrade = world(['breath']); upgrade.artLevels.breath = 3;
  assert.equal(activeSynergies(upgrade).length, 0, 'Levels of one art do not count as two held arts');
}
{
  const a = world(['stone']), b = world(['stone', 'twin']);
  for (const s of [a, b]) { beginStroke(s, { x: 400, y: 280 }); paintPoint(s, { x: 400, y: 500 }); endStroke(s); updateStrokes(s, replayInput(), 1); }
  assert.ok(b.strokes[0].life > a.strokes[0].life, 'CARVE lengthens the actual wall lifetime');
  for (const s of [a, b]) { const enemy = spawnYokai(s, 'kappa', { x: 380, y: 360 }); wallCollision(s, enemy, { x: 390, y: 360 }, 1); }
  assert.ok(b.strokes[0].integrity > a.strokes[0].integrity, 'CARVE also resists actual collision erosion');
}
{
  const a = world(['gold']), b = world(['gold', 'lotus']);
  for (const s of [a, b]) releaseSpirit(s, spawnYokai(s, 'kappa', { x: 240, y: 300 }));
  assert.equal(a.score, 130); assert.equal(b.score, 150, 'BLOOM increases real release score by 15%, rounded');
  assert.equal(b.dissolves[0].animation, 'death'); assert.ok(b.particles.filter(p => p.petal).length >= 12);
  releaseSpirit(b, b.enemies[0]); assert.equal(b.dissolves.length, 1, 'Death dissolves only once');
  updateEffects(b, 1); assert.equal(b.dissolves.length, 0, 'Dissolves expire and cannot block the next scroll');
}
{
  const s = world(), enemy = spawnYokai(s, 'fox', { x: s.monk.x - 16, y: s.monk.y }); enemy.attackReady = true;
  updateYokai(s, 0.016); assert.equal(s.ink, 91); assert.ok(s.monk.hurtTime > 0 && s.monk.hitFlash > 0 && s.monk.recoil > 0);
  const x = s.monk.x; updateWorld(s, replayInput(), 0.016); assert.ok(s.monk.x > x, 'A real hit recoils the monk away');
  assert.ok(s.ink >= 91, 'Invulnerability prevents a second ink hit');
  const dash = world(); dash.monk.dashTime = 0.1;
  spawnYokai(dash, 'kappa', { x: dash.monk.x, y: dash.monk.y }).attackReady = true;
  updateYokai(dash, 0.016); assert.equal(dash.ink, 100, 'Dash i-frames prevent ink damage');
}
assert.equal(Object.keys(ONI).length, 8);
assert.equal(new Set(SCROLLS.map(s => s.boss)).size, 8, 'Every scroll has its own real boss');
for (const scroll of SCROLLS) {
  const s = world(); spawnBoss(s, scroll.boss, { x: 360, y: 310 }); const boss = s.enemies[0];
  updateBosses(s, 2.7); assert.ok(boss.telegraph && boss.telegraph.time === 2.1, 'Each boss warns before attacking');
  updateBosses(s, 2.2); assert.ok(boss.exposed > 0, 'Every boss opens a recovery window after its attack');
}
assert.equal(new Set(Object.values(ART_SOUNDS).map(s => JSON.stringify(s))).size, 14, 'All fourteen art sounds have distinct voices');
for (const art of BRUSH_ARTS) {
  const s = world(); s.mode = 'title'; s.draft = [art]; chooseArt(s, 0);
  assert.ok(s.skillEffects.some(f => f.id === art.id)); assert.ok(s.soundEvents.some(e => e.name === `art:${art.id}`));
}
for (const [key, id] of [['KeyQ', 'lotus'], ['KeyE', 'mending']]) {
  const s = world(), input = replayInput(); input.pressed.add(key); bufferActions(s, input, 0); updateArts(s, input, 0);
  assert.equal(s.impactFrames, 2); assert.ok(s.ritualFlash > 0); assert.ok(s.skillEffects.some(f => f.id === id));
}
console.log('Systems OK: three numerical school bonuses, eight boss warnings/recoveries, death cleanup, recoil and i-frames, fourteen cast/sound voices and ritual impacts');
