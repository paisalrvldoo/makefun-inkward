export const DIFFICULTIES = [
  { id: 'novice', name: 'NOVICE', hp: 16, count: 0.82, interval: 1.18, speed: 0.86, hint: '16 bell · a gentler garden' },
  { id: 'monk', name: 'MONK', hp: 12, count: 1, interval: 1, speed: 1, hint: '12 bell · the intended challenge' },
  { id: 'master', name: 'MASTER', hp: 10, count: 1.22, interval: 0.84, speed: 1.12, hint: '10 bell · relentless spirits' },
];
export const difficulty = state => DIFFICULTIES.find(d => d.id === state.difficulty) || DIFFICULTIES[1];
