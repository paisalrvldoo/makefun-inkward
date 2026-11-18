export function dissolveSpirit(state, enemy) {
  if (enemy.dissolving) return;
  enemy.dissolving = true; enemy.animation = 'death';
  state.dissolves.push({ ...enemy, hitTime: 0, stun: 0, life: 0.75, maxLife: 0.75 });
  state.dissolves = state.dissolves.slice(-28);
  for (let i = 0; i < (enemy.kind === 'oni' ? 32 : 12); i++) {
    const angle = i * 2.39996 + enemy.id, speed = 40 + i % 5 * 18;
    state.particles.push({ x: enemy.x + Math.cos(angle) * enemy.radius * 0.6, y: enemy.y + Math.sin(angle) * enemy.radius * 0.7, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 40, life: 0.65 + i % 4 * 0.12, maxLife: 1.1, size: 3 + i % 4, angle, petal: true, color: i % 3 ? '#efb8bd' : '#252936' });
  }
}
export function hurtMonk(state, enemy) {
  const monk = state.monk, dx = monk.x - enemy.x, dy = monk.y - enemy.y, length = Math.hypot(dx, dy) || 1;
  monk.hurtTime = 0.9; monk.hitFlash = 0.12; monk.recoil = 0.16;
  monk.recoilX = dx / length * 240; monk.recoilY = dy / length * 240;
}
