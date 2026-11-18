import { updateMonk } from '../entities/monk.js';
import { updateYokai } from '../entities/yokai.js';
import { updateBosses } from '../entities/bosses.js';
import { endStroke, updateStrokes } from '../ink/strokes.js';
import { updateArts, draftArts } from '../arts/brushArts.js';
import { updateEffects } from '../render/fx.js';
import { makeThreatQueue, updateWaves } from './waves.js';
import { getScroll } from './scrolls.js';
import { updateWrath } from './wrath.js';
import { beginOmen, finishOmen } from './omens.js';
import { gradeRun } from './state.js';
import { recordRun } from '../save.js';
import { artLevel } from '../arts/levels.js';
import { walkRoad } from './path.js';
import { bufferActions, clearControls } from '../controls/buffer.js';
import { castArt } from '../fx/skillCasts.js';
import { advanceClimax } from '../entities/finalBoss.js';
import { advanceFinalSeal } from '../scenes/finalSeal.js';
import { beginEnding } from '../scenes/ending.js';
import { beginDefeat } from '../scenes/defeat.js';
import { isAscension, ascensionLabel } from './ascension.js';
import { createPath } from './path.js';

import { updateScoreBurst } from '../fx/scoreBurst.js';
import { updateInkMotes } from '../fx/inkMotes.js';

export function recordScroll(state) {
  const key = `${isAscension(state) ? state.ascension : 0}:${state.scroll}`;
  const value = Math.max(0, state.score - state.scrollStartScore);
  if (state.recordedScrollKey === key) state.scrollScores[state.scroll - 1] += value - state.recordedScrollValue;
  else state.scrollScores[state.scroll - 1] += value;
  state.recordedScrollKey = key; state.recordedScrollValue = value;
}

export function finishCircuit(state) {
  finishOmen(state, true); endStroke(state); clearControls(state);
  state.circuits++;
  state.score += 2000 * state.ascension + state.bell.hp * 100;
  recordScroll(state);
  state.mode = 'draft'; state.roadChoice = null; draftArts(state);
  state.soundEvents.push({ name: 'draft' });
}

export function finishRun(state, won) {
  if (state.ended) return;
  endStroke(state);
  clearControls(state);
  state.ended = true;
  finishOmen(state, won);
  state.mode = won ? 'win' : 'lose';
  if (won) state.score += state.bell.hp * 500 + 3000;
  recordScroll(state); state.grade = gradeRun(state);
  recordRun(state, { persist: false });
  if (won) beginEnding(state);
  else beginDefeat(state);
}
export function nextScroll(state) {
  if (!walkRoad(state)) return false;
  clearControls(state);
  if (state.scroll === 8 && isAscension(state)) {
    state.ascension++; state.scroll = 1; state.route = createPath();
    state.activeRoad = 'shrine'; state.finalSeal = null; state.climax = null;
    state.enemies = []; state.frostLanes = [];
  } else state.scroll++;
  state.scrollStartScore = state.score;
  state.scrollTime = 0; state.cleared = 0;
  state.strokes = []; state.activeStroke = null; state.waitRelease = false;
  state.queue = makeThreatQueue(state); state.total = state.queue.length; state.spawnTime = 2;
  state.ink = state.maxInk; state.comboTime = 7;
  state.qCooldown = 0; state.eCooldown = 0; state.splashCooldown = 0;
  state.banner = isAscension(state) ? ascensionLabel(state) : `SCROLL ${state.scroll} · ${getScroll(state).name.toUpperCase()}`;
  state.bannerTime = 4; state.mode = 'play';
  state.bonusDraft = false; beginOmen(state);
  state.soundEvents.push({ name: 'scrollIntro' });
  return true;
}
export function updateWorld(state, input, dt) {
  if (state.mode === 'seal') { if (advanceFinalSeal(state, dt)) { if (isAscension(state)) finishCircuit(state); else finishRun(state, true); } return; }
  if (state.mode !== 'play') return;
  bufferActions(state, input, dt);
  dt *= advanceClimax(state, dt);
  if (state.hitStop > 0) {
    state.paintBuffer = [...new Set([...state.paintBuffer, ...input.paintEvents])].slice(-650);
    state.hitStop = Math.max(0, state.hitStop - dt); return;
  }
  state.time += dt; state.runTime += dt; state.scrollTime += dt;
  state.bannerTime = Math.max(0, state.bannerTime - dt);
  state.bell.hitTime = Math.max(0, state.bell.hitTime - dt);
  state.bell.wardTime = Math.max(0, state.bell.wardTime - dt);
  state.comboTime = Math.max(0, state.comboTime - dt);
  if (state.comboTime <= 0) { state.combo = 1; state.comboHeat = Math.max(0, state.comboHeat - dt * 0.4); }
  updateEffects(state, dt);
  updateScoreBurst(state, dt);
  updateInkMotes(state, dt);
  updateMonk(state, input, dt);
  updateStrokes(state, input, dt);
  if (state.mode === 'seal') { clearControls(state); return; }
  updateArts(state, input, dt);
  updateWrath(state, dt);
  updateWaves(state, dt);
  updateBosses(state, dt);
  updateYokai(state, dt);
  if (state.bell.hp <= 0) { finishRun(state, false); return; }
  if (!state.queue.length && !state.enemies.length) {
    finishOmen(state, true);
    endStroke(state);
    state.bell.hp = Math.min(state.bell.maxHp, state.bell.hp + artLevel(state, 'afterglow'));
    if (artLevel(state, 'afterglow')) castArt(state, 'afterglow', state.bell, { radius: 90, force: true });
    if (state.scroll === 8) { if (isAscension(state)) finishCircuit(state); else finishRun(state, true); }
    else {
      state.score += 400 + state.bell.hp * 25;
      recordScroll(state);
      state.mode = 'draft'; state.roadChoice = null; draftArts(state);
      state.soundEvents.push({ name: 'draft' });
    }
  }
}
