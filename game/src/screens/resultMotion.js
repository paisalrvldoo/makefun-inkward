import { clamp } from '../config.js';

export function resultMotion(state) {
  const age = state.resultsTime ?? 5;
  const count = clamp((age - 0.65) / 1.6, 0, 1), ease = 1 - (1 - count) ** 3;
  const slam = age > 2.25 && age < 2.65 ? Math.sin((age - 2.25) / 0.4 * Math.PI) : 0;
  return { age, score: Math.round(state.score * ease), count, slam, unroll: clamp(age / 0.75, 0, 1), stamp: clamp((age - 1.8) / 0.35, 0, 1) };
}

export const resultReveal = (age, start, duration = 0.4) => clamp((age - start) / duration, 0, 1);
