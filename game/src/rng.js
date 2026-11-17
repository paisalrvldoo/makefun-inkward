export function createRng(seed = 1) {
  let value = (Number(seed) || 1) >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let t = Math.imul(value ^ value >>> 15, value | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export const between = (rng, low, high) => low + rng() * (high - low);
export const pick = (rng, items) => items[Math.floor(rng() * items.length)];
