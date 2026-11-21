// AI traffic on the road grid plus sidewalk pedestrians with panic/flee reactions.
// Head-on avoidance and horn honks run off the seeded stream so traffic is reproducible.
// Crew peds (kind 'crew') are driven by crew.js, never by street AI.
import {THREE} from './three.js';
import {world} from './world.js';
import {state} from './state.js';
import {makeCar,stepCar} from './vehicles.js';
import {buildHuman,animateHuman,ragdoll} from './peds.js';
import {roadAt,BLOCKS,LANE,HALF,SIDEWALK,PITCH,BLOCK} from './config.js';
import {rng,makeRng} from './rng.js';
import {dist2,collideCircle,angleDelta} from './physics.js';
import {sfxHorn,sfxCrash} from './audio.js';
import {impactSparks,bloodPuff,bloodPool} from './effects.js';
import {damageCar,updateCarDamageFX} from './player.js';
import {BUS_STOPS} from './city.js';
const trafficRng=makeRng(777);
let hornCooldown=0;
export function spawnTraffic(count=50){
 const busRoads=[2,4,5,6,7,8];
 for(let i=0;i<count;i++){
  const isBus=i<6;
  const type=isBus?'bus':(trafficRng()<.12?'taxi':trafficRng()<.2?'truck':trafficRng()<.35?'sports':'sedan');
  const car=makeCar(type,0,0);
  // place on a random lane segment (buses start along the major boulevards)
  const horizontal=isBus?(i%2===1):(trafficRng()<.5);
  const road=isBus?busRoads[i%busRoads.length]:trafficRng.int(0,BLOCKS);
  const along=trafficRng.range(-HALF+20,HALF-20);
  const dir=trafficRng()<.5?1:-1;
  if(horizontal){car.x=along;car.z=roadAt(road)+dir*LANE;car.heading=dir>0?Math.PI/2:-Math.PI/2;}
  else{car.x=roadAt(road)+dir*LANE;car.z=along;car.heading=dir>0?Math.PI:0;}
  car.ai={kind:'traffic',dir,horizontal,road,cruise:isBus?trafficRng.range(8.5,12):trafficRng.range(9,15),panic:0,turnCooldown:0};
  car.driver=attachDriver(car);
  world.scene.add(car.mesh);world.cars.push(car);
 }
 // 14 parked cars near sidewalks for easy stealing
 for(let i=0;i<14;i++){
  const road=trafficRng.int(1,BLOCKS-1),along=trafficRng.range(-220,220);
  const type=trafficRng()<.4?'sports':'sedan';
  const car=makeCar(type,roadAt(road)+6.4,along,Math.PI);
  car.mesh.position.set(car.x,0,car.z);car.mesh.rotation.y=Math.PI-car.heading;
  world.scene.add(car.mesh);world.cars.push(car);
 }
}
function attachDriver(car){
 const ped=buildHuman({});
 ped.visible=false;world.scene.add(ped);
 const p={mesh:ped,x:car.x,z:car.z,heading:0,speed:0,panic:0,dead:false,inCar:car,kind:'driver'};
 world.peds.push(p);return p;
}
export function spawnPeds(count=110){
 let spawned=0;
 // Clusters of waiting commuters near Bus Stops
 for(const stop of BUS_STOPS){
  for(let k=0;k<2&&spawned<count;k++){
   const mesh=buildHuman({});
   const x=stop.x+stop.dirX*.55+(trafficRng()-.5)*.9;
   const z=stop.z-1.2+k*2.2+(trafficRng()-.5)*.8;
   const heading=stop.dirX>0?Math.PI/2:-Math.PI/2;
   mesh.position.set(x,0,z);world.scene.add(mesh);
   world.peds.push({mesh,x,z,heading,speed:0,walkSpeed:trafficRng.range(.9,1.5),panic:0,dead:false,kind:'ped',zone:'commuter',turnT:trafficRng.range(3,10)});
   spawned++;
  }
 }
 // Beachgoers strolling along Ocean Drive & beach edge (x ≈ 334..348)
 const beachCount=Math.min(24,Math.max(0,count-spawned));
 for(let i=0;i<beachCount;i++){
  const mesh=buildHuman({});
  const x=trafficRng.range(334,348),z=trafficRng.range(-240,240);
  const heading=trafficRng()<.5?0:Math.PI;
  mesh.position.set(x,0,z);world.scene.add(mesh);
  world.peds.push({mesh,x,z,heading,speed:trafficRng.range(1.0,1.6),walkSpeed:trafficRng.range(1.0,1.6),panic:0,dead:false,kind:'ped',zone:'beach',turnT:trafficRng.range(3,9)});
  spawned++;
 }
 // Remaining pedestrians across city block sidewalks
 for(let i=spawned;i<count;i++){
  const mesh=buildHuman({});
  const bx=trafficRng.int(0,BLOCKS-1),bz=trafficRng.int(0,BLOCKS-1);
  const cx=-HALF+16+bx*PITCH+BLOCK/2,cz=-HALF+16+bz*PITCH+BLOCK/2;
  const side=trafficRng.int(0,3);
  let x=cx,z=cz;
  const off=BLOCK/2-SIDEWALK/2;
  if(side===0){x=cx+trafficRng.range(-off,off);z=cz-off;}
  if(side===1){x=cx+trafficRng.range(-off,off);z=cz+off;}
  if(side===2){x=cx-off;z=cz+trafficRng.range(-off,off);}
  if(side===3){x=cx+off;z=cz+trafficRng.range(-off,off);}
  const heading=side<2?(trafficRng()<.5?-Math.PI/2:Math.PI/2):(trafficRng()<.5?Math.PI:0);
  mesh.position.set(x,0,z);world.scene.add(mesh);
  world.peds.push({mesh,x,z,heading,speed:trafficRng.range(1.1,1.8),walkSpeed:trafficRng.range(1.1,1.8),panic:0,dead:false,kind:'ped',turnT:trafficRng.range(2,8),home:{cx,cz}});
 }
}
export function updateTraffic(dt){
 const px=state.foot.x,pz=state.foot.z;
 hornCooldown=Math.max(0,hornCooldown-dt);
 for(let i=0;i<world.cars.length;i++){
  const car=world.cars[i];
  if(car.dead||i===state.inCar)continue;
  car.crashCd=Math.max(0,(car.crashCd||0)-dt);
  updateCarDamageFX(car,dt,false);
  // parked or knocked-back cars still slide and spin when rammed
  if(!car.ai){
   if(Math.abs(car.kbX||0)>.05||Math.abs(car.kbZ||0)>.05||Math.abs(car.spinVel||0)>.05){
    car.x+=(car.kbX||0)*dt;car.z+=(car.kbZ||0)*dt;car.heading+=(car.spinVel||0)*dt;
    car.kbX=(car.kbX||0)*Math.max(0,1-dt*5.5);car.kbZ=(car.kbZ||0)*Math.max(0,1-dt*5.5);
    car.spinVel=(car.spinVel||0)*Math.max(0,1-dt*6.5);
    const s=collideCircle(car.x,car.z,1.3);car.x=s.x;car.z=s.z;
    car.mesh.position.set(car.x,0,car.z);car.mesh.rotation.y=Math.PI-car.heading;
   }
   continue;
  }
  const ai=car.ai;
  if(ai.kind!=='traffic')continue;
  ai.panic=Math.max(0,ai.panic-dt);
  // flee from gunfire nearby
  if(state.gunfireT>0&&dist2(car.x,car.z,px,pz)<900)ai.panic=Math.max(ai.panic,3);
  let target=ai.panic>0?ai.cruise*1.5:ai.cruise;
  // avoid the car ahead on same lane (only honk rarely if right near the player)
  for(const other of world.cars){
   if(other===car||other.dead)continue;
   const dx=other.x-car.x,dz=other.z-car.z;
   const fx=Math.sin(car.heading),fz=-Math.cos(car.heading);
   const ahead=dx*fx+dz*fz,side=Math.abs(dx*fz-dz*fx);
   const stopDist=(car.type==='bus'||other.type==='bus')?15:12;
   if(ahead>0&&ahead<stopDist&&side<2.6){
    target=Math.min(target,Math.max(0,other.speed-2));
    if(ahead<5.5&&hornCooldown<=0&&dist2(car.x,car.z,px,pz)<320&&trafficRng()<dt*.08){hornCooldown=7.5;sfxHorn();}
   }
  }
  // slow for player on foot directly ahead
  const pdx=px-car.x,pdz=pz-car.z,fx=Math.sin(car.heading),fz=-Math.cos(car.heading);
  const pahead=pdx*fx+pdz*fz,pside=Math.abs(pdx*fz-pdz*fx);
  if(state.inCar<0&&pahead>0&&pahead<10&&pside<2.5)target=0;
  // stay on grid: at intersections decide to turn smoothly without teleporting
  ai.turnCooldown=Math.max(0,ai.turnCooldown-dt);
  const coord=ai.horizontal?car.x:car.z;
  for(let r=0;r<=BLOCKS;r++){
   const cross=roadAt(r);
   if(Math.abs(coord-cross)<2.4&&ai.turnCooldown<=0&&trafficRng()<.32){
    ai.turnCooldown=5.5;
    const newDir=trafficRng()<.5?1:-1;
    ai.horizontal=!ai.horizontal;ai.road=r;ai.dir=newDir;
    break;
   }
  }
  // smooth lane-following & curved intersection steering
  const baseH=ai.horizontal?(ai.dir>0?Math.PI/2:-Math.PI/2):(ai.dir>0?Math.PI:0);
  const laneTarget=roadAt(ai.road)+ai.dir*LANE;
  const latErr=ai.horizontal?(laneTarget-car.z)*ai.dir:-(laneTarget-car.x)*ai.dir;
  const wantH=baseH+Math.max(-.52,Math.min(.52,latErr*.22));
  const hDiff=angleDelta(car.heading,wantH);
  const steer=Math.max(-1,Math.min(1,hDiff*2.5));
  if(Math.abs(hDiff)>.25)target=Math.min(target,9.5);
  const throttle=car.speed<target?1:(car.speed>target+2?-0.6:0);
  stepCar(car,dt,throttle,car.speed>target+4,steer);
  // wrap at city edge
  if(Math.abs(car.x)>HALF-6||Math.abs(car.z)>HALF-6){
   ai.dir*=-1;car.heading+=Math.PI;
   car.x=Math.max(-HALF+8,Math.min(HALF-8,car.x));car.z=Math.max(-HALF+8,Math.min(HALF-8,car.z));
  }
  if(car.driver){car.driver.x=car.x;car.driver.z=car.z;}
 }
 // AI car-vs-car physical collision pass (traffic & police cruisers bump, spark and spin instead of ghosting)
 for(let i=0;i<world.cars.length;i++){
  if(i===state.inCar)continue;const a=world.cars[i];if(a.dead)continue;
  for(let j=i+1;j<world.cars.length;j++){
   if(j===state.inCar)continue;const b=world.cars[j];if(b.dead)continue;
   const d2=dist2(a.x,a.z,b.x,b.z);
   if(d2<10.2){
    const d=Math.sqrt(d2)||.1,push=(3.2-d)*.5;
    const dx=(a.x-b.x)/d,dz=(a.z-b.z)/d;
    a.x+=dx*push;a.z+=dz*push;b.x-=dx*push;b.z-=dz*push;
    const impact=Math.abs((a.speed||0)-(b.speed||0));
    if(impact>5&&(a.crashCd||0)<=0&&(b.crashCd||0)<=0){
     a.crashCd=.6;b.crashCd=.6;
     a.kbX=dx*impact*.42;a.kbZ=dz*impact*.42;
     b.kbX=-dx*impact*.42;b.kbZ=-dz*impact*.42;
     a.spinVel=(trafficRng()-.5)*impact*.14;
     b.spinVel=(trafficRng()-.5)*impact*.14;
     if(dist2(a.x,a.z,px,pz)<1600){sfxCrash(impact*.7);impactSparks((a.x+b.x)*.5,.6,(a.z+b.z)*.5);}
     damageCar(a,Math.min(14,impact*.45));damageCar(b,Math.min(14,impact*.45));
    }
    a.speed*=.7;b.speed*=.7;
    a.mesh.position.set(a.x,0,a.z);b.mesh.position.set(b.x,0,b.z);
   }
  }
 }
}
export function updatePeds(dt){
 const px=state.foot.x,pz=state.foot.z;
 for(const ped of world.peds){
  if(ped.kind==='driver'&&ped.inCar&&!ped.inCar.dead)continue;
  if(ped.dead){
   if(ped.ragT>0){
    ped.ragT-=dt;
    ped.x+=(ped.hitVx||0)*dt;ped.z+=(ped.hitVz||0)*dt;
    const damp=Math.max(0,1-dt*4.5);
    ped.hitVx=(ped.hitVx||0)*damp;ped.hitVz=(ped.hitVz||0)*damp;
    const s=collideCircle(ped.x,ped.z,.35);ped.x=s.x;ped.z=s.z;
    ped.mesh.position.set(ped.x,Math.max(.15,ped.ragT*.55),ped.z);
    ped.mesh.rotation.y+=dt*4.2;
    if(ped.ragT<=0){ped.mesh.position.y=.15;bloodPool(ped.x,ped.z);}
   }
   continue;
  }
  if(ped.photoHold>0){ped.photoHold-=dt;continue;} // staged photo: hold the sidewalk pose
  if(ped.kind==='crew')continue; // mission crew (Marisol) is moved by followCrew, not street AI
  if(ped.hitByCar&&!ped.dead){
   ped.dead=true;ped.hitByCar=false;ped.ragT=.55;ragdoll(ped.mesh);
   bloodPuff(ped.x,.95,ped.z,16);bloodPool(ped.x,ped.z);
   import('./police.js').then(p=>p.reportCrime('hit-run',ped.x,ped.z));
   continue;
  }
  ped.panic=Math.max(0,ped.panic-dt);
  if(state.gunfireT>0&&dist2(ped.x,ped.z,px,pz)<700)ped.panic=6;
  if(dist2(ped.x,ped.z,px,pz)<25&&state.inCar>=0&&Math.abs(state.carSpeed||0)>10)ped.panic=Math.max(ped.panic,2);
  let speed=ped.walkSpeed||1.4;
  if(ped.panic>0){speed=5.2;const dx=ped.x-px,dz=ped.z-pz;const d=Math.hypot(dx,dz)||1;ped.heading=Math.atan2(dx/d,dz/d);}
  else{ped.turnT-=dt;if(ped.turnT<=0){ped.turnT=trafficRng.range(3,9);if(trafficRng()<.5)ped.heading+=trafficRng()<.5?Math.PI/2:-Math.PI/2;}}
  const nx=ped.x+Math.sin(ped.heading)*speed*dt,nz=ped.z+Math.cos(ped.heading)*speed*dt;
  // keep pedestrians inside the city/beach promenade and off the ocean water
  const outOfBounds=ped.zone==='beach'?(nx<333||nx>356||Math.abs(nz)>260):(nx<-HALF+10||nx>356||Math.abs(nz)>HALF-10);
  if(outOfBounds){ped.heading+=Math.PI;}
  else{ped.x=nx;ped.z=nz;}
  ped.speed=speed;
  ped.mesh.position.set(ped.x,0,ped.z);ped.mesh.rotation.y=ped.heading;
  animateHuman(ped.mesh,speed,dt);
 }
}
