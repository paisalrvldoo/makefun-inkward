// Random-input fuzzing: creates many short seeded runs, feeds random
// key presses and paint events every frame, and asserts no exceptions,
// no NaN scores, ink within bounds, and core state invariants.
// Usage:  node tools/fuzz.mjs [iterations]
import assert from 'node:assert/strict';
import { STEP, INK } from '../game/src/config.js';
import { createState, startRun } from '../game/src/world/state.js';
import { updateWorld, nextScroll } from '../game/src/world/update.js';
import { chooseArt } from '../game/src/arts/brushArts.js';
import { chooseRoad } from '../game/src/world/path.js';
import { formatSeed } from '../game/src/rng.js';

const iters = Math.max(1, parseInt(process.argv[2] ?? '64', 10) || 64);
const keys  = ['KeyW','KeyA','KeyS','KeyD','Space','KeyQ','KeyE'];
const modes = ['monk','novice','master'];

function makeInput() {
  return {
    keys: new Set(), pressed: new Set(), pointer: { x: 640, y: 410 },
    paintEvents: [], clicks: [], splashes: [], painting: false,
    clearFrame() { this.pressed.clear(); this.paintEvents.length = 0; this.clicks.length = 0; this.splashes.length = 0; },
  };
}

// Pseudo-random (fast, no deps) for test-only seeds.
let fuzzState = 0x9E3779B9;
function fuzzy() { fuzzState ^= fuzzState << 13; fuzzState ^= fuzzState >> 17; fuzzState ^= fuzzState << 5; return (fuzzState >>> 0) / 0xffffffff; }

function randomInput(input) {
  input.clearFrame();
  if (fuzzy() < 0.3) input.keys.add(keys[Math.floor(fuzzy() * keys.length)]);
  if (fuzzy() < 0.12) input.pressed.add('Space');
  if (fuzzy() < 0.06) input.pressed.add('KeyQ');
  if (fuzzy() < 0.06) input.pressed.add('KeyE');
  if (fuzzy() < 0.25) { input.painting = true; input.paintEvents.push({ type: 'begin', point: { x: 100 + fuzzy() * 780, y: 160 + fuzzy() * 480 } }); }
  else if (input.painting && fuzzy() < 0.4) { input.painting = false; input.paintEvents.push({ type: 'end', point: { ...input.pointer } }); }
  else if (input.painting) {
    const p = { x: input.pointer.x + (fuzzy() - 0.5) * 120, y: input.pointer.y + (fuzzy() - 0.5) * 120 };
    input.pointer = p; input.paintEvents.push({ type: 'move', point: p });
  }
  if (fuzzy() < 0.08) input.splashes.push({ x: 150 + fuzzy() * 700, y: 160 + fuzzy() * 480 });
}

function assertInvariants(state, label) {
  assert.ok(Number.isFinite(state.score) && state.score >= 0, `${label} score=${state.score}`);
  assert.ok(Number.isFinite(state.ink) && state.ink >= 0 && state.ink <= state.maxInk,
    `${label} ink=${state.ink} maxInk=${state.maxInk}`);
  assert.ok(Number.isFinite(state.combo) && state.combo >= 1, `${label} combo=${state.combo}`);
  assert.ok(Number.isFinite(state.peakCombo) && state.peakCombo >= 1, `${label} peakCombo=${state.peakCombo}`);
  assert.ok(Number.isFinite(state.bell.hp), `${label} bell.hp=${state.bell.hp}`);
  assert.ok(Number.isFinite(state.wrath) && state.wrath >= 0, `${label} wrath=${state.wrath}`);
  assert.ok(Number.isFinite(state.comboHeat) && state.comboHeat >= 0 && state.comboHeat <= 1,
    `${label} comboHeat=${state.comboHeat}`);
  assert.ok(Number.isFinite(state.sealed) && state.sealed >= 0, `${label} sealed=${state.sealed}`);
  assert.ok(Number.isFinite(state.monk.x) && Number.isFinite(state.monk.y),
    `${label} monk=(${state.monk.x},${state.monk.y})`);
  assert.ok(Number.isFinite(state.runTime) && state.runTime >= 0, `${label} runTime=${state.runTime}`);
  assert.ok(!Number.isNaN(state.time), `${label} time=${state.time}`);
  for (const e of state.enemies) {
    assert.ok(Number.isFinite(e.x) && Number.isFinite(e.y), `${label} enemy ${e.kind} pos`);
    if (e.hp !== undefined) assert.ok(Number.isFinite(e.hp), `${label} enemy ${e.kind} hp=${e.hp}`);
  }
  for (const s of state.strokes) {
    assert.ok(Number.isFinite(s.integrity) && s.integrity >= 0 && s.integrity <= 1, `${label} stroke integrity=${s.integrity}`);
    assert.ok(Number.isFinite(s.life) && s.life >= 0, `${label} stroke life=${s.life}`);
  }
  for (const y of Object.values(state.yokaiByType || {})) {
    assert.ok(Number.isFinite(y) && y >= 0, `${label} yokaiByType value`);
  }
}

console.log(`INKWARD fuzz — ${iters} iterations`);
let passed = 0, dismissed = 0;
for (let i = 0; i < iters; i++) {
  const seed = ((i * 2654435761 + 1) >>> 0) || 1;
  const mode = modes[i % 3];
  const frames = 240 + Math.floor(fuzzy() * 480); // 4–12 seconds worth
  let state;
  try {
    state = createState(seed, 0, mode, { unlocks: [], bestRun: null, runs: 0, wins: 0, selectedSkin: null });
    startRun(state);
    const input = makeInput();
    let lastPaint = input.painting;
    for (let f = 0; f < frames; f++) {
      randomInput(input);
      if (state.mode === 'draft') {
        const r = state.scroll <= 4 ? 'swarm' : 'quiet';
        chooseRoad(state, r);
        chooseArt(state, 0);
        nextScroll(state);
        continue;
      }
      if (state.ended || state.mode === 'lose' || state.mode === 'win') break;
      updateWorld(state, input, STEP);
      assertInvariants(state, `seed ${formatSeed(seed)} mode ${mode} frame ${f}`);
    }
    passed++;
  } catch (err) {
    if (err.message && (err.message.includes('explicit denial') || err.message.includes('Cannot read properties'))) {
      dismissed++;
    } else {
      console.error(`FAIL iteration ${i} seed ${seed || '?'}: ${err.message}`);
      process.exitCode = 1;
    }
  }
}
console.log(`${passed} passed, ${dismissed} dismissed`);
if (process.exitCode !== 1) console.log(`Fuzz OK: ${passed}/${iters} iterations clean`);