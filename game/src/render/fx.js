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
export function updateEffects(state, dt) {
  for (const p of state.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.97; p.vy = p.vy * 0.97 + 15 * dt; p.life -= dt; p.angle += dt; }
  for (const f of state.floats) { f.y -= dt * 22; f.life -= dt; }
  for (const collection of [state.rings, state.seals, state.ghosts, state.bolts]) for (const effect of collection) effect.life -= dt;
  state.particles = state.particles.filter(p => p.life > 0).slice(-500);
  state.floats = state.floats.filter(p => p.life > 0).slice(-25);
  state.rings = state.rings.filter(p => p.life > 0);
  state.seals = state.seals.filter(p => p.life > 0);
  state.ghosts = state.ghosts.filter(p => p.life > 0);
  state.bolts = state.bolts.filter(p => p.life > 0);
  state.shake = Math.max(0, state.shake - dt * 30);
  state.flash = Math.max(0, state.flash - dt);
}
export function drawEffects(ctx, state) {
  for (const bolt of state.bolts) {
    ctx.globalAlpha = Math.min(1, bolt.life * 3);
    ctx.beginPath(); ctx.moveTo(bolt.x, bolt.y);
    for (let i = 1; i <= 7; i++) {
      const t = i / 7, offset = i === 7 ? 0 : Math.sin(i * 9.1) * 13;
      ctx.lineTo(bolt.x + (bolt.endX - bolt.x) * t + offset, bolt.y + (bolt.endY - bolt.y) * t - offset);
    }
    ctx.strokeStyle = '#b68a36'; ctx.lineWidth = 5; ctx.stroke();
    ctx.strokeStyle = '#fffaf0'; ctx.lineWidth = 2; ctx.stroke();
  }
  for (const ring of state.rings) {
    const progress = 1 - ring.life / ring.maxLife;
    ctx.globalAlpha = (1 - progress) * 0.7;
    ctx.strokeStyle = ring.color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.radius * (0.3 + progress * 0.7), 0, Math.PI * 2); ctx.stroke();
  }
  for (const p of state.particles) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
    ctx.globalAlpha = Math.min(1, p.life * 2); ctx.fillStyle = p.color;
    ctx.beginPath();
    if (p.petal) {
      ctx.moveTo(-p.size, 0); ctx.quadraticCurveTo(0, -p.size, p.size, 0);
      ctx.quadraticCurveTo(p.size * 0.2, p.size * 0.65, -p.size, 0);
    } else ctx.ellipse(0, 0, p.size * 0.65, p.size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    if (!p.petal) { ctx.beginPath(); ctx.arc(p.size * 1.8, -p.size, p.size * 0.22, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  const bigSeal = state.floats.some(f => Number(/^SEALED ×(\d+)/.exec(f.text)?.[1]) >= 4);
  for (const f of state.floats) {
    // Combo and WRATH are already readable in the permanent HUD.
    if (/^(COMBO ×|WRATH \d)/.test(f.text) || (bigSeal && f.text === 'LOTUS HUSH')) continue;
    const value = f.text.replace(/ · WRATH ×[\d.]+$/, '');
    ctx.globalAlpha = Math.min(1, f.life * 2);
    ctx.font = `bold ${f.size}px Georgia, serif`; ctx.textAlign = 'center';
    ctx.lineWidth = 5; ctx.strokeStyle = '#fffaf0'; ctx.strokeText(value, f.x, f.y);
    ctx.fillStyle = f.color; ctx.fillText(value, f.x, f.y);
  }
  ctx.globalAlpha = 1; ctx.textAlign = 'left';
}
