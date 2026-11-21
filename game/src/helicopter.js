// AIR ONE — police helicopter: spawns at 3+ stars, orbits and pursues the player with a
// searchlight cone and ground spotlight, radios position chatter to the HUD, and loses
// the trail when the player hides under a pier deck or inside the garage.
// A translucent rotor-blur disc spins above the blades so the bird reads at distance.
import {THREE} from './three.js';
import {world} from './world.js';
import {state,notify} from './state.js';
import {PIER,GARAGE,HALF} from './config.js';
import {dist2,angleDelta} from './physics.js';
import {startRotor,stopRotor,updateRotor} from './audio.js';
const ORBIT_R=26,ALT=30,SPEED=24;
let heli=null;
export function updateHelicopter(dt){
 const wanted=state.wanted>=3;
 if(wanted&&!heli)spawnHeli();
 if(!wanted&&heli&&!heli.leaving){heli.leaving=true;stopRotor();chatter('AIR ONE: losing the trail, returning to base.');}
 if(!heli)return;
 const px=state.foot.x,pz=state.foot.z;
 // under a pier deck or in the garage the spotlight cannot hold the player
 const hidden=isHidden(px,pz);
 const h=heli;
 h.spin+=dt*22;
 h.rotor.rotation.y=h.spin;h.tailRotor.rotation.x=h.spin*1.6;
 if(h.leaving){
  h.alt+=dt*8;h.mesh.position.y=h.alt;
  h.mesh.position.x-=dt*SPEED;h.mesh.position.z+=dt*6;
  h.searchlight.visible=false;h.spotPool.visible=false;
  if(h.alt>90)removeHeli();
  return;
 }
 if(hidden){
  h.lostT+=dt;
  h.searchlight.visible=false;h.spotPool.visible=false;
  if(h.lostT>2&&state.time-h.lastChatter>4){h.lastChatter=state.time;chatter('AIR ONE: visual lost — suspect went under cover. Sweep the block.');}
  // circle the last known position instead of tracking
  orbit(h,h.lastX,h.lastZ,dt);
  if(h.lostT>6){
   // heat bleeds fast while concealed; at zero the bird gives up entirely
   state.heat=Math.max(0,state.heat-dt*14);
   state.wanted=Math.min(5,Math.ceil(state.heat/20));
   if(state.wanted<3){h.leaving=true;stopRotor();chatter('AIR ONE: negative contact. AIR ONE clear.');}
  }
 }else{
  if(h.lostT>2)chatter('AIR ONE: re-acquired. Suspect in the open.');
  h.lostT=0;h.lastX=px;h.lastZ=pz;
  orbit(h,px,pz,dt);
  h.searchlight.visible=true;h.spotPool.visible=true;
  // aim the cone from the belly at the player; pool marks the lit ground
  const from=new THREE.Vector3(h.mesh.position.x,h.alt-1,h.mesh.position.z);
  const to=new THREE.Vector3(px,.2,pz);
  const dir=to.clone().sub(from),len=dir.length();
  h.searchlight.position.copy(from);
  h.searchlight.scale.set(1,len/30,1);
  h.searchlight.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),dir.normalize());
  h.spotPool.position.set(px,.12,pz);
  h.spotPool.material.opacity=.14+Math.sin(state.time*5)*.04;
  if(state.time-h.lastChatter>7){h.lastChatter=state.time;chatter(randomChatter(px,pz));}
 }
 h.mesh.position.y=h.alt+Math.sin(state.time*1.3)*.6;
 h.beacon.material.emissiveIntensity=Math.floor(state.time*4)%2?2.4:.3;
 updateRotor(1);
}
function orbit(h,tx,tz,dt){
 h.angle+=dt*(SPEED/ORBIT_R);
 const gx=tx+Math.cos(h.angle)*ORBIT_R,gz=tz+Math.sin(h.angle)*ORBIT_R;
 const dx=gx-h.mesh.position.x,dz=gz-h.mesh.position.z;
 const step=Math.min(1,dt*1.8);
 h.mesh.position.x+=dx*step;h.mesh.position.z+=dz*step;
 const want=Math.atan2(dx,dz)+Math.PI/2;
 h.mesh.rotation.y+=angleDelta(h.mesh.rotation.y,want)*Math.min(1,dt*3);
 h.mesh.rotation.z=Math.sin(h.angle)*.12; // bank into the turn
}
function isHidden(x,z){
 if(x>PIER.minX-2&&PIER.zs.some(pz=>Math.abs(z-pz)<PIER.halfWidth+1))return true;
 if(dist2(x,z,GARAGE.x,GARAGE.z)<64)return true;
 return false;
}
function spawnHeli(){
 const g=new THREE.Group();
 const bodyMat=new THREE.MeshStandardMaterial({color:0x1c2733,roughness:.4,metalness:.3});
 const glassMat=new THREE.MeshStandardMaterial({color:0x9fd8e8,roughness:.15,metalness:.5});
 const add=(w,h,d,mt,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mt);m.position.set(x,y,z);m.castShadow=true;g.add(m);return m;};
 add(2.2,1.6,4.6,bodyMat,0,0,0);            // fuselage
 add(1.8,1.1,1.6,glassMat,0,.25,2.2);        // cockpit glass
 add(.5,.5,4.4,bodyMat,0,.4,-4);             // tail boom
 add(.2,1.4,.9,bodyMat,0,1,-6);              // tail fin
 add(.16,.16,3.4,bodyMat,-1,-1.1,.2);add(.16,.16,3.4,bodyMat,1,-1.1,.2); // skids
 const rotor=new THREE.Group();
 const bladeMat=new THREE.MeshStandardMaterial({color:0x11151c,roughness:.6});
 const rotorDisc=new THREE.Mesh(new THREE.CircleGeometry(5.6,24),new THREE.MeshBasicMaterial({color:0x4a5560,transparent:true,opacity:.22,depthWrite:false,side:THREE.DoubleSide}));rotorDisc.rotation.x=-Math.PI/2;rotorDisc.position.y=.06;rotor.add(rotorDisc);
 const b1=new THREE.Mesh(new THREE.BoxGeometry(11,.08,.4),bladeMat);
 const b2=new THREE.Mesh(new THREE.BoxGeometry(.4,.08,11),bladeMat);
 rotor.add(b1,b2);rotor.position.y=1.2;g.add(rotor);
 const tailRotor=new THREE.Mesh(new THREE.BoxGeometry(.1,2,.24),bladeMat);
 tailRotor.position.set(.3,1,-6);g.add(tailRotor);
 const beacon=new THREE.Mesh(new THREE.SphereGeometry(.18,6,5),new THREE.MeshStandardMaterial({color:0xff3030,emissive:0xff2020,emissiveIntensity:2}));
 beacon.position.set(0,1.5,-1);g.add(beacon);
 // white livery stripe
 add(2.24,.3,3,new THREE.MeshStandardMaterial({color:0xe8e8e4,roughness:.5}),0,-.2,.4);
 // searchlight cone (apex at the belly) and the lit pool on the ground
 // cone lives in world space: the fuselage yaws constantly, and a parented beam
 // would swing off-target with every orbit step
 const cone=new THREE.Mesh(new THREE.ConeGeometry(2.6,30,16,1,true),new THREE.MeshBasicMaterial({color:0xfff2c0,transparent:true,opacity:.04,side:THREE.DoubleSide,depthWrite:false}));
 cone.geometry.translate(0,-15,0);world.scene.add(cone);
 const pool=new THREE.Mesh(new THREE.CircleGeometry(3.8,20),new THREE.MeshBasicMaterial({color:0xfff2c0,transparent:true,opacity:.12,depthWrite:false}));
 pool.rotation.x=-Math.PI/2;world.scene.add(pool);
 const px=state.foot.x,pz=state.foot.z;
 g.position.set(px-70,ALT,pz-40);
 world.scene.add(g);
 heli={mesh:g,rotor,tailRotor,beacon,searchlight:cone,spotPool:pool,angle:0,alt:ALT,spin:0,lostT:0,lastX:px,lastZ:pz,lastChatter:0,leaving:false};
 world.heli=heli;
 startRotor();
 chatter('AIR ONE: airborne. Suspect vehicle in sight — all units, hold the perimeter.');
 notify('AIR ONE IS OVERHEAD');
}
function removeHeli(){
 world.scene.remove(heli.mesh);world.scene.remove(heli.spotPool);world.scene.remove(heli.searchlight);
 heli=null;world.heli=null;
}
function chatter(text){state.heliChatter=text;state.heliChatterT=5;}
function randomChatter(x,z){
 const ns=z<state.crimeZ?'north':'south',ew=x>state.crimeX?'east':'west';
 const roads=['Marigold','Bayshore','Copper','Palmetto','Solstice','Glasshouse'];
 const road=roads[Math.abs(Math.floor(x/72+z/72))%roads.length];
 const lines=[
  'AIR ONE: suspect heading '+ns+' on '+road+'. Units converge.',
  'AIR ONE: I have the spotlight. Suspect moving '+ew+' toward the water.',
  'AIR ONE: keep the pressure on, ground units. He can\'t outrun the rotor.',
  'AIR ONE: suspect vehicle still rolling '+ns+'bound. Roadblock ahead of him.',
 ];
 return lines[Math.abs(Math.floor(state.time))%lines.length];
}
// staged photo: place AIR ONE holding a fixed orbit with the beam on the player
export function photoHeli(px,pz){
 if(!heli)spawnHeli();
 // hold the bird ahead-left in the camera corridor so fuselage + beam sit in frame
 heli.mesh.position.set(px+18,ALT-14,pz-20);
 heli.mesh.rotation.y=Math.PI/2-.3;heli.mesh.rotation.z=.1;
 heli.angle=Math.PI*.8;heli.lostT=0;heli.leaving=false;
 heli.searchlight.visible=true;heli.spotPool.visible=true;
 const from=new THREE.Vector3(heli.mesh.position.x,heli.mesh.position.y-1,heli.mesh.position.z);
 const to=new THREE.Vector3(px,.2,pz);
 const dir=to.clone().sub(from),len=dir.length();
 heli.searchlight.position.copy(from.clone().add(to).multiplyScalar(.5));
 heli.searchlight.scale.set(1,len/30,1);
 heli.searchlight.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),dir.normalize());
 heli.spotPool.position.set(px,.12,pz);
 chatter('AIR ONE: suspect vehicle heading west on Marigold. All units converge.');
}