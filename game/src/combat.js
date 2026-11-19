// Weapons and combat: hitscan with spread, melee, enemy gang members, ammo, weapon
// switching and takedown combo toasts (chain kills within 4s for bonus cash).
// crewShot lets joined crew companions chip hostiles without friendly fire.
// Companion rounds reuse the existing damage/ragdoll/mission accounting path.
import {THREE} from './three.js';
import {world} from './world.js';
import {state,notify} from './state.js';
import {WEAPONS as W} from './config.js';
import {key,hit,mouse} from './input.js';
import {cam,aimDirection} from './camera.js';
import {dist2,collideCircle} from './physics.js';
import {muzzleFlash,tracer,impactSparks,bloodPuff} from './effects.js';
import {sfxGun,sfxPunch,sfxHit,sfxPickup} from './audio.js';
import {reportCrime} from './police.js';
import {damagePlayer} from './player.js';
import {buildHuman,animateHuman,ragdoll} from './peds.js';
import {rng} from './rng.js';
export function updateCombat(dt){
 const p=world.player;if(p.dead)return;
 for(let i=0;i<4;i++)if(hit('Digit'+(i+1))){if(state.unlockedWeapons[i]&&(i===0||state.ammo[i]>0)){state.weapon=i;notify(W[i].name);}else notify(state.unlockedWeapons[i]?'NO AMMO':'LOCKED — FINISH THE JOB');}
 p.fireCooldown=Math.max(0,p.fireCooldown-dt);
 const w=W[state.weapon];
 p.aiming=mouse.locked&&(state.weapon>0||mouse.down);
 const wantFire=w.auto?mouse.down:mouse.clicked;
 const canFire=state.inCar<0||state.weapon===1; // drive-by with pistol only
 if(wantFire&&p.fireCooldown<=0&&!p.dead){
  if(state.weapon>0&&state.ammo[state.weapon]<=0){notify('OUT OF AMMO');}
  else fire(p,w);
 }
 updateGang(dt);
}
function fire(p,w){
 p.fireCooldown=w.rate;
 const aim=aimDirection();
 const originX=p.x,originZ=p.z,originY=1.35;
 if(state.weapon===0){ // melee
  sfxPunch();
  let hitAny=false;
  for(const ped of world.peds){
   if(ped.dead||ped.inCar)continue;
   if(dist2(p.x,p.z,ped.x,ped.z)<w.range*w.range){
    const facing=Math.atan2(ped.x-p.x,ped.z-p.z);
    let diff=facing-p.heading;while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;
    if(Math.abs(diff)<1.2){hurtPed(ped,w.dmg,p);hitAny=true;}
   }
  }
  if(hitAny)reportCrime('assault',p.x,p.z);
  return;
 }
 state.ammo[state.weapon]--;
 state.gunfireT=.5;
 sfxGun(state.weapon);
 const mx=originX+Math.sin(aim.yaw)*.7,mz=originZ+Math.cos(aim.yaw)*.7;
 muzzleFlash(mx,originY,mz);
 cam.shake=Math.min(.35,cam.shake+(state.weapon===3?.25:.07));
 reportCrime('shoot',p.x,p.z);
 for(let pellet=0;pellet<w.pellets;pellet++){
  const yaw=aim.yaw+rng.range(-w.spread,w.spread),pitch=aim.pitch+rng.range(-w.spread,w.spread);
  const dx=Math.sin(yaw)*Math.cos(pitch),dy=Math.sin(pitch),dz=Math.cos(yaw)*Math.cos(pitch);
  // march the ray, checking peds and cars and walls
  let t=0,hitPoint=null;
  while(t<w.range){
   t+=.7;
   const x=originX+dx*t,y=originY+dy*t,z=originZ+dz*t;
   if(y<0){hitPoint={x,y:0,z};break;}
   const s=collideCircle(x,z,.05);
   if(s.hit){hitPoint={x,y,z};impactSparks(x,y,z);break;}
   let struck=false;
   for(const ped of world.peds){
    if(ped.dead||ped.inCar)continue;
    if(dist2(x,z,ped.x,ped.z)<.45&&y<1.9){hurtPed(ped,w.dmg,p);bloodPuff(x,y,z);hitPoint={x,y,z};struck=true;break;}
   }
   if(struck)break;
   for(const car of world.cars){
    if(car.dead)continue;
    if(state.inCar>=0&&world.cars[state.inCar]===car)continue;
    if(dist2(x,z,car.x,car.z)<3.6&&y<1.8){
     import('./player.js').then(m=>m.damageCar(car,w.dmg*.8));
     impactSparks(x,y,z);hitPoint={x,y,z};struck=true;
     if(car.ai&&car.ai.kind==='police')reportCrime('shoot',p.x,p.z);
     break;}
   }
   if(struck)break;
  }
  const end=hitPoint||{x:originX+dx*w.range,y:originY+dy*w.range,z:originZ+dz*w.range};
  tracer(mx,originY,mz,end.x,end.y,end.z);
 }
}
export function crewShot(ped,dmg){if(ped.kind==='gang')hurtPed(ped,dmg,world.player);}
function hurtPed(ped,dmg,p){
 ped.health=(ped.health??40)-dmg;ped.panic=8;sfxHit();
 if(ped.health<=0&&!ped.dead){
  ped.dead=true;ragdoll(ped.mesh);
  if(ped.kind==='cop'){reportCrime('kill-cop',ped.x,ped.z);state.kills++;takedownCombo('COP DOWN');}
  else if(ped.kind==='gang'){state.kills++;state.cash+=rng.int(20,80);if(state.side==='rampage')state.sideKills++;takedownCombo('TAKEDOWN');}
  else{reportCrime('kill-ped',ped.x,ped.z);state.kills++;}
 }
}
// chain takedowns within 4 seconds: each link pays a growing cash bonus
function takedownCombo(label){
 if(state.time-(state.comboT||0)<4)state.combo++;else state.combo=1;
 state.comboT=state.time;
 if(state.combo>1){const bonus=state.combo*25;state.cash+=bonus;notify(label+' x'+state.combo+' COMBO +$'+bonus);}
 else notify(label);
}
// gang members for missions/rampages
export function spawnGang(x,z,count=4){
 const spawned=[];
 for(let i=0;i<count;i++){
  const gx=x+rng.range(-8,8),gz=z+rng.range(-8,8);
  const mesh=buildHuman({shirt:0x6a2438,pants:0x2a2a30,skin:rng.pick([0xb07848,0x8a5a34,0xd9a066]),gun:true});
  mesh.position.set(gx,0,gz);world.scene.add(mesh);
  const ped={mesh,x:gx,z:gz,heading:0,speed:0,panic:0,dead:false,kind:'gang',health:70,fireT:rng.range(.5,2)};
  world.peds.push(ped);spawned.push(ped);
 }
 return spawned;
}
function updateGang(dt){
 const px=state.foot.x,pz=state.foot.z;
 for(const g of world.peds){
  if(g.kind!=='gang'||g.dead)continue;
  if(g.photoHold>0){g.photoHold-=dt;continue;}
  const dx=px-g.x,dz=pz-g.z,d=Math.hypot(dx,dz);
  if(d>90)continue;
  g.heading=Math.atan2(dx,dz);
  let speed=d>12?4.4:0;
  g.fireT-=dt;
  if(d<30&&g.fireT<=0){
   g.fireT=rng.range(.9,1.8);
   muzzleFlash(g.x+Math.sin(g.heading)*.5,1.35,g.z+Math.cos(g.heading)*.5);
   tracer(g.x,1.35,g.z,px+rng.range(-1,1),1.2,pz+rng.range(-1,1));sfxGun(1);
   if(rng()<.3)damagePlayer(rng.range(4,8));
  }
  g.x+=Math.sin(g.heading)*speed*dt;g.z+=Math.cos(g.heading)*speed*dt;
  const s=collideCircle(g.x,g.z,.45);g.x=s.x;g.z=s.z;
  g.mesh.position.set(g.x,0,g.z);g.mesh.rotation.y=g.heading;
  animateHuman(g.mesh,speed,dt,true);
 }
}
