import { BELL, INK } from '../config.js';
import { createRng } from '../rng.js';
import { createMonk } from '../entities/monk.js';
import { makeThreatQueue } from './waves.js';
import { DIFFICULTIES } from './difficulty.js';
import { beginOmen } from './omens.js';
import { emptyProgress } from '../save.js';
import { createPath } from './path.js';
import { getSkinPrefs } from '../skins.js';

export function createState(seed = 1, best = 0, difficultyId = 'monk', progress = emptyProgress(), expedition = 'pilgrimage') {
  const profile = DIFFICULTIES.find(d => d.id === difficultyId) || DIFFICULTIES[1];
  const runSeed = (Number(seed) >>> 0) || 1;
  const state = {
    expedition: expedition === 'ascension' && progress.unlocks.includes('ascension') ? 'ascension' : 'pilgrimage', ascension: 1, circuits: 0, relics: [],
    seed: runSeed, difficulty: profile.id, rng: createRng(runSeed), mode: 'title', time: 0, runTime: 0, scrollTime: 0, scroll: 1,
    progress, unlocks: [...progress.unlocks], previousBestRun: progress.bestRun, newUnlocks: [], newBest: false, runRecorded: false,
    scrollScores: Array(8).fill(0), scrollStartScore: 0,
    route: createPath(), roadChoice: null, activeRoad: 'shrine',
    score: 0, scoreShown: 0, scoreBurst: null, inkMotes: [], pickupChain: 0, pickupChainTime: 0, best, combo: 1, comboTime: 0, peakCombo: 1, comboHeat: 0, sealed: 0, loops: 0, largestSeal: 0, inkPainted: 0, yokaiByType: {}, scrollTimes: Array(8).fill(0), strokeCount: 0, bellHitThisScroll: false, unharmedScroll: false, newAchievements: [],
    wrath: 0, peakWrath: 0, lastSealTime: -10, hunterTimer: 4, huntBanner: 0, hunts: 0, huntTime: 0,
    huntersSpawned: 0, huntersSealed: 0, wrathScore: 0,
    omen: null, omenHistory: [], omenScore: 0, bonusDraft: false,
    ink: INK.max, maxInk: INK.max, bell: { ...BELL, hp: profile.hp, maxHp: profile.hp, hitTime: 0, wardTime: 0, skin: progress.selectedSkin }, monk: createMonk(),
    enemies: [], strokes: [], activeStroke: null, waitRelease: false, strokeStart: null, strokeGrace: 0, paintBuffer: [], actionBuffer: {}, controlFeedback: null, particles: [], floats: [], rings: [],
    seals: [], ghosts: [], dissolves: [], bolts: [], skillEffects: [], artFxTimes: {}, impactFrames: 0, impactColor: '#fffaf0', ritualFlash: 0, arts: [], artLevels: {}, draft: [], queue: [], spawned: 0, cleared: 0, total: 0,
    spawnTime: 1.8, splashCooldown: 0, qCooldown: 0, eCooldown: 0, bannerTime: 4.5,
    banner: 'SCROLL I · A BELL IN BLOOM', shake: 0, flash: 0, hitStop: 0, soundEvents: [], nextId: 1,
    tutorial: 'DRAW A LOOP AROUND THE SPIRITS', ended: false, climax: null, finalSeal: null, frostLanes: [],
    ending: null, defeat: null, resultsTime: 0, resultsBeat: -1, showAchievements: false, daily: false,
    ...getSkinPrefs(),
  };
  state.monk.outfit = state.outfit;
  state.monk.brush = state.brush;
  state.queue = makeThreatQueue(state);
  state.total = state.queue.length;
  beginOmen(state);
  return state;
}
export function startRun(state) { state.mode = 'play'; state.soundEvents.push({ name: 'scrollIntro' }); }
export function hasArt(state, id) { return state.arts.includes(id); }
export function gradeRun(state) {
  const skill = state.sealed / Math.max(1, state.spawned);
  if (state.scroll === 8 && state.bell.hp >= 7 && skill > 0.85) return 'S';
  if (state.scroll >= 5 && skill > 0.72) return 'A';
  if (state.scroll >= 3 || state.sealed >= 16) return 'B';
  return 'C';
}
