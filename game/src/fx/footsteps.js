export function landingDust(state, monk, heavy = false) {
  const count = heavy ? 10 : 2;
  for (let i = 0; i < count; i++) {
    const side = i % 2 ? 1 : -1, spread = 25 + i * 5;
    state.particles.push({ x: monk.x + side * 5, y: monk.y + 18, vx: side * spread, vy: -8 - i * 2, life: heavy ? 0.38 : 0.2, maxLife: 0.4, size: heavy ? 3 + i % 3 : 2, angle: i, petal: false, color: i % 3 ? '#c7ad74' : '#f7edcd', dust: true });
  }
  state.soundEvents.push({ name: heavy ? 'landing' : 'step' });
}
