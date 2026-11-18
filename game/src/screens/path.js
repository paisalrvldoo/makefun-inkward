import { text, panel, circle, line, hitRect } from '../render/primitives.js';
import { drawYokai } from '../render/sprites.js';
import { SCROLLS, SEASONS } from '../world/scrolls.js';
import { RELICS, shrineRelic } from '../arts/relics.js';
import { ROADS, availableRoads } from '../world/path.js';

const nodeX = column => 98 + column * 104;
const nodeY = road => road === 'shrine' ? 191 : road === 'swarm' ? 151 : 231;
export const ROAD_RECTS = ROADS.map((road, i) => ({ x: 904, y: 118 + i * 50, w: 330, h: 43, id: road.id }));
export const pathChoiceRects = state => availableRoads(state).map(road => ({ x: nodeX(state.scroll) - 18, y: nodeY(road.id) - 18, w: 36, h: 36, id: road.id }));

function branch(ctx, from, to, color, width) {
  const mid = (from.x + to.x) / 2;
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(from.x, from.y);
  ctx.bezierCurveTo(mid, from.y, mid, to.y, to.x, to.y); ctx.stroke();
}

function roadMark(ctx, id, x, y) {
  if (id === 'swarm') {
    circle(ctx, x - 5, y - 3, 3, '#fff4d7'); circle(ctx, x + 5, y - 3, 3, '#fff4d7');
    circle(ctx, x, y + 5, 3, '#fff4d7');
  } else {
    ctx.fillStyle = '#fff1c4'; ctx.beginPath();
    ctx.moveTo(x - 7, y + 6); ctx.lineTo(x - 5, y - 4); ctx.quadraticCurveTo(x, y - 12, x + 5, y - 4);
    ctx.lineTo(x + 7, y + 6); ctx.closePath(); ctx.fill();
    circle(ctx, x, y + 8, 2, '#fff1c4');
  }
}

export function drawPath(ctx, state, input) {
  const paper = ctx.createLinearGradient(0, 86, 0, 268);
  paper.addColorStop(0, '#f3e7c9'); paper.addColorStop(1, '#d5c8aa');
  panel(ctx, 42, 86, 840, 181, paper, '#b18b49');
  for (let i = 0; i < 220; i++) {
    ctx.fillStyle = i % 2 ? '#796b4210' : '#fff9e622';
    ctx.fillRect(46 + (i * 73 % 832), 90 + (i * 47 % 173), 1.5, 1.5);
  }
  SEASONS.forEach((season, i) => {
    text(ctx, season.name, 150 + i * 208, 105, 11, season.color, 'bold', false, 'center');
    line(ctx, [[58 + i * 208, 112], [242 + i * 208, 112]], season.color + '66', 1);
  });
  const locations = column => (column ? [2, 4, 6].includes(column) ? ['swarm', 'quiet', 'shrine'] : ['swarm', 'quiet'] : ['shrine']).map(id => ({ x: nodeX(column), y: nodeY(id), id }));
  ctx.save(); ctx.setLineDash([3, 5]);
  for (let column = 1; column < 8; column++) {
    for (const from of locations(column - 1)) for (const to of locations(column)) branch(ctx, from, to, '#81795866', 1.2);
  }
  ctx.restore();
  for (let column = 1; column < state.scroll; column++) {
    branch(ctx, { x: nodeX(column - 1), y: nodeY(state.route[column - 1]) }, { x: nodeX(column), y: nodeY(state.route[column]) }, '#172b34', 5);
  }
  if (state.roadChoice && state.scroll < 8) {
    ctx.save(); ctx.setLineDash([5, 5]);
    branch(ctx, { x: nodeX(state.scroll - 1), y: nodeY(state.route[state.scroll - 1]) }, { x: nodeX(state.scroll), y: nodeY(state.roadChoice) }, '#a54432', 3);
    ctx.restore();
  }
  SCROLLS.forEach((scroll, column) => {
    const season = SEASONS[scroll.season], next = column === state.scroll;
    text(ctx, String(column + 1).padStart(2, '0'), nodeX(column), 132, 10, next ? '#9d3228' : '#4b5552', 'bold', false, 'center');
    locations(column).forEach(node => {
      const walked = state.route[column] === node.id, current = column === state.scroll - 1 && walked;
      const selected = next && state.roadChoice === node.id;
      const rect = { x: node.x - 23, y: node.y - 23, w: 46, h: 46 };
      if (current) {
        const pulse = 24 + Math.sin(state.time * 3) * 3;
        circle(ctx, node.x, node.y, pulse, null, '#9e403488', 2);
        circle(ctx, node.x, node.y, pulse + 4, null, '#9e403433', 1);
      }
      if (selected || (next && hitRect(input.pointer, rect))) circle(ctx, node.x, node.y, 24, '#c7523622', '#aa3b2b', 2);
      circle(ctx, node.x, node.y, scroll.boss ? 20 : 17, walked || next ? season.color : season.color + '77', walked ? '#172b34' : '#8c7950', walked ? 3 : 1.3);
      if (node.id === 'shrine' && column) { roadMark(ctx, 'quiet', node.x, node.y - 1); circle(ctx, node.x, node.y - 4, 5, '#d8b5fa', '#fff0c7', 1); }
      else if (scroll.boss) drawYokai(ctx, { kind: 'oni', x: node.x, y: node.y, color: season.color, hp: 0, maxHp: 0, phase: 0 }, 0, 0.38);
      else roadMark(ctx, node.id, node.x, node.y - 1);
      if (walked && !current) circle(ctx, node.x + 13, node.y + 12, 3.5, '#fff0bb', '#172b34', 1);
    });
  });
  if (state.relics.length) text(ctx, 'RELICS / ' + state.relics.map(id => RELICS.find(r => r.id === id).name.toUpperCase()).join(' · '), 463, 258, 9, '#61437e', 'bold', false, 'center');
  text(ctx, 'INK = YOUR WALKED PATH', 61, 258, 8, '#374842', 'bold');
  text(ctx, state.scroll === 8 ? 'NEXT CIRCUIT / SCROLL 1' : 'CHOOSE SCROLL ' + (state.scroll + 1), 861, 258, 8, '#8f3428', 'bold', false, 'right');
  text(ctx, 'FIGHT / REST / RELIC SHRINE', 906, 104, 11, '#e4bf6d', 'bold');
  ROAD_RECTS.forEach((rect, i) => {
    const road = ROADS[i]; if (!availableRoads(state).includes(road)) return;
    const selected = state.roadChoice === road.id, hover = hitRect(input.pointer, rect);
    panel(ctx, rect.x, rect.y, rect.w, rect.h, selected ? '#2c4147' : hover ? '#233440' : '#172735', selected ? '#f1c774' : '#806c45');
    ctx.fillStyle = road.color; ctx.fillRect(rect.x, rect.y, 4, rect.h);
    text(ctx, (road.id === 'shrine' ? '↓ ' : i ? '→ ' : '← ') + road.name.toUpperCase(), rect.x + 16, rect.y + 18, 14, '#fff0d4', 'bold', true);
    text(ctx, (road.id === 'shrine' ? shrineRelic(state)?.name + ' · PASSIVE RELIC' : road.effect), rect.x + 16, rect.y + 35, 11, road.color, 'bold');
    if (selected) text(ctx, 'CHOSEN', rect.x + rect.w - 14, rect.y + 23, 9, '#f4d17c', 'bold', false, 'right');
  });
}
