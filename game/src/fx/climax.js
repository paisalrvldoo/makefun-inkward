import { burst, addRing, updateEffects } from '../render/fx.js';

export function beginBossPhase(state, boss, phase) {
  if (state.scroll !== 8 || boss.boss !== 'frost') return;
  boss.color = ['#7191a6', '#7868ab', '#ce534c'][phase];
  boss.crest = phase === 2 ? 'flame' : 'stone';
  boss.telegraph = null; boss.charge = null; boss.actionTime = 0;
  boss.stun = Math.max(boss.stun, 0.7); boss.pulse = 0.8;
  state.frostWaves = [];
  state.climax = { kind: 'phase', time: 0, duration: 2.1, phase, boss: { ...boss } };
  state.soundEvents.push({ name: 'phaseChange', value: phase });
}

export function beginFinalSeal(state, boss) {
  state.finalSealed = true;
  state.climax = { kind: 'seal', time: 0, duration: 2.8, boss: { ...boss, dead: false } };
  state.frostWaves = []; state.hitStop = 0;
  state.soundEvents.push({ name: 'finalSeal' });
}

// Cinematic time advances independently of the slowed/frozen simulation.
export function updateClimax(state, dt) {
  const scene = state.climax;
  if (!scene) return 1;
  const before = scene.time;
  scene.time += dt;
  if (scene.kind === 'seal') {
    if (before < 0.24 && scene.time >= 0.24) {
      burst(state, scene.boss.x, scene.boss.y, 150, '#f3c96d');
      burst(state, scene.boss.x, scene.boss.y, 90, '#ed9c9f');
      addRing(state, scene.boss.x, scene.boss.y, 1100, '#fff3c0', 1.6);
      state.soundEvents.push({ name: 'sealImpact' });
    }
    if (scene.time > 0.24) updateEffects(state, dt);
  }
  if (scene.time >= scene.duration) state.climax = null;
  return scene.kind === 'seal' ? 0 : 0.16;
}
