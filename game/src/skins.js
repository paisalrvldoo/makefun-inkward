import { COLORS } from './config.js';

export const OUTFITS = [
  { id: 'pilgrim', name: 'Pilgrim Monk', jacket: '#fffaf0', robe: '#bfb8a4', scarf: COLORS.red, hat: '#34352f', unlock: 'default', desc: 'Starting garb' },
  { id: 'ronin', name: 'Ronin Wanderer', jacket: '#11151c', robe: '#4a4548', scarf: '#802f32', hat: '#6d5d48', unlock: 'victory', desc: 'Unlocked after an 8-scroll victory' },
  { id: 'spring', name: 'Sakura Robe', jacket: '#f0d8d0', robe: '#c8a8a0', scarf: '#e8a0b0', hat: '#8b6870', unlock: 'spring', desc: 'Clear scroll 4 (spring)' },
  { id: 'winter', name: 'Snow Cloak', jacket: '#e0e8f0', robe: '#a8b8c8', scarf: '#7090b0', hat: '#708090', unlock: 'winter', desc: 'Clear scroll 8 (winter)' },
];

export const BRUSHES = [
  { id: 'sumi', name: 'Sumi Brush', inkColor: '#0c111a', trailColor: '#5a80c0', unlock: 'default', desc: 'Classic black ink' },
  { id: 'katana', name: 'Katana Blade', inkColor: '#284060', trailColor: '#7ab0f0', unlock: 'victory', desc: 'Unlocked after victory — sharp steel-blue slash' },
  { id: 'vermilion', name: 'Vermilion Lacquer', inkColor: '#601820', trailColor: '#e04040', unlock: 'seals50', desc: 'Reach 50 total seals' },
  { id: 'gold', name: 'Gold Leaf', inkColor: '#504020', trailColor: '#e0c040', unlock: 'win', desc: 'Unlocked after any victory' },
];

export function isOutfitUnlocked(outfit, state) {
  if (outfit.unlock === 'default') return true;
  if (outfit.unlock === 'victory' || outfit.unlock === 'win') return (state.progress?.wins || 0) > 0;
  if (outfit.unlock === 'spring') return (state.progress?.wins || 0) > 0 || state.scroll >= 4;
  if (outfit.unlock === 'winter') return (state.progress?.wins || 0) > 0 || state.scroll >= 8;
  return false;
}
export function isBrushUnlocked(brush, state) {
  if (brush.unlock === 'default') return true;
  if (brush.unlock === 'victory' || brush.unlock === 'win') return (state.progress?.wins || 0) > 0;
  if (brush.unlock === 'seals50') return (state.sealed || 0) >= 50;
  if (brush.unlock === 'seals100') return (state.sealed || 0) >= 100;
  return false;
}

export function newUnlockedOutfits(state) {
  if (!state.mode || state.mode !== 'win') return [];
  return OUTFITS.filter(o => !isOutfitUnlocked(o, state)).map(o => o.id);
}

const SKIN_KEY = 'inkward.skins.v1';
function readPrefs() {
  try { return JSON.parse(localStorage.getItem(SKIN_KEY)) || {}; } catch { return {}; }
}
function writePrefs(prefs) {
  try { localStorage.setItem(SKIN_KEY, JSON.stringify(prefs)); } catch {}
}
export function getSkinPrefs() {
  const prefs = readPrefs();
  return { outfit: prefs.outfit || 'pilgrim', brush: prefs.brush || 'sumi' };
}
export function setSkinPrefs(outfit, brush) {
  const prefs = readPrefs();
  if (outfit) prefs.outfit = outfit;
  if (brush) prefs.brush = brush;
  writePrefs(prefs);
}

export function getOutfit(id) { return OUTFITS.find(o => o.id === id) || OUTFITS[0]; }
export function getBrush(id) { return BRUSHES.find(b => b.id === id) || BRUSHES[0]; }