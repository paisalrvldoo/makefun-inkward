import { getSeason } from '../world/scrolls.js';

export function burst(state, x, y, count = 16, color = null) {
  const ink = color || getSeason(state).color;
  for (let i = 0; i < count; i++) {
    const angle = state.rng() * Math.PI * 2, speed = 35 + state.rng() * 150;
    state.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.7 + state.rng() * 0.6, maxLife: 1.3, size: 2 + state.rng() * 6, angle, petal: i % 3 === 0, color: i % 4 ? ink : '#262b2a' });
  }
}
export function floatText(state, x, y, text, color = '#bb4436', size = 24) {
  const repeated = state.floats.find(f => f.text === text && Math.abs(f.x - x) < 80 && Math.abs(f.y - y) < 65);
  if (repeated) { repeated.life = 1.7; return; }
  state.floats.push({ x, y, text, color, size, life: 1.7 });
}
export function addRing(state, x, y, radius, color = '#bb4436', life = 0.6) {
  state.rings.push({ x, y, radius, color, life, maxLife: life });
}
