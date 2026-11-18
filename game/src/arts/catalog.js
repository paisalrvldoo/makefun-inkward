export const BRUSH_ARTS = [
  { id: 'vermilion', name: 'Vermilion edge', rune: 'V', type: 'WALL' },
  { id: 'breath', name: 'Long breath', rune: 'L', type: 'INK' },
  { id: 'twin', name: 'Twin brush', rune: 'T', type: 'WALL' },
  { id: 'thunder', name: 'Thunder seal', rune: 'Z', type: 'SEAL' },
  { id: 'willow', name: 'Willow dash', rune: 'W', type: 'MOVE' },
  { id: 'gold', name: 'Gold leaf', rune: 'G', type: 'SCORE' },
  { id: 'well', name: 'Bottomless well', rune: 'B', type: 'INK' },
  { id: 'stone', name: 'Stone ink', rune: 'S', type: 'WALL' },
  { id: 'feather', name: 'Feather hand', rune: 'F', type: 'INK' },
  { id: 'echo', name: 'Echo of the bell', rune: 'O', type: 'COMBO' },
  { id: 'lotus', name: 'Winter lotus', rune: 'Q', type: 'RITUAL' },
  { id: 'mending', name: 'Mending prayer', rune: 'E', type: 'BELL' },
  { id: 'moonInk', name: 'Moonlit ink', rune: 'M', type: 'INK', unlock: 'moonInk' },
  { id: 'afterglow', name: 'Afterglow prayer', rune: 'A', type: 'BELL', unlock: 'afterglow' },
];
export const findArt = id => BRUSH_ARTS.find(art => art.id === id);
export function describeArt(id, level = 1) {
  const descriptions = {
    rest: ['Repair 2 bell cracks · refill ink', 'Your brush has mastered every art. Rest, then face the next ascension.'],
    vermilion: [`Wall contact cuts spirits after ${(1.6 / level).toFixed(2)}s`, 'Contact stuns spirits and reduces erosion. Oni are stunned but resist the cut.'],
    breath: [`+30 ink capacity · +${level * 30}% refill`, 'Each upgrade adds 30 capacity. Release the brush to regenerate ink.'],
    twin: [level === 3 ? 'Mirror open strokes across both axes' : `Mirror open strokes · ${Math.round((0.5 + level * 0.15) * 100)}% strength`, 'Open strokes create free mirrored walls. Closed seals are never mirrored.'],
    thunder: [`Chain seals to ${level} extra spirit${level > 1 ? 's' : ''}`, `Free nearby spirits within ${90 + level * 20}px of an enclosed spirit. Cannot chain to Oni.`],
    willow: [`Dash cooldown ${(1.65 / (1 + level * 0.7)).toFixed(2)}s`, 'Dash through spirits to stun them for 1.5 seconds.'],
    gold: [`+${level * 30}% spirit score`, 'Combos multiply this bonus. Oni hits score separately.'],
    well: [`Seal refund: 9 + ${5 + level * 4} ink per spirit`, 'An enclosed group gives more ink for your next stroke.'],
    stone: [`Walls last ${16 * (1 + level * 0.5)} seconds`, `Also reduces contact erosion by ${Math.round((1 - 1 / (1 + level * 0.25)) * 100)}%.`],
    feather: [`Painting costs ${level * 18}% less ink`, 'Bigger circles, more walls, more room to improvise.'],
    echo: [`Keep combos for ${7 + level * 7} seconds`, 'Every successful loop refreshes the combo timer.'],
    lotus: [`Q hush: ${(2.5 + level * 1.4).toFixed(1)}s · ${Math.max(6, 14 - level * 3)}s recharge`, 'Freezes every spirit and exposes an Oni to stronger seals.'],
    mending: ['Repair 3 bell cracks now', `E protects for ${8.5 + level * 1.5}s, reaches ${155 + level * 55}px, recharges in ${Math.max(8, 18 - level * 4)}s.`],
    moonInk: ['Ward painting costs ' + level * 15 + '% less ink', 'While E protects the bell, spend less ink on every wall and loop. Combines with Feather hand.'],
    afterglow: ['Repair ' + level + ' bell crack' + (level > 1 ? 's' : '') + ' after each scroll', 'A lasting prayer. Bell repairs carry forward through all eight scrolls.'],
  };
  const [description, detail] = descriptions[id];
  return { description, detail };
}
