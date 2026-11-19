// World pickups: ammo, armor, cash and health placed around districts; respawn after a delay.
import {world} from './world.js';
import {state,notify} from './state.js';
import {makePickup} from './effects.js';
import {dist2} from './physics.js';
import {sfxPickup} from './audio.js';
const SPOTS=[
 {x:236,z:60,kind:'ammo',color:0xf2c12e},{x:120,z:-60,kind:'armor',color:0x69c3d6},
 {x:-60,z:150,kind:'cash',color:0xa9e3a2},{x:-200,z:-160,kind:'ammo',color:0xf2c12e},
 {x:60,z:220,kind:'health',color:0xef6858},{x:-140,z:60,kind:'cash',color:0xa9e3a2},
 {x:270,z:-180,kind:'armor',color:0x69c3d6},{x:108,z:-96,kind:'health',color:0xef6858},
];
export function initPickups(){
 world.pickups=[];
 for(const s of SPOTS){const m=makePickup(s.x,s.z,s.color,s.kind);m.userData.spot=s;m.userData.respawn=0;world.pickups.push(m);}
}
export function updatePickups(dt){
 const px=state.foot.x,pz=state.foot.z;
 for(const m of world.pickups){
  if(m.userData.respawn>0){m.userData.respawn-=dt;if(m.userData.respawn<=0)m.visible=true;continue;}
  m.rotation.y+=dt*2.4;m.position.y=1.1+Math.sin(state.time*3+m.position.x)*.15;
  if(dist2(px,pz,m.position.x,m.position.z)<4){
   const kind=m.userData.spot.kind;
   if(kind==='ammo'){state.ammo[1]+=24;if(state.unlockedWeapons[2])state.ammo[2]+=60;notify('+ AMMO');}
   if(kind==='armor'){state.foot.armor=Math.min(100,state.foot.armor+50);notify('+ ARMOR');}
   if(kind==='health'){state.foot.health=Math.min(100,state.foot.health+50);notify('+ HEALTH');}
   if(kind==='cash'){const amt=100+Math.floor(Math.random()*150);state.cash+=amt;notify('+ $'+amt);}
   sfxPickup();m.visible=false;m.userData.respawn=45;
  }
 }
}
