import { distance } from '../config.js';
import { pointInPolygon, polygonArea } from './geometry.js';
import { burst, floatText, addRing } from '../render/fx.js';
import { artLevel, comboDuration } from '../arts/levels.js';
import { bossLoopDamage } from '../entities/bosses.js';
import { raiseWrath, wrathMultiplier } from '../world/wrath.js';

export function releaseSpirit(state, enemy) {
  if (enemy.dead) return;
  enemy.dead = true;
  state.sealed++; state.cleared++;
  const base = enemy.value * state.combo * (1 + artLevel(state, 'gold') * 0.3);
  const score = Math.round(base * wrathMultiplier(state));
  state.score += score; state.wrathScore += score - Math.round(base);
  if (enemy.hunter) state.huntersSealed++;
  burst(state, enemy.x, enemy.y, enemy.kind === 'oni' ? 65 : 18, enemy.color);
}
export function sealLoop(state, points) {
  if (polygonArea(points) < 1200) return false;
  const enclosed = state.enemies.filter(enemy => !enemy.dead && pointInPolygon(enemy, points) && !(enemy.kind === 'oni' && enemy.sealLock > 0));
  state.loops++;
  state.seals.push({ points: points.map(p => ({ ...p })), life: 1.4, success: enclosed.length > 0 });
  if (!enclosed.length) {
    const centre = points[Math.floor(points.length / 2)];
    floatText(state, centre.x, centre.y, 'EMPTY SEAL', '#77796b', 16);
    return true;
  }
  state.combo = state.comboTime > 0 ? Math.min(8, state.combo + 0.5) : 1;
  if (enclosed.length >= 3) state.combo = Math.min(8, state.combo + 0.5);
  state.comboTime = comboDuration(state);
  state.peakCombo = Math.max(state.peakCombo, state.combo);
  state.largestSeal = Math.max(state.largestSeal, enclosed.length);
  const before = state.score;
  raiseWrath(state, enclosed.length);
  for (const enemy of enclosed) {
    if (enemy.kind === 'oni') {
      const damage = bossLoopDamage(enemy, enclosed.length);
      if (!damage) { floatText(state, enemy.x, enemy.y - 55, 'WARD · STUN TO OPEN', '#7191a6', 19); continue; }
      enemy.hp = Math.max(0, enemy.hp - damage); enemy.sealLock = 1.3; enemy.stun = 1.4; enemy.hitTime = 0.8;
      enemy.actionTime = 0; enemy.charge = null;
      if (enemy.hp > 0) {
        state.score += Math.round(350 * state.combo);
        burst(state, enemy.x, enemy.y, 30, enemy.color);
        floatText(state, enemy.x, enemy.y - 50, `ONI SEAL · ${enemy.hp} LEFT`, enemy.color, 23);
      } else releaseSpirit(state, enemy);
    } else releaseSpirit(state, enemy);
  }
  for (let i = 0; i < artLevel(state, 'thunder'); i++) {
    const source = enclosed[0];
    const neighbour = state.enemies.find(e => !e.dead && e.kind !== 'oni' && enclosed.some(target => distance(e, target) < 90 + artLevel(state, 'thunder') * 20));
    if (neighbour) {
      releaseSpirit(state, neighbour); addRing(state, neighbour.x, neighbour.y, 55, '#b68a36');
      state.bolts.push({ x: source.x, y: source.y, endX: neighbour.x, endY: neighbour.y, life: 0.8 });
    }
  }
  const centre = enclosed.reduce((p, e) => ({ x: p.x + e.x / enclosed.length, y: p.y + e.y / enclosed.length }), { x: 0, y: 0 });
  const refund = 9 + enclosed.length * (5 + artLevel(state, 'well') * 4);
  state.ink = Math.min(state.maxInk, state.ink + refund);
  floatText(state, centre.x, centre.y - 24, `SEALED ×${enclosed.length}`, '#bb4436', 32);
  floatText(state, centre.x, centre.y + 4, `+${state.score - before}  ·  +${refund} INK`, '#b68a36', 19);
  addRing(state, centre.x, centre.y, 95, '#bb4436', 0.7);
  state.shake = 3; state.soundEvents.push({ name: 'seal' });
  state.tutorial = 'WALLS BUY TIME. CLOSED LOOPS SET THEM FREE.';
  return true;
}
