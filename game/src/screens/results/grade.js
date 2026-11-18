import { gradeRun } from '../../world/state.js';
import { circle, text, line } from '../../render/primitives.js';

export function drawGrade(ctx, state, motion) {
  if (!motion.stamp) return;
  ctx.save(); ctx.translate(1090, 221); ctx.rotate(-0.065 - (1 - motion.stamp) * 0.18);
  const scale = 1 + (1 - motion.stamp) * 0.65; ctx.scale(scale, scale); ctx.globalAlpha = motion.stamp;
  const points = Array.from({ length: 33 }, (_, i) => {
    const a = i / 32 * Math.PI * 2, r = i % 2 ? 94 : 100;
    return [Math.cos(a) * r, Math.sin(a) * r];
  });
  circle(ctx, 0, 0, 98, '#1b2934');
  line(ctx, points, '#d7af57', 2);
  circle(ctx, 0, 0, 85, null, '#e8c575', 2);
  circle(ctx, 0, 0, 79, null, '#a47e3b', 1);
  for (let i = 0; i < 16; i++) {
    const a = i * Math.PI / 8;
    circle(ctx, Math.cos(a) * 90, Math.sin(a) * 90, 1.5, '#edcd80');
  }
  ctx.shadowColor = '#dcae4c66'; ctx.shadowBlur = 16;
  text(ctx, state.grade || gradeRun(state), 0, 41, 126, '#f6d680', 'bold', true, 'center');
  ctx.shadowBlur = 0;
  if (state.newBest) {
    ctx.fillStyle = '#c74735'; ctx.beginPath();
    ctx.moveTo(-116, 47); ctx.lineTo(116, 47); ctx.lineTo(106, 64);
    ctx.lineTo(116, 81); ctx.lineTo(-116, 81); ctx.lineTo(-106, 64); ctx.closePath(); ctx.fill();
    line(ctx, [[-105, 51], [105, 51]], '#f2bd6b', 1);
    line(ctx, [[-105, 77], [105, 77]], '#f2bd6b', 1);
    text(ctx, 'NEW BEST!', 0, 70, 18, '#fff2ca', 'bold', false, 'center');
  }
  ctx.restore();
  text(ctx, 'BRUSH GRADE', 1090, 337, 10, '#d6b86e', 'bold', false, 'center');
}

