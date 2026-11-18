// In-run shrine shop. Yokai drop ink-gold coins; between scrolls the pilgrim may
// spend them on small, original upgrades. Logic lives here; UI is in screens/shop.js.
import { MAX_ART_LEVEL, artLevel } from '../arts/levels.js';
import { floatText, addRing } from '../render/fx.js';

// Coin drops scale with scroll and yokai value.
export function rollInkGold(state, enemy) {
  if (enemy.kind === 'oni') return Math.min(15, 3 + Math.floor(state.scroll / 3));
  const base = Math.max(1, Math.round(enemy.value / 50));
  return Math.min(9, base + Math.floor((state.scroll - 1) / 4));
}

// The shop offers 4-6 original items. Items are distinct from the brush-art
// draft pool — the shop is a quick roadside shrine, not a second draft.
export const SHOP_ITEMS = [
  { id: 'mend', name: 'Mending Touch', glyph: 'M', color: '#bc5148', blurb: 'Repair 3 bell cracks',
    price: 8, apply: state => { state.bell.hp = Math.min(state.bell.maxHp, state.bell.hp + 3); } },
  { id: 'inkcap', name: 'Ink Jar', glyph: 'J', color: '#258c9c', blurb: '+25 max ink \u00b7 full refill',
    price: 10, apply: state => { state.maxInk += 25; state.ink = state.maxInk; } },
  { id: 'inkregen', name: 'Inkstone Polish', glyph: 'P', color: '#5b829e', blurb: '+3 ink/s regen this run',
    price: 12, apply: state => { state.shopInkRegen = (state.shopInkRegen || 0) + 3; } },
  { id: 'ultcharge', name: 'Lotus Charge', glyph: 'L', color: '#477fbd', blurb: 'Reset Q & E cooldowns now',
    price: 7, apply: state => { state.qCooldown = 0; state.eCooldown = 0; state.splashCooldown = 0; } },
  { id: 'combotime', name: 'Sustained Breath', glyph: 'S', color: '#8865b4', blurb: '+4s combo duration this run',
    price: 9, apply: state => { state.shopComboBonus = (state.shopComboBonus || 0) + 4; } },
  { id: 'brushwhet', name: 'Whetstone', glyph: 'W', color: '#d9ad38', blurb: 'Upgrade your newest brush art',
    price: 14, apply: state => { const id = state.arts[state.arts.length - 1]; if (id) { state.artLevels[id] = Math.min(MAX_ART_LEVEL, artLevel(state, id) + 1); if (id === 'breath') state.maxInk += 30; } state.ink = state.maxInk; } },
  { id: 'relicward', name: 'Ward Charm', glyph: 'C', color: '#d8b5fa', blurb: 'A passive relic ward (stacks)',
    price: 16, apply: state => { state.shopWards = (state.shopWards || 0) + 1; } },
];

export function rerollPrice(state) {
  return 3 + (state.shopRerolls || 0) * 2;
}

export function openShop(state) {
  state.mode = 'shop';
  state.shopRerolls = 0;
  state.shopBought = [];
  rollShopOffer(state);
  state.soundEvents.push({ name: 'click' });
}

export function closeShop(state) {
  state.mode = 'draft';
  state.shopOffer = null;
}

// Pick 4-6 items; deterministic from the run rng.
export function rollShopOffer(state) {
  const count = 4 + Math.floor(state.rng() * 3);
  const pool = [...SHOP_ITEMS];
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(state.rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  state.shopOffer = pool.slice(0, count).map(item => ({ ...item, sold: false }));
}

export function rerollShop(state) {
  if (state.mode !== 'shop') return false;
  const cost = rerollPrice(state);
  if ((state.inkGold || 0) < cost) return false;
  state.inkGold -= cost;
  state.shopRerolls = (state.shopRerolls || 0) + 1;
  rollShopOffer(state);
  state.soundEvents.push({ name: 'click' });
  return true;
}

export function buyShopItem(state, index) {
  if (state.mode !== 'shop' || !state.shopOffer) return false;
  const item = state.shopOffer[index];
  if (!item || item.sold) return false;
  if ((state.inkGold || 0) < item.price) return false;
  state.inkGold -= item.price;
  item.sold = true;
  state.shopBought.push(item.id);
  item.apply(state);
  floatText(state, state.bell.x, state.bell.y - 50, item.name.toUpperCase() + ' \u00b7 BOUGHT', item.color, 20);
  addRing(state, state.bell.x, state.bell.y, 70, item.color, 0.6);
  state.soundEvents.push({ name: 'omen' });
  return true;
}