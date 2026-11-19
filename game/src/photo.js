// Deterministic photo/demo mode (?shot=street|chase|mission|combat&seed=N):
// stages real game systems into dense, readable scenes for the entry's screenshots.
// Every prop here is a live game object — traffic AI, police AI, AIR ONE, effects, HUD.
import {world} from './world.js';
import {state,say,notify} from './state.js';
import {makeCar} from './vehicles.js';
import {cam} from './camera.js';
import {spawnCop} from './police.js';
import {spawnGang} from './combat.js';
import {photoHeli} from './helicopter.js';
import {muzzleFlash,tracer,explosion,skidMark} from './effects.js';
import {photoMission,setPhotoObjective} from './missions.js';
import {animateHuman} from './peds.js';
import {STATIONS} from './radio.js';
import {makeRng} from './rng.js';
export function stagePhoto(name){
 const rng=makeRng(state.seed);
 const p=world.player;
 const place=(x,z,heading)=>{p.x=x;p.z=z;p.heading=heading;state.foot.x=x;state.foot.z=z;p.mesh.position.set(x,0,z);p.mesh.rotation.y=heading;cam.yaw=heading+Math.PI;};
 const put=(type,x,z,heading,ai=null,speed=0)=>{const car=makeCar(type,x,z,heading);car.speed=speed;if(ai)car.ai=ai;car.mesh.position.set(x,0,z);car.mesh.rotation.y=heading+Math.PI;world.scene.add(car.mesh);world.cars.push(car);return car;};
 // stepCar normally lights the exhaust cones; under photoFreeze it never runs, so
 // staged NOS cars switch their flames on here
 const nosOn=car=>{car.nos=true;const f=car.mesh.userData.flames;if(f){f.visible=true;f.scale.setScalar(1.15);}};
 const traffic=(type,x,z,dir,horizontal,road,speed)=>put(type,x,z,horizontal?(dir>0?Math.PI/2:-Math.PI/2):(dir>0?Math.PI:0),{kind:'traffic',dir,horizontal,road,cruise:speed,panic:0,turnCooldown:99},speed);
 const freezePedsNear=(x,z,r)=>{for(const ped of world.peds){if(ped.dead||ped.kind==='driver')continue;const dx=ped.x-x,dz=ped.z-z;if(dx*dx+dz*dz<r*r){ped.photoHold=99;ped.heading=Math.atan2(-dx,-dz)+rng.range(-.4,.4);ped.mesh.rotation.y=ped.heading;}}};
 // stage sidewalk strollers where the shot needs them (real peds, held mid-stride)
 const pedAt=(x,z,heading,pose=1)=>{
  const src=world.peds.find(q=>q.kind==='ped'&&!q.dead&&!q.photoHold);
  if(!src)return;
  src.x=x;src.z=z;src.heading=heading;src.photoHold=99;
  src.mesh.position.set(x,0,z);src.mesh.rotation.y=heading;src.mesh.userData.phase=pose;
  animateHuman(src.mesh,3,0);};
 if(name==='street'){
  // golden hour on Marigold Mile: player beside a red Solara GT, dense traffic and
  // pedestrians, neon storefronts, downtown towers ahead, full HUD + objective + dialogue
  place(322,147.6,-Math.PI/2);cam.pitch=.13;cam.dist=12;cam.aimY=2.4;cam.yaw=Math.PI/2-.18;
  const solara=put('sports',322,147.6,-Math.PI/2,null,17);
  // force the cover car red for a strong focal silhouette (clone so shared paints stay put)
  solara.mesh.traverse(o=>{if(o.isMesh&&o.material&&o.material.isMeshStandardMaterial&&o.material.metalness===.2){o.material=o.material.clone();o.material.color.setHex(0xe8452e);}});
  state.inCar=world.cars.length-1;state.carSpeed=17;state.carHeading=-Math.PI/2;p.mesh.visible=false;
  state.photoFreeze=true;
  traffic('sedan',295,147.6,-1,true,5,12);
  traffic('taxi',308,140.4,1,true,5,12);
  traffic('sedan',262,140.4,1,true,5,10);
  traffic('truck',240,147.6,-1,true,5,9);
  traffic('sedan',284.4,120,1,false,8,10);
  traffic('sports',291.6,176,-1,false,8,13);
  freezePedsNear(300,144,80);
  pedAt(304,153.5,Math.PI/2,1.2);pedAt(295,153.5,Math.PI/2,2.6);
  pedAt(310,134.5,-Math.PI/2,.8);pedAt(288,134.5,-Math.PI/2,2.1);
  pedAt(278,153.5,Math.PI/2,1.7);pedAt(268,134.5,-Math.PI/2,3.1);
  pedAt(317,156,-Math.PI/2-.4,1.4);pedAt(311,158.5,-Math.PI/2+.3,2.4);
  photoMission(0);setPhotoObjective('LOW TIDE','Meet Lena at the Breakwater — 262m');
  state.cash=2450;state.foot.health=100;state.foot.armor=65;
  state.respect=34;state.weapon=1;state.nitro=78;
  state.radioOn=true;state.radioStation=0;state.radioTrack=STATIONS[0].tracks[1];
  say('LENA VALE','Crane\'s people dredged the bay at dawn. Find out what they buried — start at the pier office.',9);
  world.waypoint={x:385,z:-85,label:'Breakwater Pier'};
  world.waypointMesh.position.set(385,0,-85);world.waypointMesh.visible=true;
 }
 if(name==='chase'){
  // full-speed pursuit under AIR ONE: 4 stars, three cruisers on the tail, searchlight
  // cone, skid marks, NOS burn, radio playing, escape objective + chatter on the HUD
  place(108,72,Math.PI/2);cam.pitch=.14;cam.dist=17;cam.yaw=-Math.PI/2-.1;cam.aimY=5;
  const car=put('sports',108,72,Math.PI/2,null,38);
  car.mesh.traverse(o=>{if(o.isMesh&&o.material&&o.material.isMeshStandardMaterial&&o.material.metalness===.2){o.material=o.material.clone();o.material.color.setHex(0xe8452e);}});
  nosOn(car);state.nosActive=true;state.nitro=62;
  state.inCar=world.cars.length-1;state.carSpeed=38;state.carHeading=Math.PI/2;p.mesh.visible=false;
  state.heat=72;state.wanted=4;state.lastCrimeT=state.time;state.photoNoDamage=true;state.photoFreeze=true;
  const copA=put('police',101,75.2,Math.PI/2,{kind:'police',officers:0,patrolX:0,patrolZ:72,photoHold:99},36);
  const copB=put('police',97,68.8,Math.PI/2-.06,{kind:'police',officers:0,patrolX:0,patrolZ:72,photoHold:99},36);
  const copC=put('police',95,73.5,Math.PI/2+.05,{kind:'police',officers:0,patrolX:0,patrolZ:72,photoHold:99},35);
  for(const c of [copA,copB,copC]){const lb=c.mesh.userData.lightbar;if(lb){lb.red.emissiveIntensity=2.4;lb.blue.emissiveIntensity=2.4;}}
  for(let k=0;k<8;k++)skidMark(104-k*2.6,72+rng.range(-2,2),Math.PI/2+rng.range(-.1,.1));
  photoHeli(108,72);
  photoMission(4);setPhotoObjective('THE LONG WAY','Lose the police (4 stars) — 61s');
  say('LENA VALE','Every cruiser in the county is yours — and AIR ONE overhead. Take the hill road!',9);
  state.radioOn=true;state.radioStation=0;state.radioToast=true;state.radioTrack=STATIONS[0].tracks[0];
  state.respect=88;
  world.waypoint={x:-216,z:180,label:'Heights Overlook'};
  world.waypointMesh.position.set(-216,0,180);world.waypointMesh.visible=true;
 }
 if(name==='mission'){
  // UNDERTOW at Copperworks Docks: crane silhouettes against the sunset, container yard,
  // waypoint beam at the gate, Marisol dialogue, delivery truck — the rescue job briefing
  // stand on the dock road facing north into the container yard: stacks and crane
  // against the sunset, gang at the gate ahead-right, camera safely over the road
  place(-148,-213,Math.PI);cam.pitch=.1;cam.dist=12;cam.aimY=3.2;
  put('truck',-143.5,-244,Math.PI*.42);
  put('sedan',-155,-238,Math.PI*.08);
  const gang=spawnGang(-148,-227,3);
  // tight triangle at the gate: every gang member stays on the open road in view
  const spots=[[-151.5,-225.5],[-144.5,-226],[-148,-222.5]];
  gang.forEach((g,i)=>{g.x=spots[i][0];g.z=spots[i][1];g.mesh.position.set(g.x,0,g.z);g.photoHold=99;g.heading=Math.atan2(p.x-g.x,p.z-g.z);g.mesh.rotation.y=g.heading;});
  photoMission(6);setPhotoObjective('UNDERTOW','Free Marisol from Crane\'s dock crew — 29m');
  say('MARISOL','Remy! Crane\'s crew keeps me at the container gate until the ledger copies surface. Get me out!',9);
  state.respect=102;state.weapon=2;state.unlockedWeapons[2]=true;state.ammo[2]=120;
  world.waypoint={x:-146,z:-241,label:'Container Gate'};
  world.waypointMesh.position.set(-146,0,-241);world.waypointMesh.visible=true;
 }
 if(name==='combat'){
  // BURN NOTICE on Glasshouse Strand: SMG firefight, crossing tracers, burning wreck with
  // a smoke column, NOS flames on the getaway car, ocean vista, two-star wanted level
  place(288,140,-Math.PI/2);cam.pitch=.14;cam.dist=10.5;cam.yaw=Math.PI/2-.55;cam.aimY=3;
  state.weapon=2;state.unlockedWeapons[2]=true;state.ammo[2]=96;
  state.photoNoDamage=true;state.photoFreeze=true;world.photoFx=true;
  const gang=spawnGang(268,132,3);
  for(const g of gang){g.heading=Math.atan2(p.x-g.x,p.z-g.z);g.mesh.rotation.y=g.heading;g.photoHold=99;}
  muzzleFlash(p.x-2.2,1.35,p.z);tracer(p.x-2.2,1.35,p.z,269,1.3,133);
  muzzleFlash(269,1.35,133);tracer(269,1.35,133,p.x+1,1.2,p.z+1);
  muzzleFlash(266,1.35,128);tracer(266,1.35,128,p.x+2,1.1,p.z-2);
  const burning=put('sedan',272,124,1.2);burning.dead=true;
  burning.mesh.traverse(o=>{if(o.isMesh&&o.material){o.material=o.material.clone();o.material.color.setHex(0x1c1c1e);}});
  explosion(272,0,124);
  // getaway Solara rolling west on the strand road ahead-left, NOS flames toward camera
  const getaway=put('sports',280,146.5,-Math.PI/2,null,26);nosOn(getaway);
  getaway.mesh.traverse(o=>{if(o.isMesh&&o.material&&o.material.isMeshStandardMaterial&&o.material.metalness===.2){o.material=o.material.clone();o.material.color.setHex(0x2ea8a0);}});
  state.heat=42;state.wanted=2;state.lastCrimeT=state.time;state.gunfireT=.5;
  photoMission(3);setPhotoObjective('BURN NOTICE','Hold the beach road — 3 hostiles left');
  say('LENA VALE','Crane\'s crew is on the strand. Hold them off until the tide turns!',9);
  state.foot.health=76;state.foot.armor=30;state.respect=58;
  world.waypoint={x:268,z:132,label:'Crane crew'};
 }
 // snap the camera to the staged framing on the first rendered frame
 cam.snap=true;
 state.photo=name;state.photoT=0;
}