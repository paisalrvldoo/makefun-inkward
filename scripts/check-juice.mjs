import assert from 'node:assert/strict';
import { createState, startRun } from '../game/src/world/state.js';
import { spawnYokai } from '../game/src/entities/yokai.js';
import { spawnBoss } from '../game/src/entities/bosses.js';
import { sealLoop } from '../game/src/ink/seal.js';
import { updateWorld } from '../game/src/world/update.js';
import { updateScoreBurst } from '../game/src/fx/scoreBurst.js';
import { updateInkMotes } from '../game/src/fx/inkMotes.js';
import { updateCombatTexts, spawnCombatText, COMBAT_TEXT } from '../game/src/fx/combatText.js';
import { artRarity } from '../game/src/render/rarityGlow.js';
import { playJuiceSound } from '../game/src/audio/juiceSounds.js';
import { replayInput } from '../game/src/shots.js';
import { INK } from '../game/src/config.js';

const polygon = [{x:200,y:250},{x:370,y:250},{x:370,y:450},{x:200,y:450}];
const make = () => {const s=createState(12);startRun(s);s.queue=[];return s;};
{
  const s = make(); for(let i=0;i<4;i++)spawnYokai(s,'kappa',{x:265+i*8,y:350});
  s.ink=50; sealLoop(s,polygon); const score=s.score, ink=s.ink;
  assert.ok(s.hitStop>=0.04 && s.hitStop<=0.07); assert.equal(s.scoreBurst.total,score);
  assert.ok(Math.abs(s.scoreBurst.base*s.scoreBurst.multiplier-score)<0.001);
  assert.equal(s.inkMotes.length,8); assert.ok(ink>50,'Ink refunds immediately, before the vacuum animation');
  for(let i=0;i<42;i++)updateScoreBurst(s,1/60);
  assert.equal(s.score,score); assert.equal(s.ink,ink,'Score theatrics never alter gameplay balances');
  assert.equal(s.soundEvents.filter(e=>e.name==='sealSlam').length,1);
  assert.deepEqual(s.soundEvents.filter(e=>e.name==='sealTick').map(e=>e.value),[0,1,2,3,4,5,6,7]);
  for(let i=0;i<180;i++)updateInkMotes(s,1/60);
  assert.equal(s.inkMotes.length,0); assert.equal(s.soundEvents.filter(e=>e.name==='pickup').length,8);
  assert.equal(s.ink,ink); assert.equal(s.score,score);
}
{
  const s=make(), boss=spawnBoss(s,'moss',{x:280,y:350});boss.stun=1;
  sealLoop(s,polygon);assert.ok(boss.hp>0 && s.hitStop>=0.04,'Nonlethal heavy boss hits also stop briefly');
  const empty=make();sealLoop(empty,polygon);assert.ok(empty.soundEvents.some(e=>e.name==='emptySeal'));
}
{
  const s=make(), input=replayInput();spawnYokai(s,'kappa',{x:240,y:240});input.keys.add('KeyD');input.pressed.add('Space');
  for(let i=0;i<14;i++){updateWorld(s,input,1/60);input.clearFrame();}
  assert.ok(s.monk.landingTime>0 && s.particles.some(p=>p.dust));
  assert.equal(s.soundEvents.filter(e=>e.name==='landing').length,1);
  assert.equal(artRarity(s,{id:'gold'}).name,'COMMON');s.arts=['lotus'];s.artLevels.lotus=1;
  assert.equal(artRarity(s,{id:'gold'}).name,'RARE');s.arts.push('gold');s.artLevels.gold=2;
  assert.equal(artRarity(s,{id:'gold'}).name,'EPIC');
}
{
  const pitches=[];const tone=(f)=>pitches.push(f), rustle=()=>{};
  playJuiceSound('pickup',1,tone,rustle);const first=pitches[0];pitches.length=0;
  playJuiceSound('pickup',8,tone,rustle);assert.ok(pitches[0]>first);
  for(const name of ['sealTick','sealSlam','landing','step','emptySeal','unready','wallSet'])assert.ok(playJuiceSound(name,2,tone,rustle));
}
{
  const s = make(); for(let i=0;i<4;i++)spawnYokai(s,'kappa',{x:265+i*8,y:350});
  s.ink=50; sealLoop(s,polygon);
  const texts = s.combatTexts;
  assert.ok(texts.length >= 2, 'A four-spirit seal emits multiple combat texts');
  assert.ok(texts.some(t => t.kind==='score' && /^\+\d/.test(t.value)), 'Each seal releases a +score popup');
  assert.ok(texts.some(t => t.kind==='seal' && /^SEALED ×4/.test(t.value)), 'A chunky SEALED ×N callout pops on every group seal');
  assert.ok(texts.some(t => t.kind==='chain' && /^CHAIN ×[2-9]!$/.test(t.value)), 'A combo/chain callout announces multi-seals');
  assert.ok(texts.some(t => t.kind==='ink' && /^\+\d+$/.test(t.value)), 'Sealing refunds an ink +N combat text');
  const before = texts.length;
  spawnCombatText(s, 300, 300, 'X', 'nonsense');
  assert.ok(s.combatTexts.at(-1).kind === 'hit', 'Unknown combat-text kinds fall back to the plain hit kind');
  const startY = s.combatTexts[0].y, startAge = s.combatTexts[0].age;
  for(let i=0;i<30;i++) updateCombatTexts(s, 1/60);
  assert.ok(s.combatTexts[0].y < startY, 'Combat text rises over time');
  assert.ok(s.combatTexts[0].age > startAge, 'Combat text ages over time');
  for(let i=0;i<240;i++) updateCombatTexts(s, 1/60);
  assert.equal(s.combatTexts.length, 0, 'Combat text fades and expires within its lifetime');
}
{
  const s = make(), boss = spawnBoss(s,'moss',{x:280,y:350}); boss.stun = 1;
  sealLoop(s, polygon);
  const hits = s.combatTexts.filter(t => (t.kind==='hit' || t.kind==='crit') && /^\d+$/.test(t.value));
  assert.ok(hits.length >= 1, 'Boss seal damage pops a bold outlined number');
  const fullPolygon = [{x:200,y:200},{x:420,y:200},{x:420,y:480},{x:200,y:480}];
  const s2 = make(); const boss2 = spawnBoss(s2,'moss',{x:310,y:340}); boss2.stun = 1;
  for(let i=0;i<6;i++) spawnYokai(s2,'kappa',{x:290+i*7,y:335});
  sealLoop(s2, fullPolygon);
  const crits = s2.combatTexts.filter(t => t.kind==='crit' && /^\d+$/.test(t.value));
  assert.ok(crits.length >= 1, 'Heavy boss hits pop bigger gold/red CRIT! text');
  assert.ok(crits.some(t => t.detail === 'CRIT!'), 'CRIT! label appears on heavy boss damage');
  assert.ok(crits.at(-1).life === COMBAT_TEXT.critLife, 'Crit text lives longer than ordinary hits');
}
{
  const s = make(); s.ink = 20; s.spawnTime = 100; s.queue = [{kind:'kappa'}]; s.enemies = [];
  const input = replayInput();
  for(let i=0;i<180;i++) { input.clearFrame(); input.keys.clear(); input.paintEvents = []; updateWorld(s, input, 1/60); }
  assert.ok(s.combatTexts.some(t => t.kind==='ink' && /^\+\d+$/.test(t.value)), 'Ink regeneration shows a subtle blue +N popup near the monk');
}
{
  const s = make(); s.bell.hp = 6; s.arts = ['afterglow']; s.artLevels.afterglow = 1;
  s.enemies = []; s.queue = [];
  for(let i=0;i<60;i++) updateWorld(s, replayInput(), 1/60);
  const heals = s.combatTexts.filter(t => t.kind==='heal');
  assert.ok(heals.some(t => /^\+\d+$/.test(t.value) && t.detail), 'Bell regen pops a green +N heal text with a label');
}
{
  const s = make(); assert.ok(Array.isArray(s.combatTexts) && s.combatTexts.length === 0, 'A fresh run starts with no combat texts');
  spawnCombatText(s, 0, 0, '+5', 'heal');
  assert.equal(s.combatTexts[0].x, 24, 'Combat text is clamped inside the field');
  spawnCombatText(s, 9999, 9999, '+5', 'score');
  assert.ok(s.combatTexts.at(-1).x <= 992 && s.combatTexts.at(-1).y <= 692, 'Combat text never escapes the visible field');
  for(let i=0;i<60;i++) spawnCombatText(s, 400, 400, '+1', 'score');
  assert.ok(s.combatTexts.length <= 40, 'Combat text pool caps to keep the field readable');
}
console.log('Juice OK: 40–70ms group/boss hit-stop, exact score ledger with eight rising beats/one slam, immediate ink plus vacuum chimes, dash landing dust/squash, rarity rules and failed-action audio, prominent combat text (hits, CRIT!, +score, +ink, +heal, CHAIN ×N)');
