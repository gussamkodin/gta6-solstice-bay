// Side activities: circuit street race, taxi fares, and timed rampage — with cash rewards.
import {world} from './world.js';
import {state,notify,say} from './state.js';
import {dist2} from './physics.js';
import {hit} from './input.js';
import {roadAt} from './config.js';
import {sfxPickup,sfxMission} from './audio.js';
import {makePickup} from './effects.js';
// checkpoints and stops sit on road centerlines/intersections, never inside a block
const RACE_POINTS=[{x:216,z:144},{x:216,z:-144},{x:-72,z:-144},{x:-72,z:144},{x:216,z:144}];
const TAXI_STOPS=[{x:36,z:144},{x:-108,z:36},{x:252,z:-36},{x:-180,z:-144},{x:108,z:-216}];
const HUBS=[
 {kind:'race',x:180,z:132,label:'STREET RACE — press F to enter ($300 per lap)'},
 {kind:'taxi',x:36,z:136,label:'BAY CAB CO. — press F to start fares'},
 {kind:'rampage',x:-108,z:-126,label:'RAMPAGE — press F ($25 per takedown, 60s)'},
];
let raceIdx=0,raceLaps=0,raceTime=0,taxiIdx=0,taxiFare=0,rampageSpawns=[];
export function initActivities(){
 world.hubMarkers=[];
 for(const h of HUBS){const p=makePickup(h.x,h.z,h.kind==='race'?0x2ec4e8:h.kind==='taxi'?0xf2c12e:0xe8452e,h.label);p.userData.hub=h;p.scale.setScalar(1.6);world.hubMarkers.push(p);}
}
export function updateActivities(dt){
 const px=state.foot.x,pz=state.foot.z;
 // hub prompts + activation
 if(!state.side){
  for(const h of HUBS){
   if(dist2(px,pz,h.x,h.z)<36){
    state.hubPrompt=h.label;
    if(hit('KeyF'))startSide(h.kind);
    break;
   }else if(state.hubPrompt===h.label)state.hubPrompt='';
  }
 }
 if(state.side==='race'){
  raceTime+=dt;
  const t=RACE_POINTS[raceIdx];
  world.waypointMesh.visible=true;world.waypointMesh.position.set(t.x,0,t.z);
  const d=Math.sqrt(dist2(px,pz,t.x,t.z));
  state.sideText='LAP '+(raceLaps+1)+'/2 — CHECKPOINT '+(raceIdx+1)+'/'+RACE_POINTS.length+' — '+raceTime.toFixed(1)+'s';
  if(d<12){sfxPickup();raceIdx++;
   if(raceIdx>=RACE_POINTS.length){raceIdx=0;raceLaps++;state.cash+=300;notify('LAP DONE +$300');
    if(raceLaps>=2){endSide('RACE WON — $600 + time bonus');state.cash+=Math.max(0,Math.round(200-raceTime));}}}
 }else if(state.side==='taxi'){
  const t=TAXI_STOPS[taxiIdx];
  world.waypointMesh.visible=true;world.waypointMesh.position.set(t.x,0,t.z);
  const d=Math.sqrt(dist2(px,pz,t.x,t.z));
  state.sideText='FAIR '+(taxiIdx+1)+'/3 — '+(state.taxiPicked?'DROP-OFF':'PICKUP')+' — '+Math.round(d)+'m';
  if(d<10&&Math.abs(state.carSpeed||0)<3){
   sfxPickup();
   if(!state.taxiPicked){state.taxiPicked=true;say('PASSENGER','Airport? No — just drive. And step on it.',4);}
   else{state.taxiPicked=false;taxiFare++;state.cash+=180;notify('FARE COMPLETE +$180');
    if(taxiFare>=3)endSide('SHIFT DONE — $540');}
  }
 }else if(state.side==='rampage'){
  state.sideTime-=dt;
  state.sideText='RAMPAGE — '+state.sideKills+' takedowns — '+Math.ceil(state.sideTime)+'s';
  if(rampageSpawns.every(g=>g.dead)&&state.sideTime>5){import('./combat.js').then(c=>{rampageSpawns=c.spawnGang(px+30,pz+30,4);});}
  if(state.sideTime<=0)endSide('RAMPAGE OVER — '+state.sideKills+' takedowns, $'+state.sideKills*25);
 }
 // hub markers bob
 for(const p of world.hubMarkers){p.rotation.y+=dt*1.6;p.position.y=1.6+Math.sin(state.time*2+p.position.x)*.2;}
}
function startSide(kind){
 state.side=kind;state.sideKills=0;state.sideTime=60;raceIdx=0;raceLaps=0;raceTime=0;taxiIdx=0;taxiFare=0;state.taxiPicked=false;
 if(kind==='race'){notify('STREET RACE — 2 LAPS');say('RACE MARSHAL','Two laps around the Mile. Checkpoints in order. Go!',5);}
 if(kind==='taxi'){notify('BAY CAB SHIFT — 3 FARES');say('DISPATCH','Three fares, clean driving. Bonus for speed.',5);}
 if(kind==='rampage'){notify('RAMPAGE — 60 SECONDS');import('./combat.js').then(c=>{rampageSpawns=c.spawnGang(state.foot.x+25,state.foot.z+25,5);});}
}
function endSide(text){
 sfxMission();notify(text);
 state.side=null;state.sideText='';world.waypointMesh.visible=false;
}
