import { COLORS } from '../config.js';
import { circle, line } from './primitives.js';
import { artLevel } from '../arts/levels.js';

export function drawArtIcon(ctx, id, x, y, size = 23) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 24, size / 24);
  circle(ctx, 0, 0, 12, '#f3e5c4', COLORS.gold, 1);
  if (id === 'vermilion') line(ctx, [[-6, 7], [6, -7], [2, -6]], COLORS.red, 3);
  else if (id === 'breath' || id === 'echo') { for (let i = -1; i <= 1; i++) line(ctx, [[-7, i * 4], [0, i * 4 - 2], [7, i * 4]], COLORS.green, 1.5); }
  else if (id === 'twin') { line(ctx, [[-6, 7], [0, -6]], COLORS.ink, 2); line(ctx, [[0, 7], [6, -6]], COLORS.ink, 2); }
  else if (id === 'thunder') line(ctx, [[3, -8], [-4, 1], [3, 0], [-2, 8]], COLORS.red, 2.5);
  else if (id === 'willow' || id === 'feather') { line(ctx, [[-6, 7], [5, -7]], COLORS.green, 1.8); for (let i = 0; i < 3; i++) line(ctx, [[-3 + i * 3, 4 - i * 4], [-6 + i * 3, -2 - i * 2]], COLORS.green, 1.5); }
  else if (id === 'gold') { ctx.fillStyle = COLORS.gold; ctx.beginPath(); ctx.ellipse(0, 0, 5, 8, 0.5, 0, Math.PI * 2); ctx.fill(); }
  else if (id === 'well') { circle(ctx, 0, 0, 7, null, COLORS.blue, 2); circle(ctx, 0, 0, 3, null, COLORS.blue, 1.5); }
  else if (id === 'stone') line(ctx, [[-7, 5], [-5, -4], [2, -6], [7, 3], [-7, 5]], COLORS.ink, 2);
  else if (id === 'lotus') { for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.ellipse(i * 4, 0, 3, 6, i * 0.5, 0, Math.PI * 2); ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 1.5; ctx.stroke(); } }
  else line(ctx, [[-7, 4], [-7, -5], [7, -5], [7, 4], [-7, 4], [0, 7]], COLORS.red, 1.8);
  ctx.restore();
}
export function drawLevelPips(ctx, state, id, x, y, next = false) {
  const level = artLevel(state, id);
  for (let i = 0; i < 3; i++) circle(ctx, x + i * 10, y, 3, i < level ? COLORS.red : next && i === level ? COLORS.gold : '#d9ceb5');
}
