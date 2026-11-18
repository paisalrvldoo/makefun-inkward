import { text, panel, hitRect, circle, line, wrapText } from '../render/primitives.js';
import { SHOP_ITEMS, rerollPrice } from '../run/shop.js';

function drawItemIcon(ctx, item, x, y, size) {
  const { glyph, color } = item;
  ctx.save();
  circle(ctx, x, y, size, color, '#fff1ce', 1.5);
  if (glyph === 'M') { text(ctx, 'M', x, y + 5, size * 1.0, '#fffaf0', 'bold', true, 'center'); }
  else if (glyph === 'J') { ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.ellipse(x, y - 2, size * 0.35, size * 0.5, 0, 0, Math.PI * 2); ctx.fill(); line(ctx, [[x - size * 0.3, y + 3], [x + size * 0.3, y + 3]], '#fffaf0', 1.5); }
  else if (glyph === 'P') { line(ctx, [[x - size * 0.4, y + size * 0.3], [x + size * 0.4, y - size * 0.2]], '#fffaf0', 2); }
  else if (glyph === 'L') { circle(ctx, x, y + 3, size * 0.3, '#fffaf0'); circle(ctx, x, y + 3, size * 0.6, null, '#fffaf0', 1); }
  else if (glyph === 'S') { const d = size * 0.35; line(ctx, [[x - d, y - d], [x + d, y + d]], '#fffaf0', 1.8); line(ctx, [[x - d, y + d], [x + d, y - d]], '#fffaf0', 1.8); }
  else if (glyph === 'W') { ctx.strokeStyle = '#fffaf0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - size * 0.4, y - size * 0.4); ctx.lineTo(x + size * 0.1, y + size * 0.3); ctx.moveTo(x - size * 0.2, y - size * 0.2); ctx.lineTo(x + size * 0.5, y + size * 0.3); ctx.stroke(); }
  else if (glyph === 'C') { circle(ctx, x, y - 3, size * 0.45, null, '#fffaf0', 2); circle(ctx, x, y + size * 0.15, size * 0.2, '#fffaf0'); }
  else { text(ctx, glyph, x, y + 5, size * 0.9, '#fffaf0', 'bold', true, 'center'); }
  ctx.restore();
}

const CARD_GAP = 14;

function cardRect(i, total) {
  const cardW = Math.min(192, (1170 - (total - 1) * CARD_GAP) / total);
  const totalW = total * cardW + (total - 1) * CARD_GAP;
  const startX = 640 - totalW / 2;
  return { x: startX + i * (cardW + CARD_GAP), y: 210, w: cardW, h: 280 };
}

export function shopRects(state) {
  const offer = state.shopOffer || [];
  return offer.map((_, i) => cardRect(i, offer.length));
}

export function drawShop(ctx, state, input) {
  ctx.fillStyle = '#090d13f6'; ctx.fillRect(0, 0, 1280, 800);
  panel(ctx, 32, 22, 1216, 56, '#111c29', '#95763b');
  text(ctx, "PILGRIM'S SHRINE SHOP", 55, 58, 34, '#efd08a', 'bold', true);
  const coins = state.inkGold || 0;
  text(ctx, 'INK-GOLD  \u25c9 ' + coins, 1224, 54, 22, '#f0c35b', 'bold', false, 'right');
  text(ctx, '1\u2013' + (state.shopOffer || []).length + ' BUY \u00b7 R REROLL \u25c9' + rerollPrice(state) + ' \u00b7 ENTER LEAVE', 1224, 72, 10, '#cbc7ba', 'bold', false, 'right');

  text(ctx, 'CHOOSE YOUR BLESSINGS', 42, 120, 24, '#f0c35b', 'bold', true);
  const rerollCost = rerollPrice(state);
  text(ctx, coins >= rerollCost ? 'R  REROLL \u25c9' + rerollCost : 'R  REROLL \u25c9' + rerollCost + ' (NOT ENOUGH)', 42, 150, 13, coins >= rerollCost ? '#cbc7ba' : '#7f7f7f', 'bold');
  text(ctx, 'ENTER  LEAVE THE SHRINE', 1224, 120, 11, '#e5dfd0', 'bold', false, 'right');
  line(ctx, [[42, 165], [1238, 165]], '#6d5231', 1);

  const offer = state.shopOffer || [];
  if (!offer.length) {
    text(ctx, 'The shrine shelves are bare.', 640, 400, 24, '#cbc7ba', 'bold', true, 'center');
    return;
  }

  offer.forEach((item, i) => {
    const rect = cardRect(i, offer.length);
    const hover = hitRect(input.pointer, rect);
    const canAfford = coins >= item.price;
    const sold = item.sold;

    const cardBg = sold ? '#1a2026' : hover ? '#203347' : '#172635';
    const cardStroke = sold ? '#3a3a3a' : hover ? '#ef5b45' : '#5d5237';
    panel(ctx, rect.x, rect.y, rect.w, rect.h, cardBg, cardStroke);
    panel(ctx, rect.x + 4, rect.y + 4, rect.w - 8, rect.h - 8, cardBg, '#36494f');

    const cx = rect.x + rect.w / 2;
    if (!sold) { ctx.fillStyle = 'rgba(240,195,91,0.10)'; ctx.beginPath(); ctx.arc(cx, rect.y + 60, 42, 0, Math.PI * 2); ctx.fill(); }
    drawItemIcon(ctx, item, cx, rect.y + 60, 30);
    text(ctx, item.name.toUpperCase(), cx, rect.y + 122, 15, '#fff0d8', 'bold', false, 'center');
    wrapText(ctx, item.blurb, rect.x + 16, rect.y + 150, rect.w - 32, 18, 12, '#c0c8c6');

    const priceColor = sold ? '#4a4d51' : canAfford ? '#f0c35b' : '#ef5b48';
    text(ctx, '\u25c9 ' + item.price, cx, rect.y + rect.h - 66, 22, priceColor, 'bold', true, 'center');

    const btnX = rect.x + 12, btnY = rect.y + rect.h - 52, btnW = rect.w - 24, btnH = 36;
    const btnHover = hover && !sold && canAfford;
    if (sold) {
      ctx.fillStyle = '#1e2e2a'; ctx.fillRect(btnX, btnY, btnW, btnH);
      ctx.strokeStyle = '#3d5d4d'; ctx.lineWidth = 1; ctx.strokeRect(btnX + 4, btnY + 4, btnW - 8, btnH - 8);
      text(ctx, 'BOUGHT', rect.x + rect.w / 2, btnY + 24, 12, '#5a8a6c', 'bold', false, 'center');
    } else {
      ctx.fillStyle = btnHover ? '#ef6348' : canAfford ? '#c43e32' : '#33424a'; ctx.fillRect(btnX, btnY, btnW, btnH);
      ctx.strokeStyle = canAfford ? '#f3b49a' : '#607168'; ctx.lineWidth = 1; ctx.strokeRect(btnX + 4, btnY + 4, btnW - 8, btnH - 8);
      text(ctx, (canAfford ? 'BUY  ' : '') + (i + 1) + (canAfford ? '' : '  TOO EXPENSIVE'), rect.x + rect.w / 2, btnY + 24, 11, canAfford ? '#fff4df' : '#7e8c89', 'bold', false, 'center');
    }
  });

  panel(ctx, 42, 704, 1196, 62, '#0d1622', '#6d5231');
  text(ctx, 'BELL ' + state.bell.hp + '/' + state.bell.maxHp + '   \u00b7   SCORE ' + (state.score || 0).toLocaleString('en-US') + '   \u00b7   ' + (state.sealed || 0) + ' SPIRITS FREED', 640, 729, 13, '#e8bd60', 'bold', false, 'center');
  text(ctx, 'COLLECT INK-GOLD FROM SEALED YOKAI \u00b7 SPEND AT SHRINE SHOPS BETWEEN SCROLLS', 640, 754, 10, '#cbc7ba', 'bold', false, 'center');
}