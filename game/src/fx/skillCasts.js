// Original procedural cast motifs; cosmetic effects never advance the world RNG.
export const ART_COLORS = {
  vermilion: '#f45449', breath: '#9de8ca', twin: '#e0bbff', thunder: '#fff0a2', willow: '#7ae0a4', gold: '#ffd66b',
  well: '#7adce9', stone: '#b1b9c6', feather: '#f6f4d4', echo: '#ffc58c', lotus: '#a9dfff', mending: '#ffe08b', moonInk: '#b3c4ff', afterglow: '#ffbd86',
};
export function castArt(state, id, point, options = {}) {
  if (!ART_COLORS[id]) return;
  const last = state.artFxTimes[id] ?? -100;
  if (!options.force && state.time - last < (options.interval ?? 0.5)) return;
  state.artFxTimes[id] = state.time;
  const life = id === 'lotus' || id === 'mending' ? 0.9 : 0.65;
  state.skillEffects.push({ id, x: point.x, y: point.y, life, maxLife: life, radius: options.radius || 65, angle: options.angle || 0, targets: options.targets?.map(p => ({ x: p.x, y: p.y })) || [] });
  state.skillEffects = state.skillEffects.slice(-32);
  state.soundEvents.push({ name: `art:${id}` });
}
export function ritualImpact(state, id) {
  state.impactFrames = 2; state.impactColor = ART_COLORS[id];
  state.ritualFlash = 0.22;
}
