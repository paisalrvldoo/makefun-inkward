import { COLORS, MONK } from '../config.js';
import { circle, line, text } from './primitives.js';
import { drawGlow, drawShadow } from './light.js';

function shadow(ctx, x, y, radius) {
  drawShadow(ctx, x, y, radius);
}
function eye(ctx, x, y, radius, color, opening, pupil = true) {
  if (opening < 0.18) { line(ctx, [[x - radius, y], [x + radius, y]], COLORS.ink, 1.6); return; }
  ctx.save(); ctx.translate(x, y); ctx.scale(1, opening);
  circle(ctx, 0, 0, radius, color);
  if (pupil) circle(ctx, 0.5, 0, radius * 0.38, COLORS.ink);
  ctx.restore();
}
function eyeOpening(time, phase) {
  const blink = (time + phase * 0.73 + 1.1) % 4.9;
  return blink < 0.18 ? Math.abs(blink - 0.09) / 0.09 : 1;
}
export function drawMonk(ctx, monk, time = 0, scale = 1) {
  ctx.save(); ctx.translate(monk.x, monk.y); ctx.scale(scale, scale);
  if (monk.hurtTime > 0 && Math.floor(time * 20) % 2) ctx.globalAlpha = 0.45;
  shadow(ctx, 0, 0, 22);
  const walk = monk.walk || 0, sway = Math.sin(time * 1.8 + walk) * 2.3;
  if (monk.dashTime > 0) {
    const progress = Math.max(0, Math.min(1, 1 - monk.dashTime / MONK.dashTime));
    const stretch = 1 + Math.sin(progress * Math.PI) * 0.34 - Math.exp(-Math.pow(progress / 0.12, 2)) * 0.1;
    const angle = Math.atan2(monk.vy ?? 0, monk.vx ?? 1);
    ctx.rotate(angle); ctx.scale(stretch, 1 / stretch); ctx.rotate(-angle);
  }
  ctx.rotate(Math.sin(time * 1.8 + walk) * 0.025);
  // Rice-paper robes, vermilion scarf and an oversized sumi brush.
  ctx.fillStyle = '#fffaf0'; ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.moveTo(-10, -6); ctx.quadraticCurveTo(-16 + sway, 5, -18 + sway, 17); ctx.quadraticCurveTo(sway, 23, 17 + sway, 15); ctx.lineTo(11, -5); ctx.closePath(); ctx.fill(); ctx.stroke();
  line(ctx, [[-5, 2], [sway * 0.6, 14], [6, 3]], '#bfb8a4', 1.3);
  line(ctx, [[-13 + sway, 16], [sway, 19], [12 + sway, 15]], '#e5d3ac', 1.2);
  circle(ctx, 0, -13, 12, '#faf0d9', COLORS.ink, 2.5);
  ctx.fillStyle = '#34352f'; ctx.beginPath(); ctx.ellipse(0, -23, 18, 4.5, -0.04, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d6b36c'; ctx.beginPath(); ctx.moveTo(-17, -24); ctx.lineTo(0, -37); ctx.lineTo(18, -24); ctx.closePath(); ctx.fill(); ctx.stroke();
  line(ctx, [[-10, -27], [12, -27]], '#907f58', 1);
  circle(ctx, -4, -13, 1.5, COLORS.ink); circle(ctx, 4, -13, 1.5, COLORS.ink);
  line(ctx, [[-10, -1], [10, -1]], COLORS.red, 5);
  const flutter = Math.sin(time * 5.5 + walk) * 3 + (monk.dashTime > 0 ? 7 : 0);
  line(ctx, [[9, 0], [23, 4 - flutter * 0.3], [29 + sway, -flutter]], COLORS.red, 4);
  ctx.save(); ctx.rotate(Math.sin(time * 2.3 + walk * 0.6) * 0.065 - (monk.dashTime > 0 ? 0.15 : 0));
  line(ctx, [[-20, 13], [17, -17]], '#66523a', 5);
  line(ctx, [[-18, 12], [15, -15]], '#a98753', 2);
  ctx.fillStyle = COLORS.ink; ctx.beginPath(); ctx.moveTo(15, -17); ctx.quadraticCurveTo(23, -36, 33, -33); ctx.quadraticCurveTo(25, -16, 19, -13); ctx.closePath(); ctx.fill();
  line(ctx, [[18, -20], [23, -25]], '#6c716a', 1);
  circle(ctx, -4, 0, 3.5, '#faf0d9', COLORS.ink, 1);
  ctx.restore();
  ctx.restore();
}
function drawKappa(ctx, color, opening) {
  circle(ctx, 0, 3, 16, color, COLORS.ink, 2.5);
  ctx.fillStyle = '#84987b'; ctx.beginPath(); ctx.ellipse(0, -11, 19, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d9d5a6'; ctx.beginPath(); ctx.ellipse(0, -12, 10, 3, 0, 0, Math.PI * 2); ctx.fill();
  eye(ctx, -6, 0, 4, '#fff9e6', opening); eye(ctx, 6, 0, 4, '#fff9e6', opening);
  ctx.fillStyle = '#d8ad50'; ctx.beginPath(); ctx.moveTo(-5, 6); ctx.lineTo(0, 10); ctx.lineTo(6, 6); ctx.closePath(); ctx.fill();
  line(ctx, [[-11, 16], [-17, 21]], COLORS.ink, 3); line(ctx, [[11, 16], [17, 21]], COLORS.ink, 3);
}
function drawLantern(ctx, color, opening) {
  line(ctx, [[0, -23], [0, -17]], COLORS.ink, 2);
  ctx.fillStyle = color; ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(-14, -17, 28, 33, 8); ctx.fill(); ctx.stroke();
  for (let i = -10; i <= 12; i += 7) line(ctx, [[-12, i], [12, i]], '#e4a574', 1);
  eye(ctx, -5, -3, 3, '#fff6d4', opening); eye(ctx, 5, -3, 3, '#fff6d4', opening);
  line(ctx, [[-4, 8], [0, 5], [4, 8]], COLORS.ink, 2);
  line(ctx, [[-8, 17], [-10, 27], [-2, 23], [3, 29], [9, 17]], '#c68a5a', 2);
}
function drawUmbrella(ctx, color, opening) {
  line(ctx, [[0, 2], [0, 22], [7, 24], [10, 19]], COLORS.ink, 3);
  ctx.fillStyle = color; ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(-24, 3); ctx.quadraticCurveTo(-17, -12, 0, -22); ctx.quadraticCurveTo(16, -12, 24, 3); ctx.lineTo(12, 0); ctx.lineTo(0, 5); ctx.lineTo(-12, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  line(ctx, [[0, -21], [-12, 0]], '#c7a4ba', 1); line(ctx, [[0, -21], [12, 0]], '#c7a4ba', 1);
  eye(ctx, 0, -5, 6, '#fff9e6', opening);
  line(ctx, [[-2, 7], [0, 14], [5, 13]], COLORS.red, 3);
}
function drawFox(ctx, color, time, opening) {
  ctx.fillStyle = color; ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-12, 9); ctx.quadraticCurveTo(-26, -2, -18, -24); ctx.quadraticCurveTo(-7, -11, -1, -14); ctx.quadraticCurveTo(4, -33 - Math.sin(time * 5) * 3, 13, -25); ctx.quadraticCurveTo(9, -10, 15, -4); ctx.quadraticCurveTo(24, 8, 10, 17); ctx.quadraticCurveTo(0, 23, -12, 9); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f6e2c0'; ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(-8, 10); ctx.lineTo(0, 15); ctx.lineTo(9, 9); ctx.lineTo(10, -10); ctx.lineTo(0, -3); ctx.closePath(); ctx.fill();
  line(ctx, [[-7, 3 + (1 - opening)], [-3, 3 + opening * 2]], COLORS.ink, 2); line(ctx, [[4, 3 + opening * 2], [8, 3 - opening]], COLORS.ink, 2); circle(ctx, 0, 10, 2, COLORS.ink);
}
function drawEater(ctx, opening) {
  ctx.fillStyle = '#394447'; ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-22, 14); ctx.bezierCurveTo(-30, -10, -18, -24, 0, -22); ctx.bezierCurveTo(23, -25, 31, 0, 21, 15); ctx.quadraticCurveTo(11, 8, 5, 16); ctx.quadraticCurveTo(-4, 8, -12, 17); ctx.closePath(); ctx.fill(); ctx.stroke();
  eye(ctx, -8, -6, 4, '#e3c977', opening); eye(ctx, 8, -6, 4, '#e3c977', opening);
  ctx.fillStyle = '#f8efda'; ctx.beginPath(); ctx.ellipse(0, 6, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
  for (let i = -9; i <= 9; i += 6) line(ctx, [[i, 1], [i + 2, 6]], '#394447', 2);
}
function drawCrane(ctx, time, opening) {
  ctx.fillStyle = '#fff9e6'; ctx.strokeStyle = '#535b55'; ctx.lineWidth = 1.8;
  const flap = Math.sin(time * 8) * 4;
  ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(-28, -12 - flap); ctx.lineTo(-12, 10); ctx.lineTo(1, 14); ctx.lineTo(19, -18 + flap); ctx.lineTo(10, 6); ctx.lineTo(2, 7); ctx.lineTo(6, -17); ctx.lineTo(17, -13); ctx.lineTo(9, -8); ctx.closePath(); ctx.fill(); ctx.stroke();
  line(ctx, [[-25, -10 - flap], [0, 8], [17, -15 + flap]], '#babaa5', 1); eye(ctx, 8, -13, 1.4, COLORS.red, opening, false);
}
function drawOni(ctx, enemy, time) {
  const color = enemy.color;
  ctx.fillStyle = color; ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-27, -17); ctx.lineTo(-24, -42); ctx.lineTo(-9, -27); ctx.quadraticCurveTo(0, -33, 9, -27); ctx.lineTo(25, -42); ctx.lineTo(28, -16); ctx.bezierCurveTo(41, 7, 30, 38, 0, 38); ctx.bezierCurveTo(-32, 37, -42, 3, -27, -17); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f7df99'; ctx.beginPath(); ctx.moveTo(-21, -7); ctx.lineTo(-5, -3); ctx.lineTo(-11, 5); ctx.lineTo(-21, 3); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(21, -7); ctx.lineTo(5, -3); ctx.lineTo(11, 5); ctx.lineTo(21, 3); ctx.closePath(); ctx.fill();
  if (enemy.telegraph) {
    drawGlow(ctx, -12, 0, 15, 0.8, '#ffd078'); drawGlow(ctx, 12, 0, 15, 0.8, '#ffd078');
  }
  circle(ctx, -12, 0, 2.3, COLORS.ink); circle(ctx, 12, 0, 2.3, COLORS.ink);
  ctx.fillStyle = '#262b2a'; ctx.beginPath(); ctx.ellipse(0, 20, 20, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff7df'; ctx.beginPath(); ctx.moveTo(-15, 14); ctx.lineTo(-10, 26); ctx.lineTo(-6, 14); ctx.fill(); ctx.beginPath(); ctx.moveTo(15, 14); ctx.lineTo(10, 26); ctx.lineTo(6, 14); ctx.fill();
  line(ctx, [[-33, 10], [-48, 20], [-42, 36]], COLORS.ink, 8); line(ctx, [[33, 10], [45, 20], [47, 36]], COLORS.ink, 8);
}
export function drawYokai(ctx, enemy, time = 0, scale = 1) {
  ctx.save(); ctx.translate(enemy.x, enemy.y); ctx.scale(scale * (enemy.small ? 0.7 : 1), scale * (enemy.small ? 0.7 : 1));
  shadow(ctx, 0, 0, enemy.kind === 'oni' ? 45 : 20);
  const phase = enemy.phase || 0, opening = eyeOpening(time, phase);
  const airborne = ['lantern', 'umbrella', 'crane'].includes(enemy.kind);
  const bob = enemy.kind === 'oni' ? 0 : Math.sin(time * (airborne ? 3 : 2.8) + phase) * (airborne ? 3.5 : 1.6);
  ctx.translate(0, bob);
  ctx.save();
  if (enemy.kind === 'oni') {
    const breath = Math.sin(time * 1.8 + phase);
    ctx.translate(0, 36); ctx.scale(1 + breath * 0.02, 1 + breath * 0.035); ctx.translate(0, -36);
    if (enemy.telegraph) drawGlow(ctx, 0, 0, 87, 0.55 + Math.sin(time * 6) * 0.08, enemy.color);
  } else ctx.rotate(Math.sin(time * 1.9 + phase) * 0.025);
  if (enemy.kind === 'kappa') drawKappa(ctx, enemy.color, opening);
  else if (enemy.kind === 'lantern') drawLantern(ctx, enemy.color, opening);
  else if (enemy.kind === 'umbrella') drawUmbrella(ctx, enemy.color, opening);
  else if (enemy.kind === 'fox') drawFox(ctx, enemy.color, time, opening);
  else if (enemy.kind === 'eater') drawEater(ctx, opening);
  else if (enemy.kind === 'crane') drawCrane(ctx, time, opening);
  else if (enemy.kind === 'oni') drawOni(ctx, enemy, time);
  ctx.restore();
  if (enemy.kind === 'oni') {
    for (let i = 0; i < enemy.maxHp; i++) circle(ctx, (i - (enemy.maxHp - 1) / 2) * 15, -56, 4.5, i < enemy.hp ? COLORS.red : '#d8ccb2', COLORS.ink, 1);
    if (enemy.sealLock > 0) { ctx.save(); ctx.globalAlpha *= 0.6; circle(ctx, 0, 0, 51 + Math.sin(time * 8) * 2, null, COLORS.gold, 2); ctx.restore(); }
  }
  if (enemy.hitTime > 0) circle(ctx, 0, 0, enemy.radius + 6, null, COLORS.red, 2);
  if (enemy.stun > 0) {
    for (let i = 0; i < 3; i++) {
      const a = time * 2 + i * Math.PI * 2 / 3;
      circle(ctx, Math.cos(a) * 16, -30 + Math.sin(a) * 4, 2.5, COLORS.gold);
    }
  }
  ctx.restore();
}
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
  ctx.save(); ctx.rotate(bell.hitTime > 0 ? Math.sin(time * 28) * 0.1 : Math.sin(time * 1.1) * 0.015);
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
  text(ctx, 'GUARD THE BELL', 0, 64, 10, '#8b7954', 'bold', false, 'center');
  ctx.restore();
}
