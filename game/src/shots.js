// Screenshot replays send mouse paths and keyboard actions through the real fixed-step game.
// They never create a pretend score, spawn a staged boss, or select an end screen directly.
import { STEP, FIELD, INK, distance, clamp } from './config.js';
import { createState, startRun } from './world/state.js';
import { updateWorld, nextScroll } from './world/update.js';
import { chooseArt, draftArts } from './arts/brushArts.js';
import { directPlayCover } from './coverReplay.js';
import { wrathLevel } from './world/wrath.js';
import { chooseRoad } from './world/path.js';

export function replayInput() {
  return {
    keys: new Set(), pressed: new Set(), pointer: { x: 640, y: 410 }, paintEvents: [], clicks: [], splashes: [], painting: false,
    clearFrame() { this.pressed.clear(); this.paintEvents.length = 0; this.clicks.length = 0; this.splashes.length = 0; },
  };
}
export function createReplayPilot(options = {}) {
  let drawing = null, lastLoop = -3, lastWall = -20;
  return (state, input, aggressive = true) => {
    input.clearFrame();
    if (state.mode === 'draft') {
      chooseRoad(state, options.branching && state.scroll % 2 && !(options.cover && state.scroll === 5) ? 'swarm' : 'quiet');
      const preferred = ['well', 'breath', 'feather', 'thunder', 'lotus', 'mending', 'gold', 'willow', 'echo', 'stone', 'twin', 'vermilion'];
      const value = art => (options.cover && art.id === 'echo' ? -2 : options.cover && art.id === 'mending' ? -1 : preferred.indexOf(art.id)) + (state.arts.includes(art.id) ? 20 : 0);
      const index = (options.cover && state.scroll === 5 && state.draft.find(a => a.id === 'echo')) || [...state.draft].sort((a, b) => value(a) - value(b))[0];
      chooseArt(state, state.draft.indexOf(index)); nextScroll(state); drawing = null; return;
    }
    const threats = state.enemies.filter(e => !e.dead).sort((a, b) => distance(a, state.bell) - distance(b, state.bell));
    const craneOmen = options.omenScroll === state.scroll && state.omen?.id === 'cranes' && !state.omen.complete;
    const cranes = craneOmen ? threats.filter(e => e.kind === 'crane' && !e.hunter && !e.sealLock) : [];
    const craneCentre = cranes.length >= 3
      ? cranes.slice(0, 3).reduce((sum, e) => ({ x: sum.x + e.x / 3, y: sum.y + e.y / 3 }), { x: 0, y: 0 })
      : null;
    const craneRadius = craneCentre ? Math.max(...cranes.slice(0, 3).map(e => distance(e, craneCentre))) : Infinity;
    const craneGroup = craneCentre && craneRadius < 230 ? { x: craneCentre.x, y: craneCentre.y, kind: 'omen-group' } : null;
    // A broad rectangular loop keeps thin or widely spaced crane groups inside the seal.
    const group = cranes.slice(0, 3);
    const left = clamp(Math.min(...group.map(e => e.x)) - 30, FIELD.x + 12, FIELD.x + FIELD.w - 12);
    const right = clamp(Math.max(...group.map(e => e.x)) + 30, FIELD.x + 12, FIELD.x + FIELD.w - 12);
    const top = clamp(Math.min(...group.map(e => e.y)) - 30, FIELD.y + 12, FIELD.y + FIELD.h - 12);
    const bottom = clamp(Math.max(...group.map(e => e.y)) + 30, FIELD.y + 12, FIELD.y + FIELD.h - 12);
    const craneVertices = craneGroup ? [{ x: left, y: top }, { x: right, y: top }, { x: right, y: bottom }, { x: left, y: bottom }] : null;
    const craneCost = craneVertices ? craneVertices.reduce((sum, p, i) => sum + distance(p, craneVertices[(i + 1) % 4]) * INK.cost, 0) + 6 : Infinity;
    const available = craneOmen && !craneGroup ? threats.filter(e => e.kind !== 'crane') : threats;
    const urgent = available.find(e => !e.hunter && !e.sealLock && distance(e, state.bell) < 125);
    const target = craneGroup || available.find(e => e.kind === 'oni' && !e.sealLock) || urgent || available.find(e => !e.sealLock);
    if (!drawing && target && state.time - lastLoop > (aggressive ? 0.45 : 2.4) && state.ink > 35) {
      const neighbours = threats.filter(e => distance(e, target) < 80);
      const radius = craneGroup ? craneRadius + 26 : target.kind === 'oni' ? 65 : neighbours.length >= 2 ? 75 : 48;
      const centre = craneGroup ? craneCentre : target.kind === 'oni' ? target : neighbours.length >= 2 ? neighbours.reduce((sum, e) => ({ x: sum.x + e.x / neighbours.length, y: sum.y + e.y / neighbours.length }), { x: 0, y: 0 }) : target;
      if (!craneGroup || state.ink >= craneCost) {
        drawing = {
          x: clamp(centre.x, FIELD.x + radius + 12, FIELD.x + FIELD.w - radius - 12),
          y: clamp(centre.y, FIELD.y + radius + 12, FIELD.y + FIELD.h - radius - 12),
          radius, vertices: craneVertices, step: 0, duration: craneGroup ? 24 : aggressive ? 12 : 47,
        };
        lastLoop = state.time;
      }
    }
    if (drawing) {
      const a = drawing.step / drawing.duration * Math.PI * 2;
      let point = { x: drawing.x + Math.cos(a) * drawing.radius, y: drawing.y + Math.sin(a) * drawing.radius };
      if (drawing.vertices) {
        const segment = Math.min(3, Math.floor(drawing.step / 6)), t = (drawing.step - segment * 6) / 6;
        const from = drawing.vertices[segment], to = drawing.vertices[(segment + 1) % 4];
        point = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
      }
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
    if (aggressive && target && threats.length > 3 && state.splashCooldown <= 0) input.splashes.push({ x: target.x, y: target.y });
    if (aggressive && state.monk.dashCooldown <= 0 && threats.some(e => distance(e, state.monk) < 95)) input.pressed.add('Space');
  };
}
export function stageShot(name, seed = 1) {
  const previous = name === 'win' ? replayPreviousAttempt(seed) : null;
  const state = createState(seed, previous?.best || 0, 'monk', previous?.progress), input = replayInput();
  if (name === 'start' || name === 'title' || !['play', 'end', 'win', 'draft', 'winter'].includes(name)) {
    state.time = 3.5; return { state, input };
  }
  if (name === 'draft') {
    // This replay begins with one previously owned art, then earns the other four through real drafts.
    draftArts(state);
    chooseArt(state, 0);
  }
  startRun(state);
  const pilot = createReplayPilot({ cover: name === 'play', omenScroll: name === 'draft' ? 4 : null, branching: ['play', 'draft', 'win'].includes(name) });
  if (name === 'play') {
    state.best = stageShot('win', seed).state.score;
    return directPlayCover(state, input, pilot);
  }
  if (name === 'winter') {
    state.best = stageShot('win', seed).state.score;
    return directWinterFight(state, input, pilot);
  }
  const limit = name === 'end' ? 280 : 900;
  for (let i = 0; i < limit / STEP; i++) {
    if (name === 'draft' && state.mode === 'draft' && state.scroll === 5) break;
    if (name === 'end' && state.runTime > 35) { input.clearFrame(); input.keys.clear(); }
    else pilot(state, input, name !== 'play' || state.scroll < 3);
    updateWorld(state, input, STEP);
    if (state.mode === 'win' || state.mode === 'lose') break;
  }
  if (name === 'draft' && (state.mode !== 'draft' || state.scroll !== 5 || !state.bonusDraft || state.arts.length !== 5 || state.draft.length !== 4)) {
    throw new Error('Draft director missed its frame: scroll ' + state.scroll + ', mode ' + state.mode + ', bonus ' + state.bonusDraft + ', arts ' + state.arts.length + ', choices ' + state.draft.length);
  }
  state.soundEvents.length = 0;
  return { state, input };
}

// The victory comparison is an earned record: play into winter, then let the bell fall.
// It stays in replay memory and never writes to the player's localStorage.
function replayPreviousAttempt(seed) {
  const state = createState(seed), input = replayInput(), pilot = createReplayPilot();
  startRun(state);
  for (let frame = 0; frame < 900 / STEP && !state.ended; frame++) {
    if (state.scroll < 8 || state.scrollTime < 12) pilot(state, input);
    else {
      input.clearFrame(); input.keys.clear();
      if (input.painting) input.paintEvents.push({ type: 'end', point: { ...input.pointer } });
      input.painting = false;
    }
    updateWorld(state, input, STEP);
  }
  if (!state.ended || state.mode !== 'lose') throw new Error('Previous-run replay missed its winter defeat');
  return state;
}

// Run the normal world until the last Oni is surrounded by an unedited live crowd.
// The director only supplies ordinary movement, wards, splashes, and one real loop.
function directWinterFight(state, input, pilot) {
  let holding = false, loop = null;
  for (let frame = 0; frame < 900 / STEP; frame++) {
    if (!holding) {
      pilot(state, input, true);
      const live = state.enemies.filter(e => !e.dead && !e.hunter);
      if (state.scroll === 8 && live.length >= 12 && live.some(e => e.kind === 'oni')) holding = true;
    } else {
      input.clearFrame(); input.keys.clear();
      const live = state.enemies.filter(e => !e.dead && !e.hunter);
      const boss = live.find(e => e.kind === 'oni');
      const danger = live.filter(e => distance(e, state.bell) < 130);
      if (danger.length && state.eCooldown <= 0) input.pressed.add('KeyE');
      if (live.length >= 12 && state.qCooldown <= 0) input.pressed.add('KeyQ');
      if (live.length >= 6 && state.splashCooldown <= 0) {
        const target = [...live].sort((a, b) => distance(a, state.bell) - distance(b, state.bell))[0];
        input.splashes.push(target);
      }
      if (!loop && state.wrath >= 4 && state.wrath <= 4.22 && live.length >= 12 && boss) {
        const solo = live.map(enemy => ({ enemy, nearby: live.filter(other => other !== enemy && distance(enemy, other) < 100).length }))
          .sort((a, b) => a.nearby - b.nearby)[0]?.enemy;
        if (solo) loop = { x: solo.x, y: solo.y, radius: 44, step: 0 };
      }
      if (loop) {
        const i = loop.step++, angle = i / 12 * Math.PI * 2;
        const point = {
          x: clamp(loop.x + Math.cos(angle) * loop.radius, FIELD.x + 54, FIELD.x + FIELD.w - 54),
          y: clamp(loop.y + Math.sin(angle) * loop.radius, FIELD.y + 54, FIELD.y + FIELD.h - 54),
        };
        input.pointer = point; input.painting = true;
        input.paintEvents.push({ type: i === 0 ? 'begin' : 'move', point });
        if (i >= 12) { input.paintEvents.push({ type: 'end', point }); input.painting = false; loop = null; }
      }
    }
    updateWorld(state, input, STEP);
    const live = state.enemies.filter(e => !e.dead && !e.hunter);
    const burst = state.seals.some(seal => seal.success && seal.life > 1.2);
    const scored = state.floats.some(f => f.text.startsWith('SEALED ×'));
    if (state.scroll === 8 && wrathLevel(state) === 4 && live.length >= 12 && live.some(e => e.kind === 'oni') && burst && scored) {
      state.soundEvents.length = 0; return { state, input };
    }
    if (state.mode === 'lose' || state.mode === 'win' || state.bell.hp <= 0) break;
  }
  throw new Error(`Winter director missed its frame: scroll ${state.scroll}, mode ${state.mode}, HP ${state.bell.hp}, WRATH ${state.wrath}, enemies ${state.enemies.length}`);
}
