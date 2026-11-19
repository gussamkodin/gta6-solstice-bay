// Story mission flow for the nine-job Last Light arc: waypoint travel, dialogue beats,
// ambush holds, timed police escapes, the dock-lot car heist, Marisol's crew rescue and
// escort, the convoy finale and the AIR ONE helicopter escape. Rewards cash + respect.
import {world} from './world.js';
import {state,missions,notify,say,showBanner,addRespect} from './state.js';
import {dist2} from './physics.js';
import {hit} from './input.js';
import {spawnGang} from './combat.js';
import {reportCrime} from './police.js';
import {makeWaypoint} from './effects.js';
import {makeCar} from './vehicles.js';
import {buildHuman,animateHuman} from './peds.js';
import {GARAGE} from './config.js';
import {sfxMission as fanfare} from './audio.js';
let stage='travel',dialogueIdx=0,ambush=null,timer=0,convoy=[],heistCar=null,marisol=null;
export function initMissions(){makeWaypoint();startMission(0);}
export function photoMission(i){startMission(i);}
export function setPhotoObjective(title,text){state.missionTitle=title;state.objective=text;stage='photo';}
export function startMission(i){
 state.mission=i;state.missionStep=0;
 const m=missions[i];
 state.missionTitle=m.title;state.objective=m.brief;
 stage='travel';dialogueIdx=0;ambush=null;timer=0;convoy=[];heistCar=null;
 world.waypoint={...m.goal};
 world.waypointMesh.position.set(m.goal.x,0,m.goal.z);world.waypointMesh.visible=true;
 say('LENA VALE','New job: '+m.title+'. '+m.brief+'.',6);
}
export function updateMissions(dt){
 const m=missions[state.mission];if(!m||stage==='photo')return;
 const px=state.foot.x,pz=state.foot.z;
 if(state.dialogueT>0){state.dialogueT-=dt;if(state.dialogueT<=0){state.dialogue='';}}
 if(stage==='travel'){
  const d=Math.sqrt(dist2(px,pz,m.goal.x,m.goal.z));
  state.objective=m.brief+' — '+Math.round(d)+'m';
  if(d<9){stage='dialogue';dialogueIdx=0;say(m.intro[0][0],m.intro[0][1],7);world.waypointMesh.visible=false;}
 }else if(stage==='dialogue'){
  state.objective='Listen — press F to continue';
  if(hit('KeyF')||state.dialogueT<=0){
   dialogueIdx++;
   if(dialogueIdx<m.intro.length){const [s,l]=m.intro[dialogueIdx];say(s,l,7);}
   else{state.dialogue='';beginTask(m);}
  }
 }else if(stage==='fight'){
  const alive=ambush.filter(g=>!g.dead).length;
  state.objective=(state.mission===6?'Free Marisol — ':'Hold the pier — ')+alive+' hostiles left';
  if(alive===0){
   if(state.mission===6)beginEscort(m);
   else completeMission(m);
  }
 }else if(stage==='escort'){
  const gx=36,gz=136; // Bay Cab stand on Palmetto Row
  followCrew(dt);
  if(marisol&&marisol.dead){state.objective='Marisol is down — the strand crew still holds the block';const left=ambush.filter(g=>!g.dead).length;if(left===0){say('LENA VALE','We lost her, Remy. Finish the job anyway — for her.',6);completeMission(m);}return;}
  const d=Math.sqrt(dist2(px,pz,gx,gz));
  state.objective='Walk Marisol to the cab stand — '+Math.round(d)+'m';
  if(d<10&&marisol&&dist2(marisol.x,marisol.z,gx,gz)<400)completeMission(m);
 }else if(stage==='escape'||stage==='heliEscape'){
  timer-=dt;
  const clear=stage==='heliEscape'?state.wanted<3:state.wanted===0;
  if(clear){stage='travel2';state.objective='Heat cleared — reach '+m.goal.label;world.waypointMesh.position.set(m.goal.x,0,m.goal.z);world.waypointMesh.visible=true;}
  else state.objective=(stage==='heliEscape'?'Shake AIR ONE — hide under a pier or in the garage':'Lose the police')+' ('+state.wanted+' stars) — '+Math.ceil(timer)+'s';
  if(timer<=0){stage='travel2';world.waypointMesh.position.set(m.goal.x,0,m.goal.z);world.waypointMesh.visible=true;}
 }else if(stage==='travel2'){
  const d=Math.sqrt(dist2(px,pz,m.goal.x,m.goal.z));
  state.objective='Reach '+m.goal.label+' — '+Math.round(d)+'m';
  if(d<9)completeMission(m);
 }else if(stage==='heist'){
  const alive=ambush.filter(g=>!g.dead).length;
  if(state.inCar>=0&&world.cars[state.inCar]===heistCar){
   stage='heistDrive';
   world.waypoint={x:GARAGE.x,z:GARAGE.z,label:'Cortez Garage'};
   world.waypointMesh.position.set(GARAGE.x,0,GARAGE.z);world.waypointMesh.visible=true;
   say('LENA VALE','Beautiful. Bring her home to Palmetto Row — and mind the paint.',6);
  }else state.objective='Steal the marked Solara GT'+(alive?' — '+alive+' guards left':'');
 }else if(stage==='heistDrive'){
  const d=Math.sqrt(dist2(px,pz,GARAGE.x,GARAGE.z));
  state.objective='Deliver the Solara to Cortez Garage — '+Math.round(d)+'m';
  if(d<14&&state.inCar>=0&&world.cars[state.inCar]===heistCar)completeMission(m);
 }else if(stage==='convoy'){
  const alive=convoy.filter(c=>!c.dead).length;
  state.objective='Destroy the convoy — '+alive+' vehicles left';
  if(alive===0){const gangAlive=ambush.filter(g=>!g.dead).length;if(gangAlive===0)completeMission(m);else state.objective='Finish Crane\'s crew — '+gangAlive+' left';}
 }
}
function beginTask(m){
 const i=state.mission;
 if(i===3){stage='fight';ambush=spawnGang(m.goal.x,m.goal.z,6);notify('AMBUSH — HOLD THE PIER');reportCrime('shoot',m.goal.x,m.goal.z);}
 else if(i===4){stage='escape';timer=75;state.heat=Math.max(state.heat,60);state.wanted=3;state.lastCrimeT=state.time;notify('THE COUNTY IS ON YOU');}
 else if(i===5){ // CHOP SHOP: guarded Solara in the dock lot
  stage='heist';
  heistCar=makeCar('sports',m.goal.x,m.goal.z,Math.PI/2);
  heistCar.mesh.position.set(heistCar.x,0,heistCar.z);heistCar.mesh.rotation.y=heistCar.heading+Math.PI;
  world.scene.add(heistCar.mesh);world.cars.push(heistCar);
  ambush=spawnGang(m.goal.x+6,m.goal.z+6,4);
  world.waypointMesh.position.set(m.goal.x,0,m.goal.z);world.waypointMesh.visible=true;
  notify('THE SOLARA IS GUARDED — TAKE IT');
 }
 else if(i===6){ // UNDERTOW: Marisol held by the strand crew
  stage='fight';ambush=spawnGang(m.goal.x,m.goal.z,5);
  const mesh=buildHuman({shirt:0xf28ab0,pants:0x33518a,skin:0xb07848,satchel:true});
  mesh.position.set(m.goal.x+4,0,m.goal.z+4);world.scene.add(mesh);
  marisol={mesh,x:m.goal.x+4,z:m.goal.z+4,heading:0,speed:0,kind:'crew',dead:false,health:80,panic:0};
  world.peds.push(marisol);
  say('MARISOL','Remy! They keep me here until the copies surface. Get me out!',6);
  notify('CREW IN DANGER — FREE MARISOL');reportCrime('shoot',m.goal.x,m.goal.z);
 }
 else if(i===7){stage='convoy';spawnConvoy(m.goal.x,m.goal.z);ambush=spawnGang(m.goal.x+8,m.goal.z+8,5);notify('CONVOY INBOUND');}
 else if(i===8){ // FIRST LIGHT: AIR ONE finale escape
  stage='heliEscape';timer=100;
  state.heat=Math.max(state.heat,80);state.wanted=4;state.lastCrimeT=state.time;
  notify('AIR ONE SCRAMBLED — THE WHOLE COUNTY WANTS YOU');
 }
 else{ // simple pickups: brief reward beat then next mission
  fanfare();state.cash+=Math.round(m.reward*.3);notify('EVIDENCE SECURED +$'+Math.round(m.reward*.3));
  completeMission(m);
 }
}
function beginEscort(m){
 stage='escort';
 say('MARISOL','I can walk. Stay close — I know who signs Crane\'s checks.',6);
 world.waypoint={x:36,z:136,label:'Bay Cab Stand'};
 world.waypointMesh.position.set(36,0,136);world.waypointMesh.visible=true;
 notify('MARISOL IS FREE — ESCORT HER');
}
function followCrew(dt){
 if(!marisol||marisol.dead)return;
 const px=state.foot.x,pz=state.foot.z;
 const dx=px-marisol.x,dz=pz-marisol.z,d=Math.hypot(dx,dz);
 let speed=0;
 if(d>3.2){speed=d>10?6.4:3.4;marisol.heading=Math.atan2(dx,dz);
  marisol.x+=Math.sin(marisol.heading)*speed*dt;marisol.z+=Math.cos(marisol.heading)*speed*dt;}
 marisol.mesh.position.set(marisol.x,0,marisol.z);marisol.mesh.rotation.y=marisol.heading;
 animateHuman(marisol.mesh,speed,dt);
}
function spawnConvoy(x,z){
 convoy=[];
 for(let k=0;k<3;k++){
  const car=makeCar(k===1?'truck':'sedan',x+k*8-8,z+14,0);
  car.health=60;car.mesh.position.set(car.x,0,car.z);
  world.scene.add(car.mesh);world.cars.push(car);convoy.push(car);
 }
}
function completeMission(m){
 fanfare();
 state.cash+=m.reward;
 addRespect(m.respect);
 showBanner('MISSION COMPLETE — '+m.title,['+$'+m.reward.toLocaleString('en-US'),'+'+m.respect+' RESPECT']);
 if(state.mission===3){state.unlockedWeapons[2]=true;state.ammo[2]=120;notify('HORNET SMG UNLOCKED');}
 if(state.mission===4){state.unlockedWeapons[3]=true;state.ammo[3]=24;notify('TIDEBREAKER UNLOCKED');}
 if(state.mission<missions.length-1){startMission(state.mission+1);}
 else{stage='done';state.missionTitle='FIRST LIGHT';state.objective='Solstice Bay is yours. Races, fares and rampages await — press F near a marker.';world.waypointMesh.visible=false;say('LENA VALE','Sunrise over the bay. You gave the city its morning back, Remy.',10);}
}