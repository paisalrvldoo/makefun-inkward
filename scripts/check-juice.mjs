import assert from 'node:assert/strict';
import { createState, startRun } from '../game/src/world/state.js';
import { spawnYokai } from '../game/src/entities/yokai.js';
import { spawnBoss } from '../game/src/entities/bosses.js';
import { sealLoop } from '../game/src/ink/seal.js';
import { updateWorld } from '../game/src/world/update.js';
import { updateScoreBurst } from '../game/src/fx/scoreBurst.js';
import { updateInkMotes } from '../game/src/fx/inkMotes.js';
import { artRarity } from '../game/src/render/rarityGlow.js';
import { playJuiceSound } from '../game/src/audio/juiceSounds.js';
import { replayInput } from '../game/src/shots.js';

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
console.log('Juice OK: 40–70ms group/boss hit-stop, exact score ledger with eight rising beats/one slam, immediate ink plus vacuum chimes, dash landing dust/squash, rarity rules and failed-action audio');
