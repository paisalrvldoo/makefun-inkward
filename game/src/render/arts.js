import { COLORS } from '../config.js';
import { circle, line } from './primitives.js';
import { artLevel } from '../arts/levels.js';

export function drawArtIcon(ctx, id, x, y, size = 23, palette = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 24, size / 24);
  const fill = palette.fill || '#f3e5c4', outline = palette.outline || COLORS.gold;
  const red = palette.mark || COLORS.red, green = palette.mark || COLORS.green;
  const ink = palette.mark || COLORS.ink, blue = palette.mark || COLORS.blue, gold = palette.mark || COLORS.gold;
  circle(ctx, 0, 0, 12, fill, outline, 1);
  if (id === 'vermilion') line(ctx, [[-6, 7], [6, -7], [2, -6]], red, 3);
  else if (id === 'breath' || id === 'echo') { for (let i = -1; i <= 1; i++) line(ctx, [[-7, i * 4], [0, i * 4 - 2], [7, i * 4]], green, 1.5); }
  else if (id === 'twin') { line(ctx, [[-6, 7], [0, -6]], ink, 2); line(ctx, [[0, 7], [6, -6]], ink, 2); }
  else if (id === 'thunder') line(ctx, [[3, -8], [-4, 1], [3, 0], [-2, 8]], red, 2.5);
  else if (id === 'willow' || id === 'feather') { line(ctx, [[-6, 7], [5, -7]], green, 1.8); for (let i = 0; i < 3; i++) line(ctx, [[-3 + i * 3, 4 - i * 4], [-6 + i * 3, -2 - i * 2]], green, 1.5); }
  else if (id === 'gold') { ctx.fillStyle = gold; ctx.beginPath(); ctx.ellipse(0, 0, 5, 8, 0.5, 0, Math.PI * 2); ctx.fill(); }
  else if (id === 'well') { circle(ctx, 0, 0, 7, null, blue, 2); circle(ctx, 0, 0, 3, null, blue, 1.5); }
  else if (id === 'stone') line(ctx, [[-7, 5], [-5, -4], [2, -6], [7, 3], [-7, 5]], ink, 2);
  else if (id === 'lotus') { for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.ellipse(i * 4, 0, 3, 6, i * 0.5, 0, Math.PI * 2); ctx.strokeStyle = blue; ctx.lineWidth = 1.5; ctx.stroke(); } }
  else if (id === 'moonInk') {
    ctx.fillStyle = blue; ctx.beginPath(); ctx.arc(0, -1, 7, 0, Math.PI * 2); ctx.fill();
    circle(ctx, 3, -3, 6, fill);
    line(ctx, [[-6, 8], [0, 6], [6, 8]], blue, 1.5);
  }
  else if (id === 'afterglow') {
    circle(ctx, 0, -1, 5, null, gold, 1.8);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; line(ctx, [[Math.cos(a) * 7, Math.sin(a) * 7 - 1], [Math.cos(a) * 9, Math.sin(a) * 9 - 1]], gold, 1); }
    line(ctx, [[-6, 8], [6, 8]], red, 2);
  }
  else line(ctx, [[-7, 4], [-7, -5], [7, -5], [7, 4], [-7, 4], [0, 7]], red, 1.8);
  ctx.restore();
}
export function drawLevelPips(ctx, state, id, x, y, next = false) {
  const level = artLevel(state, id);
  const projected = next === true ? level + 1 : typeof next === 'number' ? next : level;
  for (let i = 0; i < 3; i++) circle(ctx, x + i * 10, y, 3, i < level ? COLORS.red : i < projected ? COLORS.gold : '#d9ceb5');
}
