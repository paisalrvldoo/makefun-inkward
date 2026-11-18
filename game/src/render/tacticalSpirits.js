import { circle, line, text } from './primitives.js';

export function drawDrummer(ctx, color, time) {
  circle(ctx, 0, -9, 14, '#f1d9a6', '#202d36', 2);
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-18, 18); ctx.lineTo(-13, -5); ctx.lineTo(13, -5); ctx.lineTo(18, 18); ctx.closePath(); ctx.fill();
  circle(ctx, 0, 8, 15, '#6c3d2d', '#ffe0a0', 3);
  circle(ctx, 0, 8, 10, color, '#202d36', 1);
  for (const side of [-1, 1]) {
    circle(ctx, side * 5, -11, 2, '#202d36');
    const lift = Math.sin(time * 6 + side) * 5;
    line(ctx, [[side * 13, 0], [side * 24, -9 + lift]], '#f1d9a6', 4);
    circle(ctx, side * 25, -10 + lift, 3, '#ffd27d');
  }
  line(ctx, [[-13, -21], [0, -28], [13, -21]], color, 5);
}
export function drawMoth(ctx, color, time) {
  const flap = Math.sin(time * 9) * 5;
  for (const side of [-1, 1]) {
    ctx.fillStyle = color; ctx.strokeStyle = '#20303e'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(side * 30, -21 - flap); ctx.lineTo(side * 20, 10); ctx.lineTo(side * 8, 17); ctx.closePath(); ctx.fill(); ctx.stroke();
    circle(ctx, side * 16, -3, 5, '#ffd691', '#20303e', 1.5);
    line(ctx, [[side * 4, -12], [side * 9, -24]], '#20303e', 2);
  }
  line(ctx, [[0, -17], [0, 18]], '#f4edce', 6);
  circle(ctx, 0, -12, 5, '#20303e');
}
export function drawTacticalTelegraphs(ctx, state) {
  for (const enemy of state.enemies) {
    if (enemy.dead) continue;
    if (enemy.haste > 0) { circle(ctx, enemy.x, enemy.y + 14, enemy.radius + 5, null, '#ffb34b', 2); text(ctx, '↑', enemy.x, enemy.y - 30, 17, '#b96124', 'bold', false, 'center'); }
    if (enemy.beatWindup > 0) {
      const progress = 1 - enemy.beatWindup / 0.85;
      circle(ctx, enemy.x, enemy.y, 155, '#f2b74c18', '#c77730', 1.5);
      circle(ctx, enemy.x, enemy.y, 155 * progress, '#f2b74c30', '#c77730', 2);
      text(ctx, 'HASTE PULSE · STUN', enemy.x, enemy.y - 39, 11, '#8f4025', 'bold', false, 'center');
    }
    if (enemy.diveMark) {
      const mark = enemy.diveMark, progress = 1 - mark.time / mark.total;
      ctx.save(); ctx.globalAlpha = 0.25 + progress * 0.5;
      line(ctx, [[enemy.x, enemy.y], [mark.x, mark.y]], '#d7443a', 20);
      line(ctx, [[enemy.x, enemy.y], [mark.x, mark.y]], '#ffdb83', 2);
      ctx.restore(); text(ctx, 'DIVE', enemy.x, enemy.y - 34, 11, '#a9322b', 'bold', false, 'center');
    }
  }
}
