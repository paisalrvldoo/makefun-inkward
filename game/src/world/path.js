import { grantRelic } from '../arts/relics.js';
import { isAscension } from './ascension.js';
import { spawnCombatText } from '../fx/combatText.js';

export const ROADS = [
  { id: 'swarm', name: 'Swarm road', effect: '+30% spirits · +1 art level', color: '#df7150', key: 'ArrowLeft' },
  { id: 'quiet', name: 'Quiet road', effect: 'Bell heals 2 · a gentler passage', color: '#88bda8', key: 'ArrowRight' },
];
ROADS.push({ id: 'shrine', name: 'Relic shrine', effect: 'Take a permanent passive relic', color: '#d8b5fa', key: 'ArrowDown' });
export const availableRoads = state => ROADS.filter(road => road.id !== 'shrine' || [2, 4, 6].includes(state.scroll));
export const createPath = () => ['shrine', ...Array(7).fill(null)];
export const pendingRoad = state => ROADS.find(road => road.id === state.roadChoice);

export function chooseRoad(state, id) {
  if (state.mode !== 'draft' || (state.scroll >= 8 && !isAscension(state)) || !availableRoads(state).some(road => road.id === id)) return false;
  state.roadChoice = id;
  state.soundEvents.push({ name: 'click' });
  return true;
}

// Effects settle only when leaving the draft; changing a selection cannot farm healing.
export function walkRoad(state) {
  const road = pendingRoad(state);
  if (state.mode !== 'draft' || (state.scroll >= 8 && !isAscension(state)) || !road) return false;
  if (state.scroll < 8) state.route[state.scroll] = road.id;
  state.activeRoad = road.id;
  if (road.id === 'quiet') { state.bell.hp = Math.min(state.bell.maxHp, state.bell.hp + 2); spawnCombatText(state, state.bell.x, state.bell.y - 40, '+2', 'heal', 'BELL REPAIRED'); }
  if (road.id === 'shrine') grantRelic(state);
  state.roadChoice = null;
  return true;
}
