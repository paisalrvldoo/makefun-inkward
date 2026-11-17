// Screenshot replays send mouse paths and keyboard actions through the real fixed-step game.
// They never create a pretend score, spawn a staged boss, or select an end screen directly.
import { STEP, FIELD, distance, clamp } from './config.js';
import { createState, startRun } from './world/state.js';
import { updateWorld, nextScroll } from './world/update.js';
import { chooseArt } from './arts/brushArts.js';

export function replayInput() {
  return {
    keys: new Set(), pressed: new Set(), pointer: { x: 640, y: 410 }, paintEvents: [], clicks: [], splashes: [], painting: false,
    clearFrame() { this.pressed.clear(); this.paintEvents.length = 0; this.clicks.length = 0; this.splashes.length = 0; },
  };
}
export function createReplayPilot() {
  let drawing = null, lastLoop = -3, lastWall = -20;
  return (state, input, aggressive = true) => {
    input.clearFrame();
    if (state.mode === 'draft') {
      const preferred = ['well', 'breath', 'feather', 'thunder', 'lotus', 'mending', 'gold', 'willow', 'echo', 'stone', 'twin', 'vermilion'];
      const value = art => preferred.indexOf(art.id) + (state.arts.includes(art.id) ? 20 : 0);
      const index = [...state.draft].sort((a, b) => value(a) - value(b))[0];
      chooseArt(state, state.draft.indexOf(index)); nextScroll(state); drawing = null; return;
    }
    const threats = state.enemies.filter(e => !e.dead).sort((a, b) => distance(a, state.bell) - distance(b, state.bell));
    const urgent = threats.find(e => !e.sealLock && distance(e, state.bell) < 125);
    const target = urgent || threats.find(e => e.kind === 'oni' && !e.sealLock) || threats.find(e => !e.sealLock);
    if (!drawing && target && state.time - lastLoop > (aggressive ? 0.65 : 2.4) && state.ink > 27) {
      const neighbours = threats.filter(e => distance(e, target) < 110);
      const radius = target.kind === 'oni' || neighbours.length >= 2 ? 83 : 64;
      const centre = target.kind === 'oni' ? target : neighbours.length >= 2 ? neighbours.reduce((sum, e) => ({ x: sum.x + e.x / neighbours.length, y: sum.y + e.y / neighbours.length }), { x: 0, y: 0 }) : target;
      drawing = {
        x: clamp(centre.x, FIELD.x + radius + 12, FIELD.x + FIELD.w - radius - 12),
        y: clamp(centre.y, FIELD.y + radius + 12, FIELD.y + FIELD.h - radius - 12),
        radius, step: 0, duration: aggressive ? 16 : 47,
      };
      lastLoop = state.time;
    }
    if (drawing) {
      const a = drawing.step / drawing.duration * Math.PI * 2;
      const point = { x: drawing.x + Math.cos(a) * drawing.radius, y: drawing.y + Math.sin(a) * drawing.radius };
      input.pointer = point; input.painting = true;
      input.paintEvents.push({ type: drawing.step === 0 ? 'begin' : 'move', point });
      drawing.step++;
      if (drawing.step > drawing.duration) {
        input.paintEvents.push({ type: 'end', point }); input.painting = false; drawing = null;
      }
    } else if (state.time - lastWall > 12 && state.ink > 65 && threats.length > 1) {
      // Open strokes are also ordinary mouse input, buying time around the shrine.
      const points = [{ x: 373, y: 309 }, { x: 335, y: 362 }, { x: 336, y: 455 }, { x: 375, y: 495 }];
      input.paintEvents.push({ type: 'begin', point: points[0] }, ...points.slice(1).map(point => ({ type: 'move', point })), { type: 'end', point: points.at(-1) });
      lastWall = state.time;
    }
    input.keys.clear();
    // Circle the shrine while drawing, avoiding ink-stealing collisions.
    const x = state.bell.x + Math.cos(state.time * 0.27) * 145, y = state.bell.y + Math.sin(state.time * 0.27) * 125;
    if (x > state.monk.x + 8) input.keys.add('KeyD'); else if (x < state.monk.x - 8) input.keys.add('KeyA');
    if (y > state.monk.y + 8) input.keys.add('KeyS'); else if (y < state.monk.y - 8) input.keys.add('KeyW');
    if (aggressive && (threats.length >= 6 || threats.some(e => e.kind === 'oni')) && state.qCooldown <= 0) input.pressed.add('KeyQ');
    if (aggressive && threats.some(e => distance(e, state.bell) < 110) && state.eCooldown <= 0) input.pressed.add('KeyE');
    if (aggressive && threats.length > 3 && state.splashCooldown <= 0) input.splashes.push({ x: target.x, y: target.y });
  };
}
export function stageShot(name, seed = 1) {
  const state = createState(seed, 0), input = replayInput();
  if (name === 'start' || name === 'title' || !['play', 'end', 'win', 'draft'].includes(name)) {
    state.time = 3.5; return { state, input };
  }
  startRun(state);
  const pilot = createReplayPilot();
  let snapshot = null;
  const limit = name === 'end' ? 280 : 900;
  for (let i = 0; i < limit / STEP; i++) {
    if (name === 'draft' && state.mode === 'draft') break;
    if (name === 'play' && state.scroll === 3 && state.enemies.some(e => e.kind === 'oni') && state.enemies.length >= 3 && state.activeStroke?.points.length >= 32 && state.bannerTime <= 0 && state.bell.hitTime <= 0 && state.comboTime > 3) break;
    if (name === 'end' && state.runTime > 35) { input.clearFrame(); input.keys.clear(); }
    else pilot(state, input, name !== 'play' || state.scroll < 3);
    updateWorld(state, input, STEP);
    if (state.mode === 'play') snapshot = { ...state };
    if (state.mode === 'win' || state.mode === 'lose') break;
  }
  // A requested play shot stays a genuine non-terminal frame even if the pilot loses later.
  if (name === 'play' && state.mode !== 'play' && snapshot) Object.assign(state, snapshot);
  state.soundEvents.length = 0;
  return { state, input };
}
