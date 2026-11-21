// Player avatar: on-foot movement, sprint, car entry/exit, nitro boost, health/armor,
// hospital/police respawn with rank-based bail and a bust cinematic beat.
// v3: district perks (Sunward Heights nitro cooling) feed the nitro regen.
import {THREE} from './three.js';
import {state,notify,say,rankOf} from './state.js';
import {world} from './world.js';
import {buildHuman,animateHuman} from './peds.js';
import {key,hit,axis} from './input.js';
import {collideCircle,dist2} from './physics.js';
import {stepCar} from './vehicles.js';
import {cam} from './camera.js';
import {HOSPITAL,PRECINCT,SPAWN,NITRO} from './config.js';
import {sfxCrash,sfxHorn,updateEngine,sfxSkid,sfxNos,sfxHit} from './audio.js';
import {skidMark,impactSparks,carSmokePuff} from './effects.js';
import {districtPerk} from './district.js';
import {districtAt} from './config.js';
import {reportCrime} from './police.js';
export function makePlayer(){
 const mesh=buildHuman({shirt:0xd84632,innerShirt:0xf4ead8,pants:0x223042,skin:0xb87e4e,gun:true,hero:true});
 mesh.position.set(SPAWN.x,0,SPAWN.z);
 world.scene.add(mesh);
 const p={mesh,x:SPAWN.x,y:0,vy:0,grounded:true,z:SPAWN.z,heading:0,speed:0,dead:false,respawnT:0,fireCooldown:0,enterCooldown:0};
 world.player=p;state.foot.x=p.x;state.foot.z=p.z;
 return p;
}
export function updatePlayer(dt){
 const p=world.player;
 if(p.dead){p.respawnT-=dt;if(p.respawnT<=0)respawn(p);return;}
 p.enterCooldown=Math.max(0,p.enterCooldown-dt);
 if(state.inCar>=0){drivePlayerCar(p,dt);}else{walkPlayer(p,dt);}
 state.foot.x=p.x;state.foot.z=p.z;state.foot.heading=p.heading;
 if(state.foot.health>0&&state.foot.health<100&&!state.photo)state.foot.health=Math.min(100,state.foot.health+3.5*dt);
 state.foot.health=Math.max(0,state.foot.health);state.foot.armor=Math.max(0,state.foot.armor);
 if(state.foot.health<=0&&!p.dead)killPlayer(p,'hospital');
}
function walkPlayer(p,dt){
 const fwd=axis('KeyS','KeyW')||axis('ArrowDown','ArrowUp');
 const strafe=axis('KeyA','KeyD')||axis('ArrowLeft','ArrowRight');
 const sprint=key('ShiftLeft')||key('ShiftRight');
 const maxSpeed=sprint?8.2:4.6;
 let mx=0,mz=0;
 if(fwd||strafe){
  // Camera sits at (target.x + sin(cam.yaw)*d, target.z + cos(cam.yaw)*d), so:
  // Forward (away from camera) = (-sin(cam.yaw), -cos(cam.yaw))
  // Right (Forward x Up)       = (+cos(cam.yaw), -sin(cam.yaw))
  const fx=-Math.sin(cam.yaw),fz=-Math.cos(cam.yaw);
  const rx=Math.cos(cam.yaw),rz=-Math.sin(cam.yaw);
  mx=fx*fwd+rx*strafe;
  mz=fz*fwd+rz*strafe;
  const len=Math.hypot(mx,mz);mx/=len;mz/=len;
 }
 if((hit('Space')||key('Space'))&&p.grounded){p.vy=8.8;p.grounded=false;}
 p.vy-=21*dt;
 p.y+=p.vy*dt;
 if(p.y<=0){p.y=0;p.vy=0;p.grounded=true;}
 p.speed+=((fwd||strafe?maxSpeed:0)-p.speed)*Math.min(1,dt*10);
 const nx=p.x+mx*p.speed*dt,nz=p.z+mz*p.speed*dt;
 const solved=collideCircle(nx,nz,.45);
 p.x=solved.x;p.z=solved.z;
 if(fwd||strafe)p.heading=Math.atan2(mx,mz);
 // aim mode turns avatar toward camera aim
 if(p.aiming)p.heading=cam.yaw+Math.PI;
 p.mesh.position.set(p.x,p.y,p.z);p.mesh.rotation.y=p.heading;
 animateHuman(p.mesh,p.speed,dt,p.aiming,p.y);
 if(hit('KeyE')&&p.enterCooldown<=0)tryEnterCar(p);
 if(hit('KeyH'))sfxHorn();
 updateEngine(0,0,false);
 // nitro cools off on foot; the sidearm shows only while aiming a gun
 const heightsCool=districtAt(p.x,p.z)==='Sunward Heights'?districtPerk('Sunward Heights'):0;
 state.nitro=Math.min(100,state.nitro+NITRO.regen*(1+heightsCool)*dt);
 const sidearm=p.mesh.getObjectByName('sidearm');
 if(sidearm)sidearm.visible=p.aiming&&state.weapon>0;
}
function drivePlayerCar(p,dt){
 const car=world.cars[state.inCar];
 if(!car||car.dead){exitCar(p);return;}
 const throttle=axis('KeyS','KeyW')||axis('ArrowDown','ArrowUp');
 const steer=axis('KeyA','KeyD')||axis('ArrowLeft','ArrowRight');
 const brake=key('Space');
 // NOS: hold Shift while rolling; Street Legend rank regenerates the meter twice as fast
 const wantNos=(key('ShiftLeft')||key('ShiftRight'))&&state.nitro>0&&car.speed>NITRO.minSpeed;
 if(wantNos&&!state.nosActive)sfxNos();
 state.nosActive=wantNos;car.nos=wantNos;
 if(wantNos)state.nitro=Math.max(0,state.nitro-NITRO.drain*dt);
 else state.nitro=Math.min(100,state.nitro+(rankOf(state.respect)>=4?NITRO.regenPerk:NITRO.regen)*dt);
 const before=car.speed;
 stepCar(car,dt,throttle,brake,steer);
 const solved=collideCircle(car.x,car.z,1.4);
 if(solved.hit){
  const impact=Math.abs(before);
  if(impact>7&&(car.crashCd||0)<=0){
   car.crashCd=.55;
   sfxCrash(impact);
   impactSparks(car.x+Math.sin(car.heading)*1.6,.6,car.z-Math.cos(car.heading)*1.6);
   damageCar(car,Math.min(14,(impact-6)*.55));
  }
  car.x=solved.x;car.z=solved.z;car.speed*=.42;car.mesh.position.set(car.x,0,car.z);
 }
 // car vs car: physical separation, momentum knockback transfer, angular spin-out, crash cooldown & sparks
 for(let i=0;i<world.cars.length;i++){
  if(i===state.inCar)continue;const o=world.cars[i];if(o.dead)continue;
  const d2=dist2(car.x,car.z,o.x,o.z);
  if(d2<11.5){
   const d=Math.sqrt(d2)||.1,overlap=Math.max(.1,3.4-d);
   const dx=(car.x-o.x)/d,dz=(car.z-o.z)/d;
   car.x+=dx*overlap*.42;car.z+=dz*overlap*.42;
   o.x-=dx*overlap*.58;o.z-=dz*overlap*.58;
   const rvx=Math.sin(car.heading)*car.speed-Math.sin(o.heading)*(o.speed||0);
   const rvz=-Math.cos(car.heading)*car.speed+Math.cos(o.heading)*(o.speed||0);
   const impact=Math.max(Math.abs(car.speed-(o.speed||0)),Math.hypot(rvx,rvz));
   const shove=Math.max(5.5,impact*.82);
   o.kbX=-dx*shove;
   o.kbZ=-dz*shove;
   const cross=dx*(-Math.cos(car.heading))-dz*Math.sin(car.heading);
   o.spinVel=(Math.abs(cross)>.08?cross:.35)*Math.min(18,impact)*.22;
   car.kbX=dx*Math.min(5.5,impact*.24);
   car.kbZ=dz*Math.min(5.5,impact*.24);
   o.mesh.position.set(o.x,0,o.z);o.mesh.rotation.y=Math.PI-o.heading;
   if(impact>4.5&&((car.crashCd||0)<=0||(o.crashCd||0)<=0)){
    car.crashCd=.5;o.crashCd=.5;
    sfxCrash(impact);
    impactSparks((car.x+o.x)*.5,.65,(car.z+o.z)*.5);
    cam.shake=Math.min(.42,cam.shake+Math.min(.28,impact*.016));
    damageCar(o,Math.min(22,Math.max(6,impact*.62)));
    damageCar(car,Math.min(13,Math.max(3,impact*.34)));
    reportCrime('ram',car.x,car.z);if(o.ai)o.ai.panic=8;
   }
   car.speed*=.72;
  }
 }
 // car vs pedestrians
 const hitR2=car.type==='bus'?6.8:4.6;
 for(const ped of world.peds){
  if(ped.dead||ped.inCar)continue;
  if(dist2(car.x,car.z,ped.x,ped.z)<hitR2&&Math.abs(car.speed)>2.0){
   ped.hitByCar=true;
   ped.hitVx=Math.sin(car.heading)*car.speed*.65+(ped.x-car.x)*2.5;
   ped.hitVz=-Math.cos(car.heading)*car.speed*.65+(ped.z-car.z)*2.5;
   sfxHit();
   cam.shake=Math.min(.2,cam.shake+.06);
  }
 }
 if((brake||state.nosActive||Math.abs(car.slip||0)>.14)&&Math.abs(car.speed)>6.5){
  if(Math.random()<dt*36){
   const rx=car.x-Math.sin(car.heading)*1.55,rz=car.z+Math.cos(car.heading)*1.55;
   const lx=Math.cos(car.heading)*.68,lz=Math.sin(car.heading)*.68;
   skidMark(rx-lx,rz-lz,car.heading);skidMark(rx+lx,rz+lz,car.heading);
  }
  if((brake||Math.abs(car.slip||0)>.18)&&Math.random()<dt*7)sfxSkid();
 }
 p.x=car.x;p.z=car.z;p.heading=car.heading;
 p.mesh.visible=false;
 state.carSpeed=car.speed;state.carHeading=car.heading;
 updateCarDamageFX(car,dt,true);
 updateEngine(Math.abs(car.speed),Math.max(0,throttle),true);
 if(hit('KeyE')&&p.enterCooldown<=0)exitCar(p);
 if(hit('KeyH'))sfxHorn();
 if(car.health<=0){explodePlayerCar(p,car);}
}
function tryEnterCar(p){
 let best=-1,bestD=28;
 for(let i=0;i<world.cars.length;i++){const c=world.cars[i];if(c.dead)continue;const maxD=c.type==='bus'?28:16;const d=dist2(p.x,p.z,c.x,c.z);if(d<maxD&&d<bestD){bestD=d;best=i;}}
 if(best<0){notify('NO VEHICLE IN REACH');return;}
 const car=world.cars[best];
 state.inCar=best;car.ai=null;p.enterCooldown=.6;p.y=0;p.vy=0;p.grounded=true;p.mesh.visible=false;
 cam.yaw=-car.heading;
 if(car.type==='police')reportCrime('steal-police',car.x,car.z);
 else if(car.driver){reportCrime('carjack',car.x,car.z);ejectDriver(car);}
 notify('ENTERED '+car.spec.name.toUpperCase());
}
function ejectDriver(car){
 if(!car.driver)return;
 const ped=car.driver;car.driver=null;ped.x=car.x+2.5;ped.z=car.z;ped.panic=10;ped.mesh.visible=true;
}
function exitCar(p){
 const car=world.cars[state.inCar];
 if(car){p.x=car.x-Math.cos(car.heading)*2.3;p.z=car.z-Math.sin(car.heading)*2.3;const s=collideCircle(p.x,p.z,.45);p.x=s.x;p.z=s.z;car.speed*=.3;}
 state.inCar=-1;state.carSpeed=0;state.nosActive=false;p.y=0;p.vy=0;p.grounded=true;p.mesh.visible=true;p.enterCooldown=.6;
}
export function updateCarDamageFX(car,dt,isPlayer=false){
 const hf=car.mesh?.userData?.hoodFire;
 if(car.dead){if(hf)hf.visible=false;return;}
 const engOff=car.type==='bus'?-car.spec.l*.38:1.45;
 const hx=car.x+Math.sin(car.heading)*engOff,hz=car.z-Math.cos(car.heading)*engOff;
 if(car.health>70){
  if(hf)hf.visible=false;
 }else if(car.health>40){
  // Stage 1: light grey-white engine steam
  if(hf)hf.visible=false;
  car.smokeT=(car.smokeT||0)-dt;
  if(car.smokeT<=0){car.smokeT=.18;carSmokePuff(hx,.82,hz,false,false);}
 }else if(car.health>18){
  // Stage 2: thick dark charcoal engine smoke
  if(hf)hf.visible=false;
  car.smokeT=(car.smokeT||0)-dt;
  if(car.smokeT<=0){car.smokeT=.10;carSmokePuff(hx,.84,hz,true,false);}
 }else{
  // Stage 3: critical engine fire on the hood -> burns down before exploding
  if(hf){
   hf.visible=true;
   const f=.82+Math.abs(Math.sin(state.time*18+car.x))*.42;
   hf.scale.set(1,f,1);
  }
  if(isPlayer&&!car.fireWarned){car.fireWarned=true;notify('ENGINE ON FIRE — BAIL OUT [E]!');}
  car.smokeT=(car.smokeT||0)-dt;
  if(car.smokeT<=0){car.smokeT=.07;carSmokePuff(hx,.86,hz,true,true);}
  if(!state.photoNoDamage&&!state.photoFreeze){
   car.health-=3.2*dt;
   if(car.health<=0&&!isPlayer)blowUpCar(car);
  }
 }
}
export function damageCar(car,dmg){
 if(state.photoNoDamage&&state.inCar>=0&&world.cars[state.inCar]===car)return;
 // Ensure a car above the fire threshold enters the visible Hood Engine Fire stage (<=18 HP) first instead of insta-exploding
 if(car.health>18&&car.health-dmg<=4)car.health=15;
 else car.health-=dmg;
 if(car.health<=0&&!car.dead&&state.inCar!==world.cars.indexOf(car))blowUpCar(car);
}
export function blowUpCar(car){
 if(car.dead)return;car.dead=true;car.speed=0;
 if(car.mesh?.userData?.hoodFire)car.mesh.userData.hoodFire.visible=false;
 import('./effects.js').then(f=>f.explosion(car.x,0,car.z));
 import('./audio.js').then(a=>a.sfxExplosion());
 car.mesh.traverse(o=>{if(o.isMesh&&o.material){o.material=o.material.clone();o.material.color.setHex(0x1c1c1e);}});
 car.mesh.rotation.z=.12;
 reportCrime('explosion',car.x,car.z);
}
function explodePlayerCar(p,car){exitCar(p);state.foot.health=Math.max(25,state.foot.health-18);blowUpCar(car);}
export function damagePlayer(dmg){
 if(state.photoNoDamage)return;
 const absorb=Math.min(state.foot.armor,dmg*.6);
 state.foot.armor-=absorb;state.foot.health-=dmg-absorb;
 state.damageFlash=Math.min(1,state.damageFlash+.5); // red screen-edge pulse
 import('./camera.js').then(c=>c.cam.shake=Math.min(.5,c.cam.shake+.15));
}
export function killPlayer(p,cause){
 p.dead=true;p.respawnT=3.4;p.mesh.visible=false;
 if(state.inCar>=0){const car=world.cars[state.inCar];if(car)car.speed=0;state.inCar=-1;state.carSpeed=0;}
 state.deathCause=cause;state.wanted=0;state.heat=0;state.nosActive=false;
 // CONNECTED rank halves the bail; the bust gets a cinematic text beat
 const bail=cause==='busted'?(rankOf(state.respect)>=2?200:400):250;
 state.bustT=3.2;
 say(cause==='busted'?'COUNTY LOCKUP':'BAYSIDE GENERAL',
  cause==='busted'?'Hands where we can see them. You\'re done tonight, Cortez. Bail: $'+bail+'.':'Easy now. You took a beating out there. Bill: $'+bail+'.',3.2);
 notify(cause==='hospital'?'DOWN — WAKING AT BAYSIDE GENERAL':'BUSTED — RELEASED ON BAIL $'+bail);
 state.cash=Math.max(0,state.cash-bail);
}
function respawn(p){
 const spot=state.deathCause==='busted'?PRECINCT:HOSPITAL;
 p.x=spot.x;p.z=spot.z;p.dead=false;p.mesh.visible=true;
 state.foot.health=100;state.foot.armor=0;
 p.mesh.position.set(p.x,0,p.z);
}
