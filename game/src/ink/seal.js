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
import { finalPhase, finalSealHealth, beginFinalPhase } from '../entities/finalBoss.js';
import { beginFinalSeal } from '../scenes/finalSeal.js';

import { relicScoreBonus } from '../arts/relics.js';

import { beginScoreBurst } from '../fx/scoreBurst.js';
import { releaseInkMotes } from '../fx/inkMotes.js';
import { addUltFromSeal } from '../arts/ultimate.js';

import { rollInkGold } from '../run/shop.js';
import { spawnCombatText } from '../fx/combatText.js';

export function releaseSpirit(state, enemy) {
  if (enemy.dead) return;
  enemy.dead = true;
  dissolveSpirit(state, enemy);
  state.sealed++; state.cleared++;
  if (!enemy.hunter) { const k = enemy.kind || 'unknown'; state.yokaiByType = state.yokaiByType || {}; state.yokaiByType[k] = (state.yokaiByType[k] || 0) + 1; }
  const base = enemy.value * state.combo * (1 + artLevel(state, 'gold') * 0.3) * synergyBonus(state, 'bloom') * relicScoreBonus(state) * (state.comboHeat >= 1 ? 1.25 : 1);
  const score = Math.round(base * wrathMultiplier(state));
  state.score += score; state.wrathScore += score - Math.round(base);
  if (enemy.hunter) state.huntersSealed++;
  burst(state, enemy.x, enemy.y, enemy.kind === 'oni' ? 65 : 18, enemy.color);
  const gold = rollInkGold(state, enemy);
  if (gold > 0) {
    state.inkGold = (state.inkGold || 0) + gold;
    floatText(state, enemy.x, enemy.y - 28, '+' + gold + ' \u25c9', '#f0c35b', 16);
  }
  spawnCombatText(state, enemy.x, enemy.y - enemy.radius - 6, '+' + score.toLocaleString('en-US'), 'score', 'SCORE');
  if (enemy.boss === 'frost' && state.scroll === 8) {
    beginFinalSeal(state, enemy);
    for (const spirit of state.enemies) if (!spirit.dead) releaseSpirit(state, spirit);
  }
}
export function sealLoop(state, points) {
  if (polygonArea(points) < 1200) return false;
  const enclosed = state.enemies.filter(enemy => !enemy.dead && pointInPolygon(enemy, points) && !(enemy.kind === 'oni' && enemy.sealLock > 0));
  state.loops++;
  state.seals.push({ points: points.map(p => ({ ...p })), life: 1.4, success: enclosed.length > 0 });
  if (!enclosed.length) {
    const centre = points[Math.floor(points.length / 2)];
    floatText(state, centre.x, centre.y, 'EMPTY SEAL', '#77796b', 16);
    addRing(state, centre.x, centre.y, 48, '#7f8d88', 0.4);
    state.soundEvents.push({ name: 'emptySeal' });
    return true;
  }
  const previousCombo = state.combo;
  state.combo = state.comboTime > 0 ? Math.min(8, state.combo + 0.5) : 1;
  if (enclosed.length >= 3) state.combo = Math.min(8, state.combo + 0.5);
  state.comboTime = comboDuration(state);
  state.peakCombo = Math.max(state.peakCombo, state.combo);
  state.comboHeat = Math.min(1, state.comboHeat + 0.15 + enclosed.length * 0.05);
  state.largestSeal = Math.max(state.largestSeal, enclosed.length);
if (Math.floor(state.combo) > Math.floor(previousCombo)) {
    floatText(state, state.monk.x, state.monk.y + 66, `COMBO \u00d7${state.combo.toFixed(1)}`, '#bb4436', 22);
    state.soundEvents.push({ name: 'combo', value: state.combo });
  }
  if (enclosed.length >= 2) {
    const chainCount = enclosed.length + artLevel(state, 'thunder');
    if (chainCount >= 2) spawnCombatText(state, state.monk.x, state.monk.y - 96, `CHAIN ×${chainCount}!`, 'chain', chainCount >= 4 ? 'UNSTOPPABLE' : null);
  }
  if (state.comboHeat >= 1 && (state.comboHeat - enclosed.length * 0.05 - 0.15) < 1) {
    floatText(state, state.monk.x, state.monk.y - 72, 'HEAT MAX \u00b7 +25% SCORE', '#f2a247', 20);
    state.soundEvents.push({ name: 'seal' });
  }
  const before = state.score;
  raiseWrath(state, enclosed.length);
  for (const enemy of enclosed) {
    if (enemy.kind === 'oni') {
      const damage = bossLoopDamage(enemy, enclosed.length);
      if (!damage) { floatText(state, enemy.x, enemy.y - 55, 'WARD · STUN TO OPEN', '#7191a6', 19); continue; }
      const phase = enemy.boss === 'frost' ? finalPhase(enemy) : 0;
      enemy.hp = enemy.boss === 'frost' && state.scroll === 8 ? finalSealHealth(enemy, damage) : Math.max(0, enemy.hp - damage);
      enemy.sealLock = 1.3; enemy.stun = 1.4; enemy.hitTime = 0.8;
      enemy.hitFlash = 0.14;
      enemy.actionTime = 0; enemy.charge = null;
      if (enemy.boss === 'frost' && enemy.hp > 0 && state.scroll === 8 && finalPhase(enemy) !== phase) beginFinalPhase(state, enemy);
      if (enemy.hp > 0) {
        state.score += Math.round(350 * state.combo);
        burst(state, enemy.x, enemy.y, 30, enemy.color);
        floatText(state, enemy.x, enemy.y - 50, `ONI SEAL · ${enemy.hp} LEFT`, enemy.color, 23);
        spawnCombatText(state, enemy.x, enemy.y - enemy.radius - 18, String(damage), damage >= 3 ? 'crit' : 'hit', damage >= 3 ? 'CRIT!' : null);
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
  spawnCombatText(state, centre.x, centre.y - 60, `SEALED ×${enclosed.length}`, 'seal', '+' + (state.score - before).toLocaleString('en-US'));
  if (refund >= 10) spawnCombatText(state, centre.x + 70, centre.y - 24, '+' + refund, 'ink', 'INK');
  beginScoreBurst(state, centre, state.score - before, enclosed.length);
  releaseInkMotes(state, enclosed);
  addRing(state, centre.x, centre.y, 95, '#bb4436', 0.7);
  addUltFromSeal(state, enclosed.length, enclosed.some(e => e.kind === 'oni'));
  state.shake = 3; state.soundEvents.push({ name: 'seal' });
  state.soundEvents.push({ name: 'petals' });
  if (enclosed.length >= 3 || enclosed.some(e => e.kind === 'oni' && e.hitFlash > 0)) {
    state.hitStop = enclosed.some(e => e.kind === 'oni') || enclosed.length >= 4 ? 0.065 : 0.045; state.shake = 5;
    state.soundEvents.push({ name: 'bigSeal' });
  }
  state.tutorial = 'WALLS BUY TIME. CLOSED LOOPS SET THEM FREE.';
  return true;
}
