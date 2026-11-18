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

function drawNodeIcon(ctx, node, column, walked, season, isCurrent) {
  const scroll = SCROLLS[column], x = node.x, y = node.y;
  const nSize = scroll.boss ? 22 : 19;
  if (node.id === 'shrine' && column) {
    circle(ctx, x, y, nSize, '#3d2d55', '#d8b5fa', 2);
    circle(ctx, x, y, nSize - 6, '#5e46a0', '#e0c6ff', 1);
    circle(ctx, x, y - 4, 5, '#d8b5fa', '#fff0c7', 1);
  } else if (scroll.boss) {
    drawYokai(ctx, { kind: 'oni', x, y, color: season.color, hp: 0, maxHp: 0, phase: 0 }, 0, 0.45);
  } else if (node.id === 'swarm') {
    circle(ctx, x, y, nSize, '#5c3c28', season.color, 2);
    for (const [dx, dy] of [[-5, -4], [5, -4], [0, 5]]) circle(ctx, x + dx, y + dy, 2.5, '#ffe8a0');
  } else {
    circle(ctx, x, y, nSize, '#2a4d46', '#7dc9a3', 2);
    ctx.fillStyle = '#fff1c4'; ctx.beginPath();
    ctx.moveTo(x - 5, y + 4); ctx.lineTo(x - 3, y - 3); ctx.quadraticCurveTo(x, y - 9, x + 3, y - 3);
    ctx.lineTo(x + 5, y + 4); ctx.closePath(); ctx.fill();
  }
  if (walked && !isCurrent) circle(ctx, x + nSize - 6, y + nSize - 6, 3.5, '#fff0bb', '#172b34', 1);
}

export function drawPath(ctx, state, input) {
  const paper = ctx.createLinearGradient(0, 86, 0, 268);
  paper.addColorStop(0, '#ede3cf'); paper.addColorStop(1, '#c9b896');
  panel(ctx, 42, 86, 840, 181, paper, '#9e7a3d');
  for (let i = 0; i < 220; i++) {
    ctx.fillStyle = i % 2 ? '#6d5c3810' : '#fff9e622';
    ctx.fillRect(46 + (i * 73 % 832), 90 + (i * 47 % 173), 1.5, 1.5);
  }
  SEASONS.forEach((season, i) => {
    text(ctx, season.name, 150 + i * 208, 105, 11, season.color, 'bold', false, 'center');
    line(ctx, [[58 + i * 208, 112], [242 + i * 208, 112]], season.color + '66', 1);
  });
  const locations = column => (column ? [2, 4, 6].includes(column) ? ['swarm', 'quiet', 'shrine'] : ['swarm', 'quiet'] : ['shrine']).map(id => ({ x: nodeX(column), y: nodeY(id), id }));
  ctx.save(); ctx.setLineDash([3, 5]);
  for (let column = 1; column < 8; column++) {
    for (const from of locations(column - 1)) for (const to of locations(column)) branch(ctx, from, to, '#6d5e3a66', 1.2);
  }
  ctx.restore();
  for (let column = 1; column < state.scroll; column++) {
    branch(ctx, { x: nodeX(column - 1), y: nodeY(state.route[column - 1]) }, { x: nodeX(column), y: nodeY(state.route[column]) }, '#1a3340', 5);
  }
  if (state.roadChoice && state.scroll < 8) {
    ctx.save(); ctx.setLineDash([5, 5]);
    branch(ctx, { x: nodeX(state.scroll - 1), y: nodeY(state.route[state.scroll - 1]) }, { x: nodeX(state.scroll), y: nodeY(state.roadChoice) }, '#a54432', 3);
    ctx.restore();
  }
  SCROLLS.forEach((scroll, column) => {
    const season = SEASONS[scroll.season], next = column === state.scroll;
    text(ctx, String(column + 1).padStart(2, '0'), nodeX(column), 132, 10, next ? '#89251d' : '#3d4440', 'bold', false, 'center');
    locations(column).forEach(node => {
      const walked = state.route[column] === node.id, current = column === state.scroll - 1 && walked;
      const selected = next && state.roadChoice === node.id;
      const rect = { x: node.x - 23, y: node.y - 23, w: 46, h: 46 };
      if (current) {
        const pulse = 26 + Math.sin(state.time * 3) * 4;
        circle(ctx, node.x, node.y, pulse, null, '#8e342888', 2);
        circle(ctx, node.x, node.y, pulse + 5, null, '#8e342833', 1);
      }
      if (selected || (next && hitRect(input.pointer, rect))) circle(ctx, node.x, node.y, 26, '#c7523622', '#9a2e20', 2);
      drawNodeIcon(ctx, node, column, walked || next, season, current);
    });
  });
  if (state.relics.length) {
    panel(ctx, 42, 253, 842, 14, '#1a263308', '#6d4d78');
    text(ctx, 'RELICS / ' + state.relics.map(id => RELICS.find(r => r.id === id).name.toUpperCase()).join(' \u00b7 '), 463, 258, 9, '#8a60aa', 'bold', false, 'center');
  }
  text(ctx, 'INK = YOUR WALKED PATH', 61, 258, 8, '#2d3833', 'bold');
  text(ctx, state.scroll === 8 ? 'NEXT CIRCUIT / SCROLL 1' : 'CHOOSE SCROLL ' + (state.scroll + 1), 861, 258, 8, '#802a20', 'bold', false, 'right');
  text(ctx, 'FIGHT / REST / RELIC SHRINE', 906, 104, 12, '#d6ab58', 'bold');
  ROAD_RECTS.forEach((rect, i) => {
    const road = ROADS[i]; if (!availableRoads(state).includes(road)) return;
    const selected = state.roadChoice === road.id, hover = hitRect(input.pointer, rect);
    panel(ctx, rect.x, rect.y, rect.w, rect.h, selected ? '#26382e' : hover ? '#1e2d38' : '#131f2b', selected ? '#e4b866' : '#6d5932');
    ctx.fillStyle = road.color; ctx.fillRect(rect.x, rect.y, 4, rect.h);
    text(ctx, (road.id === 'shrine' ? '\u2193 ' : i ? '\u2192 ' : '\u2190 ') + road.name.toUpperCase(), rect.x + 16, rect.y + 18, 15, '#fff0d4', 'bold', true);
    text(ctx, (road.id === 'shrine' ? shrineRelic(state)?.name + ' \u00b7 PASSIVE RELIC' : road.effect), rect.x + 16, rect.y + 35, 12, road.color, 'bold');
    if (selected) text(ctx, 'CHOSEN', rect.x + rect.w - 14, rect.y + 23, 9, '#ecca6b', 'bold', false, 'right');
  });
}
