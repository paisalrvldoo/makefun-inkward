import { WIDTH, HEIGHT, clamp } from '../config.js';
import { text, circle, line } from './primitives.js';
import { drawYokai } from './sprites.js';

// An original tapered sumi stroke, with parallel dry-brush hairs at its tail.
export function brushSlash(ctx, progress, color = '#161c29', width = 100, centerY = 490) {
  const end = clamp(progress, 0, 1) * (WIDTH + 260) - 100;
  ctx.save(); ctx.translate(0, centerY); ctx.rotate(-0.13);
  for (let i = 0; i < 22; i++) {
    const y = (i / 21 - 0.5) * width;
    line(ctx, [[-110, y * 0.2], [end * 0.28, y], [end * 0.74, y * 0.83], [end, y * 0.08 + Math.sin(i * 12.3) * 5]], color, 2 + width / 25);
    if (progress > 0.6) line(ctx, [[end - 60, y * 0.32], [end + 45 + i % 5 * 11, y * 0.21]], color, 0.7);
  }
  ctx.restore();
}

export function drawClimax(ctx, state) {
  const scene = state.climax;
  if (!scene) return;
  const t = scene.time;
  ctx.save();
  if (scene.kind === 'phase') {
    const alpha = Math.min(1, t * 5, (scene.duration - t) * 3);
    ctx.globalAlpha = alpha * 0.82;
    // Uneven screen-wide ink wash keeps the frame recognizably hand painted.
    for (let i = 0; i < 24; i++) {
      const y = i * 36;
      line(ctx, [[-40, y], [WIDTH * 0.3, y + Math.sin(i * 4) * 15], [WIDTH + 40, y - 7]], '#111a2a', 52);
    }
    ctx.globalAlpha = alpha;
    ctx.translate(640, 310); ctx.scale(1 + t * 0.045, 1 + t * 0.045);
    drawYokai(ctx, { ...scene.boss, x: 0, y: 0, hitTime: 0, hitFlash: 0 }, state.time, 2.5);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    brushSlash(ctx, Math.min(1, t * 3), '#f1dbaf', 110, 565);
    text(ctx, scene.boss.name, 640, 495, 43, '#192231', 'bold', true, 'center');
    text(ctx, scene.boss.phases[scene.phase], 640, 558, 24, scene.phase === 2 ? '#ff957a' : '#e6ca82', 'bold', true, 'center');
    text(ctx, scene.phase === 2 ? 'DESPERATION · PAINT THE SPOKES / DASH THE WHITEOUT' : scene.phase ? 'THE WARD BREAKS. WINTER ANSWERS.' : 'SCROLL VIII · THE LAST WARDEN', 640, 601, 13, '#fff0d4', 'bold', false, 'center');
  } else {
    if (t < 0.24) {
      ctx.globalAlpha = 0.75; ctx.fillStyle = '#fff5d2'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.globalAlpha = 1;
      drawYokai(ctx, { ...scene.boss, hitTime: 0 }, state.time, 1.1);
    } else {
      const p = clamp((t - 0.24) / 0.35, 0, 1);
      ctx.globalAlpha = Math.max(0, 1 - (t - 0.24) * 2); ctx.fillStyle = '#fff8d7'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.globalAlpha = Math.max(0, 1 - (t - 0.5) / 2);
      circle(ctx, scene.boss.x, scene.boss.y, Math.max(1, (t - 0.24) * 690), null, '#fff3cb', 10);
      brushSlash(ctx, p, '#f4d37d', 145); brushSlash(ctx, p, '#151e2d', 106);
      if (t > 0.55) text(ctx, 'WINTER, RELEASED.', 640, 428, 52, '#fff0cb', 'bold', true, 'center');
      text(ctx, 'THE FINAL SEAL', 640, 559, 18, '#b23c39', 'bold', false, 'center');
    }
  }
  ctx.restore();
}
