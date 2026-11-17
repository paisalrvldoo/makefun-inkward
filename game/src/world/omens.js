import { floatText } from '../render/fx.js';

const OMENS = [
  ['cranes', 'Seal 3 cranes in one loop', 3, 2400],
  ['unharmed', 'Finish with bell unharmed', 1, 'draft'],
  ['boss', 'Seal the boss inside 2 loops', 2, 5000],
  ['cranes', 'Seal 3 cranes in one loop', 3, 'draft'],
  ['unharmed', 'Finish with bell unharmed', 1, 4000],
  ['boss', 'Seal the boss inside 2 loops', 2, 'draft'],
  ['cranes', 'Seal 3 cranes in one loop', 3, 6000],
  ['boss', 'Seal the boss inside 2 loops', 2, 8000],
];
export function beginOmen(state) {
  const [id, label, target, reward] = OMENS[state.scroll - 1];
  state.omen = { id, label, target, reward, scroll: state.scroll, progress: 0, complete: false, failed: false, settled: false, bellDamage: 0 };
}
export const omenReward = omen => omen.reward === 'draft' ? '+1 DRAFT CHOICE' : `+${omen.reward.toLocaleString('en-US')} SCORE`;
export function omenProgress(omen) {
  if (omen.complete) return 'FULFILLED';
  if (omen.failed) return 'MISSED · OPTIONAL';
  if (omen.id === 'unharmed') return omen.bellDamage ? 'BELL HIT' : 'NO HITS';
  if (omen.id === 'boss') return `${omen.progress} / 2 LOOPS`;
  return `${omen.progress} / ${omen.target}`;
}
function fulfillOmen(state) {
  const omen = state.omen;
  if (omen.complete || omen.failed) return;
  omen.complete = true;
  if (omen.reward === 'draft') state.bonusDraft = true;
  else { state.score += omen.reward; state.omenScore += omen.reward; }
  floatText(state, state.bell.x, state.bell.y + 88, 'OMEN FULFILLED', '#537f72', 23);
  state.soundEvents.push({ name: 'omen' });
}
export function recordOmenSeal(state, enclosed) {
  const omen = state.omen;
  if (omen.complete || omen.failed) return;
  if (omen.id === 'cranes') {
    omen.progress = Math.max(omen.progress, enclosed.filter(e => e.kind === 'crane' && e.dead).length);
    if (omen.progress >= omen.target) fulfillOmen(state);
  } else if (omen.id === 'boss') {
    const boss = enclosed.find(e => e.kind === 'oni');
    if (!boss) return;
    omen.progress++;
    if (boss.dead && omen.progress <= 2) fulfillOmen(state);
    else if (omen.progress >= 2) omen.failed = true;
  }
}
export function recordOmenBellHit(state, damage) {
  state.omen.bellDamage += damage;
  if (state.omen.id === 'unharmed') state.omen.failed = true;
}
export function finishOmen(state, scrollCleared) {
  const omen = state.omen;
  if (omen.settled) return;
  if (scrollCleared && omen.id === 'unharmed' && !omen.bellDamage) fulfillOmen(state);
  omen.settled = true;
  state.omenHistory.push({ ...omen });
}
