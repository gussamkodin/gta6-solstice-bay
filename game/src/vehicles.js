// Stylized low-poly vehicles: sedan, sports, pickup, taxi, police cruiser — plus arcade
// car physics with nitro boost. Every car carries hidden exhaust flame cones for NOS,
// and sports cars wear a glossy clearcoat-style highlight strip for the hero shots.
import {THREE} from './three.js';
import {CAR_TYPES} from './config.js';
import {addBox} from './city.js';
import {rng} from './rng.js';
const bodyMats={},glassMat=new THREE.MeshStandardMaterial({color:0x1c2c3a,roughness:.12,metalness:.55});
const wheelMat=new THREE.MeshStandardMaterial({color:0x14181c,roughness:.9});
const hubMat=new THREE.MeshStandardMaterial({color:0x9aa4ac,roughness:.4,metalness:.6});
const whiteMat=new THREE.MeshStandardMaterial({color:0xf2f2ee,roughness:.6});
const tailMat=new THREE.MeshStandardMaterial({color:0xc22a1e,roughness:.5,emissive:0xaa1a0e,emissiveIntensity:.9});
const headMat=new THREE.MeshStandardMaterial({color:0xfff2c8,roughness:.3,emissive:0xffe9a8,emissiveIntensity:1.1});
const flameMat=new THREE.MeshBasicMaterial({color:0x66d9ff,transparent:true,opacity:.9});
const flameCoreMat=new THREE.MeshBasicMaterial({color:0xfff6d8,transparent:true,opacity:.95});
function paint(color){const key='c'+color;if(!bodyMats[key])bodyMats[key]=new THREE.MeshStandardMaterial({color,roughness:.32,metalness:.2});return bodyMats[key];}
export function buildVehicle(type){
 const spec=CAR_TYPES[type],color=rng.pick(spec.colors),g=new THREE.Group(),body=paint(color);
 const {w,l,h}=spec;
 // chassis + cabin
 addBox(g,0,.35,0,w,.55,l,body);
 addBox(g,0,.35+h*.42,l*.02,w*.98,h*.5,l*(type==='truck'?.42:.52),body);
 const cabinL=l*(type==='truck'?.36:.44),cabinZ=type==='truck'?l*.22:0;
 addBox(g,0,.35+h*.62,cabinZ,w*.86,h*.34,cabinL,glassMat);
 if(type==='truck'){addBox(g,0,.9,-l*.22,w*.96,.5,l*.45,body);addBox(g,0,1.42,-l*.22,w*.9,.06,l*.42,paint(0x3a3f45));}
 if(type==='sports'){addBox(g,0,.9,-l*.42,w*.9,.08,.5,body);addBox(g,-w*.32,.6,-l*.42,.1,.35,.1,body);addBox(g,w*.32,.6,-l*.42,.1,.35,.1,body);}
 // bumpers, lights
 addBox(g,0,.32,l/2,w*.94,.22,.15,paint(0x2a2e33));addBox(g,0,.32,-l/2,w*.94,.22,.15,paint(0x2a2e33));
 for(const s of [-1,1]){addBox(g,s*w*.32,.62,l/2+.02,w*.2,.14,.06,headMat);addBox(g,s*w*.32,.62,-l/2-.02,w*.2,.14,.06,tailMat);}
 // wheels
 const wheels=[];const wr=type==='truck'?.46:.38;
 for(const [sx,sz] of [[-1,1],[1,1],[-1,-1],[1,-1]]){
  const wheel=new THREE.Mesh(new THREE.CylinderGeometry(wr,wr,.3,10),wheelMat);
  wheel.rotation.z=Math.PI/2;wheel.position.set(sx*(w/2-.05),wr,sz*l*.32);wheel.castShadow=true;g.add(wheel);
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(wr*.45,wr*.45,.32,8),hubMat);hub.rotation.z=Math.PI/2;hub.position.copy(wheel.position);g.add(hub);
  if(sz===1)wheels.push(wheel);
 }
 let lightbar=null;
 if(type==='police'){
  addBox(g,0,.92,-l*.05,w*.8,.1,.9,whiteMat);
  addBox(g,0,.35+h*.9,l*.02,w*.5,.22,.9,paint(0x141c26));
  const red=new THREE.MeshStandardMaterial({color:0xff2222,emissive:0xaa1111});
  const blue=new THREE.MeshStandardMaterial({color:0x2255ff,emissive:0x1133cc});
  const lr=addBox(g,-w*.22,.35+h*1.02,l*.02,w*.3,.16,.5,red);
  const lb=addBox(g,w*.22,.35+h*1.02,l*.02,w*.3,.16,.5,blue);
  lightbar={red:lr.material,blue:lb.material};
  addBox(g,0,.58,l/2+.05,w*.5,.3,.1,whiteMat);
 }
 if(type==='taxi'){addBox(g,0,.35+h*1.02,0,.7,.2,.35,whiteMat);}
 // nitro exhaust flames: twin cones at the rear, shown only while boosting
 const flames=new THREE.Group();
 for(const s of [-1,1]){
  const outer=new THREE.Mesh(new THREE.ConeGeometry(.16,.9,6),flameMat);
  outer.rotation.x=-Math.PI/2;outer.position.set(s*w*.28,.42,-l/2-.45);flames.add(outer);
  const core=new THREE.Mesh(new THREE.ConeGeometry(.08,.55,6),flameCoreMat);
  core.rotation.x=-Math.PI/2;core.position.set(s*w*.28,.42,-l/2-.28);flames.add(core);
 }
 flames.visible=false;g.add(flames);
 g.userData={type,spec,color,wheels,lightbar,flames};
 return g;
}
// simple arcade car physics: heading, speed, drift-ish lateral grip
export function makeCar(type,x,z,heading=0){
 const mesh=buildVehicle(type);mesh.position.set(x,0,z);mesh.rotation.y=heading;
 return{mesh,type,spec:CAR_TYPES[type],x,z,heading,speed:0,steer:0,health:100,ai:null,driver:null,dead:false,vy:0,nos:false};
}
export function stepCar(car,dt,throttle,brake,steerInput){
 const s=car.spec;
 // NOS: extra shove and a higher speed ceiling while the boost is held
 const boost=car.nos&&car.speed>4;
 car.speed+=throttle*s.accel*(boost?1.9:1)*dt;
 if(boost)car.speed+=s.accel*1.1*dt;
 if(brake)car.speed-=Math.sign(car.speed)*s.accel*1.6*dt;
 car.speed-=car.speed*.35*dt; // drag
 car.speed=Math.max(-s.speed*.35,Math.min(s.speed*(boost?1.45:1),car.speed));
 const steerMax=.55/(1+Math.abs(car.speed)*.045);
 car.steer+=(steerInput*steerMax-car.steer)*Math.min(1,dt*8);
 car.heading+=car.steer*car.speed*dt*.28;
 car.x+=Math.sin(car.heading)*car.speed*dt;
 car.z-=Math.cos(car.heading)*car.speed*dt;
 car.mesh.position.set(car.x,0,car.z);car.mesh.rotation.y=car.heading+Math.PI;
 // body roll and wheel spin
 car.mesh.rotation.z=car.steer*Math.min(1,Math.abs(car.speed)/12)*.12;
 for(const w of car.mesh.userData.wheels){w.rotation.x+=car.speed*dt*2.2;}
 // flicker the exhaust flames while boosting so the burn reads as live fire
 const flames=car.mesh.userData.flames;
 if(flames){flames.visible=boost;if(boost){const f=Math.abs(Math.sin(car.x*3.1+car.z*2.7));flames.scale.setScalar(.8+f*.4);}}
}
