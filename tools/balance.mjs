// Balance table: runs the same autopilot across difficulties and seeds,
// printing a compact table of win rate, average scroll and average score
// per difficulty.
// Usage:  node tools/balance.mjs [seedsPerDifficulty]
import { STEP, FIELD, distance, clamp } from '../game/src/config.js';
import { createState, startRun } from '../game/src/world/state.js';
import { updateWorld, nextScroll } from '../game/src/world/update.js';
import { chooseArt } from '../game/src/arts/brushArts.js';
import { chooseRoad } from '../game/src/world/path.js';
import { replayInput } from '../game/src/shots.js';
import { formatSeed } from '../game/src/rng.js';

const N = Math.max(1, parseInt(process.argv[2] ?? '5', 10) || 5);
const difficulties = ['novice', 'monk', 'master'];

function botPilot(state, input) {
  input.clearFrame();
  if (state.mode === 'draft') {
    const road = [2, 4, 6].includes(state.scroll) ? 'shrine'
      : state.bell.hp <= 3 ? 'quiet'
      : state.scroll <= 4 ? 'swarm' : 'quiet';
    chooseRoad(state, road); chooseArt(state, 0); nextScroll(state); return;
  }
  const threats = state.enemies.filter(e => !e.dead);
  threats.sort((a, b) => distance(a, state.bell) - distance(b, state.bell));
  const cx = state.bell.x + Math.cos(state.time * 0.27) * 150;
  const cy = state.bell.y + Math.sin(state.time * 0.27) * 125;
  if (cx > state.monk.x + 8) input.keys.add('KeyD');
  else if (cx < state.monk.x - 8) input.keys.add('KeyA');
  if (cy > state.monk.y + 8) input.keys.add('KeyS');
  else if (cy < state.monk.y - 8) input.keys.add('KeyW');
  if (state.monk.dashCooldown <= 0 && threats.length) {
    const near = threats[0];
    if (distance(near, state.monk) < 95) {
      const away = { x: state.monk.x - near.x, y: state.monk.y - near.y };
      const len = Math.hypot(away.x, away.y) || 1;
      input.pointer = { x: state.monk.x + (away.x / len) * 60, y: state.monk.y + (away.y / len) * 60 };
      input.pressed.add('Space');
    }
  }
  if (!input.painting && state.ink > 38 && threats.length) {
    const target = threats.find(e => e.kind === 'oni') || threats[0];
    const cluster = threats.filter(e => distance(e, target) < 80);
    const centre = cluster.reduce((s, e) => ({ x: s.x + e.x / cluster.length, y: s.y + e.y / cluster.length }), { x: 0, y: 0 });
    const radius = clamp(48 + cluster.length * 6, 48, 80);
    input._loop = { x: clamp(centre.x, FIELD.x + radius + 12, FIELD.x + FIELD.w - radius - 12), y: clamp(centre.y, FIELD.y + radius + 12, FIELD.y + FIELD.h - radius - 12), radius, step: 0, duration: 14 };
  }
  if (input._loop) {
    const a = input._loop.step / input._loop.duration * Math.PI * 2;
    const p = { x: input._loop.x + Math.cos(a) * input._loop.radius, y: input._loop.y + Math.sin(a) * input._loop.radius };
    input.pointer = p; input.painting = true;
    input.paintEvents.push({ type: input._loop.step === 0 ? 'begin' : 'move', point: p });
    input._loop.step++;
    if (input._loop.step > input._loop.duration) { input.paintEvents.push({ type: 'end', point: p }); input.painting = false; input._loop = null; }
  }
  if ((threats.length >= 6 || threats.some(e => e.kind === 'oni')) && state.qCooldown <= 0) input.pressed.add('KeyQ');
  if (threats.some(e => distance(e, state.bell) < 110) && state.eCooldown <= 0) input.pressed.add('KeyE');
}

function playRun(seed, difficulty) {
  const state = createState(seed, 0, difficulty, { unlocks: [], bestRun: null, runs: 0, wins: 0, selectedSkin: null });
  startRun(state);
  const input = replayInput(); input._loop = null;
  const limit = 1000 / STEP;
  for (let f = 0; f < limit; f++) {
    if (state.mode === 'win' || state.mode === 'lose') break;
    botPilot(state, input); updateWorld(state, input, STEP);
  }
  return { scroll: state.scroll, won: state.mode === 'win', score: state.score, seals: state.sealed };
}

const data = {};
for (const diff of difficulties) {
  let wins = 0, totalScroll = 0, totalScore = 0;
  for (let i = 0; i < N; i++) {
    const seed = ((i * 2654435761 + { novice: 10, monk: 20, master: 30 }[diff]) >>> 0) || 1;
    const r = playRun(seed, diff);
    if (r.won) wins++;
    totalScroll += r.scroll; totalScore += r.score;
  }
  data[diff] = { wins, n: N, avgScroll: totalScroll / N, avgScore: Math.round(totalScore / N) };
}

console.log(`INKWARD balance — ${N} seeds per difficulty`);
console.log('DIFFICULTY   BELL   WIN%   AVG SCROLL   AVG SCORE');
console.log('-'.repeat(54));
const names = { novice: 16, monk: 12, master: 10 };
for (const diff of difficulties) {
  const d = data[diff];
  process.stdout.write(
    diff.toUpperCase().padEnd(12) +
    String(names[diff]).padStart(4) + '    ' +
    String(Math.round(d.wins / d.n * 100)).padStart(3) + '%   ' +
    d.avgScroll.toFixed(1).padStart(8) + '     ' +
    String(d.avgScore).padStart(8) + '\n'
  );
}
console.log('-'.repeat(54));