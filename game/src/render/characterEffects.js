import { circle, line } from './primitives.js';
import { drawYokai } from './sprites.js';

export function drawHunterAura(ctx, enemy, time) {
  ctx.save();
  const radius = enemy.radius + 10, pulse = Math.sin(time * 7 + enemy.id);
  circle(ctx, enemy.x, enemy.y, radius + pulse * 3, '#ef534025', '#d9493d', 1.5);
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5 + time * 0.8, x = enemy.x + Math.cos(a) * radius, y = enemy.y + Math.sin(a) * radius;
    ctx.fillStyle = i % 2 ? '#ffc478' : '#ed5c43'; ctx.globalAlpha = 0.55 + pulse * 0.15;
    ctx.beginPath(); ctx.moveTo(x - 3, y + 5); ctx.quadraticCurveTo(x - 7, y - 2, x + Math.sin(time * 9 + i) * 4, y - 16); ctx.quadraticCurveTo(x + 7, y, x + 3, y + 5); ctx.fill();
  }
  ctx.restore();
}
export function drawDissolves(ctx, state) {
  for (const ghost of state.dissolves) {
    const progress = 1 - ghost.life / ghost.maxLife;
    ctx.save(); ctx.globalAlpha = (1 - progress) * 0.9;
    ctx.beginPath();
    for (let row = 0; row < 16; row++) for (let col = 0; col < 16; col++) {
      if ((row * 37 + col * 19 + ghost.id * 13) % 97 / 97 > progress) ctx.rect(ghost.x - 64 + col * 8, ghost.y - 64 + row * 8 - progress * 12, 8, 8);
    }
    ctx.clip(); drawYokai(ctx, { ...ghost, y: ghost.y - progress * 12 }, state.time, 1, true); ctx.restore();
  }
}
export function drawAttackIntent(ctx, enemy) {
  if (enemy.kind === 'oni' || enemy.animation !== 'attack') return;
  const progress = 1 - (enemy.windup || 0) / 0.24;
  ctx.save(); ctx.globalAlpha = 0.4 + progress * 0.4;
  circle(ctx, enemy.x, enemy.y + 10, enemy.radius + 9, '#eb574121', '#b94135', 1.5);
  ctx.beginPath(); ctx.arc(enemy.x, enemy.y + 10, enemy.radius + 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress); ctx.strokeStyle = '#e94e37'; ctx.lineWidth = 3; ctx.stroke();
  line(ctx, [[enemy.x - 2, enemy.y - enemy.radius - 12], [enemy.x + 2, enemy.y - enemy.radius - 5]], '#ba4234', 3); ctx.restore();
}
