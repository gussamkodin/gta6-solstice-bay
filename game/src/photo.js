// Deterministic photo/demo mode (?shot=street|chase|mission|combat&seed=N):
// stages real game systems into readable scenes for the entry's screenshots.
import {world} from './world.js';
import {state,say} from './state.js';
import {makeCar} from './vehicles.js';
import {cam} from './camera.js';
import {spawnCop} from './police.js';
import {spawnGang} from './combat.js';
import {muzzleFlash,tracer,explosion,skidMark} from './effects.js';
import {photoMission,setPhotoObjective} from './missions.js';
import {makeRng} from './rng.js';
export function stagePhoto(name){
 const rng=makeRng(state.seed);
 const p=world.player;
 const place=(x,z,heading)=>{p.x=x;p.z=z;p.heading=heading;state.foot.x=x;state.foot.z=z;p.mesh.position.set(x,0,z);p.mesh.rotation.y=heading;cam.yaw=heading+Math.PI;};
 const put=(type,x,z,heading,ai=null,speed=0)=>{const car=makeCar(type,x,z,heading);car.speed=speed;if(ai)car.ai=ai;car.mesh.position.set(x,0,z);car.mesh.rotation.y=heading+Math.PI;world.scene.add(car.mesh);world.cars.push(car);return car;};
 if(name==='street'){
  // sunlit Marigold Mile: player beside a sports car, traffic streaming past, downtown towers ahead
  place(180,72,-Math.PI/2+.2);cam.pitch=.16;cam.dist=9;
  put('sports',181.5,75.5,-Math.PI/2);
  put('taxi',230,68.4,-Math.PI/2,{kind:'traffic',dir:-1,horizontal:true,road:4,cruise:12,panic:0,turnCooldown:99},12);
  put('sedan',140,75.6,Math.PI/2,{kind:'traffic',dir:1,horizontal:true,road:4,cruise:11,panic:0,turnCooldown:99},11);
  put('sedan',183.6,20,0,{kind:'traffic',dir:1,horizontal:false,road:6,cruise:10,panic:0,turnCooldown:99},10);
  photoMission(0);setPhotoObjective('LOW TIDE','Meet Lena at the Breakwater — 212m');
  state.cash=2450;state.foot.health=100;state.foot.armor=65;
  world.waypoint={x:385,z:-85,label:'Breakwater Pier'};
  world.waypointMesh.position.set(385,0,-85);world.waypointMesh.visible=true;
 }
 if(name==='chase'){
  // full-speed pursuit: 3 stars, two cruisers on the tail, objective + dialogue live
  place(108,72,Math.PI/2);cam.pitch=.3;cam.dist=21;cam.yaw=-Math.PI/2+.18;
  const car=put('sports',108,72,Math.PI/2,null,32);
  state.inCar=world.cars.length-1;state.carSpeed=32;state.carHeading=Math.PI/2;p.mesh.visible=false;
  state.heat=55;state.wanted=3;state.lastCrimeT=state.time;state.photoNoDamage=true;state.photoFreeze=true;
  const copA=put('police',101,75.2,Math.PI/2,{kind:'police',officers:0,patrolX:0,patrolZ:72,photoHold:99},31);
  const copB=put('police',96,68.8,Math.PI/2-.06,{kind:'police',officers:0,patrolX:0,patrolZ:72,photoHold:99},31);
  for(const c of [copA,copB]){const lb=c.mesh.userData.lightbar;if(lb){lb.red.emissiveIntensity=2.2;lb.blue.emissiveIntensity=2.2;}}
  for(let k=0;k<6;k++)skidMark(104-k*3,72+rng.range(-2,2),Math.PI/2+rng.range(-.1,.1));
  photoMission(4);setPhotoObjective('THE LONG WAY','Lose the police (3 stars) — 61s');
  say('LENA VALE','Every cruiser in the county is yours. Take the hill road!',9);
  world.waypoint={x:-216,z:180,label:'Heights Overlook'};
  world.waypointMesh.position.set(-216,0,180);world.waypointMesh.visible=true;
 }
 if(name==='mission'){
  // Copperworks docks: player on the dock road facing the container yard and crane
  place(-174,-214,Math.PI);cam.pitch=.22;cam.dist=9;
  put('truck',-190,-222,Math.PI*.92);
  put('sedan',-166,-224,Math.PI*.08);
  photoMission(2);setPhotoObjective('NIGHT SHIFT','Deliver the ledger to Copperworks Docks — 42m');
  say('COURIER','This is bigger than a property deal. Crane is buying the whole waterfront.',9);
  world.waypoint={x:-186,z:-232,label:'Copperworks Gate'};
  world.waypointMesh.position.set(-186,0,-232);world.waypointMesh.visible=true;
 }
 if(name==='combat'){
  // beach road shootout at golden hour: muzzle flash, gang return fire, burning sedan, ocean vista
  place(288,140,-Math.PI/2);cam.pitch=.14;cam.dist=11;cam.yaw=Math.PI/2-.7;
  state.weapon=2;state.unlockedWeapons[2]=true;state.ammo[2]=96;
  state.photoNoDamage=true;state.photoFreeze=true;world.photoFx=true;
  const gang=spawnGang(268,132,3);
  for(const g of gang){g.heading=Math.atan2(p.x-g.x,p.z-g.z);g.mesh.rotation.y=g.heading;g.photoHold=99;}
  muzzleFlash(p.x-2.2,1.35,p.z);tracer(p.x-2.2,1.35,p.z,269,1.3,133);
  muzzleFlash(269,1.35,133);tracer(269,1.35,133,p.x+1,1.2,p.z+1);
  const burning=put('sedan',272,124,1.2);burning.dead=true;
  burning.mesh.traverse(o=>{if(o.isMesh&&o.material){o.material=o.material.clone();o.material.color.setHex(0x1c1c1e);}});
  explosion(272,0,124);
  state.heat=42;state.wanted=2;state.lastCrimeT=state.time;state.gunfireT=.5;
  photoMission(3);setPhotoObjective('BURN NOTICE','Hold the beach road — 3 hostiles left');
  say('LENA VALE','Crane\'s crew is on the strand. Hold them off until the tide turns!',9);
  state.foot.health=76;state.foot.armor=30;
  world.waypoint={x:268,z:132,label:'Crane crew'};
 }
 state.photo=name;state.photoT=0;
}
