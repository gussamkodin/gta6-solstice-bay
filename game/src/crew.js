// Named crew companions: Marisol Reyes (the ledger copyist) and Dex Okafor (the wrench).
// They join after their story jobs, follow Remy through later missions with floating name
// tags, cover him with return fire in fights, and bark over their own HUD chip.
import {THREE} from './three.js';
import {world} from './world.js';
import {state,bark,notify} from './state.js';
import {buildHuman,animateHuman} from './peds.js';
import {collideCircle,dist2} from './physics.js';
import {muzzleFlash,tracer} from './effects.js';
// Combat owns the hit handler; call it lazily to avoid a static crew/combat cycle.
import {rng} from './rng.js';
const ROSTER=[
 {id:'marisol',name:'MARISOL',tag:'#ff8ad0',opts:{shirt:0xf28ab0,pants:0x33518a,skin:0xb07848,satchel:true},
  join:'MARISOL JOINED THE CREW — she knows who signs Crane\'s checks',
  barks:['I have the copies. Every page.','Keep moving — I\'m right behind you.','Crane\'s signature is on all of it.']},
 {id:'dex',name:'DEX',tag:'#3fe8e0',opts:{shirt:0x2e8fc4,pants:0x4a4440,skin:0x6a4426,cap:0xe8452e,gun:true},
  join:'DEX JOINED THE CREW — best wrench on Palmetto Row',
  barks:['That Solara purrs now. Treat her right.','I\'ll watch your six, Remy.','Nitro lines are clean. Send it.']},
];
export function initCrew(){
 world.crew=[];
 for(const spec of ROSTER){
  const mesh=buildHuman(spec.opts);
  mesh.visible=false;
  mesh.add(nameTag(spec.name,spec.tag));
  world.scene.add(mesh);
  const member={...spec,mesh,x:0,z:0,heading:0,speed:0,kind:'crew',dead:false,health:90,panic:0,joined:false,fireT:1,barkT:rng.range(10,20),photoHold:0};
  world.peds.push(member);world.crew.push(member);
 }
}
function nameTag(text,color){
 const cv=document.createElement('canvas');cv.width=144;cv.height=32;const g=cv.getContext('2d');
 g.fillStyle='rgba(10,18,28,.82)';g.fillRect(6,5,132,22);
 g.strokeStyle=color;g.lineWidth=1.8;g.strokeRect(6,5,132,22);
 g.font='bold 13px Arial';g.textAlign='center';g.textBaseline='middle';g.fillStyle=color;g.fillText('▾ '+text,72,16);
 const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
 const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthTest:false,transparent:true,opacity:.9}));
 sprite.userData.crewLabel=true;
 sprite.scale.set(.68,.15,1);sprite.position.y=1.96;
 return sprite;
}
export function joinCrew(id){
 const member=world.crew.find(c=>c.id===id);
 if(!member||member.joined)return;
 member.joined=true;member.mesh.visible=true;
 member.x=state.foot.x+2.2;member.z=state.foot.z+1.4;
 member.mesh.position.set(member.x,0,member.z);
 notify(member.join);bark(member.name,member.barks[0],5);
}
export function crewMember(id){return world.crew.find(c=>c.id===id);}
// photo staging: place a joined (or forced-visible) member at an exact spot, mid-stride
export function crewAt(id,x,z,heading){
 const member=crewMember(id);if(!member)return null;
 member.joined=true;member.mesh.visible=true;member.photoHold=99;
 member.x=x;member.z=z;member.heading=heading;
 member.mesh.position.set(x,0,z);member.mesh.rotation.y=heading;
 member.mesh.userData.phase=1.3;animateHuman(member.mesh,2.4,0);
 return member;
}
export function updateCrew(dt){
 const px=state.foot.x,pz=state.foot.z;
 const fighting=world.peds.some(g=>g.kind==='gang'&&!g.dead&&dist2(g.x,g.z,px,pz)<2500);
 for(const member of world.crew){
  if(!member.joined||member.dead)continue;
  if(member.photoHold>0){member.photoHold-=dt;continue;}
  const dx=px-member.x,dz=pz-member.z,d=Math.hypot(dx,dz);
  let speed=0;
  if(d>3.4){ // run to catch up, walk when close — never clip into Remy
   speed=d>12?7.2:3.6;member.heading=Math.atan2(dx,dz);
   const nx=member.x+Math.sin(member.heading)*speed*dt,nz=member.z+Math.cos(member.heading)*speed*dt;
   const s=collideCircle(nx,nz,.45);member.x=s.x;member.z=s.z;
  }else if(fighting){member.heading=Math.atan2(dx,dz);}
  member.mesh.position.set(member.x,0,member.z);member.mesh.rotation.y=member.heading;
  animateHuman(member.mesh,speed,dt,fighting&&member.opts.gun);
  // covering fire: Dex (and Marisol once free) pot the nearest hostile in range
  member.fireT-=dt;
  if(fighting&&member.fireT<=0){
   let best=null,bestD=900;
   for(const g of world.peds){if(g.kind!=='gang'||g.dead)continue;const dd=dist2(g.x,g.z,member.x,member.z);if(dd<bestD){bestD=dd;best=g;}}
   if(best){
    member.fireT=rng.range(1.6,2.6);
    member.heading=Math.atan2(best.x-member.x,best.z-member.z);member.mesh.rotation.y=member.heading;
    muzzleFlash(member.x+Math.sin(member.heading)*.5,1.35,member.z+Math.cos(member.heading)*.5);
    tracer(member.x,1.35,member.z,best.x,1.3,best.z);
    import('./combat.js').then(({crewShot})=>crewShot(best,10));
   }
  }
  // occasional radio-style bark while travelling together
  member.barkT-=dt;
  if(member.barkT<=0&&!fighting){member.barkT=rng.range(24,40);bark(member.name,rng.pick(member.barks),4);}
 }
}
