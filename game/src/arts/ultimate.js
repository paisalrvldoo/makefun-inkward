import { FIELD, WIDTH, HEIGHT, clamp } from '../config.js';
import { floatText, addRing, burst } from '../render/fx.js';
import { releaseSpirit } from '../ink/seal.js';
import { bossLoopDamage } from '../entities/bosses.js';
import { finalPhase, beginFinalPhase, finalSealHealth } from '../entities/finalBoss.js';

export const ULT_MAX = 100;
const ULT_DURATION = 1.85;

export function ultCharge(state) {
  return clamp(state.ultMeter ?? 0, 0, ULT_MAX);
}
export function ultReady(state) {
  return (state.ultMeter ?? 0) >= ULT_MAX && !state.ult;
}
export function ultRatio(state) {
  return clamp((state.ultMeter ?? 0) / ULT_MAX, 0, 1);
}
export function fillUlt(state, amount) {
  if (state.ult) return;
  const before = state.ultMeter ?? 0;
  state.ultMeter = clamp(before + amount, 0, ULT_MAX);
  if (before < ULT_MAX && state.ultMeter >= ULT_MAX) {
    floatText(state, WIDTH / 2, HEIGHT / 2 - 90, 'GREAT SEAL READY', '#ffd273', 26);
  }
}
export function addUltFromSeal(state, enclosedCount, bossHit) {
  let amount = 5 + enclosedCount * 3;
  if (bossHit) amount += 8;
  fillUlt(state, amount);
}
export function addUltFromDamage(state, damage) {
  fillUlt(state, Math.min(10, damage * 1.4));
}
export function addUltFromCombo(state, combo) {
  fillUlt(state, Math.min(6, combo * 0.8));
}

export function tryUltimate(state) {
  if (!ultReady(state)) return false;
  state.ult = { age: 0, duration: ULT_DURATION, hits: false };
  state.shake = 16; state.flash = 0.6; state.ritualFlash = 0.9;
  state.impactColor = '#fffaf0';
  state.ultMeter = 0;
  state.hitStop = 0.18;
  state.soundEvents.push({ name: 'ultimate' });
  state.soundEvents.push({ name: 'bigSeal' });
  addRing(state, WIDTH / 2, HEIGHT / 2, 120, '#fffaf0', 1.2);
  return true;
}

export function updateUlt(state, dt) {
  const ult = state.ult;
  if (!ult) return;
  ult.age += dt;
  if (ult.age >= 0.45 && !ult.hits) {
    ult.hits = true;
    applyGreatSeal(state);
  }
  state.shake = Math.max(state.shake, 10 - ult.age * 6);
  if (ult.age >= ult.duration) {
    state.ult = null;
  }
}

function applyGreatSeal(state) {
  const before = state.score;
  const bosses = [];
  for (const enemy of state.enemies) {
    if (enemy.dead) continue;
    if (enemy.kind === 'oni') { bosses.push(enemy); continue; }
    releaseSpirit(state, enemy);
  }
  for (const boss of bosses) {
    if (boss.dead || boss.cinematicTime > 0) continue;
    const damage = 2 + (boss.maxHp >= 5 ? 2 : 1);
    const phase = boss.boss === 'frost' ? finalPhase(boss) : 0;
    boss.hp = boss.boss === 'frost' && state.scroll === 8 ? finalSealHealth(boss, damage) : Math.max(0, boss.hp - damage);
    boss.sealLock = 1.3; boss.stun = 1.6; boss.hitTime = 0.9; boss.hitFlash = 0.18;
    boss.actionTime = 0; boss.charge = null;
    if (boss.boss === 'frost' && boss.hp > 0 && state.scroll === 8 && finalPhase(boss) !== phase) beginFinalPhase(state, boss);
    burst(state, boss.x, boss.y, 40, boss.color);
    if (boss.hp <= 0) releaseSpirit(state, boss);
    else floatText(state, boss.x, boss.y - 60, 'GREAT SEAL · ' + boss.hp + ' LEFT', '#ffd273', 24);
  }
  for (let i = 0; i < 90; i++) burst(state, FIELD.x + state.rng() * FIELD.w, FIELD.y + state.rng() * FIELD.h, 4, '#1a2226');
  const sealed = state.enemies.filter(e => e.dead).length;
  const gained = state.score - before;
  floatText(state, WIDTH / 2, FIELD.y + FIELD.h / 2, 'ULTIMATE!', '#fffaf0', 56);
  floatText(state, WIDTH / 2, FIELD.y + FIELD.h / 2 + 50, '+' + gained.toLocaleString('en-US') + ' SCORE', '#ffd273', 28);
  addRing(state, WIDTH / 2, HEIGHT / 2, 400, '#fffaf0', 1.0);
}
