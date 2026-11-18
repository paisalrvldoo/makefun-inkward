import { COLORS } from './config.js';
import { text, panel, circle, line } from './render/primitives.js';

export const ACHIEVEMENTS = [
  { id: 'firstScroll', name: 'First Scroll', desc: 'Seal every spirit in Scroll I', icon: 'scroll' },
  { id: 'combo4', name: 'Combo Artist', desc: 'Reach combo ×4', icon: 'combo' },
  { id: 'wrath4', name: 'Wrathful Spirit', desc: 'Reach WRATH level 4', icon: 'wrath' },
  { id: 'walls50', name: 'Wall Master', desc: 'Paint 50 ink walls in one pilgrimage', icon: 'wall' },
  { id: 'bossDefeat', name: 'Oni Slayer', desc: 'Seal an Oni boss', icon: 'boss' },
  { id: 'unharmed', name: 'Untouchable', desc: 'Complete a scroll with full bell health', icon: 'bell' },
  { id: 'bigSeal', name: 'Grand Seal', desc: 'Seal 5+ spirits in a single loop', icon: 'seal' },
  { id: 'omens4', name: 'Favoured by Omens', desc: 'Fulfill 4 omens', icon: 'omen' },
  { id: 'maxInk', name: 'Overflowing Ink', desc: 'Reach 160 max ink', icon: 'ink' },
  { id: 'pathfinder', name: 'Pathfinder', desc: 'Walk all three road types', icon: 'path' },
  { id: 'circuit', name: 'Ascendant', desc: 'Complete an ascension circuit', icon: 'ascend' },
  { id: 'victory', name: 'The Bell Endures', desc: 'Win the 8-scroll pilgrimage', icon: 'victory' },
];

export function drawAchievementIcon(ctx, id, x, y, size = 22) {
  ctx.save();
  circle(ctx, x, y, size, '#232e38', '#c49a3d', 1.5);
  ctx.strokeStyle = '#f0d078'; ctx.fillStyle = '#f0d078'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
  const s = size * 0.5;
  if (id === 'scroll') {
    ctx.fillRect(x - s * 0.7, y - s * 0.5, s * 1.4, s);
    line(ctx, [[x - s * 0.9, y - s * 0.5], [x - s * 0.9, y + s * 0.3]], '#ce3327', 2);
  } else if (id === 'combo') {
    text(ctx, '×4', x, y + s * 0.4, size * 0.9, '#f2a247', 'bold', false, 'center');
  } else if (id === 'wrath') {
    for (let i = 0; i < 4; i++) circle(ctx, x - s * 0.6 + i * s * 0.4, y, s * 0.2, '#ef5b48');
  } else if (id === 'wall') {
    line(ctx, [[x - s * 0.8, y + s * 0.5], [x, y - s * 0.6]], '#d4cfbf', 2);
    line(ctx, [[x, y - s * 0.6], [x + s * 0.8, y + s * 0.3]], '#d4cfbf', 2);
    circle(ctx, x, y + s * 0.3, s * 0.35, null, COLORS.ink, 2);
  } else if (id === 'boss') {
    circle(ctx, x, y, s * 0.7, null, '#ce3327', 2);
    circle(ctx, x, y - s * 0.2, s * 0.25, '#ce3327');
    text(ctx, '鬼', x, y + s * 0.55, size * 0.8, '#ed5240', 'bold', false, 'center');
  } else if (id === 'bell') {
    ctx.beginPath(); ctx.arc(x, y + s * 0.1, s * 0.45, Math.PI, 0); ctx.stroke();
    ctx.fillRect(x - s * 0.3, y - s * 0.1, s * 0.6, s * 0.25);
  } else if (id === 'seal') {
    ctx.beginPath(); ctx.arc(x, y, s * 0.7, 0, Math.PI * 2); ctx.stroke();
    circle(ctx, x, y, s * 0.25, '#f0d078');
  } else if (id === 'omen') {
    circle(ctx, x, y, s * 0.7, null, '#8fadd8', 1.5);
    line(ctx, [[x, y - s * 0.5], [x, y + s * 0.5]], '#8fadd8', 1.5);
    line(ctx, [[x - s * 0.5, y], [x + s * 0.5, y]], '#8fadd8', 1.5);
  } else if (id === 'ink') {
    circle(ctx, x, y, s * 0.5, '#0a0f16');
    ctx.beginPath(); ctx.arc(x, y + s * 0.15, s * 0.4, Math.PI, 0); ctx.stroke();
    text(ctx, '∞', x, y + s * 0.55, size * 0.65, '#f0c35b', 'bold', false, 'center');
  } else if (id === 'path') {
    for (let i = 0; i < 3; i++) {
      const px = x - s * 0.5 + i * s * 0.5;
      circle(ctx, px, y - s * 0.2, s * 0.18, i === 0 ? '#e8ba53' : i === 1 ? '#75b395' : '#8fadd8');
    }
    line(ctx, [[x - s * 0.5, y + s * 0.3], [x + s * 0.5, y + s * 0.3]], '#c49a3d', 1);
  } else if (id === 'ascend') {
    for (let i = 0; i < 3; i++) {
      const iy = y + s * 0.4 - i * s * 0.3;
      circle(ctx, x, iy, s * 0.2, i === 0 ? '#bd5364' : i === 1 ? '#704e92' : '#75b395');
    }
    line(ctx, [[x, y - s * 0.4], [x, y + s * 0.4]], '#d8b5fa', 1);
  } else if (id === 'victory') {
    ctx.beginPath(); ctx.moveTo(x, y - s * 0.7); ctx.lineTo(x - s * 0.5, y + s * 0.5); ctx.lineTo(x + s * 0.5, y + s * 0.5); ctx.closePath(); ctx.stroke();
    circle(ctx, x, y + s * 0.1, s * 0.3, '#e4b550');
  }
  ctx.restore();
}

export function checkAchievements(state) {
  if (!state.achievements || !state.progress.achievements) return;
  const earned = (id) => {
    if (state.progress.achievements.includes(id)) return;
    state.progress.achievements.push(id);
    if (!state.newAchievements) state.newAchievements = [];
    state.newAchievements.push(id);
  };
  const walls = state.strokeCount || 0;
  if (state.scroll >= 2 && state.mode === 'draft') earned('firstScroll');
  if (state.peakCombo >= 4) earned('combo4');
  if (state.peakWrath >= 4) earned('wrath4');
  if (walls >= 50) earned('walls50');
  if (state.sealed > 0 && state.yokaiByType?.oni > 0) earned('bossDefeat');
  if (state.unharmedScroll) earned('unharmed');
  if (state.largestSeal >= 5) earned('bigSeal');
  if (state.omenHistory && state.omenHistory.filter(o => o.complete).length >= 4) earned('omens4');
  if (state.maxInk >= 160) earned('maxInk');
  if (state.activeRoad === 'shrine' && state.route) {
    const walked = state.route.filter(Boolean);
    if (walked.includes('swarm') && walked.includes('quiet') && walked.includes('shrine')) earned('pathfinder');
  }
  if (state.circuits > 0) earned('circuit');
  if (state.mode === 'win') earned('victory');
}

export function drawAchievementPanel(ctx, achievements, x, y, w) {
  panel(ctx, x - 2, y - 2, w + 4, 174, '#111827f8', '#c49a3d');
  text(ctx, 'ACHIEVEMENTS', x + w / 2, y + 20, 14, '#edc571', 'bold', false, 'center');
  const cols = 4, gapX = (w - 20) / cols, gapY = 36;
  ACHIEVEMENTS.forEach((ach, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const ax = x + 14 + col * gapX, ay = y + 36 + row * gapY;
    const earned = achievements.includes(ach.id);
    ctx.save(); ctx.globalAlpha = earned ? 1 : 0.35;
    drawAchievementIcon(ctx, ach.id, ax + 11, ay + 11, 11);
    text(ctx, ach.name, ax + 26, ay + 17, 9, earned ? '#fff0d2' : '#7b8180', 'bold');
    text(ctx, earned ? ach.desc : '???', ax + 26, ay + 29, 7, earned ? '#b9c4bc' : '#5b6060', 'bold');
    ctx.restore();
    line(ctx, [[ax + 64, ay + 4], [ax + 64, ay + 30]], '#4a3e2b', 1);
  });
}