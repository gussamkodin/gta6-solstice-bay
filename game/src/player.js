// Player avatar: on-foot movement, sprint, car entry/exit, health/armor, hospital respawn.
import {THREE} from './three.js';
import {state,notify} from './state.js';
import {world} from './world.js';
import {buildHuman,animateHuman} from './peds.js';
import {key,hit,axis} from './input.js';
import {collideCircle,dist2} from './physics.js';
import {stepCar} from './vehicles.js';
import {cam} from './camera.js';
import {HOSPITAL,SPAWN} from './config.js';
import {sfxCrash,sfxHorn,updateEngine,sfxSkid} from './audio.js';
import {skidMark} from './effects.js';
import {reportCrime} from './police.js';
export function makePlayer(){
 const mesh=buildHuman({shirt:0xe8e2d2,pants:0x2c3e50,skin:0xb07848});
 mesh.position.set(SPAWN.x,0,SPAWN.z);
 world.scene.add(mesh);
 const p={mesh,x:SPAWN.x,z:SPAWN.z,heading:0,speed:0,dead:false,respawnT:0,fireCooldown:0,enterCooldown:0};
 world.player=p;state.foot.x=p.x;state.foot.z=p.z;
 return p;
}
export function updatePlayer(dt){
 const p=world.player;
 if(p.dead){p.respawnT-=dt;if(p.respawnT<=0)respawn(p);return;}
 p.enterCooldown=Math.max(0,p.enterCooldown-dt);
 if(state.inCar>=0){drivePlayerCar(p,dt);}else{walkPlayer(p,dt);}
 state.foot.x=p.x;state.foot.z=p.z;state.foot.heading=p.heading;
 state.foot.health=Math.max(0,state.foot.health);state.foot.armor=Math.max(0,state.foot.armor);
 if(state.foot.health<=0&&!p.dead)killPlayer(p,'hospital');
}
function walkPlayer(p,dt){
 const fwd=axis('KeyS','KeyW'),strafe=axis('KeyA','KeyD');
 const sprint=key('ShiftLeft')||key('ShiftRight');
 const maxSpeed=sprint?8.2:4.6;
 let mx=0,mz=0;
 if(fwd||strafe){
  const yaw=cam.yaw+Math.PI;
  mx=Math.sin(yaw)*fwd+Math.cos(yaw)*strafe;
  mz=Math.cos(yaw)*fwd-Math.sin(yaw)*strafe;
  const len=Math.hypot(mx,mz);mx/=len;mz/=len;
 }
 p.speed+=((fwd||strafe?maxSpeed:0)-p.speed)*Math.min(1,dt*10);
 const nx=p.x+mx*p.speed*dt,nz=p.z+mz*p.speed*dt;
 const solved=collideCircle(nx,nz,.45);
 p.x=solved.x;p.z=solved.z;
 if(fwd||strafe)p.heading=Math.atan2(mx,mz);
 // aim mode turns avatar toward camera aim
 if(p.aiming)p.heading=cam.yaw+Math.PI;
 p.mesh.position.set(p.x,0,p.z);p.mesh.rotation.y=p.heading;
 animateHuman(p.mesh,p.speed,dt,p.aiming);
 if(hit('KeyE')&&p.enterCooldown<=0)tryEnterCar(p);
 if(hit('KeyH'))sfxHorn();
 updateEngine(0,0,false);
}
function drivePlayerCar(p,dt){
 const car=world.cars[state.inCar];
 if(!car||car.dead){exitCar(p);return;}
 const throttle=axis('KeyS','KeyW'),steer=axis('KeyD','KeyA');
 const brake=key('Space');
 const before=car.speed;
 stepCar(car,dt,throttle,brake,steer);
 const solved=collideCircle(car.x,car.z,1.4);
 if(solved.hit){
  const impact=Math.abs(before);
  if(impact>7){sfxCrash(impact);damageCar(car,impact*1.6);state.foot.health-=Math.max(0,(impact-10)*.8);}
  car.x=solved.x;car.z=solved.z;car.speed*=.25;car.mesh.position.set(car.x,0,car.z);
 }
 // car vs car
 for(let i=0;i<world.cars.length;i++){
  if(i===state.inCar)continue;const o=world.cars[i];if(o.dead)continue;
  const d2=dist2(car.x,car.z,o.x,o.z);
  if(d2<9){const d=Math.sqrt(d2)||.1,push=(3-d)/2;const dx=(car.x-o.x)/d,dz=(car.z-o.z)/d;
   car.x+=dx*push;car.z+=dz*push;o.x-=dx*push;o.z-=dz*push;
   const impact=Math.abs(car.speed-o.speed);
   if(impact>6){sfxCrash(impact);damageCar(o,impact*2);damageCar(car,impact);o.mesh.position.set(o.x,0,o.z);reportCrime('ram',car.x,car.z);if(o.ai)o.ai.panic=8;}
   car.speed*=.6;}
 }
 // car vs pedestrians
 for(const ped of world.peds){
  if(ped.dead)continue;
  if(dist2(car.x,car.z,ped.x,ped.z)<3.2&&Math.abs(car.speed)>4){ped.hitByCar=true;}
 }
 if(brake&&Math.abs(car.speed)>8){if(Math.random()<dt*30)skidMark(car.x-Math.sin(car.heading)*1.5,car.z-Math.cos(car.heading)*1.5,car.heading);if(Math.random()<dt*6)sfxSkid();}
 p.x=car.x;p.z=car.z;p.heading=car.heading;
 p.mesh.visible=false;
 state.carSpeed=car.speed;state.carHeading=car.heading;
 updateEngine(Math.abs(car.speed),Math.max(0,throttle),true);
 if(hit('KeyE')&&p.enterCooldown<=0)exitCar(p);
 if(hit('KeyH'))sfxHorn();
 if(car.health<=0){explodePlayerCar(p,car);}
}
function tryEnterCar(p){
 let best=-1,bestD=16;
 for(let i=0;i<world.cars.length;i++){const c=world.cars[i];if(c.dead)continue;const d=dist2(p.x,p.z,c.x,c.z);if(d<bestD){bestD=d;best=i;}}
 if(best<0){notify('NO VEHICLE IN REACH');return;}
 const car=world.cars[best];
 state.inCar=best;car.ai=null;p.enterCooldown=.6;p.mesh.visible=false;
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
 if(car){p.x=car.x+Math.cos(car.heading)*2.4;p.z=car.z-Math.sin(car.heading)*2.4;const s=collideCircle(p.x,p.z,.45);p.x=s.x;p.z=s.z;car.speed*=.3;}
 state.inCar=-1;state.carSpeed=0;p.mesh.visible=true;p.enterCooldown=.6;
}
export function damageCar(car,dmg){
 if(state.photoNoDamage&&state.inCar>=0&&world.cars[state.inCar]===car)return;
 car.health-=dmg;
 if(car.health<=0&&!car.dead&&state.inCar!==world.cars.indexOf(car))blowUpCar(car);
}
export function blowUpCar(car){
 if(car.dead)return;car.dead=true;car.speed=0;
 import('./effects.js').then(f=>f.explosion(car.x,0,car.z));
 import('./audio.js').then(a=>a.sfxExplosion());
 car.mesh.traverse(o=>{if(o.isMesh&&o.material){o.material=o.material.clone();o.material.color.setHex(0x1c1c1e);}});
 car.mesh.rotation.z=.12;
 reportCrime('explosion',car.x,car.z);
}
function explodePlayerCar(p,car){exitCar(p);state.foot.health-=45;blowUpCar(car);}
export function damagePlayer(dmg){
 if(state.photoNoDamage)return;
 const absorb=Math.min(state.foot.armor,dmg*.6);
 state.foot.armor-=absorb;state.foot.health-=dmg-absorb;
 import('./camera.js').then(c=>c.cam.shake=Math.min(.5,c.cam.shake+.15));
}
export function killPlayer(p,cause){
 p.dead=true;p.respawnT=3;p.mesh.visible=false;
 if(state.inCar>=0){const car=world.cars[state.inCar];if(car)car.speed=0;state.inCar=-1;state.carSpeed=0;}
 state.deathCause=cause;state.wanted=0;state.heat=0;
 notify(cause==='hospital'?'DOWN — WAKING AT BAYSIDE GENERAL':'BUSTED — RELEASED ON BAIL');
 state.cash=Math.max(0,state.cash-(cause==='busted'?400:250));
}
function respawn(p){
 const spot=state.deathCause==='busted'?{x:-108,z:120}:HOSPITAL;
 p.x=spot.x;p.z=spot.z;p.dead=false;p.mesh.visible=true;
 state.foot.health=100;state.foot.armor=0;
 p.mesh.position.set(p.x,0,p.z);
}
