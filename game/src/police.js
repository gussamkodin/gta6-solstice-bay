// Wanted level and police AI: patrols, pursuits, on-foot arrests, roadblocks, heat decay.
import {THREE} from './three.js';
import {world} from './world.js';
import {state,notify} from './state.js';
import {makeCar,stepCar} from './vehicles.js';
import {buildHuman,animateHuman,ragdoll} from './peds.js';
import {dist2,collideCircle} from './physics.js';
import {roadAt,BLOCKS,LANE,HALF} from './config.js';
import {rng} from './rng.js';
import {updateSiren,sfxGun} from './audio.js';
import {damagePlayer,killPlayer,damageCar} from './player.js';
import {tracer,muzzleFlash} from './effects.js';
const CRIMES={'carjack':1,'steal-police':2,'hit-run':1,'ram':1,'shoot':1,'kill-ped':2,'kill-cop':3,'explosion':2,'assault':1};
let spawnTimer=0,roadblockTimer=0;
export function reportCrime(kind,x,z){
 const add=CRIMES[kind]||1;
 state.heat=Math.min(100,state.heat+add*22);
 const stars=Math.min(5,Math.ceil(state.heat/20));
 if(stars>state.wanted){state.wanted=stars;notify(stars===1?'WANTED — POLICE ALERTED':'WANTED LEVEL '+stars);}
 else state.wanted=Math.max(state.wanted,stars);
 state.crimeX=x;state.crimeZ=z;state.lastCrimeT=state.time;
 if(kind==='shoot'||kind==='kill-ped'||kind==='kill-cop'||kind==='assault')state.gunfireT=.5;
}
export function updatePolice(dt){
 const px=state.foot.x,pz=state.foot.z;
 state.gunfireT=Math.max(0,(state.gunfireT||0)-dt);
 // heat decays when out of sight of cops
 let seen=false;
 const cops=world.cars.filter(c=>c.ai&&c.ai.kind==='police'&&!c.dead);
 for(const c of cops)if(dist2(c.x,c.z,px,pz)<3600)seen=true;
 for(const p of world.peds)if(p.kind==='cop'&&!p.dead&&dist2(p.x,p.z,px,pz)<1600)seen=true;
 if(!seen&&state.wanted>0&&state.time-(state.lastCrimeT||0)>6){
  state.heat-=dt*7;
  if(state.heat<=0){state.heat=0;state.wanted=0;notify('YOU LOST THE HEAT');}
  else state.wanted=Math.min(5,Math.ceil(state.heat/20));
 }
 updateSiren(state.wanted>0?Math.min(1,state.wanted/2):0);
 // spawn pursuit units up to wanted count
 spawnTimer-=dt;
 const want=Math.min(6,state.wanted+1);
 if(state.wanted>0&&cops.length<want&&spawnTimer<=0){spawnTimer=2.5;spawnPoliceCar(px,pz);}
 // roadblocks at 3+ stars
 roadblockTimer-=dt;
 if(state.wanted>=3&&roadblockTimer<=0){roadblockTimer=18;spawnRoadblock(px,pz);}
 for(const car of world.cars){
  if(car.dead||!car.ai||car.ai.kind!=='police')continue;
  const ai=car.ai;
  // flashing lightbar
  const lb=car.mesh.userData.lightbar;
  if(lb){const t=Math.floor(state.time*6)%2;lb.red.emissiveIntensity=t?2:.2;lb.blue.emissiveIntensity=t?.2:2;}
  if(ai.blocked)continue; // roadblock cars stay put
  if(ai.photoHold>0){ai.photoHold-=dt;continue;} // staged scene: hold formation briefly
  if(state.wanted===0){ // return to patrol
   ai.mode='patrol';
  }
  const chase=state.wanted>0;
  const tx=chase?px:ai.patrolX,tz=chase?pz:ai.patrolZ;
  const dx=tx-car.x,dz=tz-car.z,d=Math.hypot(dx,dz);
  if(!chase&&d<12){ai.patrolX=rng.range(-HALF+30,HALF-30);ai.patrolZ=roadAt(rng.int(0,BLOCKS));}
  const desired=Math.atan2(dx,-dz);
  let diff=desired-car.heading;while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;
  const steer=Math.max(-1,Math.min(1,diff*2.2));
  const targetSpeed=chase?(d>18?car.spec.speed*.95:8):11;
  const throttle=car.speed<targetSpeed?1:-.4;
  stepCar(car,dt,throttle,false,steer);
  const solved=collideCircle(car.x,car.z,1.4);
  if(solved.hit){car.x=solved.x;car.z=solved.z;car.speed*=.35;car.heading+=rng.range(-.6,.6);car.mesh.position.set(car.x,0,car.z);}
  // ram the player car: damage scales with closing speed, not contact time
  if(state.inCar>=0){const pc=world.cars[state.inCar];
   if(pc&&dist2(car.x,car.z,pc.x,pc.z)<10){
    ai.ramT=(ai.ramT||0)-dt;
    const closing=Math.abs(car.speed-(pc.speed||0));
    if(ai.ramT<=0&&closing>4){ai.ramT=.8;damageCar(pc,closing*1.2);damageCar(car,closing*.5);state.foot.health-=closing*.25;}
   }
  }
  // deploy officers when close and player on foot or slow
  if(chase&&d<26&&ai.officers>0&&(state.inCar<0||Math.abs(state.carSpeed||0)<5)){
   ai.officers--;spawnCop(car.x+2,car.z);
  }
  // cops shoot from car at 3+ stars
  if(chase&&state.wanted>=3&&d<40){ai.fireT=(ai.fireT||0)-dt;if(ai.fireT<=0){ai.fireT=1.1;
   muzzleFlash(car.x,1.3,car.z);tracer(car.x,1.3,car.z,px+rng.range(-1,1),1.2,pz+rng.range(-1,1));sfxGun(1);
   if(rng()<.35)damagePlayer(rng.range(3,7));}}
 }
 // on-foot officers
 for(const cop of world.peds){
  if(cop.kind!=='cop'||cop.dead)continue;
  const dx=px-cop.x,dz=pz-cop.z,d=Math.hypot(dx,dz);
  cop.heading=Math.atan2(dx,dz);
  if(state.wanted===0){cop.flee=true;}
  let speed=0;
  if(!cop.flee){
   if(d>14)speed=5.6;
   else if(state.inCar<0&&d<2.2){killPlayer(world.player,'busted');return;}
   cop.fireT=(cop.fireT||0)-dt;
   if(d<26&&d>3&&cop.fireT<=0&&state.wanted>=2){cop.fireT=1.3;
    muzzleFlash(cop.x+Math.sin(cop.heading)*.5,1.35,cop.z+Math.cos(cop.heading)*.5);
    tracer(cop.x,1.35,cop.z,px+rng.range(-.8,.8),1.2,pz+rng.range(-.8,.8));sfxGun(1);
    if(rng()<.4)damagePlayer(rng.range(4,9));}
  }
  cop.x+=Math.sin(cop.heading)*speed*dt;cop.z+=Math.cos(cop.heading)*speed*dt;
  const s=collideCircle(cop.x,cop.z,.45);cop.x=s.x;cop.z=s.z;
  cop.mesh.position.set(cop.x,0,cop.z);cop.mesh.rotation.y=cop.heading;
  animateHuman(cop.mesh,speed,dt,true);
 }
}
function spawnPoliceCar(px,pz){
 const angle=rng()*Math.PI*2,r=90+rng()*40;
 const car=makeCar('police',px+Math.cos(angle)*r,pz+Math.sin(angle)*r,angle+Math.PI);
 car.x=Math.max(-HALF+12,Math.min(HALF-12,car.x));car.z=Math.max(-HALF+12,Math.min(HALF-12,car.z));
 car.ai={kind:'police',officers:2,patrolX:rng.range(-200,200),patrolZ:roadAt(rng.int(0,BLOCKS))};
 car.mesh.position.set(car.x,0,car.z);
 world.scene.add(car.mesh);world.cars.push(car);
}
function spawnRoadblock(px,pz){
 // two cruisers parked broadside across the road ahead of travel
 const heading=state.inCar>=0?state.carHeading:state.foot.heading;
 const bx=px-Math.sin(heading)*70,bz=pz+Math.cos(heading)*70;
 for(const s of [-1,1]){
  const car=makeCar('police',bx+Math.cos(heading)*s*3.2,bz+Math.sin(heading)*s*3.2,heading+Math.PI/2);
  car.ai={kind:'police',officers:1,blocked:true,patrolX:bx,patrolZ:bz};
  car.mesh.position.set(car.x,0,car.z);car.mesh.rotation.y=car.heading+Math.PI;
  world.scene.add(car.mesh);world.cars.push(car);
 }
 notify('ROADBLOCK REPORTED AHEAD');
}
export function spawnCop(x,z){
 const mesh=buildHuman({shirt:0x27436b,pants:0x1c2733,cap:0x1c2733,skin:0xd9a066});
 mesh.position.set(x,0,z);world.scene.add(mesh);
 world.peds.push({mesh,x,z,heading:0,speed:0,panic:0,dead:false,kind:'cop',health:60});
}
