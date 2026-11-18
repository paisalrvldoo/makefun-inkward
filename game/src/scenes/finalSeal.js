import { burst, addRing, updateEffects } from '../render/fx.js';

export function beginFinalSeal(state, boss) {
  state.finalSeal = { age: 0, duration: 3.2, x: boss.x, y: boss.y, boss: { ...boss, hp: 1, stun: 0, hitTime: 0, hitFlash: 0, telegraph: null }, burst: false };
  state.climax = null; state.frostLanes = [];
  state.mode = 'seal'; state.hitStop = 0; state.queue = [];
  state.soundEvents.push({ name: 'finalBreath' });
}

export function advanceFinalSeal(state, dt) {
  const seal = state.finalSeal;
  seal.age += dt;
  if (seal.age < 0.24) return false;
  if (!seal.burst) {
    seal.burst = true;
    burst(state, seal.x, seal.y, 230, '#f3b5b4');
    burst(state, seal.x, seal.y, 70, '#edcf77');
    addRing(state, seal.x, seal.y, 1100, '#fff6d4', 2.2);
    addRing(state, seal.x, seal.y, 850, '#e8b74f', 1.8);
    state.soundEvents.push({ name: 'finalSlash' });
  }
  state.time += dt * 0.4;
  updateEffects(state, dt * (seal.age < 1 ? 0.35 : 1));
  return seal.age >= seal.duration;
}
