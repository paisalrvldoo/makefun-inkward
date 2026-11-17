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
      const preferred = ['breath', 'feather', 'thunder', 'mending', 'gold', 'lotus', 'echo', 'well', 'stone', 'willow', 'twin', 'vermilion'];
      const index = [...state.draft].sort((a, b) => preferred.indexOf(a.id) - preferred.indexOf(b.id))[0];
      chooseArt(state, state.draft.indexOf(index)); nextScroll(state); drawing = null; return;
    }
    const threats = state.enemies.filter(e => !e.dead).sort((a, b) => distance(a, state.bell) - distance(b, state.bell));
    const target = threats.find(e => !e.sealLock);
    if (!drawing && target && state.time - lastLoop > (aggressive ? 1.55 : 4.2) && state.ink > 27) {
      const radius = target.kind === 'oni' ? 76 : 64;
      drawing = {
        x: clamp(target.x, FIELD.x + radius + 12, FIELD.x + FIELD.w - radius - 12),
        y: clamp(target.y, FIELD.y + radius + 12, FIELD.y + FIELD.h - radius - 12),
        radius, step: 0, duration: 47,
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
    if (aggressive && threats.some(e => e.kind === 'oni') && state.qCooldown <= 0) input.pressed.add('KeyQ');
    if (aggressive && threats.some(e => distance(e, state.bell) < 110) && state.eCooldown <= 0) input.pressed.add('KeyE');
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
    if (name === 'play' && state.scroll === 3 && state.enemies.some(e => e.kind === 'oni') && state.enemies.length >= 3 && state.activeStroke) break;
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
