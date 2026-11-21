// Pooled visual effects: muzzle flashes, tracers, sparks, explosions, skid marks, pickups,
// waypoint beam and neon ground reflections for the wet-asphalt look.
import {THREE} from './three.js';
import {world} from './world.js';
const pool=[],skids=[],skidMax=180,bloodPools=[],bloodPoolMax=45;
const sparkMat=new THREE.MeshBasicMaterial({color:0xffb060,transparent:true});
const smokeMat=new THREE.MeshBasicMaterial({color:0x3a3a3a,transparent:true,opacity:.8});
const fireMat=new THREE.MeshBasicMaterial({color:0xff7020,transparent:true});
const skidMat=new THREE.MeshBasicMaterial({color:0x22242a,transparent:true,opacity:.55});
const tracerMat=new THREE.MeshBasicMaterial({color:0xffe9a8,transparent:true,opacity:.8});
const geo=new THREE.SphereGeometry(1,6,5),boxGeo=new THREE.BoxGeometry(1,1,1),bloodPoolGeo=new THREE.PlaneGeometry(1,1);
let bloodPoolMat=null;
function getBloodPoolMat(){
 if(bloodPoolMat)return bloodPoolMat;
 const S=128,cv=document.createElement('canvas');cv.width=S;cv.height=S;
 const g=cv.getContext('2d'),cx=S/2,cy=S/2;
 // irregular radial dark-crimson splatter decal
 for(let k=0;k<7;k++){
  const a=k*Math.PI*2/7+((k*17)%5)*.18,dist=k===0?0:(8+(k*7)%16),rad=k===0?38:(18+(k*11)%18);
  const gx=cx+Math.cos(a)*dist,gy=cy+Math.sin(a)*dist;
  const grad=g.createRadialGradient(gx,gy,0,gx,gy,rad);
  grad.addColorStop(0,'rgba(118,8,14,0.92)');
  grad.addColorStop(0.55,'rgba(148,14,22,0.78)');
  grad.addColorStop(0.85,'rgba(98,8,14,0.32)');
  grad.addColorStop(1,'rgba(80,4,10,0)');
  g.fillStyle=grad;g.beginPath();g.arc(gx,gy,rad,0,Math.PI*2);g.fill();
 }
 for(let d=0;d<10;d++){
  const a=d*.63+.2,dist=34+(d*13)%20,rad=2.5+(d*3)%4;
  g.fillStyle='rgba(128,10,16,0.72)';g.beginPath();g.arc(cx+Math.cos(a)*dist,cy+Math.sin(a)*dist,rad,0,Math.PI*2);g.fill();
 }
 const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
 bloodPoolMat=new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:.92,depthWrite:false});
 return bloodPoolMat;
}
// muzzle flash: tiny hot core inside a soft glow — reads as a flash, not a floating ball
const flashCoreMat=new THREE.MeshBasicMaterial({color:0xfff3c0,transparent:true,opacity:.98});
const flashGlowMat=new THREE.MeshBasicMaterial({color:0xffb050,transparent:true,opacity:.3,depthWrite:false});
// staged photo effects get a long life so the frozen frame keeps its muzzle flashes and fire
const fxLife=life=>world.photoFx?life*160:life;
function spawn(mesh,life,grow=0,vel=null,fade=true,buoyant=false){mesh.userData.fx={life:fxLife(life),max:fxLife(life),grow:world.photoFx?0:grow,vel:world.photoFx?null:vel,fade:!world.photoFx,buoyant};world.scene.add(mesh);pool.push(mesh);}
export function carSmokePuff(x,y,z,dark=false,fire=false){
 const sMat=new THREE.MeshBasicMaterial({color:dark?0x1f2229:0xd8dfe8,transparent:true,opacity:dark?.78:.48,depthWrite:false});
 const m=new THREE.Mesh(geo,sMat);
 m.position.set(x+(Math.random()-.5)*.32,y,z+(Math.random()-.5)*.32);
 m.scale.setScalar(dark?.22:.16);
 spawn(m,dark?1.05:.85,dark?.95:.68,new THREE.Vector3((Math.random()-.5)*1.1,(dark?2.3:1.7)+Math.random()*.8,(Math.random()-.5)*1.1),true,true);
 if(fire){
  const fMat=new THREE.MeshBasicMaterial({color:Math.random()<.5?0xff6a14:0xffc244,transparent:true,opacity:.92,depthWrite:false,blending:THREE.AdditiveBlending});
  const fm=new THREE.Mesh(geo,fMat);
  fm.position.set(x+(Math.random()-.5)*.26,y-.05,z+(Math.random()-.5)*.26);
  fm.scale.set(.16,.24,.16);
  spawn(fm,.32,.45,new THREE.Vector3((Math.random()-.5)*1.4,2.6+Math.random()*1.2,(Math.random()-.5)*1.4),true,true);
 }
}
export function muzzleFlash(x,y,z){
 const core=new THREE.Mesh(geo,flashCoreMat.clone());core.position.set(x,y,z);core.scale.setScalar(world.photoFx?.14:.18);spawn(core,.07,4);
 const glow=new THREE.Mesh(geo,flashGlowMat.clone());glow.position.set(x,y,z);glow.scale.setScalar(world.photoFx?.3:.4);spawn(glow,.07,3);
}
export function tracer(x1,y1,z1,x2,y2,z2){const len=Math.hypot(x2-x1,y2-y1,z2-z1);if(len<.5)return;const m=new THREE.Mesh(boxGeo,tracerMat.clone());m.scale.set(.036,.036,len);m.position.set((x1+x2)/2,(y1+y2)/2,(z1+z2)/2);m.lookAt(x2,y2,z2);spawn(m,.06);}
export function impactSparks(x,y,z){for(let i=0;i<5;i++){const m=new THREE.Mesh(geo,sparkMat.clone());m.position.set(x,y,z);m.scale.setScalar(.07);spawn(m,.3+Math.random()*.2,0,new THREE.Vector3((Math.random()-.5)*7,Math.random()*6,(Math.random()-.5)*7));}}
export function bloodPuff(x,y,z,count=12){
 for(let i=0;i<count;i++){
  const col=i%2?0xc8141e:0x8a0c12;
  const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.95}));
  m.position.set(x+(Math.random()-.5)*.22,y+(Math.random()-.5)*.22,z+(Math.random()-.5)*.22);
  m.scale.setScalar(.07+Math.random()*.06);
  const ang=Math.random()*Math.PI*2,spd=1.6+Math.random()*4.4;
  spawn(m,.55,0,new THREE.Vector3(Math.cos(ang)*spd,2.0+Math.random()*3.2,Math.sin(ang)*spd));
 }
 // dark-crimson mist puff
 const mist=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0x6e0810,transparent:true,opacity:.55,depthWrite:false}));
 mist.position.set(x,y,z);mist.scale.setScalar(.24);
 spawn(mist,.45,1.8,new THREE.Vector3((Math.random()-.5)*.8,.7,(Math.random()-.5)*.8),true,true);
}
export function bloodPool(x,z){
 if(bloodPools.length>=bloodPoolMax){const old=bloodPools.shift();world.scene.remove(old.mesh);}
 const mesh=new THREE.Mesh(bloodPoolGeo,getBloodPoolMat());
 mesh.rotation.x=-Math.PI/2;mesh.rotation.z=Math.random()*Math.PI*2;
 mesh.position.set(x,.095,z);
 mesh.scale.setScalar(.35);
 world.scene.add(mesh);
 bloodPools.push({mesh,t:0,dur:.85,from:.35,to:1.55});
}
export function explosion(x,y,z){
 if(world.photoFx){
  // staged wreck fire: layered flame tongues lick up around the car body instead of
  // one big sphere swallowing it — the burnt wreck stays readable inside the flames
  const tongues=[[.6,1.4,1.15,0xff5a18],[1.5,1.9,.8,0xff8a30],[-.4,1.8,.7,0xff7020],[.9,2.7,.55,0xffb050],[.3,3.4,.4,0xffd27a]];
  for(const [dx,dy,s,c] of tongues){const f=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.95}));f.position.set(x+dx,y+dy,z+dx*.5+.4);f.scale.set(s*.65,s*1.05,s*.65);spawn(f,.5,0);}
 }else{
  const core=new THREE.Mesh(geo,fireMat.clone());core.position.set(x,y+1,z);core.scale.set(1.3,1.9,1.3);spawn(core,.45,world.photoFx?0:10);
 }
 for(let i=0;i<10;i++){const m=new THREE.Mesh(geo,smokeMat.clone());m.position.set(x+(Math.random()-.5)*2,y+1,z+(Math.random()-.5)*2);m.scale.setScalar(world.photoFx?.45:.8+Math.random()*.25);spawn(m,1.2+Math.random(),2.5,new THREE.Vector3((Math.random()-.5)*5,3+Math.random()*5,(Math.random()-.5)*5));}
 for(let i=0;i<8;i++){const m=new THREE.Mesh(geo,sparkMat.clone());m.position.set(x,y+1,z);m.scale.setScalar(.14);spawn(m,.7,0,new THREE.Vector3((Math.random()-.5)*16,4+Math.random()*12,(Math.random()-.5)*16));}
 const light=new THREE.PointLight(0xffa040,world.photoFx?7:40,world.photoFx?14:40);light.position.set(x,y+2,z);light.userData.fx={life:fxLife(.4),max:fxLife(.4),grow:0,vel:null,fade:false,isLight:true};world.scene.add(light);pool.push(light);
 if(world.photoFx){for(let i=0;i<6;i++){const m=new THREE.Mesh(geo,smokeMat.clone());m.position.set(x-1-i*.4+(Math.random()-.5)*.5,y+2.3+i*.7,z-1-i*.3+(Math.random()-.5)*.5);m.scale.set(.28+i*.045,.45+i*.06,.28+i*.045);m.material.opacity=.32-i*.03;spawn(m,2,0);}}
}
export function skidMark(x,z,heading){
 if(skids.length>=skidMax){const old=skids.shift();world.scene.remove(old);}
 const m=new THREE.Mesh(boxGeo,skidMat);m.scale.set(.24,.02,1.5);m.position.set(x,.09,z);m.rotation.y=heading;world.scene.add(m);skids.push(m);
}
export function makeWaypoint(){
 const g=new THREE.Group();
 const beam=new THREE.Mesh(new THREE.CylinderGeometry(.9,.9,26,12,1,true),new THREE.MeshBasicMaterial({color:0xffc84a,transparent:true,opacity:.28,side:THREE.DoubleSide,depthWrite:false}));
 beam.position.y=13;g.add(beam);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(2.4,.22,8,24),new THREE.MeshBasicMaterial({color:0xffd24a}));
 ring.rotation.x=Math.PI/2;ring.position.y=.4;g.add(ring);
 const arrow=new THREE.Mesh(new THREE.ConeGeometry(1,1.8,4),new THREE.MeshBasicMaterial({color:0xffd24a}));
 arrow.rotation.x=Math.PI;arrow.position.y=5;g.add(arrow);
 g.visible=false;world.scene.add(g);world.waypointMesh=g;return g;
}
export function makePickup(x,z,color,label){
 const m=new THREE.Mesh(new THREE.OctahedronGeometry(.6),new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.5}));
 m.position.set(x,1.1,z);m.userData.pickup={label,x,z,taken:false};world.scene.add(m);return m;
}
export function updateEffects(dt){
 for(let i=pool.length-1;i>=0;i--){
  const o=pool[i],f=o.userData.fx;f.life-=dt;
  if(f.life<=0){world.scene.remove(o);if(o.material&&!f.isLight)o.material.dispose();pool.splice(i,1);continue;}
  if(f.isLight){o.intensity=40*(f.life/f.max);continue;}
  const t=f.life/f.max;
  if(f.fade)o.material.opacity=t*.9;
  if(f.grow)o.scale.setScalar(o.scale.x+f.grow*dt);
  if(f.vel){o.position.addScaledVector(f.vel,dt);if(!f.buoyant)f.vel.y-=12*dt;}
 }
 for(const bp of bloodPools){
  if(bp.t<bp.dur){bp.t=Math.min(bp.dur,bp.t+dt);const k=1-Math.pow(1-bp.t/bp.dur,2);bp.mesh.scale.setScalar(bp.from+(bp.to-bp.from)*k);}
 }
 if(world.waypointMesh&&world.waypointMesh.visible){world.waypointMesh.rotation.y+=dt*1.5;const a=world.waypointMesh.children[2];a.position.y=5+Math.sin(world.waypointMesh.rotation.y*2)*.5;}
}
