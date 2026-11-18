import { WIDTH, HEIGHT, clamp } from '../config.js';
import { text, circle, button, hitRect } from '../render/primitives.js';
import { brushSlash } from '../render/brush.js';

export const DEFEAT_RETRY_BUTTON = { x: 470, y: 544, w: 340, h: 58 };

export function drawDefeat(ctx, state, input) {
  const age = state.defeat.age, dissolve = clamp(age / 1.3, 0, 1);
  ctx.save();
  ctx.globalAlpha = Math.min(0.88, age * 1.3); ctx.fillStyle = '#080f19'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.globalAlpha = 0.88;
  for (let i = 0; i < 14; i++) {
    const x = state.bell.x + Math.cos(i * 2.399) * (35 + i * 25), y = state.bell.y + Math.sin(i * 2.399) * (20 + i * 18);
    circle(ctx, x, y, Math.max(0.1, (18 + i * 10) * dissolve), '#0c1621');
  }
  for (let i = 0; i < 8; i++) {
    brushSlash(ctx, { x: i % 2 ? WIDTH + 60 : -60, y: 95 + i * 100 }, { x: i % 2 ? -80 : WIDTH + 80, y: 45 + i * 100 }, clamp((age - i * 0.055) / 0.65, 0, 1), 148, '#0b1420');
  }
  ctx.globalAlpha = clamp((age - 0.3) * 2, 0, 1);
  const glow = ctx.createRadialGradient(640, 364, 10, 640, 364, 390); glow.addColorStop(0, '#9b523028'); glow.addColorStop(1, '#101b2700');
  ctx.fillStyle = glow; ctx.fillRect(200, 80, 880, 650);
  text(ctx, 'THE BELL FELL', 640, 352, 68, '#f1d6be', 'bold', true, 'center');
  text(ctx, 'Even a broken note leaves a road home.', 640, 402, 23, '#c5b7a0', 'italic', true, 'center');
  for (let i = 0; i < 26; i++) {
    const angle = i * 2.399, radius = 90 + age * (48 + i * 5);
    ctx.save(); ctx.translate(640 + Math.cos(angle) * radius * 1.6, 370 + Math.sin(angle) * radius * 0.6); ctx.rotate(angle + age);
    ctx.globalAlpha = 0.35 * (1 - dissolve * 0.5); ctx.fillStyle = '#b17a62'; ctx.beginPath(); ctx.ellipse(0, 0, 3 + i % 3, 1.7, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  text(ctx, `SCROLL ${state.scroll} / 8 · ${state.sealed} SPIRITS FREED · THE BRUSH REMEMBERS`, 640, 458, 11, '#b2b9ad', 'bold', false, 'center');
  button(ctx, 'RETRY  (R)', DEFEAT_RETRY_BUTTON, hitRect(input.pointer, DEFEAT_RETRY_BUTTON), 'A NEW PILGRIMAGE');
  text(ctx, 'S · SAME SEED     ANY OTHER KEY · SEE YOUR RECORD', 640, 634, 10, '#afab94', 'bold', false, 'center');
  ctx.restore();
}
