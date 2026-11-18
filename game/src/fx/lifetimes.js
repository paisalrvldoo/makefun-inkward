import { updateCombatTexts } from './combatText.js';

export function updateEffects(state, dt) {
  for (const p of state.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.97; p.vy = p.vy * 0.97 + 15 * dt; p.life -= dt; p.angle += dt; }
  for (const f of state.floats) { f.y -= dt * 22; f.life -= dt; }
  for (const collection of [state.rings, state.seals, state.ghosts, state.dissolves, state.bolts, state.skillEffects, state.frostLanes]) for (const effect of collection) effect.life -= dt;
  updateCombatTexts(state, dt);
  state.particles = state.particles.filter(p => p.life > 0).slice(-500);
  state.floats = state.floats.filter(p => p.life > 0).slice(-25);
  state.rings = state.rings.filter(p => p.life > 0);
  state.seals = state.seals.filter(p => p.life > 0);
  state.ghosts = state.ghosts.filter(p => p.life > 0);
  state.dissolves = state.dissolves.filter(p => p.life > 0);
  state.bolts = state.bolts.filter(p => p.life > 0);
  state.skillEffects = state.skillEffects.filter(p => p.life > 0);
  state.frostLanes = state.frostLanes.filter(p => p.life > 0);
  state.ritualFlash = Math.max(0, state.ritualFlash - dt);
  state.shake = Math.max(0, state.shake - dt * 30);
  state.flash = Math.max(0, state.flash - dt);
}
