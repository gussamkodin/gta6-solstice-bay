// Pooled visual effects: muzzle flashes, tracers, sparks, explosions, skid marks, pickups, waypoint beam.
import {THREE} from './three.js';
import {world} from './world.js';
const pool=[],skids=[],skidMax=180;
const flashMat=new THREE.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:.95});
const sparkMat=new THREE.MeshBasicMaterial({color:0xffb060,transparent:true});
const smokeMat=new THREE.MeshBasicMaterial({color:0x3a3a3a,transparent:true,opacity:.8});
const fireMat=new THREE.MeshBasicMaterial({color:0xff7020,transparent:true});
const skidMat=new THREE.MeshBasicMaterial({color:0x22242a,transparent:true,opacity:.55});
const tracerMat=new THREE.MeshBasicMaterial({color:0xffe9a8,transparent:true,opacity:.8});
const geo=new THREE.SphereGeometry(1,6,5),boxGeo=new THREE.BoxGeometry(1,1,1);
function spawn(mesh,life,grow=0,vel=null,fade=true){mesh.userData.fx={life,max:life,grow,vel,fade};world.scene.add(mesh);pool.push(mesh);}
export function muzzleFlash(x,y,z){const m=new THREE.Mesh(geo,flashMat.clone());m.position.set(x,y,z);m.scale.setScalar(.3);spawn(m,.07,4);}
export function tracer(x1,y1,z1,x2,y2,z2){const len=Math.hypot(x2-x1,y2-y1,z2-z1);if(len<.5)return;const m=new THREE.Mesh(boxGeo,tracerMat.clone());m.scale.set(.05,.05,len);m.position.set((x1+x2)/2,(y1+y2)/2,(z1+z2)/2);m.lookAt(x2,y2,z2);spawn(m,.06);}
export function impactSparks(x,y,z){for(let i=0;i<5;i++){const m=new THREE.Mesh(geo,sparkMat.clone());m.position.set(x,y,z);m.scale.setScalar(.07);spawn(m,.3+Math.random()*.2,0,new THREE.Vector3((Math.random()-.5)*7,Math.random()*6,(Math.random()-.5)*7));}}
export function bloodPuff(x,y,z){for(let i=0;i<4;i++){const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0xb03030,transparent:true}));m.position.set(x,y,z);m.scale.setScalar(.09);spawn(m,.25,1,new THREE.Vector3((Math.random()-.5)*3,Math.random()*2,(Math.random()-.5)*3));}}
export function explosion(x,y,z){
 const core=new THREE.Mesh(geo,fireMat.clone());core.position.set(x,y+1,z);core.scale.setScalar(1.2);spawn(core,.45,10);
 for(let i=0;i<10;i++){const m=new THREE.Mesh(geo,smokeMat.clone());m.position.set(x+(Math.random()-.5)*2,y+1,z+(Math.random()-.5)*2);m.scale.setScalar(.8+Math.random());spawn(m,1.2+Math.random(),2.5,new THREE.Vector3((Math.random()-.5)*5,3+Math.random()*5,(Math.random()-.5)*5));}
 for(let i=0;i<8;i++){const m=new THREE.Mesh(geo,sparkMat.clone());m.position.set(x,y+1,z);m.scale.setScalar(.14);spawn(m,.7,0,new THREE.Vector3((Math.random()-.5)*16,4+Math.random()*12,(Math.random()-.5)*16));}
 const light=new THREE.PointLight(0xffa040,40,40);light.position.set(x,y+2,z);light.userData.fx={life:.4,max:.4,grow:0,vel:null,fade:false,isLight:true};world.scene.add(light);pool.push(light);
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
  if(f.vel){o.position.addScaledVector(f.vel,dt);f.vel.y-=12*dt;}
 }
 if(world.waypointMesh&&world.waypointMesh.visible){world.waypointMesh.rotation.y+=dt*1.5;const a=world.waypointMesh.children[2];a.position.y=5+Math.sin(world.waypointMesh.rotation.y*2)*.5;}
}
