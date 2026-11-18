import { clamp } from '../config.js';
import { line, circle } from './primitives.js';
import { drawBell, drawMonk } from './sprites.js';

const ease = t => { const p = clamp(t, 0, 1); return p * p * (3 - 2 * p); };

function ridge(ctx, top, color, phase) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-100, 500);
  for (let i = -1; i <= 14; i++) ctx.lineTo(i * 105, top + Math.sin(i * 1.63 + phase) * 27 + Math.cos(i * 0.65) * 23);
  ctx.lineTo(1380, 500); ctx.closePath(); ctx.fill();
}

export function drawEndingVista(ctx, state, age, rect = { x: 0, y: 0, w: 1280, h: 500 }, compact = false) {
  ctx.save(); ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
  const scale = Math.max(rect.w / 1280, rect.h / 500);
  ctx.translate(rect.x + (compact ? rect.w / 2 - 900 * scale : 0), rect.y); ctx.scale(scale, scale);
  const dawn = ease((age - 0.4) / 2.5), sky = ctx.createLinearGradient(0, 0, 0, 500);
  sky.addColorStop(0, dawn < 0.3 ? '#34495e' : '#efcfa0'); sky.addColorStop(0.55, '#f8e7c5'); sky.addColorStop(1, '#bdd2b1');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, 1280, 500);
  ctx.save(); ctx.globalAlpha = 0.18 + dawn * 0.55;
  const glow = ctx.createRadialGradient(963, 160, 10, 963, 160, 410);
  glow.addColorStop(0, '#fffbd9'); glow.addColorStop(0.2, '#fff1b8bb'); glow.addColorStop(1, '#f1ca7000');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, 1280, 500); circle(ctx, 963, 160, 53, '#fff5d4');
  for (let i = 0; i < 7; i++) {
    ctx.save(); ctx.translate(963, 160); ctx.rotate(-0.75 + i * 0.22 + dawn * 0.28);
    ctx.fillStyle = '#fff4c02b'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-26, 800); ctx.lineTo(52, 800); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  ctx.restore();
  ridge(ctx, 260, '#93ab9a', 0.6); ridge(ctx, 325, '#718b81', 1.5); ridge(ctx, 396, '#3c645d', 0);
  ctx.fillStyle = '#b6bc92'; ctx.beginPath(); ctx.moveTo(80, 500); ctx.quadraticCurveTo(610, 354, 1165, 401); ctx.lineTo(1280, 500); ctx.fill();
  for (let i = 0; i < 12; i++) line(ctx, [[140 + i * 75, 476 - i * 3], [177 + i * 75, 468 - i * 3]], '#eee1b54d', 2);
  // A single flowering branch frames the pilgrimage without covering the shrine.
  line(ctx, [[30, 500], [98, 345], [132, 248], [207, 195]], '#283d39', 11);
  line(ctx, [[114, 315], [234, 266], [301, 231]], '#344b43', 6);
  line(ctx, [[136, 248], [68, 207], [34, 142]], '#344b43', 5);
  for (let i = 0; i < 27; i++) {
    const x = 75 + i % 8 * 31 + Math.sin(i * 2.9) * 17, y = 197 + Math.floor(i / 8) * 30 + Math.cos(i * 1.8) * 13;
    for (let petal = 0; petal < 5; petal++) {
      const angle = petal / 5 * Math.PI * 2;
      ctx.fillStyle = i % 3 ? '#ecb8ad' : '#f9d5bd'; ctx.beginPath(); ctx.ellipse(x + Math.cos(angle) * 7, y + Math.sin(angle) * 7, 8, 5, angle, 0, Math.PI * 2); ctx.fill();
    }
    circle(ctx, x, y, 2.5, '#e8c567');
  }
  drawBell(ctx, { ...state.bell, x: 1050, y: 366, hp: state.bell.maxHp, peaceful: true, ring: Math.exp(-Math.max(0, age - 0.16) * 1.4), hitTime: 0, wardTime: 0 }, age, 1.85);
  const walk = ease((age - 2.4) / 2.9), monkX = 240 + walk * 686;
  drawMonk(ctx, { ...state.monk, x: monkX, y: 447 - walk * 38, walk: walk < 1 ? age * 7 : 0, dashTime: 0, hurtTime: 0, hitFlash: 0, recoil: 0 }, age, 1.5);
  if (age > 0.16 && age < 3.2) {
    ctx.save(); ctx.globalAlpha = clamp(1 - (age - 0.16) / 3, 0, 1) * 0.6;
    for (let i = 0; i < 3; i++) circle(ctx, 1050, 350, 30 + Math.max(0, age - 0.16 - i * 0.22) * 150, null, '#fff6c7', 2);
    ctx.restore();
  }
  for (let i = 0; i < 30; i++) {
    const x = (i * 157 + age * (17 + i % 4 * 8)) % 1350 - 35, y = 100 + i * 43 % 360 + Math.sin(age + i) * 19;
    ctx.save(); ctx.translate(x, y); ctx.rotate(age * 0.5 + i); ctx.fillStyle = i % 3 ? '#f7cfc0' : '#fff4cc';
    ctx.beginPath(); ctx.ellipse(0, 0, 5, 2.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  const sweep = ctx.createLinearGradient(-600 + dawn * 1880, 0, -220 + dawn * 1880, 500);
  sweep.addColorStop(0, '#ffe8a500'); sweep.addColorStop(0.5, '#fff3c946'); sweep.addColorStop(1, '#ffe8a500');
  ctx.fillStyle = sweep; ctx.fillRect(0, 0, 1280, 500);
  ctx.restore();
}
