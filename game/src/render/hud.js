import { COLORS } from '../config.js';
import { getScroll, getSeason } from '../world/scrolls.js';
import { gradeRun } from '../world/state.js';
import { YOKAI } from '../entities/yokai.js';
import { findArt } from '../arts/brushArts.js';
import { drawArtIcon, drawLevelPips } from './arts.js';
import { artLevel, comboDuration } from '../arts/levels.js';
import { drawYokai } from './sprites.js';
import { text, line, panel, circle, wrapText, stamp } from './primitives.js';
import { wrathLevel, wrathMultiplier } from '../world/wrath.js';
import { omenReward, omenProgress } from '../world/omens.js';
import { ONI } from '../entities/bosses.js';
import { activeSynergies } from '../arts/schools.js';

import { drawRelics } from './relics.js';
import { isAscension, wrathCap, ascensionLabel } from '../world/ascension.js';
import { ultRatio, ultReady } from '../arts/ultimate.js';

export function drawHud(ctx, state, audio) {
  const scroll = getScroll(state), season = getSeason(state);
  // Lacquer bands hold the paper garden in a high-contrast frame.
  ctx.fillStyle = '#0e141e'; ctx.fillRect(0, 0, 1280, 122);
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
  drawRelics(ctx, state, 900, 80);
  if (state.scroll > 1) text(ctx, state.activeRoad === 'swarm' ? 'SWARM ROAD +30%' : state.activeRoad === 'shrine' ? 'SHRINE / PASSIVE RELIC' : 'QUIET ROAD +2 BELL', 576, 81, 9, '#e1bf70', 'bold');
  text(ctx, 'SCORE', 690, 28, 11, COLORS.gold, 'bold');
  text(ctx, String(Math.round(state.scoreShown ?? state.score)).padStart(6, '0'), 688, 64, 34, COLORS.white, 'bold', true);
  text(ctx, 'PERSONAL BEST', 906, 28, 11, COLORS.gold, 'bold');
  text(ctx, String(state.best).padStart(6, '0'), 904, 62, 30, '#f0c35b', 'bold', true);
  text(ctx, audio.muted ? 'M  SOUND OFF' : 'M  SOUND ON', 1250, 77, 10, '#e5dfd0', 'bold', false, 'right');
  text(ctx, isAscension(state) ? 'WRATH / ' + wrathCap(state) : 'WRATH', 1020, 28, 11, '#ef5b48', 'bold');
  text(ctx, `×${wrathMultiplier(state).toFixed(1)}`, 1020, 47, 11, '#f0c35b', 'bold');
  for (let i = 0; i < 5; i++) {
    ctx.globalAlpha = i < wrathLevel(state) ? 1 : 0.16;
    stamp(ctx, String(i + 1), 1078 + i * 35, 76, 24, (i % 2 ? 1 : -1) * 0.07);
  }
  ctx.globalAlpha = 1;

  panel(ctx, 18, 89, 978, 26, '#222936', COLORS.gold);
  text(ctx, isAscension(state) ? 'ASCEND / CIRCUIT ' + state.ascension : 'WIN  Seal all 8 scrolls', 33, 107, 12, '#8bd0ac', 'bold');
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
  const synergies = activeSynergies(state);
  text(ctx, `${state.arts.length} HELD`, 1246, 405, 10, '#d4cfbf', 'bold', false, 'right');
  if (!state.arts.length) {
    text(ctx, 'Your brush is a blank page.', 1028, 437, 14, '#d4cfbf', 'normal', true);
    wrapText(ctx, 'Clear a scroll. Choose 1 of 3 arts. Shape your own way to win.', 1028, 462, 210, 20, 13, '#d4cfbf');
  } else {
    state.arts.forEach((id, i) => {
      const compact = state.arts.length > 7;
      const gap = synergies.length ? state.arts.length <= 5 ? 19 : 14 : state.arts.length <= 5 ? 23 : 17;
      const art = findArt(id), x = 1028 + (compact ? Math.floor(i / 7) * 114 : 0), y = 432 + (compact ? i % 7 * 14 : i * gap);
      drawArtIcon(ctx, id, x + 9, y - 4, compact ? 13 : Math.min(19, gap - 1));
      text(ctx, compact ? art.name.split(' ')[0] : art.name, x + (compact ? 18 : 24), y, compact ? 9 : gap >= 19 ? 13 : 11, '#f4eddb', 'bold');
      if (compact) text(ctx, String(artLevel(state, id)), x + 99, y, 9, '#f4d082', 'bold');
      else drawLevelPips(ctx, state, id, 1210, y - 4);
    });
  }
  if (synergies.length) {
    const colors = synergies[0].color;
    panel(ctx, 1026, 529, 224, 30, '#25363c', colors);
    text(ctx, 'SYNERGY', 1033, 541, 9, colors, 'bold');
    text(ctx, synergies.map(s => s.name).join(' + '), 1243, 541, 9, '#fff2dc', 'bold', false, 'right');
    text(ctx, synergies.map(s => s.bonus.replace(' WALL LIFE', ' WALL').replace(' INK REFILL', ' REFILL').replace(' SEAL SCORE', ' SCORE')).join(' · '), 1033, 553, 9, '#fff2dc', 'bold');
  } else text(ctx, (state.unlocks.includes('moonInk') ? '14' : '12') + ' ARTS · PAIR SCHOOLS FOR SYNERGY', 1028, 551, 9, '#f0c35b', 'bold');

  panel(ctx, 1014, 580, 248, 114, '#171c24', COLORS.gold);
  const bossOmen = state.mode === 'play' && state.omen.id === 'boss' && state.enemies.some(e => e.kind === 'oni' && !e.dead);
  text(ctx, 'OMEN / OPTIONAL', 1028, 602, 12, '#f0c35b', 'bold');
  wrapText(ctx, state.omen.label, 1028, 626, 216, 20, 16, '#f4eddb');
  if (!bossOmen) text(ctx, omenProgress(state.omen), 1028, 675, 11, state.omen.complete ? '#8bd0ac' : '#ef5b48', 'bold');
  text(ctx, omenReward(state.omen), 1246, 675, 9, '#f0c35b', 'bold', false, 'right');

  panel(ctx, 18, 708, 978, 58, '#222936', COLORS.gold);
  text(ctx, 'HEALTH', 34, 722, 11, '#e8c06a', 'bold');
  text(ctx, `${Math.ceil(state.monk.health)} / ${state.monk.maxHealth}`, 261, 722, 11, state.monk.health < 3 ? '#ef5b48' : COLORS.white, 'bold', false, 'right');
  ctx.fillStyle = '#4a4d51'; ctx.fillRect(34, 730, 218, 12);
  const healthColor = state.monk.health < 3 ? '#ef5b48' : state.monk.health < 6 ? '#f0a838' : '#8bd0ac';
  ctx.fillStyle = healthColor; ctx.fillRect(34, 730, 218 * state.monk.health / state.monk.maxHealth, 12);
  line(ctx, [[270, 720], [270, 754]], '#806c3e', 1);
  text(ctx, 'INK', 287, 722, 11, '#f0c35b', 'bold');
  text(ctx, `${Math.ceil(state.ink)} / ${state.maxInk}`, 478, 722, 11, state.ink < 20 ? '#ef5b48' : COLORS.white, 'bold', false, 'right');
  ctx.fillStyle = '#4a4d51'; ctx.fillRect(287, 730, 178, 12);
  ctx.fillStyle = state.ink < 20 ? '#ef5b48' : '#f0c35b'; ctx.fillRect(287, 730, 178 * state.ink / state.maxInk, 12);
  if (state.monk.stunned) { text(ctx, 'STUNNED', 376, 751, 11, '#ef5b48', 'bold', false, 'center'); }
  line(ctx, [[480, 720], [480, 754]], '#806c3e', 1);
  text(ctx, 'BELL', 500, 722, 11, '#f0c35b', 'bold');
  text(ctx, `${state.bell.hp} / ${state.bell.maxHp}`, 680, 722, 11, state.bell.hp < 4 ? '#ef5b48' : COLORS.white, 'bold', false, 'right');
  for (let i = 0; i < state.bell.maxHp; i++) { const step = 170 / state.bell.maxHp; ctx.fillStyle = i < state.bell.hp ? (state.bell.hp < 4 ? '#ef5b48' : '#f0c35b') : '#4a4d51'; ctx.fillRect(500 + i * step, 730, step - 3, 12); }
  line(ctx, [[695, 720], [695, 754]], '#806c3e', 1);
  text(ctx, 'COMBO', 710, 722, 11, '#f0c35b', 'bold');
  const comboColor = state.combo >= 6 ? '#ffd273' : state.combo >= 3 ? '#ff9558' : '#ef5b48';
  if (state.combo >= 3) {
    for (let i = 0; i < Math.min(6, Math.floor(state.combo)); i++) {
      const x = 760 + i * 11, rise = 8 + Math.sin(state.time * 11 + i * 2) * 5;
      ctx.fillStyle = comboColor + '66'; ctx.beginPath(); ctx.moveTo(x - 4, 753); ctx.quadraticCurveTo(x - 6, 739, x + 2, 733 - rise); ctx.quadraticCurveTo(x + 7, 741, x + 4, 753); ctx.fill();
    }
  }
  text(ctx, `×${state.combo.toFixed(1)}`, 772, 751, 28 + Math.sin(state.time * 9) * (state.combo >= 6 ? 1.4 : 0), comboColor, 'bold', true);
  ctx.fillStyle = '#4a4d51'; ctx.fillRect(710, 741, 80, 6);
  ctx.fillStyle = '#ef5b48'; ctx.fillRect(710, 741, 80 * Math.min(1, state.comboTime / comboDuration(state)), 6);
  if (state.comboHeat > 0.01) {
    const hx = 710, hy = 754, hw = 80, heat = state.comboHeat;
    const heatColor = heat >= 0.66 ? '#f2a247' : heat >= 0.33 ? '#e8682a' : '#c94224';
    ctx.fillStyle = '#4a4d51'; ctx.fillRect(hx, hy, hw, 4);
    ctx.fillStyle = heatColor; ctx.fillRect(hx, hy, hw * heat, 4);
    if (heat >= 0.33) {
      for (let i = 0; i < Math.ceil(heat * 5); i++) {
        const fx = hx + i * (hw / 5) + (i % 2 ? 1 : -1) * Math.sin(state.time * 14 + i) * 2;
        const flicker = 3 + heat * 7 + Math.sin(state.time * 18 + i * 2.3) * 2;
        ctx.fillStyle = heat >= 0.66 ? '#ffbf44' + '88' : '#e86a30' + '66';
        ctx.beginPath(); ctx.moveTo(fx - 2, hy); ctx.quadraticCurveTo(fx - 1, hy - flicker, fx + 1, hy - flicker); ctx.quadraticCurveTo(fx + 2, hy - 3, fx + 2, hy); ctx.fill();
      }
    }
    if (heat >= 1) text(ctx, '+25%', hx + hw + 2, hy + 12, 9, '#ffb84d', 'bold');
  }
  text(ctx, 'RITUALS', 681, 729, 10, '#d4cfbf', 'bold');
  text(ctx, `SPACE ${state.monk.dashCooldown > 0 ? state.monk.dashCooldown.toFixed(1) + 's' : 'READY'} · SPLASH ${state.splashCooldown > 0 ? state.splashCooldown.toFixed(1) + 's' : 'READY'}`, 294, 690, 10, '#171c24', 'bold');
  text(ctx, `Q ${state.qCooldown > 0 ? Math.ceil(state.qCooldown) + 's' : 'READY'}`, 681, 751, 12, '#8dc8e2', 'bold');
  text(ctx, `E ${state.eCooldown > 0 ? Math.ceil(state.eCooldown) + 's' : 'READY'}`, 758, 751, 12, '#f0c35b', 'bold');
  // ULTIMATE — Great Seal meter and R keycap; glows when full.
  const ultFull = ultReady(state), ultFill = ultRatio(state);
  const ultX = 826;
  if (ultFull) {
    const glow = 0.5 + Math.sin(state.time * 8) * 0.3;
    ctx.fillStyle = `rgba(255,210,115,${glow})`; ctx.fillRect(ultX - 4, 716, 86, 40);
  }
  ctx.fillStyle = ultFull ? '#ffd273' : '#2a3040'; ctx.fillRect(ultX, 720, 24, 24);
  ctx.strokeStyle = ultFull ? '#fffaf0' : '#5a606e'; ctx.lineWidth = 1.5; ctx.strokeRect(ultX + 0.5, 720.5, 23, 23);
  text(ctx, 'R', ultX + 12, 737, 15, ultFull ? '#0a0f16' : '#9aa0ae', 'bold', true, 'center');
  text(ctx, 'ULT', ultX + 52, 731, 11, ultFull ? '#ffd273' : '#d4cfbf', 'bold');
  ctx.fillStyle = '#4a4d51'; ctx.fillRect(ultX + 32, 738, 50, 7);
  const ultColor = ultFill >= 1 ? '#ffd273' : ultFill >= 0.5 ? '#e8682a' : '#c93127';
  ctx.fillStyle = ultColor; ctx.fillRect(ultX + 32, 738, 50 * ultFill, 7);
  if (ultFill >= 1) text(ctx, 'READY', ultX + 57, 759, 9, '#ffd273', 'bold', false, 'center');
  text(ctx, 'GRADE', 927, 727, 9, '#d4cfbf', 'bold', false, 'center');
  text(ctx, gradeRun(state), 927, 754, 29, COLORS.white, 'bold', true, 'center');
  const mastery = Math.floor(state.sealed / 8) + state.circuits;
  text(ctx, `LV ${mastery + 1}  ·  ${state.sealed % 8}/8 SEALS`, 884, 751, 10, '#c4a4f0', 'bold');
  text(ctx, `${state.sealed} SEALED  ·  ${Math.floor(state.runTime / 60)}:${String(Math.floor(state.runTime % 60)).padStart(2, '0')}`, 996, 729, 12, COLORS.white, 'bold', true, 'right');
  const hints = [['WASD', 'MOVE'], ['LMB', 'PAINT'], ['RMB', 'SPLASH'], ['SPACE', 'DASH'], ['Q', 'LOTUS'], ['E', 'BELL'], ['R', 'ULT'], ['P', 'PAUSE'], ['M', 'SOUND']];
  let kx = 20;
  for (const [key, label] of hints) {
    const kw = ctx.measureText(key).width + 16;
    panel(ctx, kx, 768, kw, 18, '#1a2330', '#5a6a7a');
    text(ctx, key, kx + kw / 2, 781, 9, '#e5dfd0', 'bold', false, 'center');
    text(ctx, label, kx + kw + 3, 781, 9, '#9aa8b0', 'bold');
    kx += kw + ctx.measureText(label).width + 16;
  }
  text(ctx, 'AN ORIGINAL INK-PAINTING DEFENCE', 1260, 789, 10, '#e5dfd0', 'bold', false, 'right');
}
export function drawWaveBanner(ctx, state) {
  if (state.huntBanner > 0) {
    panel(ctx, 270, 235, 450, 48, '#bb4436ee', '#bb4436');
    text(ctx, 'WRATH ' + wrathLevel(state) + ' — THE HUNT', 495, 268, 28, COLORS.white, 'bold', true, 'center');
  }
  if (state.bannerTime <= 0) return;
  ctx.globalAlpha = Math.min(1, state.bannerTime);
  const scroll = getScroll(state), season = getSeason(state);
  panel(ctx, 207, 255, 574, 123, '#171c24f5', COLORS.gold);
  text(ctx, `SCROLL ${state.scroll} — ${season.name}`, 494, 286, 17, '#f0c35b', 'bold', false, 'center');
  text(ctx, scroll.boss ? ONI[scroll.boss].short : scroll.name.toUpperCase(), 494, 324, 28, COLORS.white, 'bold', true, 'center');
  text(ctx, isAscension(state) ? ascensionLabel(state) : 'GUARD THE BELL · DRAW THE WARD · SEAL THE WANDERERS', 494, 353, 11, '#ddd4c1', 'bold', false, 'center');
  ctx.globalAlpha = 1;
}
