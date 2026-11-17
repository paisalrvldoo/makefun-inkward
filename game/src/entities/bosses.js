import { distance } from '../config.js';
import { addRing, floatText } from '../render/fx.js';

export const ONI = {
  moss: { name: 'MOSS-CROWNED ONI', color: '#63846d', hp: 3, speed: 16, value: 1200 },
  ember: { name: 'EMBER-CROWNED ONI', color: '#bf6341', hp: 4, speed: 18, value: 1800 },
  frost: { name: 'FROST-CROWNED ONI', color: '#7191a6', hp: 5, speed: 19, value: 2600 },
};
export function spawnBoss(state, kind, point) {
  const stats = ONI[kind];
  state.enemies.push({
    ...point, ...stats, kind: 'oni', boss: kind, id: state.nextId++, maxHp: stats.hp,
    radius: 36, phase: 0, age: 0, stun: 0, hitTime: 0, blocked: 0, dead: false, pulse: 7, sealLock: 0,
  });
  state.banner = stats.name; state.bannerTime = 3.5;
  floatText(state, point.x, point.y + 55, 'ENCIRCLE ' + stats.hp + ' TIMES', stats.color, 18);
  state.soundEvents.push({ name: 'bell' });
}
export function updateBosses(state, dt) {
  for (const enemy of state.enemies) {
    if (enemy.kind !== 'oni' || enemy.dead) continue;
    enemy.sealLock = Math.max(0, enemy.sealLock - dt);
    if (enemy.stun > 0) continue;
    enemy.pulse -= dt;
    if (enemy.pulse <= 0) {
      enemy.pulse = 7.5;
      addRing(state, enemy.x, enemy.y, 125, enemy.color, 1.2);
      for (const stroke of state.strokes) {
        if (stroke.points.some(p => distance(p, enemy) < 125)) stroke.integrity -= 0.4;
      }
      floatText(state, enemy.x, enemy.y - 50, 'INK SHATTER', enemy.color, 17);
      state.soundEvents.push({ name: 'splash' });
    }
  }
}
