import { COLORS } from '../config.js';
import { getScroll, getSeason } from '../world/scrolls.js';
import { gradeRun } from '../world/state.js';
import { YOKAI } from '../entities/yokai.js';
import { findArt } from '../arts/brushArts.js';
import { drawArtIcon, drawLevelPips } from './arts.js';
import { comboDuration } from '../arts/levels.js';
import { drawYokai } from './sprites.js';
import { text, line, panel, circle, wrapText, stamp } from './primitives.js';
import { wrathLevel, wrathMultiplier } from '../world/wrath.js';
import { omenReward, omenProgress } from '../world/omens.js';
import { ONI } from '../entities/bosses.js';

export function drawHud(ctx, state, audio) {
  const scroll = getScroll(state), season = getSeason(state);
  // Lacquer bands hold the paper garden in a high-contrast frame.
  ctx.fillStyle = '#171c24'; ctx.fillRect(0, 0, 1280, 122);
  ctx.fillRect(0, 708, 1280, 92);
  ctx.fillStyle = COLORS.gold; ctx.fillRect(0, 120, 1280, 2); ctx.fillRect(0, 706, 1280, 2);
  text(ctx, 'INKWARD', 24, 54, 38, COLORS.white, 'bold', true);
  text(ctx, 'GUARD THE LAST BELL', 27, 76, 10, COLORS.gold, 'bold');
  text(ctx, `SCROLL ${String(state.scroll).padStart(2, '0')} / 08`, 294, 36, 18, COLORS.white, 'bold');
  text(ctx, `${season.name}  /  ${scroll.name}`, 294, 61, 15, '#f0c35b', 'bold', true);
  for (let i = 0; i < 8; i++) {
    const x = 308 + i * 31;
    ctx.fillStyle = i < state.scroll - 1 ? '#e24937' : i === state.scroll - 1 ? '#f0c35b' : '#494b4b';
    ctx.fillRect(x, 72, 24, 5);
  }
  if (state.scroll > 1) text(ctx, state.activeRoad === 'swarm' ? 'SWARM ROAD +30%' : 'QUIET ROAD +2 BELL', 576, 81, 9, '#e1bf70', 'bold');
  text(ctx, 'SCORE', 690, 28, 11, COLORS.gold, 'bold');
  text(ctx, String(state.score).padStart(6, '0'), 688, 64, 34, COLORS.white, 'bold', true);
  text(ctx, 'PERSONAL BEST', 906, 28, 11, COLORS.gold, 'bold');
  text(ctx, String(state.best).padStart(6, '0'), 904, 62, 30, '#f0c35b', 'bold', true);
  text(ctx, audio.muted ? 'M  SOUND OFF' : 'M  SOUND ON', 1250, 77, 10, '#e5dfd0', 'bold', false, 'right');
  text(ctx, 'WRATH', 1020, 28, 11, '#ef5b48', 'bold');
  text(ctx, `×${wrathMultiplier(state).toFixed(1)}`, 1020, 47, 11, '#f0c35b', 'bold');
  for (let i = 0; i < 5; i++) {
    ctx.globalAlpha = i < wrathLevel(state) ? 1 : 0.16;
    stamp(ctx, String(i + 1), 1078 + i * 35, 76, 24, (i % 2 ? 1 : -1) * 0.07);
  }
  ctx.globalAlpha = 1;

  panel(ctx, 18, 89, 978, 26, '#222936', COLORS.gold);
  text(ctx, 'WIN  Seal all 8 scrolls', 33, 107, 12, '#8bd0ac', 'bold');
  text(ctx, 'LOSE  Bell cracks reach 0', 255, 107, 12, '#f06a58', 'bold');
  const progress = state.cleared / Math.max(1, state.total);
  text(ctx, `WAVE ${Math.min(3, Math.floor((state.total - state.queue.length) / Math.ceil(state.total / 3)) + 1)} / 3`, 525, 107, 11, COLORS.white, 'bold');
  ctx.fillStyle = '#4a4d51'; ctx.fillRect(620, 99, 222, 7);
  ctx.fillStyle = '#e24937'; ctx.fillRect(620, 99, 222 * progress, 7);
  text(ctx, `${state.cleared}/${state.total}`, 980, 107, 12, COLORS.white, 'bold', false, 'right');

  panel(ctx, 1014, 128, 248, 240, '#171c24', COLORS.gold);
  text(ctx, 'THREAT QUEUE', 1028, 153, 17, '#f0c35b', 'bold', true);
  text(ctx, `${state.enemies.length} ON PAPER`, 1246, 176, 10, '#ef5b48', 'bold', false, 'right');
  text(ctx, `${state.queue.length} INCOMING`, 1028, 176, 10, '#d4cfbf', 'bold');
  line(ctx, [[1028, 187], [1246, 187]], '#806c3e', 1);
  const counts = {};
  if (state.enemies.some(e => e.kind === 'oni')) counts.oni = 1;
  for (const threat of state.queue) counts[threat.kind] = (counts[threat.kind] || 0) + 1;
  const rows = Object.entries(counts).slice(0, 4);
  if (!rows.length) text(ctx, 'Last spirits on the paper', 1030, 222, 13, '#8bd0ac', 'normal', true);
  rows.forEach(([kind, count], i) => {
    const y = 210 + i * 31;
    if (kind === 'oni') { circle(ctx, 1040, y, 12, COLORS.red); text(ctx, '!', 1040, y + 5, 17, COLORS.white, 'bold', true, 'center'); }
    else drawYokai(ctx, { x: 1040, y, kind, color: YOKAI[kind].color, radius: 15, phase: 0 }, state.time, 0.52);
    text(ctx, kind === 'oni' ? 'ONI BOSS' : YOKAI[kind].name, 1062, y + 5, 12, '#f4eddb', 'bold');
    text(ctx, `× ${count}`, 1246, y + 5, 14, '#f4eddb', 'bold', false, 'right');
  });
  const next = state.queue[0];
  text(ctx, next ? `NEXT  ${next.kind === 'oni' ? 'ONI BOSS' : YOKAI[next.kind].name}  ·  ${Math.max(0, state.spawnTime).toFixed(1)}s` : 'CLEAR THE GARDEN TO CONTINUE', 1028, 350, 10, next?.kind === 'oni' ? '#ef5b48' : '#d4cfbf', 'bold');

  panel(ctx, 1014, 380, 248, 188, '#171c24', COLORS.gold);
  text(ctx, 'BRUSH ARTS', 1028, 405, 18, '#f0c35b', 'bold', true);
  text(ctx, `${state.arts.length} / 7 HELD`, 1246, 405, 10, '#d4cfbf', 'bold', false, 'right');
  if (!state.arts.length) {
    text(ctx, 'Your brush is a blank page.', 1028, 437, 14, '#d4cfbf', 'normal', true);
    wrapText(ctx, 'Clear a scroll. Choose 1 of 3 arts. Shape your own way to win.', 1028, 462, 210, 20, 13, '#d4cfbf');
  } else {
    state.arts.forEach((id, i) => {
      const art = findArt(id), x = 1028, y = 432 + i * (state.arts.length <= 5 ? 23 : 17);
      drawArtIcon(ctx, id, x + 9, y - 4, 19);
      text(ctx, art.name, x + 24, y, state.arts.length <= 5 ? 13 : 11, '#f4eddb', 'bold');
      drawLevelPips(ctx, state, id, 1210, y - 4);
    });
  }
  text(ctx, (state.unlocks.includes('moonInk') ? '14' : '12') + ' ARTS · EVERY RUN A NEW BRUSH', 1028, 551, 9, '#f0c35b', 'bold');

  panel(ctx, 1014, 580, 248, 114, '#171c24', COLORS.gold);
  const bossOmen = state.mode === 'play' && state.omen.id === 'boss' && state.enemies.some(e => e.kind === 'oni' && !e.dead);
  text(ctx, 'OMEN / OPTIONAL', 1028, 602, 12, '#f0c35b', 'bold');
  wrapText(ctx, state.omen.label, 1028, 626, 216, 20, 16, '#f4eddb');
  if (!bossOmen) text(ctx, omenProgress(state.omen), 1028, 675, 11, state.omen.complete ? '#8bd0ac' : '#ef5b48', 'bold');
  text(ctx, omenReward(state.omen), 1246, 675, 9, '#f0c35b', 'bold', false, 'right');

  panel(ctx, 18, 708, 978, 62, '#222936', COLORS.gold);
  text(ctx, 'INK', 34, 729, 12, '#f0c35b', 'bold');
  text(ctx, `${Math.ceil(state.ink)} / ${state.maxInk}`, 261, 729, 12, COLORS.white, 'bold', false, 'right');
  ctx.fillStyle = '#4a4d51'; ctx.fillRect(34, 740, 218, 12);
  ctx.fillStyle = state.ink < 20 ? '#ef5b48' : '#f0c35b'; ctx.fillRect(34, 740, 218 * state.ink / state.maxInk, 12);
  line(ctx, [[270, 720], [270, 759]], '#806c3e', 1);
  text(ctx, 'BELL', 287, 729, 12, '#f0c35b', 'bold');
  text(ctx, `${state.bell.hp} / ${state.bell.maxHp}`, 478, 729, 12, state.bell.hp < 4 ? '#ef5b48' : COLORS.white, 'bold', false, 'right');
  for (let i = 0; i < state.bell.maxHp; i++) { const step = 195 / state.bell.maxHp; ctx.fillStyle = i < state.bell.hp ? (state.bell.hp < 4 ? '#ef5b48' : '#f0c35b') : '#4a4d51'; ctx.fillRect(287 + i * step, 740, step - 3, 12); }
  line(ctx, [[500, 720], [500, 759]], '#806c3e', 1);
  text(ctx, 'COMBO', 518, 729, 12, '#f0c35b', 'bold');
  text(ctx, `×${state.combo.toFixed(1)}`, 585, 751, 30, '#ef5b48', 'bold', true);
  ctx.fillStyle = '#4a4d51'; ctx.fillRect(518, 741, 54, 6);
  ctx.fillStyle = '#ef5b48'; ctx.fillRect(518, 741, 54 * Math.min(1, state.comboTime / comboDuration(state)), 6);
  text(ctx, 'RITUALS', 681, 729, 10, '#d4cfbf', 'bold');
  text(ctx, `SPACE ${state.monk.dashCooldown > 0 ? state.monk.dashCooldown.toFixed(1) + 's' : 'READY'} · SPLASH ${state.splashCooldown > 0 ? state.splashCooldown.toFixed(1) + 's' : 'READY'}`, 294, 690, 10, '#171c24', 'bold');
  text(ctx, `Q ${state.qCooldown > 0 ? Math.ceil(state.qCooldown) + 's' : 'READY'}`, 681, 751, 12, '#8dc8e2', 'bold');
  text(ctx, `E ${state.eCooldown > 0 ? Math.ceil(state.eCooldown) + 's' : 'READY'}`, 758, 751, 12, '#f0c35b', 'bold');
  text(ctx, 'GRADE', 927, 727, 9, '#d4cfbf', 'bold', false, 'center');
  text(ctx, gradeRun(state), 927, 754, 29, COLORS.white, 'bold', true, 'center');
  text(ctx, 'WASD MOVE  ·  LMB PAINT + CLOSE LOOP  ·  RMB SPLASH  ·  SPACE DASH  ·  Q LOTUS  ·  E BELL  ·  P PAUSE  ·  G CINEMATIC', 20, 790, 11, '#e5dfd0');
  text(ctx, `${state.sealed} SEALED  ·  ${Math.floor(state.runTime / 60)}:${String(Math.floor(state.runTime % 60)).padStart(2, '0')}`, 1260, 751, 15, COLORS.white, 'bold', true, 'right');
  text(ctx, 'AN ORIGINAL INK-PAINTING DEFENCE', 1260, 789, 10, '#e5dfd0', 'bold', false, 'right');
}
export function drawWaveBanner(ctx, state) {
  if (state.huntBanner > 0) {
    panel(ctx, 270, 235, 450, 48, '#bb4436ee', '#bb4436');
    text(ctx, 'WRATH 5 — THE HUNT', 495, 268, 28, COLORS.white, 'bold', true, 'center');
  }
  if (state.bannerTime <= 0) return;
  ctx.globalAlpha = Math.min(1, state.bannerTime);
  const scroll = getScroll(state), season = getSeason(state);
  panel(ctx, 207, 255, 574, 123, '#171c24f5', COLORS.gold);
  text(ctx, `SCROLL ${state.scroll} — ${season.name}`, 494, 286, 17, '#f0c35b', 'bold', false, 'center');
  text(ctx, scroll.boss ? ONI[scroll.boss].short : scroll.name.toUpperCase(), 494, 324, 28, COLORS.white, 'bold', true, 'center');
  text(ctx, 'GUARD THE BELL · DRAW THE WARD · SEAL THE WANDERERS', 494, 353, 11, '#ddd4c1', 'bold', false, 'center');
  ctx.globalAlpha = 1;
}
