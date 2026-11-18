import { WIDTH, HEIGHT, FIELD, clamp } from '../config.js';
import { brushSlash } from './brush.js';
import { text, circle, line, panel } from './primitives.js';

function drawSealMark(ctx, x, y, size, intensity) {
  const s = size * intensity;
  if (s < 2) return;
  ctx.save(); ctx.translate(x, y);
  ctx.globalAlpha = clamp(intensity, 0, 1) * 0.92;
  ctx.strokeStyle = '#c93127'; ctx.fillStyle = '#c93127';

  ctx.lineWidth = s * 0.13; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-s * 0.38, -s * 0.37); ctx.lineTo(-s * 0.38, s * 0.36);
  ctx.lineTo(s * 0.38, s * 0.36); ctx.lineTo(s * 0.38, -s * 0.37);
  ctx.closePath(); ctx.stroke();

  ctx.lineWidth = s * 0.11;
  ctx.beginPath();
  ctx.moveTo(-s * 0.30, -s * 0.30); ctx.lineTo(-s * 0.30, s * 0.29);
  ctx.lineTo(s * 0.30, s * 0.29); ctx.lineTo(s * 0.30, -s * 0.30);
  ctx.closePath(); ctx.stroke();

  ctx.strokeStyle = '#0a0f16';
  ctx.lineWidth = s * 0.21;
  ctx.beginPath();
  ctx.moveTo(-s * 0.14, -s * 0.32); ctx.lineTo(-s * 0.14, s * 0.30);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(s * 0.14, -s * 0.30); ctx.lineTo(s * 0.14, s * 0.24);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(s * 0.06, -s * 0.26); ctx.lineTo(-s * 0.06, -s * 0.14);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-s * 0.20, s * 0.04); ctx.lineTo(s * 0.18, s * 0.12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-s * 0.32, -s * 0.08); ctx.lineTo(s * 0.30, -s * 0.02);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-s * 0.10, -s * 0.20); ctx.quadraticCurveTo(s * 0.04, -s * 0.28, s * 0.10, -s * 0.16);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(s * 0.24, s * 0.22); ctx.lineTo(s * 0.22, s * 0.10);
  ctx.lineTo(-s * 0.22, s * 0.04); ctx.lineTo(-s * 0.28, s * 0.14);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-s * 0.28, -s * 0.18); ctx.lineTo(s * 0.08, -s * 0.32);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(s * 0.03, s * 0.18); ctx.lineTo(s * 0.01, s * 0.28);
  ctx.lineTo(-s * 0.01, s * 0.28); ctx.lineTo(-s * 0.03, s * 0.18);
  ctx.stroke();

  const blots = 5 + Math.floor(intensity * 6);
  for (let i = 0; i < blots; i++) {
    ctx.beginPath();
    ctx.arc(-s * 0.32 + i * s * 0.08, -s * 0.32 + (i % 3) * s * 0.06, s * 0.03 + i * s * 0.003, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 0.24 - i * s * 0.06, s * 0.34 - (i % 2) * s * 0.05, s * 0.025, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawUltimate(ctx, state) {
  const ult = state.ult;
  if (!ult) return;
  const age = ult.age, dur = ult.duration;

  if (age < 0.16) {
    const flash = clamp(age / 0.16, 0, 1);
    ctx.save(); ctx.globalAlpha = flash;
    ctx.fillStyle = '#fffaf0'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.restore();
  }

  if (age < 0.10 && age < 0.16) {
    for (let i = 0; i < 6; i++) {
      const offset = (i % 2 === 0 ? 1 : -1) * age * 1200;
      brushSlash(ctx, { x: -80 + offset, y: -40 }, { x: WIDTH + 80 + offset, y: HEIGHT + 40 }, clamp(age / 0.08, 0, 1), 32 + i * 7, '#0a0f16');
    }
  }

  if (age >= 0.12 && age < 1.0) {
    const sweep = clamp((age - 0.12) / 0.28, 0, 1);
    const fade = clamp((1.0 - age) / 0.6, 0, 1);
    const dir = age < 0.4 ? 1 : -1;
    const xOff = Math.sin(age * 2.3) * (1 - sweep) * 600 * dir;

    ctx.save(); ctx.globalAlpha = fade * 0.55;
    for (let i = 0; i < 8; i++) {
      const s = clamp((age - 0.12 - i * 0.035) / 0.22, 0, 1);
      if (s <= 0) continue;
      brushSlash(ctx,
        { x: -120 + xOff + i * 18, y: FIELD.y + i * 14 - 20 },
        { x: WIDTH + 120 + xOff - i * 16, y: HEIGHT - FIELD.y - i * 12 },
        s, 68 - i * 5, i % 2 ? '#101723' : '#0a0f16');
    }
    ctx.restore();
  }

  if (age >= 0.32) {
    const sealAppear = clamp((age - 0.32) / 0.18, 0, 1);
    const stampAngle = Math.sin(age * 7) * 0.04 * (1 - sealAppear);
    ctx.save();
    ctx.translate(WIDTH / 2, FIELD.y + FIELD.h / 2 - 10);
    ctx.rotate(stampAngle);
    if (sealAppear < 1) {
      ctx.globalAlpha = sealAppear * 0.9;
      ctx.scale(1 + (1 - sealAppear) * 0.4, 1 + (1 - sealAppear) * 0.4);
    }
    drawSealMark(ctx, 0, 0, 96, sealAppear);
    ctx.restore();
  }

  if (age >= 0.48) {
    const callout = clamp((age - 0.48) / 0.15, 0, 1);
    const slam = Math.exp(-Math.pow((age - 0.55) / 0.08, 2));
    const stay = clamp((dur - age) / 0.45, 0, 1);
    const alpha = clamp(callout * stay, 0, 1);
    if (alpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(WIDTH / 2, FIELD.y + FIELD.h / 2 - 110);
      ctx.scale(1 + slam * 0.12, 1 + slam * 0.12);
      ctx.shadowColor = '#ffd273'; ctx.shadowBlur = 20 + slam * 30;
      ctx.font = 'bold 68px Georgia, serif'; ctx.textAlign = 'center';
      ctx.fillStyle = '#fffaf0'; ctx.fillText('ULTIMATE!', 0, 0);
      ctx.restore();
    }

    const subAlpha = clamp(clamp((age - 0.58) / 0.12, 0, 1) * stay, 0, 1);
    if (subAlpha > 0.01) {
      ctx.save(); ctx.globalAlpha = subAlpha;
      ctx.font = 'bold 20px Arial, sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = '#d6a040'; ctx.fillText('THE GREAT SEAL DESCENDS', WIDTH / 2, FIELD.y + FIELD.h / 2 - 55);
      ctx.restore();
    }
  }

  if (age < dur - 0.25) {
    for (let i = 0; i < 25; i++) {
      const rx = WIDTH / 2 + Math.cos(i * 2.7 + age * 4) * (60 + age * 280);
      const ry = FIELD.y + FIELD.h / 2 + Math.sin(i * 2.7 + age * 4) * (35 + age * 200);
      ctx.save(); ctx.globalAlpha = clamp((age - 0.25) / 0.3, 0, 0.35);
      ctx.fillStyle = i % 3 ? '#c93127' : '#ffd273';
      ctx.beginPath(); ctx.arc(rx, ry, 3 + age * 2 + i % 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }
}