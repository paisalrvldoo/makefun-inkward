import { clamp } from '../config.js';

export const COMBAT_TEXT = {
  life: 1.2,
  rise: 64,
  critLife: 1.6,
  critRise: 86,
};

const kinds = new Set(['hit', 'crit', 'seal', 'chain', 'heal', 'ink', 'score']);

export function spawnCombatText(state, x, y, value, kind = 'hit', detail = null) {
  if (!kinds.has(kind)) kind = 'hit';
  const crit = kind === 'crit';
  const entry = {
    x: clamp(x, 24, 992), y: clamp(y, 132, 692),
    value, kind, detail,
    age: 0, life: crit ? COMBAT_TEXT.critLife : COMBAT_TEXT.life,
    rise: crit ? COMBAT_TEXT.critRise : COMBAT_TEXT.rise,
    seed: (state.combatTexts.length * 1.7 + 0.3) % 1,
  };
  state.combatTexts.push(entry);
  state.combatTexts = state.combatTexts.slice(-40);
  return entry;
}

export function updateCombatTexts(state, dt) {
  for (const t of state.combatTexts) {
    t.age += dt;
    t.y -= t.rise * dt;
  }
  state.combatTexts = state.combatTexts.filter(t => t.age < t.life);
}
