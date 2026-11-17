import { COLORS } from '../config.js';
import { bossPhase, ATTACK_NAMES } from '../entities/bosses.js';
import { text, panel, circle, line } from './primitives.js';

export function drawBossTelegraphs(ctx, state) {
  for (const boss of state.enemies) {
    if (boss.kind !== 'oni' || !boss.telegraph) continue;
    const warning = boss.telegraph, progress = 1 - warning.time / warning.total;
    const color = warning.kind === 'charge' ? COLORS.red : boss.color;
    if (warning.kind === 'charge') {
      line(ctx, [[warning.x, warning.y], [warning.end.x, warning.end.y]], '#bb44361c', 76);
      ctx.setLineDash([12, 8]); line(ctx, [[warning.x, warning.y], [warning.end.x, warning.end.y]], color, 3); ctx.setLineDash([]);
      const a = Math.atan2(warning.end.y - warning.y, warning.end.x - warning.x);
      const tip = { x: warning.end.x - Math.cos(a) * 42, y: warning.end.y - Math.sin(a) * 42 };
      line(ctx, [[tip.x - Math.cos(a - 0.6) * 28, tip.y - Math.sin(a - 0.6) * 28], [tip.x, tip.y], [tip.x - Math.cos(a + 0.6) * 28, tip.y - Math.sin(a + 0.6) * 28]], color, 4);
    } else {
      circle(ctx, warning.x, warning.y, warning.radius, color + '18', color, 2);
      ctx.setLineDash([7, 8]); circle(ctx, warning.x, warning.y, warning.radius * (0.25 + progress * 0.75), null, color, 2); ctx.setLineDash([]);
      if (warning.kind === 'storm') for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; circle(ctx, warning.x + Math.cos(a) * warning.radius, warning.y + Math.sin(a) * warning.radius, 9, '#fff5da', color, 2); }
    }
    const labelY = warning.kind === 'charge' ? Math.max(254, warning.y + 12) : Math.max(240, warning.y - warning.radius - 20);
    const labelX = warning.kind === 'charge' ? Math.min(810, warning.x + 205) : warning.x;
    panel(ctx, labelX - 119, labelY - 22, 238, 29, '#171c24ee', '#d5a847');
    text(ctx, `${ATTACK_NAMES[warning.kind]} · ${warning.time.toFixed(1)}s`, labelX, labelY - 2, 14, warning.kind === 'charge' ? '#ef5b48' : '#f0c35b', 'bold', false, 'center');
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
