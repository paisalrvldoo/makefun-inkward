import { ART_COLORS } from '../fx/skillCasts.js';
import { circle, line } from './primitives.js';

function petal(ctx, x, y, size, angle, color) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-size, -size, 0, -size * 2); ctx.quadraticCurveTo(size, -size, 0, 0); ctx.fill(); ctx.restore();
}
function lightning(ctx, a, b, phase, width = 4) {
  const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy) || 1;
  const points = [[a.x, a.y]];
  for (let i = 1; i < 9; i++) {
    const offset = Math.sin(i * 13.7 + phase) * 17;
    points.push([a.x + dx * i / 9 - dy / length * offset, a.y + dy * i / 9 + dx / length * offset]);
  }
  points.push([b.x, b.y]); line(ctx, points, '#eec768', width + 3); line(ctx, points, '#fffbea', width);
  const fork = points[4]; line(ctx, [fork, [fork[0] + dy / length * 19, fork[1] - dx / length * 19], [fork[0] + dy / length * 36 + dx / length * 15, fork[1] - dx / length * 36 + dy / length * 15]], '#fffbea', 2);
}
export function drawSkillEffects(ctx, state) {
  for (const fx of state.skillEffects) {
    const t = 1 - fx.life / fx.maxLife, color = ART_COLORS[fx.id], r = fx.radius * (0.25 + t * 0.75);
    ctx.save(); ctx.translate(fx.x, fx.y); ctx.globalAlpha = Math.min(1, fx.life * 3); ctx.lineCap = 'round';
    if (fx.id === 'thunder') {
      let source = { x: 0, y: 0 };
      for (const target of fx.targets) {
        const end = { x: target.x - fx.x, y: target.y - fx.y };
        lightning(ctx, source, end, Math.floor(t * 14)); circle(ctx, end.x, end.y, 14 + t * 12, '#fff7cc44', color, 2); source = end;
      }
      if (!fx.targets.length) lightning(ctx, { x: -12, y: -45 }, { x: 12, y: 32 }, t * 12);
    } else if (fx.id === 'vermilion') {
      ctx.rotate(fx.angle); line(ctx, [[-r, 12], [0, -8], [r, -16]], color, 5); line(ctx, [[-r * 0.7, 10], [r, -16]], '#fff4de', 2);
      for (let i = -1; i <= 1; i++) { const x = i * r * 0.6; line(ctx, [[x - 6, -18], [x + 6, 7]], color, 2); }
    } else if (fx.id === 'lotus') {
      circle(ctx, 0, 0, r, '#a9dfff0c', color, 3);
      for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; petal(ctx, Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85, 9 + 10 * (1 - t), a + Math.PI / 2, color); }
      circle(ctx, 0, 0, r * 0.6, null, '#effaff', 1.5);
    } else if (fx.id === 'mending') {
      ctx.scale(1, 0.78); circle(ctx, 0, 0, r, '#ffe08b0e', color, 3);
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(0, 0, r * (1 - i * 0.15), r, i * Math.PI / 3, 0, Math.PI * 2); ctx.strokeStyle = i ? '#ffe08b70' : '#fff9d1'; ctx.lineWidth = 1.5; ctx.stroke(); }
    } else if (fx.id === 'willow') {
      ctx.rotate(fx.angle);
      for (let i = 0; i < 5; i++) { const x = -i * 17 - t * 20; ctx.globalAlpha = (1 - t) * (1 - i / 6); petal(ctx, x, 10 * Math.sin(i), 15, Math.PI / 2, color); line(ctx, [[x - 20, -14], [x, -18], [x + 8, -12]], color, 2); }
    } else if (fx.id === 'breath') {
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(0, -t * 24 - i * 12, r * (1 - i * 0.15), 14, 0, Math.PI * 0.1, Math.PI * 1.3); ctx.strokeStyle = color; ctx.lineWidth = 3 - i * 0.6; ctx.stroke(); }
    } else if (fx.id === 'twin') {
      for (const side of [-1, 1]) { ctx.save(); ctx.scale(side, 1); ctx.rotate(t * 0.3); line(ctx, [[-10, r], [14, -r]], color, 5); petal(ctx, 14, -r, 9, 0.5, '#fff5ff'); ctx.restore(); }
    } else if (fx.id === 'gold') {
      for (let i = 0; i < 9; i++) { const a = i * Math.PI * 2 / 9; petal(ctx, Math.cos(a) * r, Math.sin(a) * r - t * 20, 7, a + t * 3, color); }
    } else if (fx.id === 'well') {
      ctx.beginPath();
      for (let i = 0; i < 65; i++) { const a = i * 0.19 + t * 7, size = r * (1 - i / 70); const x = Math.cos(a) * size, y = Math.sin(a) * size * 0.65; if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke(); circle(ctx, 0, 0, 9, '#e0fbff');
    } else if (fx.id === 'stone') {
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, x = Math.cos(a) * r, y = Math.sin(a) * r; line(ctx, [[x - 9, y + 6], [x - 7, y - 7], [x + 5, y - 11], [x + 11, y + 3], [x - 9, y + 6]], color, 3); }
    } else if (fx.id === 'feather') {
      for (let i = 0; i < 5; i++) { const a = i * 1.3, x = Math.cos(a) * r, y = Math.sin(a) * r; line(ctx, [[x - 10, y + 9], [x + 8, y - 10]], color, 2); for (let j = 0; j < 3; j++) line(ctx, [[x - 6 + j * 5, y + 5 - j * 5], [x - 12 + j * 5, y - 5 - j * 4]], color, 2); }
    } else if (fx.id === 'echo') {
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, 0, r * (1 - i * 0.22), -2.7, 0.5); ctx.strokeStyle = color; ctx.lineWidth = 3 - i * 0.6; ctx.stroke(); }
    } else if (fx.id === 'moonInk') {
      ctx.beginPath(); ctx.arc(0, -t * 30, 24, 0.6, 5.5); ctx.strokeStyle = color; ctx.lineWidth = 8; ctx.stroke();
      for (let i = 0; i < 6; i++) circle(ctx, Math.cos(i) * r, Math.sin(i) * r, 2, '#f8f7ff');
    } else if (fx.id === 'afterglow') {
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; line(ctx, [[Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55], [Math.cos(a) * r, Math.sin(a) * r]], color, 3); }
    }
    ctx.restore();
  }
}
