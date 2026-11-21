// Deterministic photo/demo mode (?shot=street|combat|map|title&seed=N):
// stages real game systems into dense, readable scenes for the entry's 4 screenshots.
import {world} from './world.js';
import {state,say} from './state.js';
import {cam} from './camera.js';
import {spawnGang} from './combat.js';
import {photoHeli} from './helicopter.js';
import {muzzleFlash,tracer,explosion,skidMark,impactSparks} from './effects.js';
import {photoMission,setPhotoObjective} from './missions.js';
import {makeCar} from './vehicles.js';
import {animateHuman,ragdoll} from './peds.js';
import {crewAt} from './crew.js';
import {STATIONS} from './radio.js';
import {makeRng} from './rng.js';
import {addBox} from './city.js';
import {openMapMenu} from './mapmenu.js';
import {setTimeOfDay} from './sky.js';

export function stagePhoto(name){
 const THREE=window.THREE;
 const rng=makeRng(state.seed);
 const p=world.player;
 cam.aimDX=0;cam.aimDZ=0;cam.fovWish=0;cam.baseY=null;cam.aimY=0;cam.fixedPos=null;cam.fixedLook=null;
 openMapMenu(false);
 const clearCarsNear=(cx,cz,rx,rz)=>{for(const c of world.cars){if(Math.abs(c.x-cx)<rx&&Math.abs(c.z-cz)<rz){c.x-=144;c.mesh.position.x=c.x;}}};
 const place=(x,z,heading)=>{p.x=x;p.z=z;p.heading=heading;state.foot.x=x;state.foot.z=z;p.mesh.position.set(x,0,z);p.mesh.rotation.y=heading;cam.yaw=-heading;};
 const put=(type,x,z,heading,ai=null,speed=0)=>{const car=makeCar(type,x,z,heading);car.speed=speed;if(ai)car.ai=ai;car.mesh.position.set(x,0,z);car.mesh.rotation.y=heading+Math.PI;world.scene.add(car.mesh);world.cars.push(car);return car;};
 const nosOn=car=>{car.nos=true;const f=car.mesh.userData.flames;if(f){f.visible=true;f.scale.setScalar(1.15);}};
 const traffic=(type,x,z,dir,horizontal,road,speed)=>put(type,x,z,horizontal?(dir>0?Math.PI/2:-Math.PI/2):(dir>0?Math.PI:0),{kind:'traffic',dir,horizontal,road,cruise:speed,panic:0,turnCooldown:99},speed);
 const freezePedsNear=(x,z,r)=>{for(const ped of world.peds){if(ped.dead||ped.kind==='driver')continue;const dx=ped.x-x,dz=ped.z-z;if(dx*dx+dz*dz<r*r){ped.photoHold=99;ped.heading=Math.atan2(-dx,-dz)+rng.range(-.4,.4);ped.mesh.rotation.y=ped.heading;}}};
 const pedAt=(x,z,heading,pose=1,aiming=false)=>{
  const src=world.peds.find(q=>q.kind==='ped'&&!q.dead&&!q.photoHold);
  if(!src)return null;
  src.x=x;src.z=z;src.heading=heading;src.photoHold=99;
  src.mesh.position.set(x,0,z);src.mesh.rotation.y=heading;src.mesh.userData.phase=pose;
  animateHuman(src.mesh,3,0,aiming);
  return src;
 };

 if(name==='street'){
  // Shot 1 (COVER): Sunset Coastal Boulevard 4-Star Pursuit on Ocean Drive (x=324, 18:40).
  // Camera ahead-left looking back at the 3/4 FRONT & SIDE of the glossy coral-red Solara GT,
  // 3 Police Interceptors with blazing red/blue lightbars & road strobe pools chasing behind, AIR ONE overhead,
  // pastel Art Deco hotels with glowing storefronts, dense window grids & rooftop signs on the left,
  // sandy beach + parasols + turquoise ocean on the right.
  setTimeOfDay('sunset');
  state.clock='18:40';
  clearCarsNear(324,62,18,48);
  place(324.4,48,0);
  cam.fixedPos=new THREE.Vector3(320.2,3.1,37.5);
  cam.fixedLook=new THREE.Vector3(325.5,2.2,54);
  cam.fovWish=60;
  const solara=put('sports',324.4,48,.22,null,31.8);
  p.mesh.visible=false;
  solara.mesh.traverse(o=>{if(o.isMesh&&o.material&&o.material.isMeshStandardMaterial&&o.material.metalness===.2){o.material=o.material.clone();o.material.color.setHex(0xe8452e);}});
  solara.health=86;
  state.inCar=world.cars.length-1;state.carSpeed=31.8;state.carHeading=.22;
  state.photoFreeze=true;state.nosActive=true;state.nitro=78;
  const cop1=put('police',322.2,58.5,.08,{kind:'police',officers:0,patrolX:324,patrolZ:58,photoHold:99},30);
  const cop2=put('police',326.8,64.2,-.06,{kind:'police',officers:0,patrolX:324,patrolZ:64,photoHold:99},29);
  const cop3=put('police',323.6,73.5,.04,{kind:'police',officers:0,patrolX:324,patrolZ:73,photoHold:99},28);
  for(const c of [cop1,cop2,cop3]){
   const lb=c.mesh.userData.lightbar;if(lb){lb.red.emissiveIntensity=3.5;lb.blue.emissiveIntensity=3.5;}
  }
  for(let k=0;k<6;k++)skidMark(324.2+rng.range(-.7,.7),49.5+k*1.8,.15);
  traffic('taxi',327.6,82,1,false,8,18);
  traffic('sedan',321.2,92,-1,false,8,15);
  traffic('sports',327.4,106,1,false,8,20);
  freezePedsNear(324,55,90);
  pedAt(315.2,56.0,0,1.2);
  pedAt(315.2,64.0,Math.PI,2.4);
  pedAt(333.4,44.2,0,1.9);
  pedAt(333.8,52.5,Math.PI,2.8);
  pedAt(341.0,49.0,-Math.PI/2,1.1);
  crewAt('marisol',335.2,46.2,-.35);
  crewAt('dex',336.5,43.0,-.45);
  photoHeli(326,68);
  if(world.heli){
   world.heli.mesh.position.set(326,13.5,68);
   world.heli.mesh.scale.setScalar(1.45);
   world.heli.mesh.rotation.y=Math.PI+.18;
   const h=world.heli;
   const from=new THREE.Vector3(326,12.2,68),to=new THREE.Vector3(324.4,1.0,48);
   const dir=to.clone().sub(from),len=dir.length();
   h.searchlight.position.copy(from);
   h.searchlight.scale.set(1,len/30,1);
   h.searchlight.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),dir.normalize());
   h.searchlight.material.opacity=.045;
   h.spotPool.position.set(324.4,.095,48);
   h.spotPool.material.opacity=.55;
  }
  state.wanted=4;state.heat=84;state.lastCrimeT=state.time;state.photoNoDamage=true;
  photoMission(0);setPhotoObjective('ACT III · LOW TIDE','Outrun the Harbor Sweep along Coastal Blvd to Breakwater Pier — 240m');
  state.cash=24850;state.foot.health=88;state.foot.armor=65;
  state.respect=4250;state.weapon=2;
  state.districtRep={...state.districtRep,'Glasshouse Strand':74};
  state.crewSpeaker='';state.crewBark='';state.crewBarkT=0;
  state.radioOn=true;state.radioStation=0;state.radioTrack='Island Synthwave';
  say('LENA VALE','AIR ONE has visual on the coast road! Cut past Hotel Solstice and hit Breakwater Pier!',9);
  world.waypoint={x:385,z:-85,label:'Breakwater Pier'};
  world.waypointMesh.position.set(385,0,-85);world.waypointMesh.visible=true;
 }

 if(name==='combat'){
  // Shot 2: True Midnight Strand Avenue Crew Firefight (22:15) along x=288 flanked on BOTH left and right
  // by tall multi-story buildings with blazing ground-floor glass storefronts, glowing amber fascia lines,
  // and dense multi-story lit window grids, boulevard street lamps casting golden road pools, Police Interceptor
  // with red/blue strobe pool & headlight fan, market canopy stalls, burning syndicate car, and SMG tracers.
  setTimeOfDay('night');
  state.clock='22:15';
  clearCarsNear(288,108,18,45);
  place(286.0,92.0,0);
  p.mesh.visible=true;
  p.mesh.position.set(285.2,0,92.4);
  p.mesh.rotation.y=-.15;
  animateHuman(p.mesh,0,0,true);
  cam.fixedPos=new THREE.Vector3(283.8,2.35,89.0);
  cam.fixedLook=new THREE.Vector3(288.2,2.0,108.0);
  cam.fovWish=58;
  state.inCar=-1;state.weapon=2;state.unlockedWeapons=[true,true,true,true];state.ammo=[Infinity,60,90,18];
  state.photoNoDamage=true;state.photoFreeze=true;world.photoFx=true;
  // Marisol right beside Remy aiming her SMG down the midnight avenue
  crewAt('marisol',286.6,92.8,-.18);
  const mar=world.peds.find(q=>q.kind==='crew'&&q.name==='MARISOL');
  if(mar)animateHuman(mar.mesh,0,0,true);
  crewAt('dex',291.2,96.5,-.35);
  // night-market canopy stalls flanking the avenue sidewalks
  const stallMatA=new THREE.MeshStandardMaterial({color:0xff5e78,emissive:0x4a1220,emissiveIntensity:.45,roughness:.55});
  const stallMatB=new THREE.MeshStandardMaterial({color:0x3fe8e0,emissive:0x104a48,emissiveIntensity:.45,roughness:.55});
  const postMat=new THREE.MeshStandardMaterial({color:0x34424a,roughness:.7});
  for(const [sx,sz,sm] of [[281.4,100.5,stallMatA],[294.2,101.8,stallMatB]]){
   addBox(world.scene,sx,2.5,sz,3.6,.22,3.2,sm);
   addBox(world.scene,sx,.5,sz,3.0,.8,1.4,postMat);
   for(const dx of [-1.5,1.5])for(const dz of [-1.3,1.3])addBox(world.scene,sx+dx,0,sz+dz,.12,2.5,.12,postMat);
  }
  // 5 gang gunmen + 1 downed hostile in center foreground
  const gang=spawnGang(288,105,6);
  const gSpots=[[287.4,97.4],[285.8,102.2],[288.6,103.8],[291.2,102.5],[286.8,107.8],[290.0,108.6]];
  gang.forEach((g,i)=>{
   g.x=gSpots[i][0];g.z=gSpots[i][1];
   g.mesh.position.set(g.x,0,g.z);
   g.heading=Math.atan2(285.5-g.x,92.4-g.z);
   g.mesh.rotation.y=g.heading;
   g.photoHold=99;
   if(i===0){ragdoll(g.mesh);g.mesh.position.set(g.x,.22,g.z);}
   else animateHuman(g.mesh,0,0,true);
  });
  // fleeing pedestrians on the avenue sidewalks
  pedAt(281.8,105.0,-Math.PI/2,1.5);
  pedAt(294.6,106.2,Math.PI/2,2.3);
  // intense white-gold tracer beams & muzzle flashes
  muzzleFlash(285.4,1.38,93.1);tracer(285.4,1.38,93.1,288.6,1.32,103.8);
  muzzleFlash(286.7,1.36,93.5);tracer(286.7,1.36,93.5,285.8,1.3,102.2);
  muzzleFlash(288.6,1.35,103.8);tracer(288.6,1.35,103.8,284.8,1.25,93.0);
  muzzleFlash(291.2,1.35,102.5);tracer(291.2,1.35,102.5,286.2,1.4,93.2);
  // burning syndicate car + explosion glow & sparks in midground
  const burning=put('sedan',289.8,106.5,1.15,null,0);burning.dead=true;
  burning.mesh.traverse(o=>{if(o.isMesh&&o.material){o.material=o.material.clone();o.material.color.setHex(0x23252a);}});
  explosion(289.8,0,106.5);
  impactSparks(288.5,1.4,103.8);impactSparks(289.8,1.6,106.5);
  // cyan getaway Solara GT parked angled at the right curb with NOS & forward headlight fan
  const getaway=put('sports',293.4,97.2,-.42,null,0);nosOn(getaway);
  getaway.mesh.traverse(o=>{if(o.isMesh&&o.material&&o.material.isMeshStandardMaterial&&o.material.metalness===.2){o.material=o.material.clone();o.material.color.setHex(0x2ec4e8);}});
  // Police Interceptor responder angled on the left lane with blazing red/blue strobe pool & headlight beam
  const responder=put('police',282.6,105.2,.24,null,0);
  if(responder.mesh.userData.lightbar){
   responder.mesh.userData.lightbar.red.emissiveIntensity=3.8;
   responder.mesh.userData.lightbar.blue.emissiveIntensity=3.8;
  }
  // background avenue traffic with glowing headlight fans down the street corridor
  put('taxi',285.4,122.0,0,null,16);
  put('sports',291.2,132.0,Math.PI,null,18);
  state.heat=52;state.wanted=2;state.lastCrimeT=state.time;state.gunfireT=.5;
  photoMission(3);setPhotoObjective('MISSION 4 · BURN NOTICE','CLEAR THE STRAND AVENUE — Take out Crane\'s Enforcers 2/6');
  state.speaker='MARISOL';state.dialogue='Enforcers pinned between the storefronts — push through and grab the ledger case, Remy!';state.dialogueT=999;
  state.crewSpeaker='';state.crewBark='';state.crewBarkT=0;
  state.cash=24850;state.foot.health=88;state.foot.armor=65;state.respect=4250;
  state.districtRep={...state.districtRep,'Glasshouse Strand':74};
  world.waypoint={x:288,z:110,label:'Crane Enforcers'};
 }

 if(name==='map'){
  // Shot 3: Full-Screen Interactive City Map, 72.5% Progression, Activities Checklist & Save Slots Menu.
  setTimeOfDay('sunset');
  state.clock='18:40';
  place(180,72,0);
  state.cash=24850;state.respect=4250;state.wanted=0;
  openMapMenu(true);
 }

 if(name==='title'){
  // Shot 4: Aerial 3D Beach & Hotel Skyline Start Screen at Coastal Twilight (19:50) + 3 Save Slots.
  setTimeOfDay('twilight');
  state.clock='19:50';
  clearCarsNear(324,56,22,44);
  place(324,55,0);
  cam.fixedPos=new THREE.Vector3(366,18.5,128);
  cam.fixedLook=new THREE.Vector3(312,12,16);
  cam.fovWish=60;
  state.photoFreeze=true;
  // populate Ocean Drive (x=324) and Strand Ave (x=288) with vivid coastal traffic & headlight fans below the camera
  put('sports',324.4,68,0,null,26);
  put('taxi',327.6,46,Math.PI,null,22);
  put('sedan',321.2,28,0,null,20);
  put('sports',327.4,84,Math.PI,null,28);
  put('police',288.4,52,0,null,24);
  put('sedan',285.2,34,Math.PI,null,20);
 }

 cam.snap=true;
 state.photo=name;state.photoT=0;
}
