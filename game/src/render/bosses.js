import { COLORS, FIELD, clamp } from '../config.js';
import { bossPhase, ATTACK_NAMES } from '../entities/bosses.js';
import { text, panel, circle, line } from './primitives.js';
import { omenProgress } from '../world/omens.js';
import { drawGlow } from './light.js';

function drawAttackIcon(ctx, kind, x, y, color) {
  ctx.save();
  circle(ctx, x, y, 15, '#171c24f2', color, 2);
  ctx.strokeStyle = '#fff4dc'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  if (kind === 'storm') {
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2 - Math.PI / 2, r = 3 + i * 1.6;
      ctx.beginPath(); ctx.arc(x, y, r, a, a + 1.6); ctx.stroke();
    }
  } else if (kind === 'charge') {
    ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.lineTo(x + 5, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 5, y); ctx.lineTo(x, y - 5); ctx.moveTo(x + 5, y); ctx.lineTo(x, y + 5); ctx.stroke();
  } else if (kind === 'roar') {
    for (let i = 1; i <= 3; i++) { ctx.globalAlpha = 0.8 - i * 0.2; ctx.beginPath(); ctx.arc(x, y, i * 4, 0, Math.PI * 2); ctx.stroke(); }
  } else {
    ctx.beginPath(); ctx.moveTo(x - 7, y - 4); ctx.lineTo(x + 7, y - 4); ctx.moveTo(x - 7, y + 4); ctx.lineTo(x + 7, y + 4); ctx.stroke();
  }
  ctx.restore();
}

export function drawBossTelegraphs(ctx, state) {
  for (const effect of state.frostLanes) {
    ctx.save(); ctx.globalAlpha = effect.life / effect.maxLife;
    for (const lane of effect.lanes) {
      line(ctx, [[lane.from.x, lane.from.y], [lane.to.x, lane.to.y]], '#b7edf8', 44);
      line(ctx, [[lane.from.x, lane.from.y], [lane.to.x, lane.to.y]], '#fff9de', 5);
    }
    ctx.restore();
  }
  for (const boss of state.enemies) {
    if (boss.kind !== 'oni' || boss.dead || !boss.telegraph) continue;
    const warning = boss.telegraph, progress = 1 - warning.time / warning.total;
    const color = warning.kind === 'charge' ? COLORS.red : boss.color;
    drawGlow(ctx, warning.x, warning.y, boss.radius * 2.3, 0.25 + progress * 0.45, color);
    ctx.save(); ctx.globalAlpha *= 0.32 + progress * 0.4 + Math.sin(state.time * 6) * 0.08;
    circle(ctx, warning.x, warning.y, boss.radius + 12 + progress * 5, null, '#ffd078', 3); ctx.restore();
    if (warning.kind === 'divide') {
      for (const lane of warning.lanes) {
        ctx.save(); ctx.globalAlpha = 0.1 + progress * 0.3;
        line(ctx, [[lane.from.x, lane.from.y], [lane.to.x, lane.to.y]], COLORS.red, 48);
        ctx.restore();
        const fx = lane.from.x + (lane.to.x - lane.from.x) * progress, fy = lane.from.y + (lane.to.y - lane.from.y) * progress;
        line(ctx, [[lane.from.x, lane.from.y], [fx, fy]], '#e86554', 3 + progress * 28);
        ctx.setLineDash([10, 10]); line(ctx, [[lane.from.x, lane.from.y], [lane.to.x, lane.to.y]], '#fff4d0', 2); ctx.setLineDash([]);
      }
    } else if (warning.kind === 'charge') {
      line(ctx, [[warning.x, warning.y], [warning.end.x, warning.end.y]], '#bb44361c', 76);
      const fx = warning.x + (warning.end.x - warning.x) * progress, fy = warning.y + (warning.end.y - warning.y) * progress;
      ctx.save(); ctx.globalAlpha = 0.15 + progress * 0.3;
      line(ctx, [[warning.x, warning.y], [fx, fy]], COLORS.red, 76);
      ctx.restore();
    } else {
      circle(ctx, warning.x, warning.y, warning.radius, color + '18', color, 2);
      ctx.save(); ctx.globalAlpha = 0.1 + progress * 0.3;
      ctx.fillStyle = COLORS.red;
      ctx.beginPath();
      ctx.arc(warning.x, warning.y, boss.radius + (warning.radius - boss.radius) * progress, 0, Math.PI * 2);
      ctx.arc(warning.x, warning.y, boss.radius, 0, Math.PI * 2, true);
      ctx.fill(); ctx.restore();
      ctx.setLineDash([7, 8]); circle(ctx, warning.x, warning.y, warning.radius * (0.25 + progress * 0.75), null, color, 2); ctx.setLineDash([]);
      if (warning.kind === 'storm') for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; circle(ctx, warning.x + Math.cos(a) * warning.radius, warning.y + Math.sin(a) * warning.radius, 9, '#fff5da', color, 2); }
    }
  }
}

export function drawBossCallouts(ctx, state) {
  const boss = state.enemies.find(e => e.kind === 'oni' && !e.dead);
  if (!boss) return;
  if (boss.telegraph) {
    const warning = boss.telegraph;
    if (warning.kind === 'charge') {
      // The bold lane stays above sprites so the shrine cannot hide its arrowhead.
      const a = Math.atan2(warning.end.y - warning.y, warning.end.x - warning.x);
      const start = { x: warning.x + Math.cos(a) * (boss.radius + 10), y: warning.y + Math.sin(a) * (boss.radius + 10) };
      const tip = { x: warning.end.x - Math.cos(a) * 36, y: warning.end.y - Math.sin(a) * 36 };
      ctx.setLineDash([18, 12]);
      line(ctx, [[start.x, start.y], [tip.x, tip.y]], '#fffaf0', 12);
      line(ctx, [[start.x, start.y], [tip.x, tip.y]], COLORS.red, 8); ctx.setLineDash([]);
      const arrow = [[tip.x - Math.cos(a - 0.65) * 38, tip.y - Math.sin(a - 0.65) * 38], [tip.x, tip.y], [tip.x - Math.cos(a + 0.65) * 38, tip.y - Math.sin(a + 0.65) * 38]];
      line(ctx, arrow, '#fffaf0', 12); line(ctx, arrow, COLORS.red, 8);
    }
    const iconY = clamp(boss.y - boss.radius - 22, FIELD.y + 28, FIELD.y + FIELD.h - 10);
    drawAttackIcon(ctx, warning.kind, boss.x, iconY, warning.kind === 'charge' ? COLORS.red : '#f0c35b');
    const x = clamp(boss.x + boss.radius + 25, FIELD.x + 10, FIELD.x + FIELD.w - 292);
    const y = clamp(boss.y - 24, FIELD.y + 105, FIELD.y + FIELD.h - 90);
    const color = warning.kind === 'charge' ? '#ff8067' : '#f0c35b';
    panel(ctx, x, y, 282, 38, '#171c24f5', COLORS.red);
    text(ctx, `${ATTACK_NAMES[warning.kind]} ${warning.time.toFixed(1)}s`, x + 141, y + 26, 20, color, 'bold', false, 'center');
    line(ctx, [[x, y + 19], [boss.x + boss.radius + 7, boss.y]], COLORS.red, 2);
  } else if (boss.pulse <= 1.5 && !boss.stun && !boss.exposed) {
    const iconY = clamp(boss.y - boss.radius - 22, FIELD.y + 28, FIELD.y + FIELD.h - 10);
    circle(ctx, boss.x, iconY, 13, '#171c24cc', '#7a6a44', 1.5);
    ctx.save(); ctx.globalAlpha = 0.4 + Math.sin(state.time * 4) * 0.2;
    text(ctx, '?', boss.x, iconY + 6, 16, '#ddd4c1', 'bold', false, 'center'); ctx.restore();
  }
  if (state.omen.id === 'boss') {
    const x = clamp(boss.x - boss.radius - 194, FIELD.x + 10, FIELD.x + FIELD.w - 188);
    const y = clamp(boss.y - 17, FIELD.y + 105, FIELD.y + FIELD.h - 40);
    const color = state.omen.complete ? '#8bd0ac' : state.omen.failed ? '#ff8067' : '#f0c35b';
    panel(ctx, x, y, 180, 32, '#171c24f5', COLORS.gold);
    text(ctx, state.omen.failed ? 'OMEN MISSED' : `OMEN ${omenProgress(state.omen)}`, x + 90, y + 22, 15, color, 'bold', false, 'center');
  }
}
export function drawBossBanner(ctx, state) {
  const boss = state.enemies.find(e => e.kind === 'oni' && !e.dead);
  if (!boss) return;
  const phase = bossPhase(boss);
  panel(ctx, 38, 144, 938, 76, '#171c24f5', '#d5a847');
  text(ctx, boss.name, 54, 169, 21, '#fff4dc', 'bold', true);
  text(ctx, boss.phases[phase], 860, 167, 13, '#f0c35b', 'bold', false, 'right');
  for (let i = 0; i < 3; i++) circle(ctx, 885 + i * 15, 162, 4.5, i <= phase ? boss.color : '#ddcfb5');
  ctx.fillStyle = '#4a4d51'; ctx.fillRect(54, 180, 757, 12);
  ctx.fillStyle = boss.color; ctx.fillRect(54, 180, 757 * boss.hp / boss.maxHp, 12);
  for (let i = 1; i < boss.maxHp; i++) { ctx.fillStyle = '#f0c35b99'; ctx.fillRect(54 + i * 757 / boss.maxHp, 180, 2, 12); }
  text(ctx, `${boss.hp} / ${boss.maxHp}`, 958, 192, 17, '#f0c35b', 'bold', false, 'right');
  text(ctx, boss.rule + ' · +1 HIT / 2 MINIONS (MAX +3)', 54, 209, 10, '#ddd4c1', 'bold');
  text(ctx, boss.telegraph ? 'WARNING' : boss.exposed > 0 || boss.stun > 0 ? 'EXPOSED' : 'GUARDED', 958, 209, 11, boss.telegraph ? '#ef5b48' : '#f0c35b', 'bold', false, 'right');
}
