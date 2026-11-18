import { COLORS } from '../config.js';
import { circle, line, text } from './primitives.js';
import { drawGlow, drawShadow as shadow } from './light.js';

export function drawBell(ctx, bell, time = 0, scale = 1) {
  ctx.save(); ctx.translate(bell.x, bell.y); ctx.scale(scale, scale);
  shadow(ctx, 0, 20, 55);
  drawGlow(ctx, 0, -6, 95 + Math.sin(time * 1.1) * 3, bell.wardTime > 0 ? 0.8 : 0.46);
  if (bell.wardTime > 0) {
    circle(ctx, 0, 0, 60 + Math.sin(time * 5) * 3, '#d7b46713', '#b68a3677', 1.5);
  }
  // A small vermilion shrine protects a warm bronze bell.
  ctx.fillStyle = '#d9ceb0'; ctx.beginPath(); ctx.ellipse(0, 28, 56, 25, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d5c6a5'; ctx.fillRect(-45, 15, 90, 20); ctx.strokeStyle = '#958568'; ctx.lineWidth = 1.4; ctx.strokeRect(-45, 15, 90, 20);
  line(ctx, [[-36, 17], [-36, -48]], COLORS.red, 7); line(ctx, [[36, 17], [36, -48]], COLORS.red, 7);
  line(ctx, [[-53, -46], [0, -55], [53, -46]], COLORS.ink, 6); line(ctx, [[-48, -40], [48, -40]], COLORS.red, 5);
  ctx.save(); ctx.rotate(bell.ring > 0 ? Math.sin(time * 12) * bell.ring * 0.12 : bell.hitTime > 0 ? Math.sin(time * 28) * 0.1 : Math.sin(time * 1.1) * 0.015);
  line(ctx, [[0, -48], [0, -28]], '#a88c52', 3);
  const moon = bell.skin === 'moon';
  ctx.fillStyle = moon ? '#c3dceb' : bell.hp <= 3 ? '#b58955' : '#d7b467'; ctx.strokeStyle = moon ? '#526b88' : '#695737'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-20, 8); ctx.lineTo(-16, -16); ctx.quadraticCurveTo(0, -39, 16, -16); ctx.lineTo(20, 8); ctx.quadraticCurveTo(0, 16, -20, 8); ctx.fill(); ctx.stroke();
  line(ctx, [[-15, 0], [15, 0]], '#af8945', 2); circle(ctx, 0, 15, 4, '#695737');
  if (moon) {
    circle(ctx, 0, -12, 7, '#edf7fc');
    circle(ctx, 3, -14, 6, '#c3dceb');
    circle(ctx, -9, -23, 1.4, '#fff8d9'); circle(ctx, 10, -8, 1.2, '#fff8d9');
  }
  if (bell.hp < (bell.maxHp || 12)) line(ctx, [[7, -21], [3, -10], [9, -4], [4, 5]], '#70543a', 1.6);
  if (bell.hp <= (bell.maxHp || 12) - 2) line(ctx, [[-8, -18], [-5, -10], [-10, -1]], '#70543a', 1.8);
  ctx.restore();
  if (!bell.peaceful) text(ctx, 'GUARD THE BELL', 0, 64, 10, '#8b7954', 'bold', false, 'center');
  ctx.restore();
}
