// Deterministic photo/demo mode (?shot=street|chase|mission|combat&seed=N):
// stages real game systems into readable scenes for the entry's screenshots.
import {world} from './world.js';
import {state,say} from './state.js';
import {makeCar} from './vehicles.js';
import {cam} from './camera.js';
import {reportCrime,spawnCop} from './police.js';
import {spawnGang} from './combat.js';
import {muzzleFlash,tracer,explosion,skidMark} from './effects.js';
import {makeRng} from './rng.js';
export function stagePhoto(name){
 const rng=makeRng(state.seed);
 const p=world.player;
 const place=(x,z,heading)=>{p.x=x;p.z=z;p.heading=heading;state.foot.x=x;state.foot.z=z;p.mesh.position.set(x,0,z);p.mesh.rotation.y=heading;cam.yaw=heading+Math.PI;};
 if(name==='street'){
  // sunlit downtown street, player beside a fresh sports car, traffic and pedestrians around
  place(196,42,Math.PI*.95);cam.pitch=.26;cam.dist=8;
  const car=makeCar('sports',192.5,46,Math.PI*.95);world.scene.add(car.mesh);world.cars.push(car);
  const taxi=makeCar('taxi',183.6,20,Math.PI);taxi.ai={kind:'traffic',dir:1,horizontal:false,road:6,cruise:11,panic:0,turnCooldown:9};world.scene.add(taxi.mesh);world.cars.push(taxi);
  const sedan=makeCar('sedan',176.4,70,0);sedan.ai={kind:'traffic',dir:-1,horizontal:false,road:6,cruise:10,panic:0,turnCooldown:9};world.scene.add(sedan.mesh);world.cars.push(sedan);
  state.missionTitle='LOW TIDE';state.objective='Meet Lena at the Breakwater — 212m';
  state.cash=2450;state.foot.health=100;state.foot.armor=65;
  world.waypoint={x:385,z:-85,label:'Breakwater Pier'};
  world.waypointMesh.position.set(385,0,-85);world.waypointMesh.visible=true;
 }
 if(name==='chase'){
  // full-speed pursuit on the Mile: 3 stars, two cruisers on the tail, mission objective live
  place(180,-30,Math.PI);cam.pitch=.3;cam.dist=11;
  const car=makeCar('sports',180,-30,Math.PI);car.speed=32;world.scene.add(car.mesh);world.cars.push(car);
  state.inCar=world.cars.length-1;state.carSpeed=32;state.carHeading=Math.PI;p.mesh.visible=false;
  state.heat=55;state.wanted=3;state.lastCrimeT=state.time;
  for(let k=0;k<2;k++){
   const cop=makeCar('police',180+(k?3.4:-3.4),-30+16+k*9,Math.PI);
   cop.speed=30;cop.ai={kind:'police',officers:0,patrolX:180,patrolZ:0};
   world.scene.add(cop.mesh);world.cars.push(cop);
  }
  for(let k=0;k<6;k++)skidMark(180+rng.range(-2,2),-26+k*3,Math.PI+rng.range(-.1,.1));
  state.missionTitle='THE LONG WAY';state.objective='Lose the police (3 stars) — 61s';
  say('LENA VALE','Every cruiser in the county is yours. Take the hill road!',6);
  world.waypoint={x:-216,z:180,label:'Heights Overlook'};
  world.waypointMesh.position.set(-216,0,180);world.waypointMesh.visible=true;
 }
 if(name==='mission'){
  // Copperworks docks: mission dialogue, waypoint beam, containers and cranes behind
  place(-150,-236,Math.PI*.6);cam.pitch=.24;cam.dist=8.5;
  const truck=makeCar('truck',-142,-244,Math.PI*.5);world.scene.add(truck.mesh);world.cars.push(truck);
  state.missionTitle='NIGHT SHIFT';state.objective='Deliver the ledger to Copperworks Docks — 66m';
  say('COURIER','This is bigger than a property deal. Crane is buying the whole waterfront.',8);
  world.waypoint={x:-216,z:-252,label:'Copperworks Gate'};
  world.waypointMesh.position.set(-216,0,-252);world.waypointMesh.visible=true;
  spawnCop(-160,-228);
 }
 if(name==='combat'){
  // beach road shootout at golden hour: muzzle flash, gang return fire, ocean vista
  place(262,140,-Math.PI/2);cam.pitch=.2;cam.dist=7.5;
  state.weapon=2;state.unlockedWeapons[2]=true;state.ammo[2]=96;
  const gang=spawnGang(288,138,3);
  for(const g of gang){g.heading=Math.atan2(-(p.x-g.x),p.z-g.z);g.mesh.rotation.y=g.heading;}
  muzzleFlash(p.x+2.2,1.35,p.z);tracer(p.x+2.2,1.35,p.z,286,1.3,139);
  muzzleFlash(286,1.35,139);tracer(286,1.35,139,p.x+1,1.2,p.z+1);
  const burning=makeCar('sedan',270,152,1.2);burning.dead=true;world.scene.add(burning.mesh);world.cars.push(burning);
  explosion(270,0,152);
  state.heat=42;state.wanted=2;state.lastCrimeT=state.time;state.gunfireT=.5;
  state.missionTitle='BURN NOTICE';state.objective='Hold the pier — 3 hostiles left';
  state.foot.health=76;state.foot.armor=30;
  world.waypoint={x:288,z:138,label:'Crane crew'};
 }
 state.photo=name;
}
