import assert from 'node:assert/strict';
import { createState, startRun } from '../game/src/world/state.js';
import { updateWorld, nextScroll } from '../game/src/world/update.js';
import { spawnYokai, updateYokai } from '../game/src/entities/yokai.js';
import { tacticalVelocity } from '../game/src/entities/tacticalYokai.js';
import { chooseRoad, availableRoads } from '../game/src/world/path.js';
import { draftArts, chooseArt, BRUSH_ARTS } from '../game/src/arts/brushArts.js';
import { RELICS, relicScoreBonus } from '../game/src/arts/relics.js';
import { inkCost } from '../game/src/ink/cost.js';
import { wrathCap, ascensionModifiers } from '../game/src/world/ascension.js';
import { raiseWrath, wrathLevel } from '../game/src/world/wrath.js';
import { replayInput, createReplayPilot } from '../game/src/shots.js';
import { emptyProgress, UNLOCKS } from '../game/src/save.js';

const make = () => { const s = createState(29); startRun(s); s.queue = []; return s; };
{
  const s = make(), drummer = spawnYokai(s, 'drummer', { x: 330, y: 320 });
  const ally = spawnYokai(s, 'kappa', { x: 350, y: 340 });
  drummer.beatCooldown = 0;
  for (let i = 0; i < 55; i++) tacticalVelocity(s, drummer, 1/60, 165, 91, 189, 22);
  assert.ok(ally.haste > 0, 'The completed drum pulse really hastes nearby spirits');
  drummer.beatWindup = 0.5; drummer.stun = 0.5; updateYokai(s, 1/60);
  assert.equal(drummer.beatWindup, null, 'Stunning a drummer cancels its charged attack');
  const moth = spawnYokai(s, 'moth', { x: 240, y: 250 }); moth.diveCooldown = 0;
  const start = { x: moth.x, y: moth.y }; updateYokai(s, 1/60);
  assert.ok(moth.diveMark && moth.x === start.x, 'Moth holds a readable lane before diving');
  for (let i = 0; i < 44; i++) updateYokai(s, 1/60);
  assert.ok(moth.dive && moth.x > start.x, 'The telegraph becomes a real fast dive');
  moth.stun = 1; updateYokai(s, 1/60); assert.equal(moth.dive, null);
}
{
  const s = make();
  assert.ok(!availableRoads(s).some(r => r.id === 'shrine'));
  for (const scroll of [2, 4, 6]) {
    s.scroll = scroll; s.mode = 'draft'; draftArts(s);
    const hp = s.bell.hp, before = s.relics.length;
    chooseRoad(s, 'shrine'); chooseRoad(s, 'quiet'); chooseRoad(s, 'shrine');
    assert.equal(s.relics.length, before, 'Changing a node preview cannot farm a relic');
    assert.ok(chooseArt(s, 0) && nextScroll(s));
    assert.equal(s.relics.length, before + 1); assert.equal(s.bell.hp, hp);
  }
  assert.deepEqual(s.relics, RELICS.map(r => r.id));
  const bare = make();
  assert.ok(inkCost(s) < inkCost(bare), 'Reed Quill changes real stroke cost');
  s.combo = 3; assert.equal(relicScoreBonus(s), 1.15);
  s.combo = 2; assert.equal(relicScoreBonus(s), 1);
  const input = replayInput(); input.pressed.add('Space'); updateWorld(s, input, 1/60);
  assert.ok(s.bell.wardTime > 1.1, 'Dew Bead grants a real ward after dash');
}
{
  const locked = createState(1, 0, 'monk', emptyProgress(), 'ascension');
  assert.equal(locked.expedition, 'pilgrimage', 'Ascension cannot start before victory');
  const progress = { ...emptyProgress(), runs: 1, wins: 1, unlocks: UNLOCKS.map(u => u.id) };
  const s = createState(1, 0, 'monk', progress, 'ascension'), input = replayInput();
  const pilot = createReplayPilot({ branching: true, relics: true }); startRun(s);
  for (let i = 0; i < 100000 && s.circuits < 2 && !s.ended; i++) { pilot(s, input); updateWorld(s, input, 1/60); }
  assert.equal(s.circuits, 2, 'Real combat clears two endless circuits, including both final bosses');
  assert.equal(s.ended, false); assert.equal(s.mode, 'draft'); assert.equal(s.ascension, 2);
  const held = [...s.arts], relics = [...s.relics], score = s.score;
  chooseRoad(s, 'quiet'); chooseArt(s, 0); assert.ok(nextScroll(s));
  assert.equal(s.scroll, 1); assert.equal(s.ascension, 3);
  assert.ok(held.every(id => s.arts.includes(id))); assert.deepEqual(s.relics, relics);
  assert.equal(s.score, score); assert.equal(s.scrollScores.reduce((a,b) => a+b, 0), score);
  assert.equal(wrathCap(s), 8); assert.ok(ascensionModifiers(s).erosion > 1.4);
  for (let i = 0; i < 12; i++) raiseWrath(s, 4);
  assert.equal(wrathLevel(s), 8, 'Ascension exposes real WRATH tiers above five');
  s.arts = BRUSH_ARTS.map(a => a.id); s.artLevels = Object.fromEntries(s.arts.map(id => [id, 3]));
  s.mode = 'draft'; draftArts(s); chooseRoad(s, 'quiet');
  assert.equal(s.draft[0].id, 'rest'); assert.ok(chooseArt(s, 0) && nextScroll(s), 'Fully mastered builds can keep playing');
}
console.log('Depth OK: interruptible drummer pulse/moth dive, three nonfarmable shrine passives, victory gate, two live ascension circuits, rising WRATH/modifiers and exhausted-draft continuation');
