import { panel, text } from './primitives.js';

export function drawScoreBurst(ctx, state) {
  const fx = state.scoreBurst;
  if (!fx) return;
  const age = fx.age, fade = Math.min(1, (1.8 - age) * 3);
  const count = Math.min(1, Math.max(0, (age - 0.25) / 0.35));
  ctx.save(); ctx.translate(fx.x, fx.y - age * 7); ctx.globalAlpha = fade;
  panel(ctx, -174, -35, 348, 111, '#142330ed', '#eabc69');
  text(ctx, 'SEALED ×' + fx.count + '  /  VALUE ' + Math.round(fx.base).toLocaleString('en-US'), 0, -12, 14, '#b6d8c5', 'bold', false, 'center');
  if (age > 0.1) text(ctx, 'COMBO ×' + fx.combo.toFixed(1) + '   ·   WRATH ×' + (fx.multiplier / fx.combo).toFixed(1), 0, 9, 13, '#ffc46e', 'bold', false, 'center');
  {
    const slam = Math.exp(-Math.pow((age - 0.6) / 0.11, 2));
    ctx.translate(Math.sin(age * 80) * (1 - count) * 2, 43); ctx.scale(1 + slam * 0.16, 1 + slam * 0.16);
    ctx.shadowColor = '#f8b750'; ctx.shadowBlur = 10 + slam * 12;
    const value = age > 0.25 ? '+' + Math.round(fx.total * (1 - (1 - count) ** 3)).toLocaleString('en-US') : age > 0.1 ? '×' + fx.multiplier.toFixed(1) : Math.round(fx.base).toLocaleString('en-US');
    text(ctx, value, 0, 10, 39, '#fff2c9', 'bold', true, 'center');
  }
  ctx.restore();
}
