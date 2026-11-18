import { COLORS } from '../config.js';

function wobble(seed, age) {
  return Math.sin(age * 17 + seed * 6.28) * 1.5;
}

export function drawCombatTexts(ctx, state) {
  for (const t of state.combatTexts) {
    const progress = t.age / t.life;
    const fade = Math.max(0, 1 - progress * progress);
    if (fade < 0.015) continue;
    const scale = 1 + (1 - fade) * 0.15;
    ctx.save();
    ctx.translate(t.x + wobble(t.seed + 0.3, t.age), t.y + wobble(t.seed, t.age));
    ctx.scale(scale, scale);
    ctx.globalAlpha = fade;
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';

    if (t.kind === 'chain') {
      ctx.font = `bold 34px Georgia, serif`;
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#0a0f16';
      ctx.fillStyle = '#fff5d5';
      ctx.strokeText(t.value, 0, 0);
      ctx.fillText(t.value, 0, 0);
      if (t.detail) {
        ctx.font = `bold 18px Georgia, serif`;
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#0a0f16';
        ctx.fillStyle = '#f0c35b';
        ctx.strokeText(t.detail, 0, 34);
        ctx.fillText(t.detail, 0, 34);
      }
    } else if (t.kind === 'crit') {
      ctx.font = `bold 44px Georgia, serif`;
      ctx.lineWidth = 7;
      ctx.shadowColor = '#f0a030';
      ctx.shadowBlur = 14;
      ctx.strokeStyle = '#0a0f16';
      ctx.strokeText(t.value, 0, 0);
      ctx.fillStyle = '#f2a247';
      ctx.fillText(t.value, 0, 0);
      ctx.font = `bold 20px Georgia, serif`;
      ctx.lineWidth = 4;
      ctx.shadowColor = '#cc4030';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = '#0a0f16';
      ctx.strokeText(t.detail || 'CRIT!', 0, 38);
      ctx.fillStyle = '#e8422a';
      ctx.fillText(t.detail || 'CRIT!', 0, 38);
    } else if (t.kind === 'heal') {
      ctx.font = `bold 26px Georgia, serif`;
      ctx.lineWidth = 5;
      ctx.shadowColor = '#3d6d5d';
      ctx.shadowBlur = 7;
      ctx.strokeStyle = '#0a1410';
      ctx.strokeText(t.value, 0, 0);
      ctx.fillStyle = '#5ce892';
      ctx.fillText(t.value, 0, 0);
      if (t.detail) {
        ctx.font = `bold 13px Georgia, serif`;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 4;
        ctx.strokeStyle = '#0a1410';
        ctx.strokeText(t.detail, 0, 28);
        ctx.fillStyle = '#7bd8a1';
        ctx.fillText(t.detail, 0, 28);
      }
    } else if (t.kind === 'ink') {
      ctx.font = `bold 20px Georgia, serif`;
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#0a161c';
      ctx.strokeText(t.value, 0, 0);
      ctx.fillStyle = COLORS.blue;
      ctx.fillText(t.value, 0, 0);
      if (t.detail) {
        ctx.font = `bold 11px Georgia, serif`;
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#0a161c';
        ctx.strokeText(t.detail, 0, 22);
        ctx.fillStyle = '#8bbbd5';
        ctx.fillText(t.detail, 0, 22);
      }
    } else if (t.kind === 'score') {
      ctx.font = `bold 24px Georgia, serif`;
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#0a0f16';
      ctx.strokeText(t.value, 0, 0);
      ctx.fillStyle = '#f0c35b';
      ctx.fillText(t.value, 0, 0);
      if (t.detail) {
        ctx.font = `bold 12px Georgia, serif`;
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#0a0f16';
        ctx.strokeText(t.detail, 0, 24);
        ctx.fillStyle = '#e1bf70';
        ctx.fillText(t.detail, 0, 24);
      }
    } else {
      const size = t.kind === 'seal' ? 30 : 24;
      ctx.font = `bold ${size}px Georgia, serif`;
      ctx.lineWidth = 5;
      ctx.shadowColor = '#d6a040';
      ctx.shadowBlur = 2;
      ctx.strokeStyle = '#0a0f16';
      ctx.strokeText(t.value, 0, 0);
      ctx.fillStyle = t.kind === 'seal' ? '#fff5d5' : '#eeddc0';
      ctx.fillText(t.value, 0, 0);
      if (t.detail) {
        ctx.font = `bold ${Math.floor(size * 0.45)}px Georgia, serif`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 1;
        ctx.strokeStyle = '#0a0f16';
        ctx.strokeText(t.detail, 0, size * 0.8);
        ctx.fillStyle = '#d6a040';
        ctx.fillText(t.detail, 0, size * 0.8);
      }
    }
    ctx.restore();
  }
}