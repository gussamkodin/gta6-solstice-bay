// AI traffic on the road grid plus sidewalk pedestrians with panic/flee reactions.
// Head-on avoidance and horn honks run off the seeded stream so traffic is reproducible.
import {THREE} from './three.js';
import {world} from './world.js';
import {state} from './state.js';
import {makeCar,stepCar} from './vehicles.js';
import {buildHuman,animateHuman,ragdoll} from './peds.js';
import {roadAt,BLOCKS,LANE,HALF,SIDEWALK,PITCH,BLOCK} from './config.js';
import {rng,makeRng} from './rng.js';
import {dist2} from './physics.js';
import {sfxHorn} from './audio.js';
const trafficRng=makeRng(777);
export function spawnTraffic(count=26){
 for(let i=0;i<count;i++){
  const type=trafficRng()<.12?'taxi':trafficRng()<.2?'truck':trafficRng()<.35?'sports':'sedan';
  const car=makeCar(type,0,0);
  // place on a random lane segment
  const horizontal=trafficRng()<.5;
  const road=trafficRng.int(0,BLOCKS);
  const along=trafficRng.range(-HALF+20,HALF-20);
  const dir=trafficRng()<.5?1:-1;
  if(horizontal){car.x=along;car.z=roadAt(road)+dir*LANE;car.heading=dir>0?Math.PI/2:-Math.PI/2;}
  else{car.x=roadAt(road)+dir*LANE;car.z=along;car.heading=dir>0?Math.PI:0;}
  car.ai={kind:'traffic',dir,horizontal,road,cruise:trafficRng.range(9,15),panic:0,turnCooldown:0};
  car.driver=attachDriver(car);
  world.scene.add(car.mesh);world.cars.push(car);
 }
 // a few parked cars near sidewalks for easy stealing
 for(let i=0;i<10;i++){
  const road=trafficRng.int(1,BLOCKS-1),along=trafficRng.range(-200,200);
  const type=trafficRng()<.4?'sports':'sedan';
  const car=makeCar(type,roadAt(road)+6.4,along,Math.PI);
  car.mesh.position.set(car.x,0,car.z);car.mesh.rotation.y=Math.PI;
  world.scene.add(car.mesh);world.cars.push(car);
 }
}
function attachDriver(car){
 const ped=buildHuman({});
 ped.visible=false;world.scene.add(ped);
 const p={mesh:ped,x:car.x,z:car.z,heading:0,speed:0,panic:0,dead:false,inCar:car,kind:'driver'};
 world.peds.push(p);return p;
}
export function spawnPeds(count=40){
 for(let i=0;i<count;i++){
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
 for(let i=0;i<world.cars.length;i++){
  const car=world.cars[i];
  if(car.dead||i===state.inCar||!car.ai)continue;
  const ai=car.ai;
  if(ai.kind!=='traffic')continue;
  ai.panic=Math.max(0,ai.panic-dt);
  // flee from gunfire nearby
  if(state.gunfireT>0&&dist2(car.x,car.z,px,pz)<900)ai.panic=Math.max(ai.panic,3);
  let target=ai.panic>0?ai.cruise*1.5:ai.cruise;
  // avoid the car ahead on same lane
  for(const other of world.cars){
   if(other===car||other.dead)continue;
   const dx=other.x-car.x,dz=other.z-car.z;
   const fx=Math.sin(car.heading),fz=-Math.cos(car.heading);
   const ahead=dx*fx+dz*fz,side=Math.abs(dx*fz-dz*fx);
   if(ahead>0&&ahead<12&&side<2.4){target=Math.min(target,Math.max(0,other.speed-2));if(ahead<6&&trafficRng()<dt*.5)sfxHorn();}
  }
  // slow for player on foot directly ahead
  const pdx=px-car.x,pdz=pz-car.z,fx=Math.sin(car.heading),fz=-Math.cos(car.heading);
  const pahead=pdx*fx+pdz*fz,pside=Math.abs(pdx*fz-pdz*fx);
  if(state.inCar<0&&pahead>0&&pahead<10&&pside<2.5)target=0;
  const throttle=car.speed<target?1:(car.speed>target+2?-0.6:0);
  stepCar(car,dt,throttle,car.speed>target+4,.0);
  // stay on grid: at intersections maybe turn
  ai.turnCooldown=Math.max(0,ai.turnCooldown-dt);
  const coord=ai.horizontal?car.x:car.z;
  for(let r=0;r<=BLOCKS;r++){
   const cross=roadAt(r);
   if(Math.abs(coord-cross)<1.2&&ai.turnCooldown<=0&&trafficRng()<.35){
    ai.turnCooldown=3;
    const newDir=trafficRng()<.5?1:-1;
    ai.horizontal=!ai.horizontal;ai.road=r;ai.dir=newDir;
    if(ai.horizontal){car.z=roadAt(r)+newDir*LANE;car.heading=newDir>0?Math.PI/2:-Math.PI/2;}
    else{car.x=roadAt(r)+newDir*LANE;car.heading=newDir>0?Math.PI:0;}
    car.mesh.position.set(car.x,0,car.z);
    break;
   }
  }
  // wrap at city edge
  if(Math.abs(car.x)>HALF-6||Math.abs(car.z)>HALF-6){
   ai.dir*=-1;car.heading+=Math.PI;
   car.x=Math.max(-HALF+8,Math.min(HALF-8,car.x));car.z=Math.max(-HALF+8,Math.min(HALF-8,car.z));
  }
  if(car.driver){car.driver.x=car.x;car.driver.z=car.z;}
 }
}
export function updatePeds(dt){
 const px=state.foot.x,pz=state.foot.z;
 for(const ped of world.peds){
  if(ped.kind==='driver'&&ped.inCar&&!ped.inCar.dead)continue;
  if(ped.dead){continue;}
  if(ped.photoHold>0){ped.photoHold-=dt;continue;} // staged photo: hold the sidewalk pose
  if(ped.kind==='crew')continue; // mission crew (Marisol) is moved by followCrew, not street AI
  if(ped.hitByCar&&!ped.dead){ped.dead=true;ped.hitByCar=false;ragdoll(ped.mesh);import('./police.js').then(p=>p.reportCrime('hit-run',ped.x,ped.z));import('./effects.js').then(e=>e.bloodPuff(ped.x,1,ped.z));state.cash+=0;continue;}
  ped.panic=Math.max(0,ped.panic-dt);
  if(state.gunfireT>0&&dist2(ped.x,ped.z,px,pz)<700)ped.panic=6;
  if(dist2(ped.x,ped.z,px,pz)<25&&state.inCar>=0&&Math.abs(state.carSpeed||0)>10)ped.panic=Math.max(ped.panic,2);
  let speed=ped.walkSpeed||1.4;
  if(ped.panic>0){speed=5.2;const dx=ped.x-px,dz=ped.z-pz;const d=Math.hypot(dx,dz)||1;ped.heading=Math.atan2(dx/d,dz/d);}
  else{ped.turnT-=dt;if(ped.turnT<=0){ped.turnT=trafficRng.range(3,9);if(trafficRng()<.5)ped.heading+=trafficRng()<.5?Math.PI/2:-Math.PI/2;}}
  const nx=ped.x+Math.sin(ped.heading)*speed*dt,nz=ped.z+Math.cos(ped.heading)*speed*dt;
  // keep pedestrians inside the city and off the water
  if(Math.abs(nx)>HALF-10||Math.abs(nz)>HALF-10||nx>300){ped.heading+=Math.PI;}
  else{ped.x=nx;ped.z=nz;}
  ped.speed=speed;
  ped.mesh.position.set(ped.x,0,ped.z);ped.mesh.rotation.y=ped.heading;
  animateHuman(ped.mesh,speed,dt);
 }
}
