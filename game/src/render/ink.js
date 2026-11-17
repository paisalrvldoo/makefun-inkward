import { COLORS, FIELD } from '../config.js';
import { circle, text, stamp } from './primitives.js';

function strokePath(ctx, points, width, color) {
  if (points.length < 2) return;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = width; ctx.strokeStyle = color;
  ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
}
export function drawStrokes(ctx, state) {
  for (const seal of state.seals) {
    ctx.globalAlpha = Math.min(1, seal.life) * 0.12;
    ctx.fillStyle = seal.success ? COLORS.red : COLORS.gold;
    ctx.beginPath(); ctx.moveTo(seal.points[0].x, seal.points[0].y);
    for (const p of seal.points) ctx.lineTo(p.x, p.y); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = Math.min(1, seal.life);
    strokePath(ctx, seal.points, 3, seal.success ? COLORS.red : COLORS.gold);
    if (seal.success) {
      const p = seal.points.reduce((sum, point) => ({ x: sum.x + point.x / seal.points.length, y: sum.y + point.y / seal.points.length }), { x: 0, y: 0 });
      stamp(ctx, 'SEAL', p.x, p.y, 42, -0.16);
    }
  }
  ctx.globalAlpha = 1;
  for (const stroke of state.strokes) {
    ctx.globalAlpha = Math.min(1, stroke.life / 2) * (0.42 + stroke.integrity * 0.58);
    strokePath(ctx, stroke.points, 14, '#33383030');
    strokePath(ctx, stroke.points, 10, state.arts.includes('vermilion') ? '#983d34' : COLORS.ink);
    strokePath(ctx, stroke.points, 1, '#f8f1d82b');
    if (stroke.flash > 0) {
      ctx.globalAlpha = Math.min(1, stroke.flash * 4);
      strokePath(ctx, stroke.points, 13, '#bb443655');
      strokePath(ctx, stroke.points, 4, '#fffaf0');
    }
    // Dry-brush fibers and edge speckles follow the actual painted line.
    for (let i = 2; i < stroke.points.length; i += 5) {
      const p = stroke.points[i]; const prev = stroke.points[i - 1];
      const angle = Math.atan2(p.y - prev.y, p.x - prev.x) + Math.PI / 2;
      const offset = 5 + Math.sin(i * 2.3) * 2;
      circle(ctx, p.x + Math.cos(angle) * offset, p.y + Math.sin(angle) * offset, 0.8 + i % 3 * 0.3, COLORS.ink);
    }
    if (stroke === state.activeStroke) {
      const start = stroke.points[0];
      circle(ctx, start.x, start.y, 20, '#bb443610', COLORS.red, 1.5);
      circle(ctx, start.x, start.y, 3, COLORS.red);
      text(ctx, 'CLOSE HERE', start.x, start.y - 29, 10, COLORS.red, 'bold', false, 'center');
    }
  }
  ctx.globalAlpha = 1;
}
export function drawCursor(ctx, input, state) {
  const { x, y } = input.pointer;
  if (x < FIELD.x || x > FIELD.x + FIELD.w || y < FIELD.y || y > FIELD.y + FIELD.h) return;
  circle(ctx, x, y, input.painting ? 7 : 12, null, state.ink < 5 ? COLORS.red : COLORS.ink, 1);
  circle(ctx, x, y, 2, COLORS.ink);
  if (state.activeStroke) {
    const last = state.activeStroke.points[state.activeStroke.points.length - 1];
    ctx.strokeStyle = '#bb443660'; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(x, y); ctx.stroke(); ctx.setLineDash([]);
  }
}
