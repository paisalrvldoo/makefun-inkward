import { panel, text } from './primitives.js';

export function drawScoreBurst(ctx, state) {
  const fx = state.scoreBurst;
  if (!fx) return;
  const age = fx.age, fade = Math.min(1, (2.0 - age) * 3);
  const count = Math.min(1, Math.max(0, (age - 0.25) / 0.35));
  ctx.save(); ctx.translate(fx.x, fx.y - age * 7); ctx.globalAlpha = fade;
  panel(ctx, -174, -35, 348, 111, '#0e1929ed', '#d6a040');
  text(ctx, 'SEALED \u00d7' + fx.count + '  /  VALUE ' + Math.round(fx.base).toLocaleString('en-US'), 0, -12, 14, '#a6d0bb', 'bold', false, 'center');
  if (age > 0.1) text(ctx, 'COMBO \u00d7' + fx.combo.toFixed(1) + '   \u00b7   WRATH \u00d7' + (fx.multiplier / fx.combo).toFixed(1), 0, 9, 13, '#f7c060', 'bold', false, 'center');
  {
    const slam = Math.exp(-Math.pow((age - 0.6) / 0.11, 2));
    ctx.translate(Math.sin(age * 80) * (1 - count) * 2, 43); ctx.scale(1 + slam * 0.18, 1 + slam * 0.18);
    ctx.shadowColor = '#eeb030'; ctx.shadowBlur = 13 + slam * 15;
    const value = age > 0.25 ? '+' + Math.round(fx.total * (1 - (1 - count) ** 3)).toLocaleString('en-US') : age > 0.1 ? '\u00d7' + fx.multiplier.toFixed(1) : Math.round(fx.base).toLocaleString('en-US');
    text(ctx, value, 0, 10, 42, '#fff5d5', 'bold', true, 'center');
  }
  ctx.restore();
}
