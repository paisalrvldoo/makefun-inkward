import { clamp } from '../config.js';
import { line } from './primitives.js';

// Procedural sumi: a swelling body, pointed end, and separate dry bristles at the tail.
export function brushSlash(ctx, from, to, progress, width = 84, color = '#131d29') {
  const amount = clamp(progress, 0, 1), dx = to.x - from.x, dy = to.y - from.y, length = Math.hypot(dx, dy) || 1;
  if (amount <= 0) return;
  const nx = -dy / length, ny = dx / length, count = Math.min(70, Math.ceil(70 * amount));
  const edge = (i, side) => {
    const t = i / 70, swell = Math.sin(Math.PI * clamp(t / 0.98, 0, 1)) ** 0.6;
    const w = width * (0.04 + swell * 0.48) * (1 + Math.sin(i * 2.8) * 0.065);
    return [from.x + dx * t + nx * w * side, from.y + dy * t + ny * w * side];
  };
  ctx.fillStyle = color; ctx.beginPath();
  for (let i = 0; i <= count; i++) { const p = edge(i, 1); if (i) ctx.lineTo(...p); else ctx.moveTo(...p); }
  for (let i = count; i >= 0; i--) ctx.lineTo(...edge(i, -1));
  ctx.closePath(); ctx.fill();
  for (let i = 0; i < 9; i++) {
    const offset = (i - 4) * width * 0.085, end = Math.min(amount, 0.27 + i % 3 * 0.018);
    line(ctx, [[from.x - dx * 0.055 + nx * offset, from.y - dy * 0.055 + ny * offset], [from.x + dx * end + nx * offset * 0.6, from.y + dy * end + ny * offset * 0.6]], color, 1 + i % 3);
  }
}
