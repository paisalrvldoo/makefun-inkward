import { distance } from '../config.js';
import { hurtMonk } from '../fx/characterStates.js';
import { recordOmenBellHit } from '../world/omens.js';
import { addRing, floatText } from '../render/fx.js';

const TAU = Math.PI * 2;
export function frostSector(wave, point) {
  return Math.floor(((Math.atan2(point.y - wave.y, point.x - wave.x) - wave.angle) % TAU + TAU) % TAU / (TAU / 6));
}
export const frostSafe = (wave, point) => wave.broken.includes(frostSector(wave, point));

export function releaseWhiteout(state, boss, warning) {
  for (let i = 0; i < 2; i++) state.frostWaves.push({ x: boss.x, y: boss.y, angle: warning.angle, radius: 30, delay: i * 0.8, broken: [1, 4], touched: [] });
  state.soundEvents.push({ name: 'whiteout' });
}

export function updateFrostWaves(state, dt) {
  for (const wave of state.frostWaves) {
    wave.delay -= dt;
    if (wave.delay > 0) continue;
    const before = wave.radius;
    wave.radius += dt * 205;
    // Painted walls break a spoke; dash and the two open wedges also evade it.
    for (const stroke of state.strokes) {
      if (stroke.life <= 0 || stroke.integrity <= 0) continue;
      const point = stroke.points.find(p => Math.abs(distance(p, wave) - wave.radius) < 18 && !frostSafe(wave, p));
      if (point) {
        wave.broken.push(frostSector(wave, point)); stroke.integrity -= 0.18; stroke.flash = 0.3;
        addRing(state, point.x, point.y, 55, '#f6d581');
        state.soundEvents.push({ name: 'wallHit' });
      }
    }
    for (const [id, target] of [['monk', state.monk], ['bell', state.bell]]) {
      const r = distance(target, wave);
      if (wave.touched.includes(id) || r < before - 20 || r > wave.radius + 20 || frostSafe(wave, target)) continue;
      wave.touched.push(id);
      if (id === 'monk') {
        if (target.dashTime > 0 || target.hurtTime > 0) continue;
        hurtMonk(state, wave); state.ink = Math.max(0, state.ink - 12);
        floatText(state, target.x, target.y - 35, 'WHITEOUT · −12 INK', '#ce534c', 17);
      } else {
        if (target.wardTime > 0) { addRing(state, target.x, target.y, 85, '#f6d581'); continue; }
        target.hp = Math.max(0, target.hp - 1); target.hitTime = 0.7;
        recordOmenBellHit(state, 1); state.soundEvents.push({ name: 'bellHit' });
      }
    }
  }
  state.frostWaves = state.frostWaves.filter(w => w.radius < 1100);
}
