import { distance } from '../config.js';
import { addRing } from '../render/fx.js';

// Ink settles on the seal frame; these motes make that immediate refund visible.
// Cosmetic trajectories use an index, preserving the seeded simulation stream.
export function releaseInkMotes(state, enemies) {
  for (let i = 0; i < Math.min(16, enemies.length * 2); i++) {
    const e = enemies[i % enemies.length], angle = i * 2.39996;
    state.inkMotes.push({ x: e.x + Math.cos(angle) * 18, y: e.y + Math.sin(angle) * 18, age: 0, delay: i * 0.035, trail: [], dead: false });
  }
  state.inkMotes = state.inkMotes.slice(-64);
}
export function updateInkMotes(state, dt) {
  state.pickupChainTime = Math.max(0, state.pickupChainTime - dt);
  if (!state.pickupChainTime) state.pickupChain = 0;
  for (const mote of state.inkMotes) {
    mote.age += dt;
    if (mote.age < 0.16 + mote.delay) continue;
    const length = distance(mote, state.monk) || 1;
    const travel = Math.min(length, (260 + mote.age * 700) * dt);
    mote.trail.unshift({ x: mote.x, y: mote.y }); mote.trail.length = Math.min(5, mote.trail.length);
    mote.x += (state.monk.x - mote.x) / length * travel; mote.y += (state.monk.y - mote.y) / length * travel;
    if (length < 20 || mote.age > 2.5) {
      mote.dead = true; state.pickupChain = Math.min(18, state.pickupChain + 1); state.pickupChainTime = 0.55;
      state.soundEvents.push({ name: 'pickup', value: state.pickupChain });
      addRing(state, state.monk.x, state.monk.y, 28, '#79c7b5', 0.22);
    }
  }
  state.inkMotes = state.inkMotes.filter(m => !m.dead);
}
