const KEY = 'inkward.best.v1';
export function readBest() {
  try { return Math.max(0, Number(localStorage.getItem(KEY)) || 0); } catch { return 0; }
}
export function saveBest(score) {
  const best = Math.max(readBest(), Math.floor(score));
  try { localStorage.setItem(KEY, String(best)); } catch { /* Play also works with storage disabled. */ }
  return best;
}
