import { COLORS, FIELD, INK, distance, clamp } from '../config.js';
import { polygonArea } from '../ink/geometry.js';
import { circle, text, stamp, line, panel } from './primitives.js';
import { drawGlow } from './light.js';
import { inkCost, closingSnap } from '../ink/cost.js';

function strokePath(ctx, points, width, color) {
  if (points.length < 2) return;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = width; ctx.strokeStyle = color;
  ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
}
export function drawStrokes(ctx, state) {
  for (const seal of state.seals) {
    ctx.globalAlpha = Math.min(1, seal.life) * 0.15;
    ctx.fillStyle = seal.success ? COLORS.red : COLORS.gold;
    ctx.beginPath(); ctx.moveTo(seal.points[0].x, seal.points[0].y);
    for (const p of seal.points) ctx.lineTo(p.x, p.y); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = Math.min(1, seal.life);
    strokePath(ctx, seal.points, 3, seal.success ? COLORS.red : COLORS.gold);
    if (seal.success) {
      const p = seal.points.reduce((sum, point) => ({ x: sum.x + point.x / seal.points.length, y: sum.y + point.y / seal.points.length }), { x: 0, y: 0 });
      drawGlow(ctx, p.x, p.y, 104 + (1 - Math.min(1, seal.life)) * 65, Math.min(1, seal.life) * 0.72);
      stamp(ctx, 'SEAL', p.x, p.y, 46, -0.16);
    }
  }
  ctx.globalAlpha = 1;
  for (const stroke of state.strokes) {
    ctx.globalAlpha = Math.min(1, stroke.life / 2) * (0.48 + stroke.integrity * 0.52);
    strokePath(ctx, stroke.points, 14, '#282e2580');
    strokePath(ctx, stroke.points, 10, state.arts.includes('vermilion') ? '#882a20' : '#0c111a');
    strokePath(ctx, stroke.points, 1, '#efe6cc2b');
    if (stroke.flash > 0) {
      ctx.globalAlpha = Math.min(1, stroke.flash * 4);
      strokePath(ctx, stroke.points, 13, '#b0333a55');
      strokePath(ctx, stroke.points, 4, '#fff4e6');
    }
    // Dry-brush fibers and edge speckles follow the actual painted line.
    for (let i = 2; i < stroke.points.length; i += 5) {
      const p = stroke.points[i]; const prev = stroke.points[i - 1];
      const angle = Math.atan2(p.y - prev.y, p.x - prev.x) + Math.PI / 2;
      const offset = 5 + Math.sin(i * 2.3) * 2;
      circle(ctx, p.x + Math.cos(angle) * offset, p.y + Math.sin(angle) * offset, 0.8 + i % 3 * 0.3, '#0c111a');
    }
  }
  ctx.globalAlpha = 1;
}

export function loopProgress(stroke) {
  if (!stroke || stroke.length < INK.minLength || polygonArea(stroke.points) < 900) return 0;
  const gap = distance(stroke.points[0], stroke.points.at(-1));
  // Estimate the closed perimeter from the painted length and remaining gap.
  const progress = Math.round(stroke.length / (stroke.length + gap) * 100);
  return progress >= 65 ? Math.min(99, progress) : 0;
}

export function drawInkCallouts(ctx, state) {
  const stroke = state.activeStroke, progress = loopProgress(stroke);
  if (stroke) {
    const start = stroke.points[0];
    circle(ctx, start.x, start.y, INK.closeRadius, '#d43b2f18', COLORS.red, 2);
    circle(ctx, start.x, start.y, 8, COLORS.red, COLORS.white, 3);
  }
  if (progress) {
    const start = stroke.points[0], end = stroke.points.at(-1);
    ctx.setLineDash([4, 7]); line(ctx, [[end.x, end.y], [start.x, start.y]], COLORS.red, 3); ctx.setLineDash([]);
    const x = clamp((start.x + end.x) / 2 - 141, FIELD.x + 10, FIELD.x + FIELD.w - 292);
    const y = clamp(Math.max(start.y, end.y) + 18, FIELD.y + 105, FIELD.y + FIELD.h - 44);
    panel(ctx, x, y, 282, 36, '#171c24f5', COLORS.red);
    text(ctx, `LOOP ${progress}% · CLOSE HERE`, x + 141, y + 25, 18, '#fff5dd', 'bold', false, 'center');
  }
  // Mark one live collision, prioritizing the wall closest to breaking.
  const eroding = state.strokes.filter(s => s !== stroke && s.erosion?.life > 0 && s.integrity > 0)
    .sort((a, b) => a.integrity - b.integrity)[0];
  if (eroding) {
    const hit = eroding.erosion;
    circle(ctx, hit.x, hit.y, 12, '#d43b2f28', COLORS.red, 3);
    const x = clamp(hit.x - 235, FIELD.x + 10, FIELD.x + FIELD.w - 200);
    const y = clamp(hit.y + 28, FIELD.y + 105, FIELD.y + FIELD.h - 40);
    line(ctx, [[hit.x, hit.y + 12], [x + 170, y]], COLORS.red, 2);
    panel(ctx, x, y, 190, 32, '#171c24f5', COLORS.red);
    text(ctx, 'WALL ERODING', x + 95, y + 22, 17, '#ff8067', 'bold', false, 'center');
  }
}
export function drawCursor(ctx, input, state) {
  const { x, y } = input.pointer;
  if (x < FIELD.x || x > FIELD.x + FIELD.w || y < FIELD.y || y > FIELD.y + FIELD.h) return;
  const snap = closingSnap(state.activeStroke, input.pointer), feedback = state.controlFeedback;
  const cost = state.activeStroke ? distance(state.activeStroke.points.at(-1), snap || input.pointer) * inkCost(state) : 2;
  const color = state.ink < cost ? COLORS.red : snap ? '#258f78' : COLORS.ink;
  circle(ctx, x, y, input.painting ? 7 : 12, null, color, 2);
  circle(ctx, x, y, 2, COLORS.ink);
  ctx.beginPath(); ctx.arc(x, y, 17, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * state.ink / state.maxInk);
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke();
  if (snap) { circle(ctx, snap.x, snap.y, 12, '#258f7830', '#258f78', 2); line(ctx, [[x, y], [snap.x, snap.y]], '#258f78', 2); }
  const label = feedback?.life > 0 ? feedback.text : state.ink < cost ? 'NOT ENOUGH INK' : snap ? `SNAP · ${cost.toFixed(1)} INK` : state.activeStroke ? `${cost.toFixed(1)} INK` : `INK ${Math.ceil(state.ink)}`;
  ctx.font = 'bold 10px Arial';
  const width = ctx.measureText(label).width + 16, px = clamp(x + 23, FIELD.x + 8, FIELD.x + FIELD.w - width - 8), py = clamp(y - 29, FIELD.y + 103, FIELD.y + FIELD.h - 30);
  panel(ctx, px, py, width, 24, '#171c24ee', feedback?.life > 0 ? COLORS.red : color);
  text(ctx, label, px + 8, py + 16, 10, feedback?.life > 0 ? '#ffad8d' : '#fff5dd', 'bold');
  if (state.activeStroke) {
    const last = state.activeStroke.points[state.activeStroke.points.length - 1];
    ctx.strokeStyle = '#bb443660'; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(x, y); ctx.stroke(); ctx.setLineDash([]);
  }
}
