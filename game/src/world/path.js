export const ROADS = [
  { id: 'swarm', name: 'Swarm road', effect: '+30% spirits · +1 art level', color: '#df7150', key: 'ArrowLeft' },
  { id: 'quiet', name: 'Quiet road', effect: 'Bell heals 2 · a gentler passage', color: '#88bda8', key: 'ArrowRight' },
];
export const createPath = () => ['shrine', ...Array(7).fill(null)];
export const pendingRoad = state => ROADS.find(road => road.id === state.roadChoice);

export function chooseRoad(state, id) {
  if (state.mode !== 'draft' || state.scroll >= 8 || !ROADS.some(road => road.id === id)) return false;
  state.roadChoice = id;
  state.soundEvents.push({ name: 'click' });
  return true;
}

// Effects settle only when leaving the draft; changing a selection cannot farm healing.
export function walkRoad(state) {
  const road = pendingRoad(state);
  if (state.mode !== 'draft' || state.scroll >= 8 || !road) return false;
  state.route[state.scroll] = road.id;
  state.activeRoad = road.id;
  if (road.id === 'quiet') state.bell.hp = Math.min(state.bell.maxHp, state.bell.hp + 2);
  state.roadChoice = null;
  return true;
}
