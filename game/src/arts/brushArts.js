import { distance, inField } from '../config.js';
import { spawnYokai } from '../entities/yokai.js';
import { burst, addRing, floatText } from '../render/fx.js';
import { artLevel, MAX_ART_LEVEL } from './levels.js';

export const BRUSH_ARTS = [
  { id: 'vermilion', name: 'Vermilion edge', rune: 'V', type: 'WALL', description: 'Ink walls slow attackers further', detail: 'Contact briefly stuns spirits and reduces wall erosion.' },
  { id: 'breath', name: 'Long breath', rune: 'L', type: 'INK', description: '+30 ink capacity · faster refill', detail: 'Hold longer strokes. Ink regenerates 30% faster.' },
  { id: 'twin', name: 'Twin brush', rune: 'T', type: 'WALL', description: 'Mirror every open stroke', detail: 'A second wall appears across the shrine at no ink cost.' },
  { id: 'thunder', name: 'Thunder seal', rune: 'Z', type: 'SEAL', description: 'Seals chain to a nearby spirit', detail: 'Every successful loop frees one extra spirit within 90px.' },
  { id: 'willow', name: 'Willow dash', rune: 'W', type: 'MOVE', description: 'Dash almost twice as often', detail: 'Dash cooldown becomes 0.95s. Dash through spirits to stun.' },
  { id: 'gold', name: 'Gold leaf', rune: 'G', type: 'SCORE', description: '+30% score from every spirit', detail: 'A bolder path to the S rank. Combos multiply the bonus.' },
  { id: 'well', name: 'Bottomless well', rune: 'B', type: 'INK', description: 'Almost double seal ink refunds', detail: 'Successful loops return 9 ink per spirit instead of 5.' },
  { id: 'stone', name: 'Stone ink', rune: 'S', type: 'WALL', description: 'Walls last 50% longer', detail: 'Open strokes remain on the paper for 24 seconds.' },
  { id: 'feather', name: 'Feather hand', rune: 'F', type: 'INK', description: 'Painting costs 25% less ink', detail: 'Bigger circles, more walls, more room to improvise.' },
  { id: 'echo', name: 'Echo of the bell', rune: 'O', type: 'COMBO', description: 'Keep your combo for 10 seconds', detail: 'Take a breath between seals without losing your multiplier.' },
  { id: 'lotus', name: 'Winter lotus', rune: 'Q', type: 'RITUAL', description: 'Q freezes all spirits longer', detail: 'Lotus hush lasts 4.5 seconds and recharges faster.' },
  { id: 'mending', name: 'Mending prayer', rune: 'E', type: 'BELL', description: 'Repair 3 bell cracks now', detail: 'Also makes the E bell ward wider and faster to recharge.' },
];
export const findArt = id => BRUSH_ARTS.find(art => art.id === id);
export function describeArt(id, level = 1) {
  const descriptions = {
    vermilion: [`Wall contact cuts spirits after ${(1.6 / level).toFixed(2)}s`, 'Contact stuns spirits and reduces erosion. Oni are stunned but resist the cut.'],
    breath: [`+30 ink capacity · +${level * 30}% refill`, 'Each upgrade adds 30 capacity. Release the brush to regenerate ink.'],
    twin: [level === 3 ? 'Mirror open strokes across both axes' : `Mirror open strokes · ${Math.round((0.5 + level * 0.15) * 100)}% strength`, 'Open strokes create free mirrored walls. Closed seals are never mirrored.'],
    thunder: [`Chain seals to ${level} extra spirit${level > 1 ? 's' : ''}`, `Free nearby spirits within ${90 + level * 20}px of an enclosed spirit. Cannot chain to Oni.`],
    willow: [`Dash cooldown ${(1.65 / (1 + level * 0.7)).toFixed(2)}s`, 'Dash through spirits to stun them for 1.5 seconds.'],
    gold: [`+${level * 30}% spirit score`, 'Combos multiply this bonus. Oni hits score separately.'],
    well: [`Seal refund: 9 + ${5 + level * 4} ink per spirit`, 'An enclosed group gives more ink for your next stroke.'],
    stone: [`Walls last ${16 * (1 + level * 0.5)} seconds`, `Also reduces contact erosion by ${Math.round((1 - 1 / (1 + level * 0.25)) * 100)}%.`],
    feather: [`Painting costs ${level * 18}% less ink`, 'Bigger circles, more walls, more room to improvise.'],
    echo: [`Keep combos for ${7 + level * 3} seconds`, 'Every successful loop refreshes the combo timer.'],
    lotus: [`Q hush: ${(2.5 + level * 1.4).toFixed(1)}s · ${Math.max(6, 14 - level * 3)}s recharge`, 'Freezes every spirit and exposes an Oni to stronger seals.'],
    mending: ['Repair 3 bell cracks now', `E ward reaches ${155 + level * 55}px and recharges in ${Math.max(8, 18 - level * 4)}s.`],
  };
  const [description, detail] = descriptions[id];
  return { description, detail };
}
export function draftArts(state) {
  const pool = BRUSH_ARTS.filter(art => artLevel(state, art.id) < MAX_ART_LEVEL);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(state.rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  state.draft = pool.slice(0, state.bonusDraft ? 4 : 3);
}
export function chooseArt(state, index) {
  const art = state.draft[index];
  if (!art) return false;
  const level = artLevel(state, art.id) + 1;
  if (!state.arts.includes(art.id)) state.arts.push(art.id);
  state.artLevels[art.id] = level;
  if (art.id === 'breath') state.maxInk += 30;
  if (art.id === 'mending') state.bell.hp = Math.min(state.bell.hp + 3, state.bell.maxHp);
  state.ink = state.maxInk;
  burst(state, state.monk.x, state.monk.y, 26, '#b68a36');
  floatText(state, state.monk.x, state.monk.y - 40, `${art.name.toUpperCase()} · LV ${level}`, '#b68a36', 21);
  state.soundEvents.push({ name: 'draft' });
  return true;
}
export function splashInk(state, point) {
  if (state.splashCooldown > 0 || !inField(point)) return;
  state.splashCooldown = 4;
  addRing(state, point.x, point.y, 85, '#537f72', 0.6);
  burst(state, point.x, point.y, 20, '#537f72');
  for (const enemy of [...state.enemies]) {
    if (enemy.dead || distance(enemy, point) > 85 + enemy.radius) continue;
    enemy.stun = Math.max(enemy.stun, 2.2);
    if (enemy.kind === 'fox' && !enemy.small) {
      enemy.small = true; enemy.radius *= 0.7; enemy.value = 90;
      const child = spawnYokai(state, 'fox', { x: enemy.x + 22, y: enemy.y - 16 }, true);
      child.hunter = Boolean(enemy.hunter);
      child.stun = 2.2;
      state.spawned++; state.total++;
      floatText(state, enemy.x, enemy.y - 25, 'FOX-FIRE SPLIT', '#c85c42', 16);
    }
  }
  state.soundEvents.push({ name: 'splash' });
}
export function updateArts(state, input, dt) {
  for (const key of ['splashCooldown', 'qCooldown', 'eCooldown']) state[key] = Math.max(0, state[key] - dt);
  for (const point of input.splashes) splashInk(state, point);
  if (input.pressed.has('KeyQ') && state.qCooldown <= 0) {
    const level = artLevel(state, 'lotus');
    state.qCooldown = Math.max(6, 14 - level * 3);
    for (const enemy of state.enemies) enemy.stun = Math.max(enemy.stun, 2.5 + level * 1.4);
    addRing(state, state.monk.x, state.monk.y, 600, '#7191a6', 1);
    floatText(state, state.monk.x, state.monk.y - 35, 'LOTUS HUSH', '#7191a6', 23);
    state.soundEvents.push({ name: 'bell' });
  }
  if (input.pressed.has('KeyE') && state.eCooldown <= 0) {
    const level = artLevel(state, 'mending');
    state.eCooldown = Math.max(8, 18 - level * 4);
    const range = 155 + level * 55;
    for (const enemy of state.enemies) {
      const length = distance(enemy, state.bell) || 1;
      if (length < range) {
        enemy.x += (enemy.x - state.bell.x) / length * 65;
        enemy.y += (enemy.y - state.bell.y) / length * 65;
        enemy.stun = Math.max(enemy.stun, 2);
      }
    }
    addRing(state, state.bell.x, state.bell.y, range, '#b68a36', 0.8);
    floatText(state, state.bell.x, state.bell.y - 55, 'BELL WARD', '#b68a36', 23);
    state.soundEvents.push({ name: 'bell' });
  }
}
