import { clamp, WIDTH, HEIGHT } from '../config.js';
import { text, line, circle, panel } from './primitives.js';

export function drawDefeat(ctx, state) {
  const t = state.defeat.time, dissolve = clamp((t - 0.08) / 0.9, 0, 1);
  ctx.save();
  if (t < 0.18) { ctx.globalAlpha = 1 - t / 0.18; ctx.fillStyle = '#fff1d5'; ctx.fillRect(0, 0, WIDTH, HEIGHT); }
  ctx.globalAlpha = 1;
  // Irregular wet ink fingers spread inward, then dissolve into the results paper.
  for (let i = 0; i < 32; i++) {
    const x = i * 42, h = HEIGHT * Math.min(1, dissolve * (1.2 + Math.sin(i * 2.3) * 0.19));
    ctx.fillStyle = '#0b1522'; ctx.fillRect(x - 2, 0, 46, h);
    circle(ctx, x + 20, h, 23, '#0b1522');
    if (dissolve > 0.2) circle(ctx, x + 18, h + 36 + i % 3 * 12, 4 + i % 6, '#0b1522');
  }
  for (let i = 0; i < 46; i++) {
    const a = i * 2.39996, r = 30 + t * (60 + i % 7 * 20);
    ctx.globalAlpha = Math.max(0, 1 - t / 1.7);
    circle(ctx, state.bell.x + Math.cos(a) * r, state.bell.y + Math.sin(a) * r, 2 + i % 6, i % 3 ? '#0b1522' : '#dda36a');
  }
  ctx.globalAlpha = clamp((t - 0.25) * 3, 0, 1);
  panel(ctx, 257, 209, 766, 254, '#0d192ae8', '#bd9258');
  text(ctx, 'THE BELL FELL', 640, 302, 66, '#f0d5b0', 'bold', true, 'center');
  line(ctx, [[477, 329], [803, 329]], '#b65442', 2);
  text(ctx, 'Ink fades. The hand remembers.', 640, 376, 25, '#e3c495', 'bold', true, 'center');
  text(ctx, 'ANOTHER ROAD IS WAITING.', 640, 415, 12, '#a9baba', 'bold', false, 'center');
  text(ctx, 'RETRY (R) · SAME SEED (S) · TAP / ANY KEY FOR THE RECORD', 640, 744, 12, '#f0d5b0', 'bold', false, 'center');
  ctx.restore();
}
