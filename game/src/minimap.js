// Live rotating minimap: static city layer baked once, dynamic blips per frame —
// traffic, police, gangs, AIR ONE (pulsing ring), the garage and the objective waypoint.
import {world} from './world.js';
import {state} from './state.js';
import {roadAt,BLOCKS,ROAD,HALF,PITCH,BLOCK} from './config.js';
const SIZE=240,RANGE=110;
let staticLayer=null,ctx=null;
export function initMinimap(){
 const canvas=document.querySelector('#map');ctx=canvas.getContext('2d');
 staticLayer=document.createElement('canvas');staticLayer.width=1024;staticLayer.height=1024;
 const g=staticLayer.getContext('2d');
 const S=1024/(HALF*2+60);
 const px=x=>(x+HALF+30)*S,pz=z=>(z+HALF+30)*S;
 g.fillStyle='#1d5f74';g.fillRect(0,0,1024,1024); // ocean base
 g.fillStyle='#c9b98a';g.fillRect(px(-HALF),pz(-HALF),(HALF*2+30)*S,(HALF*2)*S); // land+sand
 g.fillStyle='#8aa06a';g.fillRect(px(-HALF),pz(-HALF),(HALF*2-20)*S,(HALF*2)*S);
 // districts tint
 g.fillStyle='#b8a8c0';g.fillRect(px(36),pz(-116),3*PITCH*S,4*PITCH*S); // downtown
 g.fillStyle='#9aa4a8';g.fillRect(px(-HALF),pz(-HALF),4*PITCH*S,PITCH*S); // port
 g.fillStyle='#e0cf9a';g.fillRect(px(252),pz(-HALF),60*S,HALF*2*S); // beach
 g.fillStyle='#7a9a68';g.fillRect(px(-HALF),pz(124),3*PITCH*S,172*S); // heights/suburb
 // roads
 g.fillStyle='#3c4048';
 for(let i=0;i<=BLOCKS;i++){const c=roadAt(i);g.fillRect(px(c-ROAD/2),pz(-HALF),ROAD*S,HALF*2*S);g.fillRect(px(-HALF),pz(c-ROAD/2),HALF*2*S,ROAD*S);}
 // block fills
 g.fillStyle='#7d8a92';
 for(let bx=0;bx<BLOCKS;bx++)for(let bz=0;bz<BLOCKS;bz++){
  const cx=-HALF+ROAD+bx*PITCH,cz=-HALF+ROAD+bz*PITCH;
  g.fillRect(px(cx+4),pz(cz+4),(BLOCK-8)*S,(BLOCK-8)*S);
 }
}
export function drawMinimap(){
 if(!ctx)initMinimap();
 const p=state.foot;
 ctx.clearRect(0,0,SIZE,SIZE);
 ctx.save();
 ctx.beginPath();ctx.arc(SIZE/2,SIZE/2,SIZE/2,0,Math.PI*2);ctx.clip();
 const heading=state.inCar>=0?state.carHeading:p.heading;
 ctx.translate(SIZE/2,SIZE/2);ctx.rotate(heading);
 const scale=SIZE/(RANGE*2);
 const S=1024/(HALF*2+60);
 // draw the static layer section around player
 const src=((p.x+HALF+30)-RANGE)*S,srcZ=((p.z+HALF+30)-RANGE)*S,srcW=RANGE*2*S;
 ctx.drawImage(staticLayer,src,srcZ,srcW,srcW,-SIZE/2,-SIZE/2,SIZE,SIZE);
 const blip=(x,z,color,r=4)=>{
  const dx=(x-p.x)*scale,dz=(z-p.z)*scale;
  if(dx*dx+dz*dz>(SIZE/2)*(SIZE/2))return;
  ctx.fillStyle=color;ctx.beginPath();ctx.arc(dx,dz,r,0,Math.PI*2);ctx.fill();
 };
 for(const car of world.cars){
  if(car.dead)continue;
  if(car.ai&&car.ai.kind==='police')blip(car.x,car.z,'#4a90ff',4.5);
  else if(car.ai)blip(car.x,car.z,'#c8c8c8',2.5);
  else blip(car.x,car.z,'#88e088',2.5);
 }
 for(const ped of world.peds){if(ped.dead)continue;if(ped.kind==='cop')blip(ped.x,ped.z,'#4a90ff',3);if(ped.kind==='gang')blip(ped.x,ped.z,'#ff5040',3.5);if(ped.kind==='crew')blip(ped.x,ped.z,'#ff8ad0',3.5);}
 // garage: small house square
 if(world.garage){
  const dx=(world.garage.x-p.x)*scale,dz=(world.garage.z-p.z)*scale;
  if(dx*dx+dz*dz<(SIZE/2)*(SIZE/2)){ctx.fillStyle='#3fe8e0';ctx.fillRect(dx-4,dz-4,8,8);ctx.fillStyle='#10202a';ctx.fillRect(dx-2,dz,4,4);}
 }
 // AIR ONE: blue diamond with a pulsing search ring
 if(world.heli&&!world.heli.leaving){
  const hx=world.heli.mesh.position.x,hz=world.heli.mesh.position.z;
  const dx=(hx-p.x)*scale,dz=(hz-p.z)*scale;
  if(dx*dx+dz*dz<(SIZE/2)*(SIZE/2)){
   ctx.save();ctx.translate(dx,dz);ctx.rotate(Math.PI/4);
   ctx.fillStyle='#7ab8ff';ctx.fillRect(-4,-4,8,8);ctx.restore();
   ctx.strokeStyle='rgba(122,184,255,'+(0.5+0.4*Math.sin(state.time*5))+')';ctx.lineWidth=1.5;
   ctx.beginPath();ctx.arc(dx,dz,7+Math.sin(state.time*5)*2,0,Math.PI*2);ctx.stroke();
  }
 }
 if(world.waypoint){
  const dx=(world.waypoint.x-p.x)*scale,dz=(world.waypoint.z-p.z)*scale;
  const d=Math.hypot(dx,dz),cl=Math.min(d,SIZE/2-10),fx=d?dx/d:0,fz=d?dz/d:0;
  ctx.fillStyle='#ffd24a';ctx.beginPath();ctx.arc(fx*cl,fz*cl,5,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
 // player arrow (points up = facing)
 ctx.save();ctx.translate(SIZE/2,SIZE/2);
 ctx.fillStyle='#ffffff';ctx.strokeStyle='#10202a';ctx.lineWidth=1.5;
 ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(5.5,6);ctx.lineTo(0,3);ctx.lineTo(-5.5,6);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.restore();
 // north indicator
 ctx.fillStyle='#ffd9a0';ctx.font='bold 11px Arial';ctx.textAlign='center';
 ctx.save();ctx.translate(SIZE/2,SIZE/2);ctx.rotate(heading);ctx.fillText('N',0,-SIZE/2+14);ctx.restore();
}
