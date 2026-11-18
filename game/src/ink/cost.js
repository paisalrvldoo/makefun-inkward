import { INK, distance } from '../config.js';
import { artLevel } from '../arts/levels.js';
import { nearestOnSegment } from './geometry.js';

export function inkCost(state) {
  return INK.cost * (1 - artLevel(state, 'feather') * 0.18) * (state.bell.wardTime > 0 ? 1 - artLevel(state, 'moonInk') * 0.15 : 1);
}
export function closingSnap(stroke, point) {
  if (!stroke || stroke.length <= INK.minLength || stroke.points.length <= 12) return null;
  const start = stroke.points[0];
  if (distance(start, point) <= INK.closeRadius) return start;
  for (let i = 1; i < stroke.points.length - 9; i++) {
    const nearest = nearestOnSegment(point, stroke.points[i - 1], stroke.points[i]);
    if (nearest.distance <= 10) return { x: nearest.x, y: nearest.y };
  }
  return null;
}
