// Deterministic photo/demo mode (?shot=street|chase|mission|combat&seed=N):
// stages real game systems into dense, readable scenes for the entry's screenshots.
// Every prop here is a live game object — traffic AI, police AI, AIR ONE, effects, HUD.
import {world} from './world.js';
import {state,say,notify} from './state.js';
import {cam} from './camera.js';
import {spawnCop} from './police.js';
import {spawnGang} from './combat.js';
import {photoHeli} from './helicopter.js';
import {muzzleFlash,tracer,explosion,skidMark,impactSparks} from './effects.js';
import {photoMission,setPhotoObjective} from './missions.js';
import {makeCar} from './vehicles.js';
import {animateHuman} from './peds.js';
import {crewAt} from './crew.js';
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
  place(316.8,149.8,-Math.PI/2);cam.pitch=.11;cam.dist=8.2;cam.aimY=2.8;cam.baseY=1.8;cam.yaw=Math.PI/2-.26;cam.fovWish=62;cam.aimDX=-1.2;cam.aimDZ=-.3;
  // Solara waits ahead-left, nose angled back toward the lens for a 3/4 hero read
  const solara=put('sports',310.2,145.0,-Math.PI/2-.42,null,17);
  // Keep Remy beside the moving GT for the cover: the avatar silhouette sells the
  // on-foot half of the open world while the adjacent live car proves driveability.
  p.mesh.visible=true;p.mesh.position.set(316.8,0,149.8);p.mesh.rotation.y=-Math.PI/2+.25;
  p.mesh.scale.setScalar(1.3);
  // force the cover car red for a strong focal silhouette (clone so shared paints stay put)
  solara.mesh.traverse(o=>{if(o.isMesh&&o.material&&o.material.isMeshStandardMaterial&&o.material.metalness===.2){o.material=o.material.clone();o.material.color.setHex(0xe8452e);}});
  state.inCar=world.cars.length-1;state.carSpeed=17;state.carHeading=-Math.PI/2;
  // In the cover tableau Remy walks alongside the staged GT rather than disappearing
  // into its driver seat; the chase frame remains explicitly in-car.
  p.speed=0;
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
  crewAt('marisol',315.1,153.2,-Math.PI/2+.2);crewAt('dex',314.0,145.2,-Math.PI/2+.35);
  state.districtRep={...state.districtRep,'Marigold Mile':44};
  state.crewSpeaker='MARISOL';state.crewBark='Neon Mile is listening. Keep the ledger dry.';state.crewBarkT=999;
  state.radioOn=true;state.radioStation=0;state.radioTrack=STATIONS[0].tracks[1];
  say('LENA VALE','Crane\'s people dredged the bay at dawn. Find out what they buried — start at the pier office.',9);
  world.waypoint={x:385,z:-85,label:'Breakwater Pier'};
  world.waypointMesh.position.set(385,0,-85);world.waypointMesh.visible=true;
 }
 if(name==='chase'){
  // full-speed pursuit under AIR ONE: 4 stars, three cruisers on the tail, searchlight
  // cone, skid marks, NOS burn, radio playing, escape objective + chatter on the HUD
  place(108,72,Math.PI/2);cam.pitch=.2;cam.dist=15.5;cam.yaw=-Math.PI/2-.06;cam.aimY=5.4;cam.baseY=4;cam.fovWish=76;
  const car=put('sports',108,72,Math.PI/2,null,38);
  car.mesh.traverse(o=>{if(o.isMesh&&o.material&&o.material.isMeshStandardMaterial&&o.material.metalness===.2){o.material=o.material.clone();o.material.color.setHex(0xe8452e);}});
  nosOn(car);state.nosActive=true;state.nitro=62;
  const nf=car.mesh.userData.flames;if(nf)nf.scale.setScalar(2.1); // long twin burn trails
  state.inCar=world.cars.length-1;state.carSpeed=38;state.carHeading=Math.PI/2;p.mesh.visible=false;
  state.heat=82;state.wanted=4;state.lastCrimeT=state.time;state.photoNoDamage=true;state.photoFreeze=true;
  state.heliChatter='AIR ONE: Searchlight on the Solara. Ground units, close the net.';state.heliChatterT=999;
  const copA=put('police',103,76.4,Math.PI/2,{kind:'police',officers:0,patrolX:0,patrolZ:72,photoHold:99},36);
  const copB=put('police',100.2,68.6,Math.PI/2-.06,{kind:'police',officers:0,patrolX:0,patrolZ:72,photoHold:99},36);
  const copC=put('police',101.4,73.5,Math.PI/2+.05,{kind:'police',officers:0,patrolX:0,patrolZ:72,photoHold:99},35);
  for(const c of [copA,copB,copC]){const lb=c.mesh.userData.lightbar;if(lb){lb.red.emissiveIntensity=2.4;lb.blue.emissiveIntensity=2.4;}}
  for(let k=0;k<8;k++)skidMark(104-k*2.6,72+rng.range(-2,2),Math.PI/2+rng.range(-.1,.1));
  photoHeli(108,72);
  // AIR ONE reads big: scale the bird up and lay a bright rotor-blur disc over the blades
  if(world.heli){world.heli.mesh.scale.setScalar(1.7);world.heli.mesh.position.set(136,15,66);world.heli.mesh.rotation.y=Math.PI/2+1.1;}
  const blur=new (window.THREE.Mesh)(new window.THREE.CircleGeometry(9.8,28),new window.THREE.MeshBasicMaterial({color:0x4a5560,transparent:true,opacity:.38,depthWrite:false,side:window.THREE.DoubleSide}));blur.rotation.x=-Math.PI/2;blur.position.set(136,17,66);world.scene.add(blur);
  // re-aim the cone from the new bird position onto the player's roof
  if(world.heli){const h=world.heli;const from=new window.THREE.Vector3(136,13.3,66),to=new window.THREE.Vector3(108,1,72);const dir=to.clone().sub(from),len=dir.length();h.searchlight.position.copy(from.clone().add(to).multiplyScalar(.5));h.searchlight.scale.set(1,len/30,1);h.searchlight.quaternion.setFromUnitVectors(new window.THREE.Vector3(0,-1,0),dir.normalize());h.spotPool.position.set(108,.12,72);}
  for(const c of [copA,copB,copC])c.speed=38;
  state.weapon=1;
  photoMission(4);setPhotoObjective('THE LONG WAY','Lose the police (4 stars) — 61s');
  state.dialogue='';state.dialogueT=0;state.crewBarkT=0;
  state.heliChatter='AIR ONE: suspect vehicle heading west on Marigold. All units converge.';state.heliChatterT=999;
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
  place(-148,-213,Math.PI);cam.pitch=.12;cam.dist=11;cam.aimY=4;cam.baseY=2.8;cam.yaw=.06;cam.aimDX=0;cam.fovWish=68;
  put('truck',-156,-240,Math.PI*.1);
  put('sedan',-140.5,-236,-Math.PI*.1);
  const gang=spawnGang(-148,-227,3);
  // tight triangle at the gate: every gang member stays on the open road in view
  const spots=[[-151.5,-225.5],[-144.5,-226],[-148,-222.5]];
  gang.forEach((g,i)=>{g.x=spots[i][0];g.z=spots[i][1];g.mesh.position.set(g.x,0,g.z);g.photoHold=99;g.heading=Math.atan2(p.x-g.x,p.z-g.z);g.mesh.rotation.y=g.heading;});
  photoMission(6);setPhotoObjective('UNDERTOW','Free Marisol from Crane\'s dock crew — 29m');
  state.speaker='MARISOL';state.dialogue='Remy! Crane\'s crew keeps me at the container gate until the ledger copies surface. Get me out!';state.dialogueT=999;
  state.crewSpeaker='DEX';state.crewBark='Gate crew is three deep. I\'ll watch the flank.';state.crewBarkT=999;
  state.respect=102;state.weapon=2;state.unlockedWeapons[2]=true;state.ammo[2]=120;
  crewAt('marisol',-146,-216.5,Math.PI);crewAt('dex',-151,-216.2,Math.PI+.2);
  state.districtRep={...state.districtRep,'Copperworks Docks':54};
  state.missionBannerT=99;
  world.waypoint={x:-146,z:-241,label:'Container Gate'};
  world.waypointMesh.position.set(-146,0,-241);world.waypointMesh.visible=true;
 }
 if(name==='combat'){
  // BURN NOTICE on Glasshouse Strand: SMG firefight, crossing tracers, burning wreck with
  // a smoke column, NOS flames on the getaway car, ocean vista, two-star wanted level
  place(288,140,-Math.PI/2);cam.pitch=.16;cam.dist=7.5;cam.yaw=Math.PI/2-.55;cam.aimY=2.4;cam.baseY=1.6;cam.fovWish=62;state.dialogue='';state.dialogueT=0;
  state.weapon=2;state.unlockedWeapons[2]=true;state.ammo[2]=96;
  state.photoNoDamage=true;state.photoFreeze=true;world.photoFx=true;
  const gang=spawnGang(272,133,3);
  const gSpots=[[277,130],[281,131.5],[284,129.5]];
  gang.forEach((g,i)=>{g.x=gSpots[i][0];g.z=gSpots[i][1];g.mesh.position.set(g.x,0,g.z);g.heading=Math.atan2(p.x-g.x,p.z-g.z);g.mesh.rotation.y=g.heading;g.photoHold=99;});
  crewAt('dex',291.2,137.6,-Math.PI/2-.3);
  muzzleFlash(p.x-.7,1.35,p.z);tracer(p.x-.7,1.35,p.z,277,1.3,130);
  muzzleFlash(277,1.35,130);tracer(277,1.35,130,p.x+.5,1.2,p.z+.5);
  muzzleFlash(281,1.35,131.5);tracer(281,1.35,131.5,p.x+.8,1.1,p.z-.4);
  muzzleFlash(284,1.35,129.5);tracer(284,1.35,129.5,p.x-.2,1.4,p.z-.6);
  const burning=makeCar('sedan',279,132,1.2);burning.dead=true;burning.mesh.position.set(279,0,132);burning.mesh.rotation.y=1.2+Math.PI;world.scene.add(burning.mesh);world.cars.push(burning);
  burning.mesh.traverse(o=>{if(o.isMesh&&o.material){o.material=o.material.clone();o.material.color.setHex(0x1c1c1e);}});
  explosion(279,0,132);
  // sparks flying off the wreck add motion to the frozen frame
  impactSparks(279,1.6,132);impactSparks(277.5,1.1,131);
  // getaway Solara rolling west on the strand road ahead-left, NOS flames toward camera
  const getaway=put('sports',280,146.5,-Math.PI/2,null,26);nosOn(getaway);
  getaway.mesh.traverse(o=>{if(o.isMesh&&o.material&&o.material.isMeshStandardMaterial&&o.material.metalness===.2){o.material=o.material.clone();o.material.color.setHex(0x2ea8a0);}});
  state.heat=65;state.wanted=3;state.lastCrimeT=state.time;state.gunfireT=.5;state.crewBarkT=0;
  photoMission(3);setPhotoObjective('BURN NOTICE','Hold the beach road — 3 hostiles left');
  state.speaker='DEX';state.dialogue='Covering fire! Get to the Solara before the backup arrives.';state.dialogueT=999;
  state.crewSpeaker='DEX';state.crewBark='Two behind the wreck — I have them.';state.crewBarkT=999;
  state.missionBannerT=999;
  state.foot.health=76;state.foot.armor=30;state.respect=58;
  world.waypoint={x:268,z:132,label:'Crane crew'};
 }
 // snap the camera to the staged framing on the first rendered frame
 cam.snap=true;
 state.photo=name;state.photoT=0;
}