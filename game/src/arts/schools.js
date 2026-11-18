import { artLevel } from './levels.js';

export const SCHOOLS = [
  { id: 'carve', name: 'CARVE', color: '#ff8870', arts: ['vermilion', 'twin', 'stone', 'willow'], bonus: '+25% WALL LIFE' },
  { id: 'flow', name: 'FLOW', color: '#82ddd8', arts: ['breath', 'well', 'feather', 'echo', 'moonInk'], bonus: '+20% INK REFILL' },
  { id: 'bloom', name: 'BLOOM', color: '#ffd783', arts: ['thunder', 'gold', 'lotus', 'mending', 'afterglow'], bonus: '+15% SEAL SCORE' },
];
export const artSchool = id => SCHOOLS.find(school => school.arts.includes(id));
export const schoolCount = (state, school) => school.arts.filter(id => artLevel(state, id) > 0).length;
export const activeSynergies = state => SCHOOLS.filter(school => schoolCount(state, school) >= 2);
export const synergyBonus = (state, id) => schoolCount(state, SCHOOLS.find(s => s.id === id)) >= 2 ? { carve: 1.25, flow: 1.2, bloom: 1.15 }[id] : 1;
