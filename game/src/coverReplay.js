// A photo director for the real rules: only mouse paths, movement keys and rituals.
import { FIELD, STEP, distance, clamp } from './config.js';
import { updateWorld } from './world/update.js';
import { wrathLevel } from './world/wrath.js';

const WALLS = [
  [{ x: 368, y: 303 }, { x: 337, y: 360 }, { x: 337, y: 456 }, { x: 372, y: 500 }],
  [{ x: 405, y: 322 }, { x: 446, y: 302 }, { x: 548, y: 302 }, { x: 590, y: 328 }],
  [{ x: 609, y: 321 }, { x: 645, y: 365 }, { x: 645, y: 459 }, { x: 606, y: 505 }],
];
function paintWall(input, points) {
  input.paintEvents.push({ type: 'begin', point: points[0] }, ...points.slice(1).map(point => ({ type: 'move', point })), { type: 'end', point: points.at(-1) });
}
function paintLoop(input, centre, radius) {
  const x = clamp(centre.x, FIELD.x + radius + 9, FIELD.x + FIELD.w - radius - 9);
  const y = clamp(centre.y, FIELD.y + radius + 9, FIELD.y + FIELD.h - radius - 9);
  for (let i = 0; i <= 60; i++) {
    const a = i / 60 * Math.PI * 2, point = { x: x + Math.cos(a) * radius, y: y + Math.sin(a) * radius };
    input.paintEvents.push({ type: i === 0 ? 'begin' : 'move', point }); input.pointer = point;
  }
  input.paintEvents.push({ type: 'end', point: input.pointer });
}
function moveMonk(state, input) {
  const x = 495 + Math.cos(state.scrollTime * 0.36) * 175, y = 436 + Math.sin(state.scrollTime * 0.36) * 128;
  if (x > state.monk.x + 7) input.keys.add('KeyD'); else if (x < state.monk.x - 7) input.keys.add('KeyA');
  if (y > state.monk.y + 7) input.keys.add('KeyS'); else if (y < state.monk.y - 7) input.keys.add('KeyW');
}
export function directPlayCover(state, input, pilot, trace = null) {
  let wallAt = -100, lastLoop = -100, cooling = false, coolAt = 0, bossSealed = false, dashAt = -100;
  for (let frame = 0; frame < 900 / STEP; frame++) {
    if (state.scroll < 6) { pilot(state, input); updateWorld(state, input, STEP); continue; }
    if (state.mode !== 'play' || state.scroll !== 6) break;
    input.clearFrame(); input.keys.clear(); moveMonk(state, input);
    const boss = state.enemies.find(e => e.kind === 'oni');
    const spirits = state.enemies.filter(e => e.kind !== 'oni' && !e.dead);
    if (trace && frame % 120 === 0) trace({ t: state.scrollTime.toFixed(1), hp: state.bell.hp, ink: state.ink.toFixed(0), combo: state.combo, comboTime: state.comboTime.toFixed(1), wrath: state.wrath.toFixed(2), n: spirits.length, walls: state.strokes.length, boss: boss?.hp, warning: boss?.telegraph?.kind, cooling, coolTime: (state.runTime - coolAt).toFixed(1), arts: state.arts });
    // Let two ordinary attackers strike, so the bell's genuine damage is visible.
    if (state.bell.hp > state.bell.maxHp - 2) { updateWorld(state, input, STEP); continue; }
    const missingWall = WALLS.find(path => !state.strokes.some(s => distance(s.points[0], path[0]) < 3 && s.life > 3 && s.integrity > 0.12));
    if (missingWall && state.time - wallAt > 0.3 && state.ink > 40 && state.strokes.length < 4) {
      paintWall(input, missingWall); wallAt = state.time;
    }
    if (!cooling && state.time - lastLoop > 0.75 && state.ink > 40) {
      const target = boss && !bossSealed && boss.sealLock <= 0 ? boss : spirits.sort((a, b) => distance(a, state.bell) - distance(b, state.bell))[0];
      if (target) {
        const nearby = spirits.filter(e => distance(e, target) < 100);
        const centre = target.kind === 'oni' ? target : nearby.length > 1 ? nearby.reduce((p, e) => ({ x: p.x + e.x / nearby.length, y: p.y + e.y / nearby.length }), { x: 0, y: 0 }) : target;
        paintLoop(input, centre, target.kind === 'oni' ? 69 : nearby.length >= 2 ? 92 : 52);
        lastLoop = state.time;
        if (target.kind === 'oni') bossSealed = true;
      }
    }
    if (bossSealed && state.combo >= 7 && boss?.telegraph && !cooling && spirits.length >= 5) {
      cooling = true; coolAt = state.runTime;
    }
    if (cooling) {
      input.keys.clear();
      if (state.monk.x < 770) input.keys.add('KeyD'); else if (state.monk.x > 784) input.keys.add('KeyA');
      if (state.monk.y < 405) input.keys.add('KeyS'); else if (state.monk.y > 419) input.keys.add('KeyW');
      const danger = spirits.filter(e => !e.hunter && distance(e, state.bell) < 105);
      const splashTarget = danger.find(e => !boss || distance(e, boss) > 140);
      if (splashTarget && state.splashCooldown <= 0) input.splashes.push(splashTarget);
      if (danger.length && state.eCooldown <= 0) input.pressed.add('KeyE');
      if (state.runTime - coolAt > 6.8 && boss?.telegraph && state.qCooldown <= 0) input.pressed.add('KeyQ');
      if (state.wrath < 3 && boss?.telegraph && state.monk.dashCooldown <= 0) {
        input.keys.clear(); input.pointer = { x: 900, y: 410 };
        input.pressed.add('Space'); dashAt = state.runTime;
      }
      if (boss?.telegraph && state.wrath >= 2.2 && state.wrath < 3 && state.comboTime > 0.35 && spirits.length >= 17 && state.strokes.length >= 3 && state.runTime - dashAt > 0.04 && state.runTime - dashAt < 0.14) {
        const candidates = spirits.filter(e => distance(e, boss) > 160 && distance(e, state.monk) > 170);
        const group = candidates.map(e => ({ enemy: e, neighbours: candidates.filter(n => distance(n, e) < 116) })).sort((a, b) => b.neighbours.length - a.neighbours.length)[0];
        if (group?.neighbours.length >= 4) paintLoop(input, group.enemy, 132);
      }
    }
    updateWorld(state, input, STEP);
    const live = state.enemies.filter(e => !e.dead), kinds = new Set(live.filter(e => !e.hunter).map(e => e.kind));
    const burst = state.seals.find(s => s.success && s.life > 1.2);
    const scoredGroup = state.floats.some(f => Number(/^SEALED ×(\d+)/.exec(f.text)?.[1]) >= 4);
    if (boss?.telegraph && wrathLevel(state) === 3 && state.combo >= 6 && live.length >= 12 && kinds.size >= 4 && state.strokes.length >= 3 && state.strokes.length <= 5 && burst && scoredGroup && state.monk.dashTime > 0 && state.ghosts.length >= 2) {
      // Leave a genuine 85% brush loop open around the next group to seal.
      const targets = live.filter(e => !e.hunter && e.kind !== 'oni' && e.x > 680 && e.x < 870 && e.y > 340 && e.y < 500);
      if (targets.length < 1 || state.ink < 45 || state.strokes.length > 4) continue;
      const centre = targets.reduce((p, e) => ({ x: p.x + e.x / targets.length, y: p.y + e.y / targets.length }), { x: 0, y: 0 });
      const radius = 110;
      input.clearFrame(); input.keys.clear(); input.painting = true;
      for (let i = 0; i <= 51; i++) {
        const angle = Math.PI / 2 + i / 60 * Math.PI * 2;
        const point = { x: centre.x + Math.cos(angle) * radius, y: centre.y + Math.sin(angle) * radius };
        input.paintEvents.push({ type: i === 0 ? 'begin' : 'move', point }); input.pointer = point;
      }
      while (state.hitStop > 0) updateWorld(state, input, STEP);
      updateWorld(state, input, STEP);
      state.soundEvents.length = 0; return { state, input };
    }
    if (state.bell.hp <= 0) break;
  }
  throw new Error(`Cover director missed its frame: scroll ${state.scroll}, HP ${state.bell.hp}, combo ${state.combo}, WRATH ${state.wrath}, enemies ${state.enemies.length}, walls ${state.strokes.length}, omen ${state.omen.progress}`);
}
