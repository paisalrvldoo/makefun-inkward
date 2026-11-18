// Victory opens an endless pilgrimage. Each circuit keeps the player's build.
export const isAscension = state => state.expedition === 'ascension';
export const ascensionTier = state => isAscension(state) ? Math.max(1, state.ascension || 1) : 0;
export const wrathCap = state => 5 + ascensionTier(state);
export function ascensionModifiers(state) {
  const tier = ascensionTier(state);
  return { count: 1 + tier * 0.12, speed: 1 + tier * 0.08, interval: 1 / (1 + tier * 0.1), erosion: 1 + tier * 0.15 };
}
export function ascensionLabel(state) {
  const tier = ascensionTier(state);
  return `ASCENSION ${tier} · WRATH ${wrathCap(state)} · +${tier * 8}% SPEED · +${tier * 15}% EROSION`;
}
