const BEST_KEY = 'inkward.best.v1';
const PROGRESS_KEY = 'inkward.progress.v2';

export const UNLOCKS = [
  { id: 'master', name: 'Master difficulty', kind: 'CHALLENGE' },
  { id: 'moonInk', name: 'Moonlit ink', kind: 'BRUSH ART' },
  { id: 'afterglow', name: 'Afterglow prayer', kind: 'BRUSH ART' },
  { id: 'ascension', name: 'Endless ascension', kind: 'CHALLENGE' },
  { id: 'moonBell', name: 'Moon Bell skin', kind: 'BELL SKIN' },
];

const integer = value => Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;
export const emptyProgress = () => ({ version: 2, runs: 0, wins: 0, unlocks: [], selectedSkin: 'bronze', bestRun: null });

function cleanProgress(value) {
  const progress = emptyProgress();
  if (!value || typeof value !== 'object') return progress;
  progress.runs = integer(value.runs); progress.wins = Math.min(progress.runs, integer(value.wins));
  progress.unlocks = UNLOCKS.filter(u => Array.isArray(value.unlocks) && value.unlocks.includes(u.id)).map(u => u.id);
  if (progress.wins > 0 && !progress.unlocks.includes('ascension')) progress.unlocks.push('ascension');
  if (value.selectedSkin === 'moon' && progress.unlocks.includes('moonBell')) progress.selectedSkin = 'moon';
  const run = value.bestRun;
  if (run && integer(run.score) > 0 && Array.isArray(run.scrollScores) && run.scrollScores.length === 8) {
    progress.bestRun = {
      seed: (integer(run.seed) >>> 0) || 1, score: integer(run.score),
      difficulty: ['novice', 'monk', 'master'].includes(run.difficulty) ? run.difficulty : 'monk',
      grade: /^[SABC]$/.test(run.grade) ? run.grade : 'C', expedition: run.expedition === 'ascension' ? 'ascension' : 'pilgrimage', ascension: integer(run.ascension),
      scrollScores: run.scrollScores.map(integer),
    };
  }
  return progress;
}

export function readProgress() {
  try { return cleanProgress(JSON.parse(localStorage.getItem(PROGRESS_KEY))); }
  catch { return emptyProgress(); }
}
export function writeProgress(progress) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(cleanProgress(progress))); }
  catch { /* The current pilgrimage still keeps its rewards when storage is unavailable. */ }
}
export function readBest() {
  let legacy = 0;
  try { legacy = integer(localStorage.getItem(BEST_KEY)); } catch { /* Storage is optional. */ }
  return Math.max(legacy, readProgress().bestRun?.score || 0);
}
export function saveBest(score) {
  const best = Math.max(readBest(), integer(score));
  try { localStorage.setItem(BEST_KEY, String(best)); } catch { /* Storage is optional. */ }
  return best;
}

// The world settles this record once; the browser persists that same record.
// Replays use the same rewards without writing into the player's save.
export function recordRun(state, { persist = true } = {}) {
  if (!state.ended || !['win', 'lose'].includes(state.mode)) return false;
  if (!state.runRecorded) {
    const progress = cleanProgress(state.progress);
    const oldBest = Math.max(state.best, progress.bestRun?.score || 0);
    state.newBest = state.score > oldBest;
    state.newUnlocks = state.mode === 'win' ? UNLOCKS.filter(u => !progress.unlocks.includes(u.id)).map(u => u.id) : [];
    progress.runs++;
    if (state.mode === 'win') progress.wins++;
    progress.unlocks.push(...state.newUnlocks);
    if (state.newBest) {
      progress.bestRun = {
        seed: state.seed, difficulty: state.difficulty, expedition: state.expedition, ascension: state.ascension, score: state.score, grade: state.grade,
        scrollScores: [...state.scrollScores],
      };
    }
    state.best = Math.max(oldBest, state.score);
    state.progress = progress; state.unlocks = [...progress.unlocks]; state.runRecorded = true;
  }
  if (persist) { writeProgress(state.progress); saveBest(state.best); }
  return true;
}
export function selectBellSkin(progress, skin) {
  if (!['bronze', 'moon'].includes(skin) || (skin === 'moon' && !progress.unlocks.includes('moonBell'))) return false;
  progress.selectedSkin = skin; writeProgress(progress); return true;
}
