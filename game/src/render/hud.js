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
  text(ctx, 'INKWARD', 28, 61, 43, COLORS.ink, 'bold', true);
  text(ctx, 'GUARD THE LAST BELL', 30, 78, 10, COLORS.faint, 'bold');
  text(ctx, `SCROLL ${String(state.scroll).padStart(2, '0')} / 08`, 308, 36, 18, COLORS.ink, 'bold');
  text(ctx, `${season.name}  /  ${scroll.name}`, 308, 60, 16, season.color, 'normal', true);
  for (let i = 0; i < 8; i++) {
    const x = 308 + i * 31;
    ctx.fillStyle = i < state.scroll - 1 ? COLORS.red : i === state.scroll - 1 ? season.color : '#ddd3bb';
    ctx.fillRect(x, 72, 24, 5);
  }
  text(ctx, 'SCORE', 708, 29, 11, COLORS.faint, 'bold');
  text(ctx, String(state.score).padStart(6, '0'), 706, 63, 34, COLORS.ink, 'bold', true);
  text(ctx, 'PERSONAL BEST', 991, 29, 11, COLORS.faint, 'bold');
  text(ctx, String(state.best).padStart(6, '0'), 989, 63, 32, COLORS.gold, 'bold', true);
  text(ctx, audio.muted ? 'M  SOUND OFF' : 'M  SOUND ON', 1250, 77, 10, COLORS.faint, 'bold', false, 'right');
  text(ctx, 'WRATH', 991, 101, 11, COLORS.red, 'bold');
  text(ctx, `×${wrathMultiplier(state).toFixed(1)}`, 991, 116, 11, COLORS.gold, 'bold');
  for (let i = 0; i < 5; i++) {
    ctx.globalAlpha = i < wrathLevel(state) ? 1 : 0.16;
    stamp(ctx, String(i + 1), 1063 + i * 40, 105, 26, (i % 2 ? 1 : -1) * 0.07);
  }
  ctx.globalAlpha = 1;

  panel(ctx, 28, 92, 932, 25, '#eee6d1');
  text(ctx, 'WIN  Seal all 8 scrolls', 43, 109, 12, COLORS.green, 'bold');
  text(ctx, 'LOSE  Bell cracks reach 0', 267, 109, 12, COLORS.red, 'bold');
  const progress = state.cleared / Math.max(1, state.total);
  text(ctx, `WAVE ${Math.min(3, Math.floor((state.total - state.queue.length) / Math.ceil(state.total / 3)) + 1)} / 3`, 552, 109, 11, COLORS.ink, 'bold');
  ctx.fillStyle = '#d5cab1'; ctx.fillRect(642, 101, 198, 7);
  ctx.fillStyle = season.color; ctx.fillRect(642, 101, 198 * progress, 7);
  text(ctx, `${state.cleared}/${state.total}`, 943, 109, 12, COLORS.ink, 'bold', false, 'right');

  panel(ctx, 984, 128, 268, 240);
  text(ctx, 'THREAT QUEUE', 1001, 153, 18, COLORS.ink, 'bold', true);
  text(ctx, `${state.enemies.length} ON PAPER`, 1235, 176, 10, COLORS.red, 'bold', false, 'right');
  text(ctx, `${state.queue.length} INCOMING`, 1001, 176, 10, COLORS.faint, 'bold');
  line(ctx, [[1001, 187], [1235, 187]], COLORS.line, 1);
  const counts = {};
  if (state.enemies.some(e => e.kind === 'oni')) counts.oni = 1;
  for (const threat of state.queue) counts[threat.kind] = (counts[threat.kind] || 0) + 1;
  const rows = Object.entries(counts).slice(0, 4);
  if (!rows.length) text(ctx, 'Last spirits on the paper', 1003, 222, 14, COLORS.green, 'normal', true);
  rows.forEach(([kind, count], i) => {
    const y = 210 + i * 31;
    if (kind === 'oni') { circle(ctx, 1017, y, 12, COLORS.red); text(ctx, '!', 1017, y + 5, 17, COLORS.white, 'bold', true, 'center'); }
    else drawYokai(ctx, { x: 1017, y, kind, color: YOKAI[kind].color, radius: 15, phase: 0 }, state.time, 0.52);
    text(ctx, kind === 'oni' ? 'ONI BOSS' : YOKAI[kind].name, 1042, y + 5, 12, COLORS.ink, 'bold');
    text(ctx, `× ${count}`, 1234, y + 5, 14, COLORS.ink, 'bold', false, 'right');
  });
  const next = state.queue[0];
  text(ctx, next ? `NEXT  ${next.kind === 'oni' ? 'ONI BOSS' : YOKAI[next.kind].name}  ·  ${Math.max(0, state.spawnTime).toFixed(1)}s` : 'CLEAR THE GARDEN TO CONTINUE', 1001, 350, 11, next?.kind === 'oni' ? COLORS.red : COLORS.faint, 'bold');

  panel(ctx, 984, 380, 268, 188);
  text(ctx, 'BRUSH ARTS', 1001, 405, 18, COLORS.ink, 'bold', true);
  text(ctx, `${state.arts.length} / 7 HELD`, 1234, 405, 10, COLORS.faint, 'bold', false, 'right');
  if (!state.arts.length) {
    text(ctx, 'Your brush is a blank page.', 1001, 437, 15, COLORS.faint, 'normal', true);
    wrapText(ctx, 'Clear a scroll. Choose 1 of 3 arts. Shape your own way to win.', 1001, 462, 225, 20, 13);
  } else {
    state.arts.forEach((id, i) => {
      const art = findArt(id), x = 1001, y = 432 + i * (state.arts.length <= 5 ? 23 : 17);
      drawArtIcon(ctx, id, x + 9, y - 4, 19);
      text(ctx, art.name, x + 24, y, state.arts.length <= 5 ? 14 : 12, COLORS.ink, 'bold');
      drawLevelPips(ctx, state, id, 1196, y - 4);
    });
  }
  text(ctx, '12 ARTS · EVERY RUN A NEW BRUSH', 1001, 551, 10, COLORS.gold, 'bold');

  panel(ctx, 984, 580, 268, 114, '#eee8d7');
  text(ctx, 'OMEN / OPTIONAL', 1001, 602, 12, COLORS.gold, 'bold');
  wrapText(ctx, state.omen.label, 1001, 626, 228, 20, 17, COLORS.ink);
  text(ctx, omenProgress(state.omen), 1001, 675, 11, state.omen.complete ? COLORS.green : COLORS.red, 'bold');
  text(ctx, omenReward(state.omen), 1235, 675, 10, COLORS.gold, 'bold', false, 'right');

  panel(ctx, 28, 708, 932, 62, '#f0e7d1');
  text(ctx, 'INK', 46, 729, 12, COLORS.ink, 'bold');
  text(ctx, `${Math.ceil(state.ink)} / ${state.maxInk}`, 275, 729, 12, COLORS.ink, 'bold', false, 'right');
  ctx.fillStyle = '#d8ceb6'; ctx.fillRect(46, 740, 230, 12);
  ctx.fillStyle = state.ink < 20 ? COLORS.red : COLORS.ink; ctx.fillRect(46, 740, 230 * state.ink / state.maxInk, 12);
  line(ctx, [[292, 720], [292, 759]], COLORS.line, 1);
  text(ctx, 'BELL', 309, 729, 12, COLORS.ink, 'bold');
  text(ctx, `${state.bell.hp} / ${state.bell.maxHp}`, 505, 729, 12, state.bell.hp < 4 ? COLORS.red : COLORS.gold, 'bold', false, 'right');
  for (let i = 0; i < state.bell.maxHp; i++) { const step = 200 / state.bell.maxHp; ctx.fillStyle = i < state.bell.hp ? (state.bell.hp < 4 ? COLORS.red : COLORS.gold) : '#d8ceb6'; ctx.fillRect(309 + i * step, 740, step - 3, 12); }
  line(ctx, [[535, 720], [535, 759]], COLORS.line, 1);
  text(ctx, 'COMBO', 554, 729, 12, COLORS.ink, 'bold');
  text(ctx, `×${state.combo.toFixed(1)}`, 620, 751, 32, COLORS.red, 'bold', true);
  ctx.fillStyle = '#d8ceb6'; ctx.fillRect(554, 741, 54, 6);
  ctx.fillStyle = COLORS.red; ctx.fillRect(554, 741, 54 * Math.min(1, state.comboTime / comboDuration(state)), 6);
  text(ctx, 'RITUALS', 734, 729, 10, COLORS.faint, 'bold');
  text(ctx, `Q ${state.qCooldown > 0 ? Math.ceil(state.qCooldown) + 's' : 'READY'}`, 734, 751, 12, COLORS.blue, 'bold');
  text(ctx, `E ${state.eCooldown > 0 ? Math.ceil(state.eCooldown) + 's' : 'READY'}`, 811, 751, 12, COLORS.gold, 'bold');
  text(ctx, 'GRADE', 920, 727, 9, COLORS.faint, 'bold', false, 'center');
  text(ctx, gradeRun(state), 920, 754, 29, COLORS.ink, 'bold', true, 'center');
  text(ctx, 'WASD  Move    LMB  Paint + close loop    RMB  Splash    SPACE  Dash    Q  Lotus hush    E  Bell ward    P  Pause', 29, 790, 12, COLORS.faint);
  text(ctx, `${state.sealed} SEALED  ·  ${Math.floor(state.runTime / 60)}:${String(Math.floor(state.runTime % 60)).padStart(2, '0')}`, 1250, 751, 16, COLORS.ink, 'bold', true, 'right');
  text(ctx, 'AN ORIGINAL INK-PAINTING DEFENCE', 1250, 789, 10, COLORS.faint, 'bold', false, 'right');
}
export function drawWaveBanner(ctx, state) {
  if (state.huntBanner > 0) {
    panel(ctx, 270, 235, 450, 48, '#bb4436ee', '#bb4436');
    text(ctx, 'WRATH 5 — THE HUNT', 495, 268, 28, COLORS.white, 'bold', true, 'center');
  }
  if (state.bannerTime <= 0) return;
  ctx.globalAlpha = Math.min(1, state.bannerTime);
  const scroll = getScroll(state), season = getSeason(state);
  panel(ctx, 207, 255, 574, 123, '#faf3e6f5', season.color);
  text(ctx, `SCROLL ${state.scroll} — ${season.name}`, 494, 286, 17, season.color, 'bold', false, 'center');
  text(ctx, scroll.boss ? ONI[scroll.boss].short : scroll.name.toUpperCase(), 494, 324, 28, COLORS.ink, 'bold', true, 'center');
  text(ctx, 'GUARD THE BELL · DRAW THE WARD · SEAL THE WANDERERS', 494, 353, 11, COLORS.faint, 'bold', false, 'center');
  ctx.globalAlpha = 1;
}
