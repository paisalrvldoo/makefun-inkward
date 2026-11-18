import { COLORS, FIELD, clamp } from '../config.js';
import { bossPhase, ATTACK_NAMES } from '../entities/bosses.js';
import { text, panel, circle, line } from './primitives.js';
import { omenProgress } from '../world/omens.js';
import { drawGlow } from './light.js';

export function drawBossTelegraphs(ctx, state) {
  for (const boss of state.enemies) {
    if (boss.kind !== 'oni' || boss.dead || !boss.telegraph) continue;
    const warning = boss.telegraph, progress = 1 - warning.time / warning.total;
    const color = warning.kind === 'charge' ? COLORS.red : boss.color;
    drawGlow(ctx, warning.x, warning.y, boss.radius * 2.3, 0.25 + progress * 0.45, color);
    ctx.save(); ctx.globalAlpha *= 0.32 + progress * 0.4 + Math.sin(state.time * 6) * 0.08;
    circle(ctx, warning.x, warning.y, boss.radius + 12 + progress * 5, null, '#ffd078', 3); ctx.restore();
    if (warning.kind === 'charge') {
      line(ctx, [[warning.x, warning.y], [warning.end.x, warning.end.y]], '#bb44361c', 76);
    } else {
      circle(ctx, warning.x, warning.y, warning.radius, color + '18', color, 2);
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
    const x = clamp(boss.x + boss.radius + 25, FIELD.x + 10, FIELD.x + FIELD.w - 292);
    const y = clamp(boss.y - 24, FIELD.y + 105, FIELD.y + FIELD.h - 90);
    const color = warning.kind === 'charge' ? '#ff8067' : '#f0c35b';
    panel(ctx, x, y, 282, 38, '#171c24f5', COLORS.red);
    text(ctx, `${ATTACK_NAMES[warning.kind]} ${warning.time.toFixed(1)}s`, x + 141, y + 26, 20, color, 'bold', false, 'center');
    line(ctx, [[x, y + 19], [boss.x + boss.radius + 7, boss.y]], COLORS.red, 2);
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
