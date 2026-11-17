export const SEASONS = [
  { name: 'SPRING', subtitle: 'The waking garden', color: '#bd5364', wash: '#ed9c9f', motif: 'blossom' },
  { name: 'SUMMER', subtitle: 'The emerald rain', color: '#397b57', wash: '#91c987', motif: 'leaf' },
  { name: 'AUTUMN', subtitle: 'The wandering embers', color: '#bd4e22', wash: '#f18132', motif: 'maple' },
  { name: 'WINTER', subtitle: 'The last snowfall', color: '#3d789e', wash: '#94cce5', motif: 'snow' },
];
export const SCROLLS = [
  { name: 'A bell in bloom', season: 0, types: ['kappa', 'crane'], count: 16, interval: 2.0, boss: null },
  { name: 'Lanterns at dusk', season: 0, types: ['kappa', 'lantern', 'umbrella'], count: 23, interval: 1.6, boss: null },
  { name: 'The moss oni', season: 1, types: ['kappa', 'crane', 'eater', 'umbrella'], count: 32, interval: 1.28, boss: 'moss' },
  { name: 'A thousand paper wings', season: 1, types: ['crane', 'umbrella', 'lantern', 'kappa'], count: 40, interval: 1.02, boss: null },
  { name: 'Foxes in the firelight', season: 2, types: ['fox', 'eater', 'umbrella', 'lantern', 'crane'], count: 48, interval: 0.88, boss: null },
  { name: 'The maple oni', season: 2, types: ['fox', 'kappa', 'lantern', 'umbrella', 'eater', 'crane'], count: 62, interval: 0.72, boss: 'ember' },
  { name: 'Snow on the inkstone', season: 3, types: ['eater', 'crane', 'lantern', 'fox', 'umbrella'], count: 70, interval: 0.66, boss: null },
  { name: 'The last bell', season: 3, types: ['eater', 'fox', 'umbrella', 'crane', 'lantern', 'kappa'], count: 82, interval: 0.60, boss: 'frost' },
];
export const getScroll = state => SCROLLS[state.scroll - 1];
export const getSeason = state => SEASONS[getScroll(state).season];
