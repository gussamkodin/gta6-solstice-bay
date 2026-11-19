// Story mission flow: waypoint stages, dialogue, ambushes, timed escapes, rewards and unlocks.
import {world} from './world.js';
import {state,missions,notify,say} from './state.js';
import {dist2} from './physics.js';
import {hit} from './input.js';
import {spawnGang} from './combat.js';
import {reportCrime} from './police.js';
import {makeWaypoint} from './effects.js';
import {sfxMission as fanfare} from './audio.js';
let stage='travel',dialogueIdx=0,ambush=null,timer=0,convoy=[];
export function initMissions(){makeWaypoint();startMission(0);}
export function photoMission(i){startMission(i);}
export function setPhotoObjective(title,text){state.missionTitle=title;state.objective=text;stage='photo';}
export function startMission(i){
 state.mission=i;state.missionStep=0;
 const m=missions[i];
 state.missionTitle=m.title;state.objective=m.brief;
 stage='travel';dialogueIdx=0;ambush=null;timer=0;
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
  state.objective='Hold the pier — '+alive+' hostiles left';
  if(alive===0)completeMission(m);
 }else if(stage==='escape'){
  timer-=dt;
  if(state.wanted===0){stage='travel2';state.objective='Heat cleared — reach '+m.goal.label;world.waypointMesh.position.set(m.goal.x,0,m.goal.z);world.waypointMesh.visible=true;}
  else state.objective='Lose the police ('+state.wanted+' stars) — '+Math.ceil(timer)+'s';
  if(timer<=0){state.objective='Reach the overlook — cops still active';stage='travel2';world.waypointMesh.position.set(m.goal.x,0,m.goal.z);world.waypointMesh.visible=true;}
 }else if(stage==='travel2'){
  const d=Math.sqrt(dist2(px,pz,m.goal.x,m.goal.z));
  state.objective='Reach '+m.goal.label+' — '+Math.round(d)+'m';
  if(d<9)completeMission(m);
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
 else if(i===5){stage='convoy';spawnConvoy(m.goal.x,m.goal.z);ambush=spawnGang(m.goal.x+8,m.goal.z+8,5);notify('CONVOY INBOUND');}
 else{ // simple pickups: brief reward beat then next mission
  fanfare();state.cash+=Math.round(m.reward*.3);notify('EVIDENCE SECURED +$'+Math.round(m.reward*.3));
  completeMission(m);
 }
}
function spawnConvoy(x,z){
 convoy=[];
 import('./vehicles.js').then(v=>{
  for(let k=0;k<3;k++){
   const car=v.makeCar(k===1?'truck':'sedan',x+k*8-8,z+14,0);
   car.health=60;car.mesh.position.set(car.x,0,car.z);
   world.scene.add(car.mesh);world.cars.push(car);convoy.push(car);
  }
 });
}
function completeMission(m){
 fanfare();
 state.cash+=m.reward;
 notify('MISSION COMPLETE — '+m.title+' +$'+m.reward);
 if(state.mission===3){state.unlockedWeapons[2]=true;state.ammo[2]=120;notify('HORNET SMG UNLOCKED');}
 if(state.mission===4){state.unlockedWeapons[3]=true;state.ammo[3]=24;notify('TIDEBREAKER UNLOCKED');}
 if(state.mission<missions.length-1){startMission(state.mission+1);}
 else{stage='done';state.missionTitle='CITY AT PEACE';state.objective='Solstice Bay is yours. Races, fares and rampages await — press F near a marker.';world.waypointMesh.visible=false;say('LENA VALE','Sunrise over the bay. You gave the city its morning back, Remy.',10);}
}
