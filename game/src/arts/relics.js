import { addRing, floatText } from '../render/fx.js';

export const RELICS = [
  { id: 'reedQuill', name: 'Reed Quill', effect: 'Painting costs 12% less ink', color: '#7bd1b1', glyph: 'Q' },
  { id: 'dewBead', name: 'Dew Bead', effect: 'Every dash wards the bell for 1.2s', color: '#8dd8f3', glyph: 'D' },
  { id: 'emberCharm', name: 'Ember Charm', effect: '+15% seal score at combo ×3+', color: '#ffb565', glyph: 'E' },
];
export const hasRelic = (state, id) => state.relics.includes(id);
export const shrineRelic = state => RELICS[Math.floor((state.scroll - 2) / 2)] || null;
export const relicScoreBonus = state => hasRelic(state, 'emberCharm') && state.combo >= 3 ? 1.15 : 1;
export function grantRelic(state) {
  const relic = shrineRelic(state);
  if (!relic || hasRelic(state, relic.id)) return false;
  state.relics.push(relic.id);
  addRing(state, state.monk.x, state.monk.y, 110, relic.color, 1);
  floatText(state, state.monk.x, state.monk.y - 65, relic.name.toUpperCase() + ' · RELIC FOUND', relic.color, 22);
  state.soundEvents.push({ name: 'omen' });
  return true;
}
