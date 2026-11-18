import { BRUSH_ARTS } from './catalog.js';
import { artLevel, MAX_ART_LEVEL } from './levels.js';
import { burst, floatText } from '../render/fx.js';
import { castArt } from '../fx/skillCasts.js';
import { spawnCombatText } from '../fx/combatText.js';

export const draftArtLevel = (state, id) => Math.min(MAX_ART_LEVEL, artLevel(state, id) + 1 + (state.roadChoice === 'swarm' ? 1 : 0));

export function draftArts(state) {
  const pool = BRUSH_ARTS.filter(art => (!art.unlock || state.unlocks.includes(art.unlock)) && artLevel(state, art.id) < MAX_ART_LEVEL);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(state.rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  state.draft = pool.length ? pool.slice(0, state.bonusDraft ? 4 : 3) : [{ id: 'rest', name: 'Pilgrim’s respite', rune: 'R', type: 'BELL' }];
}
export function chooseArt(state, index) {
  const art = state.draft[index];
  if (!art || (state.mode === 'draft' && !state.roadChoice)) return false;
  if (art.id === 'rest') { state.bell.hp = Math.min(state.bell.maxHp, state.bell.hp + 2); state.ink = state.maxInk; state.soundEvents.push({ name: 'bell' }); spawnCombatText(state, state.bell.x, state.bell.y - 40, '+2', 'heal', 'RESPITE'); return true; }
  const current = artLevel(state, art.id), level = draftArtLevel(state, art.id), gained = level - current;
  if (gained <= 0) return false;
  if (!state.arts.includes(art.id)) state.arts.push(art.id);
  state.artLevels[art.id] = level;
  if (art.id === 'breath') state.maxInk += 30 * gained;
  if (art.id === 'mending') { state.bell.hp = Math.min(state.bell.hp + 3 * gained, state.bell.maxHp); spawnCombatText(state, state.bell.x, state.bell.y - 40, '+' + (3 * gained), 'heal', 'MENDING'); }
  state.ink = state.maxInk;
  castArt(state, art.id, state.monk, { force: true });
  burst(state, state.monk.x, state.monk.y, 26, '#b68a36');
  floatText(state, state.monk.x, state.monk.y - 40, `${art.name.toUpperCase()} · LV ${level}`, '#b68a36', 21);
  state.soundEvents.push({ name: 'draft' });
  return true;
}
