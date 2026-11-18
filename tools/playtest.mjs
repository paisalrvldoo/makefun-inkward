// Headless autopilot: plays N whole seeded runs through the game's own
// simulation modules (the same imports scripts/check-core.mjs uses) and
// prints per-run scroll reached, win/loss, score, seals and combo peak.
// Usage:  node tools/playtest.mjs [runs] [seedBase]
import { STEP, FIELD, distance, clamp } from '../game/src/config.js';
import { createState, startRun } from '../game/src/world/state.js';
import { updateWorld, nextScroll } from '../game/src/world/update.js';
import { chooseArt } from '../game/src/arts/brushArts.js';
import { chooseRoad } from '../game/src/world/path.js';
import { replayInput } from '../game/src/shots.js';
import { formatSeed } from '../game/src/rng.js';

const runs = Math.max(1, parseInt(process.argv[2] ?? '4', 10) || 4);
const seedBase = (parseInt(process.argv[3] ?? '1', 10) || 1) >>> 0;

// A simple heuristic pilot: paint loops around clustered yokai and dash
// away from nearby threats. It does not call the screenshot replay pilot;
// it builds its own ordinary input object so the run is fully played.
function botPilot(state, input) {
  input.clearFrame();
  if (state.mode === 'draft') {
    // Prefer Swarm early for art levels, Quiet when the bell is hurt,
    // Shrine whenever it is offered.
    const road = [2, 4, 6].includes(state.scroll)
      ? 'shrine'
      : state.bell.hp <= 3 ? 'quiet'
      : state.scroll <= 4 ? 'swarm' : 'quiet';
    chooseRoad(state, road);
    // Pick the first offered art (deterministic across reruns).
    chooseArt(state, 0);
    nextScroll(state);
    return;
  }
  const threats = state.enemies.filter(e => !e.dead);
  threats.sort((a, b) => distance(a, state.bell) - distance(b, state.bell));
  // Circle the shrine defensively.
  const cx = state.bell.x + Math.cos(state.time * 0.27) * 150;
  const cy = state.bell.y + Math.sin(state.time * 0.27) * 125;
  if (cx > state.monk.x + 8) input.keys.add('KeyD');
  else if (cx < state.monk.x - 8) input.keys.add('KeyA');
  if (cy > state.monk.y + 8) input.keys.add('KeyS');
  else if (cy < state.monk.y - 8) input.keys.add('KeyW');
  // Dash away from the nearest threat.
  if (state.monk.dashCooldown <= 0 && threats.length) {
    const near = threats[0];
    if (distance(near, state.monk) < 95) {
      const away = { x: state.monk.x - near.x, y: state.monk.y - near.y };
      const len = Math.hypot(away.x, away.y) || 1;
      const tx = state.monk.x + (away.x / len) * 60;
      const ty = state.monk.y + (away.y / len) * 60;
      input.pointer = { x: tx, y: ty };
      input.pressed.add('Space');
    }
  }
  // Paint a loop around a clustered group when ink allows.
  if (!input.painting && state.ink > 38 && threats.length) {
    const target = threats.find(e => e.kind === 'oni') || threats[0];
    const cluster = threats.filter(e => distance(e, target) < 80);
    const centre = cluster.reduce((s, e) => ({ x: s.x + e.x / cluster.length, y: s.y + e.y / cluster.length }), { x: 0, y: 0 });
    const radius = clamp(48 + cluster.length * 6, 48, 80);
    input._loop = {
      x: clamp(centre.x, FIELD.x + radius + 12, FIELD.x + FIELD.w - radius - 12),
      y: clamp(centre.y, FIELD.y + radius + 12, FIELD.y + FIELD.h - radius - 12),
      radius, step: 0, duration: 14,
    };
  }
  if (input._loop) {
    const a = input._loop.step / input._loop.duration * Math.PI * 2;
    const point = { x: input._loop.x + Math.cos(a) * input._loop.radius, y: input._loop.y + Math.sin(a) * input._loop.radius };
    input.pointer = point; input.painting = true;
    input.paintEvents.push({ type: input._loop.step === 0 ? 'begin' : 'move', point });
    input._loop.step++;
    if (input._loop.step > input._loop.duration) {
      input.paintEvents.push({ type: 'end', point }); input.painting = false; input._loop = null;
    }
  }
  // Ritual use under pressure.
  if ((threats.length >= 6 || threats.some(e => e.kind === 'oni')) && state.qCooldown <= 0) input.pressed.add('KeyQ');
  if (threats.some(e => distance(e, state.bell) < 110) && state.eCooldown <= 0) input.pressed.add('KeyE');
}

function playRun(seed, difficulty = 'monk') {
  const state = createState(seed, 0, difficulty, { unlocks: ['master', 'ascension'], bestRun: null, runs: 0, wins: 0, selectedSkin: null });
  startRun(state);
  const input = replayInput();
  input._loop = null;
  const limit = 1000 / STEP; // 1000s safety cap
  for (let f = 0; f < limit; f++) {
    if (state.mode === 'win' || state.mode === 'lose') break;
    botPilot(state, input);
    updateWorld(state, input, STEP);
  }
  return {
    seed: formatSeed(state.seed),
    scroll: state.scroll,
    result: state.mode === 'win' ? 'WIN' : (state.mode === 'lose' ? 'LOSS' : 'TIMEOUT'),
    score: state.score,
    seals: state.sealed,
    comboPeak: state.peakCombo,
    bellHp: state.bell.hp,
  };
}

console.log(`INKWARD playtest — ${runs} run${runs === 1 ? '' : 's'} from seed ${formatSeed(seedBase)}`);
console.log('-'.repeat(64));
let wins = 0, totalScore = 0, totalScroll = 0;
for (let i = 0; i < runs; i++) {
  const r = playRun((seedBase + i) >>> 0);
  totalScore += r.score; totalScroll += r.scroll;
  if (r.result === 'WIN') wins++;
  console.log(
    `seed ${r.seed} · ${r.result.padEnd(7)} · scroll ${r.scroll}/8 · score ${String(r.score).padStart(6)} · seals ${String(r.seals).padStart(3)} · combo ×${r.comboPeak.toFixed(1)} · bell ${r.bellHp}`
  );
}
console.log('-'.repeat(64));
console.log(`WIN RATE ${(wins / runs * 100).toFixed(0)}% · avg scroll ${(totalScroll / runs).toFixed(1)} · avg score ${Math.round(totalScore / runs)}`);
