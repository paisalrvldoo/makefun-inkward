import { distance } from '../config.js';
import { pointInPolygon, polygonArea } from './geometry.js';
import { burst, floatText, addRing } from '../render/fx.js';
import { artLevel, comboDuration } from '../arts/levels.js';
import { bossLoopDamage } from '../entities/bosses.js';
import { raiseWrath, wrathMultiplier } from '../world/wrath.js';
import { recordOmenSeal } from '../world/omens.js';
import { castArt } from '../fx/skillCasts.js';
import { dissolveSpirit } from '../fx/characterStates.js';
import { synergyBonus } from '../arts/schools.js';

export function releaseSpirit(state, enemy) {
  if (enemy.dead) return;
  enemy.dead = true;
  dissolveSpirit(state, enemy);
  state.sealed++; state.cleared++;
  const base = enemy.value * state.combo * (1 + artLevel(state, 'gold') * 0.3) * synergyBonus(state, 'bloom');
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
  const previousCombo = state.combo;
  state.combo = state.comboTime > 0 ? Math.min(8, state.combo + 0.5) : 1;
  if (enclosed.length >= 3) state.combo = Math.min(8, state.combo + 0.5);
  state.comboTime = comboDuration(state);
  state.peakCombo = Math.max(state.peakCombo, state.combo);
  state.largestSeal = Math.max(state.largestSeal, enclosed.length);
  if (Math.floor(state.combo) > Math.floor(previousCombo)) {
    floatText(state, state.monk.x, state.monk.y + 66, `COMBO ×${state.combo.toFixed(1)}`, '#bb4436', 22);
    state.soundEvents.push({ name: 'combo', value: state.combo });
  }
  const before = state.score;
  raiseWrath(state, enclosed.length);
  for (const enemy of enclosed) {
    if (enemy.kind === 'oni') {
      const damage = bossLoopDamage(enemy, enclosed.length);
      if (!damage) { floatText(state, enemy.x, enemy.y - 55, 'WARD · STUN TO OPEN', '#7191a6', 19); continue; }
      enemy.hp = Math.max(0, enemy.hp - damage); enemy.sealLock = 1.3; enemy.stun = 1.4; enemy.hitTime = 0.8;
      enemy.hitFlash = 0.14;
      enemy.actionTime = 0; enemy.charge = null;
      if (enemy.hp > 0) {
        state.score += Math.round(350 * state.combo);
        burst(state, enemy.x, enemy.y, 30, enemy.color);
        floatText(state, enemy.x, enemy.y - 50, `ONI SEAL · ${enemy.hp} LEFT`, enemy.color, 23);
      } else releaseSpirit(state, enemy);
    } else releaseSpirit(state, enemy);
  }
  recordOmenSeal(state, enclosed);
  const chain = [...enclosed];
  for (let i = 0; i < artLevel(state, 'thunder'); i++) {
    const neighbour = state.enemies.find(e => !e.dead && e.kind !== 'oni' && enclosed.some(target => distance(e, target) < 90 + artLevel(state, 'thunder') * 20));
    if (neighbour) {
      releaseSpirit(state, neighbour); addRing(state, neighbour.x, neighbour.y, 55, '#b68a36');
      chain.push(neighbour);
    }
  }
  const centre = enclosed.reduce((p, e) => ({ x: p.x + e.x / enclosed.length, y: p.y + e.y / enclosed.length }), { x: 0, y: 0 });
  if (artLevel(state, 'thunder')) { castArt(state, 'thunder', chain[0], { targets: chain.slice(1), force: true }); state.ritualFlash = Math.max(state.ritualFlash, 0.1); state.impactColor = '#fff0a2'; }
  if (artLevel(state, 'gold')) castArt(state, 'gold', centre, { radius: 90 });
  if (artLevel(state, 'echo')) castArt(state, 'echo', centre, { radius: 100 });
  if (artLevel(state, 'well')) castArt(state, 'well', centre, { radius: 50 });
  const refund = 9 + enclosed.length * (5 + artLevel(state, 'well') * 4);
  state.ink = Math.min(state.maxInk, state.ink + refund);
  floatText(state, centre.x, centre.y - 24, `SEALED ×${enclosed.length} +${(state.score - before).toLocaleString('en-US')}`, '#bb4436', 29);
  floatText(state, centre.x, centre.y + 4, `+${refund} INK · WRATH ×${wrathMultiplier(state).toFixed(1)}`, '#b68a36', 17);
  addRing(state, centre.x, centre.y, 95, '#bb4436', 0.7);
  state.shake = 3; state.soundEvents.push({ name: 'seal' });
  state.soundEvents.push({ name: 'petals' });
  if (enclosed.length >= 4 || enclosed.some(e => e.kind === 'oni' && e.dead)) {
    state.hitStop = 0.075; state.shake = 5;
    state.soundEvents.push({ name: 'bigSeal' });
  }
  state.tutorial = 'WALLS BUY TIME. CLOSED LOOPS SET THEM FREE.';
  return true;
}
