export const MAX_ART_LEVEL = 3;
export const artLevel = (state, id) => state.arts.includes(id) ? state.artLevels?.[id] || 1 : 0;
export const comboDuration = state => 7 + artLevel(state, 'echo') * 7;
