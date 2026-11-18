import { COLORS } from '../config.js';
import { circle, line } from './primitives.js';
import { drawGlow, drawShadow as shadow } from './light.js';

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
function drawOni(ctx, enemy, time, silhouette = false) {
  const color = enemy.color;
  ctx.fillStyle = color; ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-27, -17); ctx.lineTo(-24, -42); ctx.lineTo(-9, -27); ctx.quadraticCurveTo(0, -33, 9, -27); ctx.lineTo(25, -42); ctx.lineTo(28, -16); ctx.bezierCurveTo(41, 7, 30, 38, 0, 38); ctx.bezierCurveTo(-32, 37, -42, 3, -27, -17); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (enemy.crest === 'bloom') {
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse((i - 2) * 9, -32, 7, 14, (i - 2) * 0.3, 0, Math.PI * 2); ctx.fillStyle = '#ebadb8'; ctx.fill(); ctx.stroke(); }
  } else if (enemy.crest === 'wings') {
    for (const side of [-1, 1]) line(ctx, [[side * 26, -10], [side * 58, -32], [side * 43, 11], [side * 28, 20]], '#e3dbf2', 5);
  } else if (enemy.crest === 'lantern') {
    line(ctx, [[-22, -32], [22, -32]], '#f5ce76', 5); line(ctx, [[-25, 28], [25, 28]], '#f5ce76', 4);
  } else if (enemy.crest === 'flame') {
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * 10, -24); ctx.quadraticCurveTo(side * 29, -66, side * 35, -38); ctx.quadraticCurveTo(side * 32, -24, side * 24, -17); ctx.fillStyle = '#efa44e'; ctx.fill(); ctx.stroke(); }
  } else if (enemy.crest === 'stone') {
    line(ctx, [[-31, -16], [-38, 0], [-33, 24]], '#b2c1cb', 10); line(ctx, [[31, -16], [38, 0], [33, 24]], '#b2c1cb', 10);
  }
  ctx.fillStyle = '#f7df99'; ctx.beginPath(); ctx.moveTo(-21, -7); ctx.lineTo(-5, -3); ctx.lineTo(-11, 5); ctx.lineTo(-21, 3); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(21, -7); ctx.lineTo(5, -3); ctx.lineTo(11, 5); ctx.lineTo(21, 3); ctx.closePath(); ctx.fill();
  if (enemy.telegraph && !silhouette) {
    drawGlow(ctx, -12, 0, 15, 0.8, '#ffd078'); drawGlow(ctx, 12, 0, 15, 0.8, '#ffd078');
  }
  circle(ctx, -12, 0, 2.3, COLORS.ink); circle(ctx, 12, 0, 2.3, COLORS.ink);
  ctx.fillStyle = '#262b2a'; ctx.beginPath(); ctx.ellipse(0, 20, 20, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff7df'; ctx.beginPath(); ctx.moveTo(-15, 14); ctx.lineTo(-10, 26); ctx.lineTo(-6, 14); ctx.fill(); ctx.beginPath(); ctx.moveTo(15, 14); ctx.lineTo(10, 26); ctx.lineTo(6, 14); ctx.fill();
  line(ctx, [[-33, 10], [-48, 20], [-42, 36]], COLORS.ink, 8); line(ctx, [[33, 10], [45, 20], [47, 36]], COLORS.ink, 8);
}
export function drawYokai(ctx, enemy, time = 0, scale = 1, silhouette = false) {
  ctx.save(); ctx.translate(enemy.x, enemy.y); ctx.scale(scale * (enemy.small ? 0.7 : 1), scale * (enemy.small ? 0.7 : 1));
  if (!silhouette) shadow(ctx, 0, 0, enemy.kind === 'oni' ? 45 : 20);
  const phase = enemy.phase || 0, opening = eyeOpening(time, phase);
  const airborne = ['lantern', 'umbrella', 'crane'].includes(enemy.kind);
  const bob = enemy.kind === 'oni' ? 0 : Math.sin(time * (airborne ? 3 : 2.8) + phase) * (airborne ? 3.5 : 1.6);
  ctx.translate(0, bob);
  ctx.save();
  if (enemy.animation === 'attack' && enemy.kind !== 'oni') {
    const windup = Math.min(1, (enemy.windup || 0) / 0.24);
    ctx.scale(1 + windup * 0.2, 1 - windup * 0.17); ctx.rotate(Math.sin(phase) * (1 - windup) * 0.18);
  }
  if (enemy.animation === 'hit') { ctx.translate(Math.sin((enemy.hitTime || 0) * 35) * 3, 0); ctx.scale(1.1, 0.92); }
  if (enemy.kind === 'oni') {
    const breath = Math.sin(time * 1.8 + phase);
    ctx.translate(0, 36); ctx.scale(1 + breath * 0.02, 1 + breath * 0.035); ctx.translate(0, -36);
    const stage = Math.min(2, Math.floor((1 - enemy.hp / enemy.maxHp) * 3));
    ctx.scale(1 + stage * 0.07, 1 + stage * 0.03);
    if (enemy.telegraph) {
      const charge = 1 - enemy.telegraph.time / enemy.telegraph.total;
      ctx.translate(0, charge * 7); ctx.scale(1 + charge * 0.16, 1 - charge * 0.12);
      ctx.rotate(Math.sin(time * (7 + charge * 14)) * charge * 0.035);
    } else if (enemy.actionTime > 0) ctx.rotate((enemy.charge?.dx || 1) * 0.17);
    if (enemy.telegraph && !silhouette) drawGlow(ctx, 0, 0, 87, 0.55 + Math.sin(time * 6) * 0.08, enemy.color);
  } else ctx.rotate(Math.sin(time * 1.9 + phase) * 0.025);
  if (enemy.kind === 'kappa') drawKappa(ctx, enemy.color, opening);
  else if (enemy.kind === 'lantern') drawLantern(ctx, enemy.color, opening);
  else if (enemy.kind === 'umbrella') drawUmbrella(ctx, enemy.color, opening);
  else if (enemy.kind === 'fox') drawFox(ctx, enemy.color, time, opening);
  else if (enemy.kind === 'eater') drawEater(ctx, opening);
  else if (enemy.kind === 'crane') drawCrane(ctx, time, opening);
  else if (enemy.kind === 'oni') {
    const colors = [enemy.color, enemy.boss === 'frost' ? '#7fb8db' : '#c18152', enemy.boss === 'frost' ? '#bdd8ee' : '#d9644d'];
    drawOni(ctx, { ...enemy, color: colors[Math.min(2, Math.floor((1 - enemy.hp / enemy.maxHp) * 3))] }, time, silhouette);
  }
  ctx.restore();
  if (!silhouette && enemy.kind === 'oni') {
    for (let i = 0; i < enemy.maxHp; i++) circle(ctx, (i - (enemy.maxHp - 1) / 2) * 15, -56, 4.5, i < enemy.hp ? COLORS.red : '#d8ccb2', COLORS.ink, 1);
    if (enemy.sealLock > 0) { ctx.save(); ctx.globalAlpha *= 0.6; circle(ctx, 0, 0, 51 + Math.sin(time * 8) * 2, null, COLORS.gold, 2); ctx.restore(); }
  }
  if (!silhouette && enemy.hitTime > 0) circle(ctx, 0, 0, enemy.radius + 6, null, COLORS.red, 2);
  if (!silhouette && enemy.stun > 0) {
    for (let i = 0; i < 3; i++) {
      const a = time * 2 + i * Math.PI * 2 / 3;
      circle(ctx, Math.cos(a) * 16, -30 + Math.sin(a) * 4, 2.5, COLORS.gold);
    }
  }
  ctx.restore();
}
