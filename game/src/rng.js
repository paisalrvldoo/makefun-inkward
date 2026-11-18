export function createRng(seed = 1) {
  let value = (Number(seed) >>> 0) || 1;
  return () => {
    value += 0x6D2B79F5;
    let t = Math.imul(value ^ value >>> 15, value | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export const between = (rng, low, high) => low + rng() * (high - low);
export const pick = (rng, items) => items[Math.floor(rng() * items.length)];
export const formatSeed = seed => String((Number(seed) >>> 0) || 1).padStart(10, '0');

export function newRunSeed(previous = 0) {
  const values = new Uint32Array(1);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(values);
  else values[0] = Math.floor(Math.random() * 0xffffffff);
  const seed = values[0] || 1;
  return seed === previous ? (seed + 1) >>> 0 || 1 : seed;
}

export function dailySeed() {
  const d = new Date();
  const key = d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = ((hash * 31 + key.charCodeAt(i)) >>> 0);
  return hash || 1;
}

export function dailyDateString() {
  const d = new Date();
  return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
}
