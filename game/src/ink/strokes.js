import { BELL, INK, distance, inField } from '../config.js';
import { segmentIntersection } from './geometry.js';
import { sealLoop } from './seal.js';
import { floatText } from '../render/fx.js';
import { artLevel } from '../arts/levels.js';
import { inkCost, closingSnap } from './cost.js';
import { INPUT_GRACE, controlFeedback } from '../controls/buffer.js';
import { castArt } from '../fx/skillCasts.js';

export function beginStroke(state, point) {
  if (state.waitRelease) return;
  if (!inField(point) || state.ink < 2) {
    state.strokeStart = { life: INPUT_GRACE };
    if (state.ink < 2) controlFeedback(state, 'ink', 'NOT ENOUGH INK · RELEASE');
    return;
  }
  state.strokeStart = null; state.strokeGrace = 0;
  const stroke = { id: state.nextId++, points: [{ ...point }], length: 0, integrity: 1, life: INK.lifetime, closed: false };
  state.strokes.push(stroke); state.activeStroke = stroke;
  if (artLevel(state, 'feather')) castArt(state, 'feather', point, { radius: 38, interval: 1.5 });
  if (artLevel(state, 'moonInk') && state.bell.wardTime > 0) castArt(state, 'moonInk', point, { interval: 2 });
}
export function endStroke(state) {
  const stroke = state.activeStroke;
  if (stroke && stroke.points.length < 2) state.strokes = state.strokes.filter(s => s !== stroke);
  if (stroke && !stroke.closed && state.arts.includes('twin') && stroke.points.length > 1) {
    castArt(state, 'twin', { x: BELL.x * 2 - stroke.points.at(-1).x, y: stroke.points.at(-1).y });
    state.strokes.push({ ...stroke, id: state.nextId++, points: stroke.points.map(p => ({ x: BELL.x * 2 - p.x, y: p.y })), integrity: 0.5 + artLevel(state, 'twin') * 0.15 });
    if (artLevel(state, 'twin') >= 3) state.strokes.push({ ...stroke, id: state.nextId++, points: stroke.points.map(p => ({ x: p.x, y: BELL.y * 2 - p.y })), integrity: 0.8 });
  }
  state.activeStroke = null;
}
export function paintPoint(state, point) {
  const stroke = state.activeStroke;
  if (!stroke || state.waitRelease) return;
  if (!inField(point)) { if (!state.strokeGrace) state.strokeGrace = INPUT_GRACE; return; }
  state.strokeGrace = 0;
  point = closingSnap(stroke, point) || point;
  const previous = stroke.points[stroke.points.length - 1];
  let length = distance(previous, point);
  if (length < 3) return;
  const cost = inkCost(state);
  const available = state.ink / cost;
  const end = length > available ? { x: previous.x + (point.x - previous.x) * available / length, y: previous.y + (point.y - previous.y) * available / length } : { ...point };
  length = Math.min(length, available);
  state.ink = Math.max(0, state.ink - length * cost);
  stroke.length += length; stroke.life = INK.lifetime;
  // Interpolate long mouse movements: collision, ink use and closure stay consistent at every frame rate.
  const samples = Math.max(1, Math.ceil(length / 9));
  let closedPoints = null;
  for (let sample = 1; sample <= samples; sample++) {
    const p = { x: previous.x + (end.x - previous.x) * sample / samples, y: previous.y + (end.y - previous.y) * sample / samples };
    const last = stroke.points[stroke.points.length - 1];
    if (stroke.length > INK.minLength && stroke.points.length > 12) {
      if (distance(p, stroke.points[0]) < INK.closeRadius) closedPoints = [...stroke.points, { ...stroke.points[0] }];
      else {
        for (let i = 1; i < stroke.points.length - 9; i++) {
          const hit = segmentIntersection(last, p, stroke.points[i - 1], stroke.points[i]);
          if (hit) { closedPoints = [hit, ...stroke.points.slice(i), hit]; break; }
        }
      }
    }
    stroke.points.push(p);
    if (closedPoints && sealLoop(state, closedPoints)) {
      stroke.closed = true; stroke.life = 0;
      state.activeStroke = null; state.waitRelease = true;
      break;
    }
    if (stroke.points.length >= 650) { endStroke(state); state.waitRelease = true; break; }
  }
  state.soundEvents.push({ name: 'stroke', value: stroke.points.length });
  if (state.ink <= 0.1) {
    endStroke(state); state.waitRelease = true;
    floatText(state, end.x, end.y - 20, 'INK EMPTY · RELEASE TO REFILL', '#bb4436', 17);
    controlFeedback(state, 'ink', 'NOT ENOUGH INK · RELEASE');
  }
}
export function updateStrokes(state, input, dt) {
  if (state.strokeStart) {
    state.strokeStart.life -= dt;
    if (!input.painting || state.strokeStart.life < -1e-6) state.strokeStart = null;
    else if (inField(input.pointer) && state.ink >= 2) beginStroke(state, input.pointer);
  }
  if (state.strokeGrace > 0) {
    state.strokeGrace = Math.max(0, state.strokeGrace - dt);
    if (!state.strokeGrace) { endStroke(state); state.waitRelease = true; }
  }
  for (const event of input.paintEvents) {
    if (event.type === 'begin') { state.waitRelease = false; beginStroke(state, event.point); }
    else if (event.type === 'move') {
      if (state.strokeStart && inField(event.point) && state.ink >= 2) beginStroke(state, event.point);
      paintPoint(state, event.point);
    }
    else { paintPoint(state, event.point); endStroke(state); state.waitRelease = false; state.strokeStart = null; state.strokeGrace = 0; }
  }
  for (const stroke of state.strokes) {
    if (stroke !== state.activeStroke) stroke.life -= dt / (1 + artLevel(state, 'stone') * 0.5);
    stroke.flash = Math.max(0, (stroke.flash || 0) - dt);
    stroke.soundCooldown = Math.max(0, (stroke.soundCooldown || 0) - dt);
    if (stroke.erosion) stroke.erosion.life = Math.max(0, stroke.erosion.life - dt);
  }
  state.strokes = state.strokes.filter(stroke => stroke.life > 0 && stroke.integrity > 0).slice(-35);
  if (state.activeStroke && !state.strokes.includes(state.activeStroke)) state.activeStroke = null;
  if (!state.activeStroke) {
    if (state.ink < state.maxInk - 10 && artLevel(state, 'breath')) castArt(state, 'breath', state.monk, { radius: 38, interval: 2.5 });
    state.ink = Math.min(state.maxInk, state.ink + INK.regen * dt * (1 + artLevel(state, 'breath') * 0.3));
  }
}
