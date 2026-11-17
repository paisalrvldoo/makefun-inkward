export const SEASONS = [
  { name: 'SPRING', subtitle: 'The waking garden', color: '#cf878a', wash: '#efc6c0', motif: 'blossom' },
  { name: 'SUMMER', subtitle: 'The emerald rain', color: '#648e75', wash: '#bed8b5', motif: 'leaf' },
  { name: 'AUTUMN', subtitle: 'The wandering embers', color: '#ba793e', wash: '#efd1a0', motif: 'maple' },
  { name: 'WINTER', subtitle: 'The last snowfall', color: '#7191a6', wash: '#c7dce3', motif: 'snow' },
];
export const SCROLLS = [
  { name: 'A bell in bloom', season: 0, types: ['kappa', 'crane'], count: 16, interval: 2.0, boss: null },
  { name: 'Lanterns at dusk', season: 0, types: ['kappa', 'lantern', 'umbrella'], count: 23, interval: 1.6, boss: null },
  { name: 'The moss-crowned oni', season: 1, types: ['kappa', 'crane', 'eater'], count: 25, interval: 1.45, boss: 'moss' },
  { name: 'A thousand paper wings', season: 1, types: ['crane', 'umbrella', 'lantern'], count: 30, interval: 1.25, boss: null },
  { name: 'Foxes in the firelight', season: 2, types: ['fox', 'eater', 'umbrella'], count: 34, interval: 1.1, boss: null },
  { name: 'The ember-crowned oni', season: 2, types: ['fox', 'kappa', 'lantern'], count: 36, interval: 1.0, boss: 'ember' },
  { name: 'Snow on the inkstone', season: 3, types: ['eater', 'crane', 'lantern', 'fox'], count: 42, interval: 0.88, boss: null },
  { name: 'The last bell', season: 3, types: ['eater', 'fox', 'umbrella', 'crane'], count: 46, interval: 0.8, boss: 'frost' },
];
export const getScroll = state => SCROLLS[state.scroll - 1];
export const getSeason = state => SEASONS[getScroll(state).season];
