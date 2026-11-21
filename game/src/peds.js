// Stylized sculpted 3D characters: player avatar, pedestrians, drivers, police, gang, crew.
// Features rounded heads, sculpted hair domes, wrap-around sunglasses, layered jacket torsos
// with collars & shoulder pads, belt buckles, tapered limbs, two-tone sneakers, and a detailed SMG/pistol sidearm.
import {THREE} from './three.js';
import {rng} from './rng.js';
const SKIN=[0xd9a066,0xb07848,0x8a5a34,0xe8b88a,0x6a4426];
const SHIRT=[0xe8452e,0x2e8fc4,0xf2c12e,0x7a4fc0,0x3da35a,0xf28ab0,0xececec,0x33404e];
const PANTS=[0x2c3e50,0x4a4440,0x5d6d7e,0x33518a,0x704214];
const hairMat=new THREE.MeshStandardMaterial({color:0x221a14,roughness:.82});
const visorMat=new THREE.MeshStandardMaterial({color:0x0f1622,roughness:.15,metalness:.75});
const beltMat=new THREE.MeshStandardMaterial({color:0x1a1c22,roughness:.5});
const buckleMat=new THREE.MeshStandardMaterial({color:0xe8c468,roughness:.25,metalness:.8});
const gunBodyMat=new THREE.MeshStandardMaterial({color:0x181c24,roughness:.35,metalness:.6});
const gunSlideMat=new THREE.MeshStandardMaterial({color:0x6e7b88,roughness:.28,metalness:.75});
const mats={};
function m(color){if(!mats[color])mats[color]=new THREE.MeshStandardMaterial({color,roughness:.58});return mats[color];}
const headGeo=new THREE.SphereGeometry(.155,12,10);
const hairGeo=new THREE.SphereGeometry(.162,12,8);
const neckGeo=new THREE.CylinderGeometry(.065,.076,.12,8);
const shoulderGeo=new THREE.SphereGeometry(.105,8,6);
const upperArmGeo=new THREE.CylinderGeometry(.076,.065,.28,8);
const foreArmGeo=new THREE.CylinderGeometry(.062,.052,.24,8);
const handGeo=new THREE.SphereGeometry(.058,8,6);
const thighGeo=new THREE.CylinderGeometry(.094,.08,.34,8);
const calfGeo=new THREE.CylinderGeometry(.078,.064,.32,8);
function part(parent,w,h,d,color,x,y,z){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof color==='number'?m(color):color);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;}
function geomPart(parent,geo,color,x,y,z,sx=1,sy=1,sz=1){const mesh=new THREE.Mesh(geo,typeof color==='number'?m(color):color);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;parent.add(mesh);return mesh;}
export function buildHuman(opts={}){
 const skin=opts.skin??rng.pick(SKIN),shirt=opts.shirt??rng.pick(SHIRT),pants=opts.pants??rng.pick(PANTS);
 const inner=opts.innerShirt??0xf4ead8;
 const g=new THREE.Group();
 // Sculpted layered jacket torso + raised collar + inner v-neck shirt + belt & metallic buckle
 const torso=part(g,.44,.54,.25,shirt,0,1.07,0);
 part(g,.28,.09,.23,shirt,0,1.35,-.01); // jacket collar
 part(g,.16,.50,.262,inner,0,1.07,.004); // inner contrast shirt
 part(g,.45,.07,.265,beltMat,0,.79,0);   // waist belt
 part(g,.09,.065,.276,buckleMat,0,.79,.005); // metallic belt buckle
 for(const s of [-1,1])geomPart(g,shoulderGeo,shirt,s*.23,1.28,0,1,.88,1);
 // Cylindrical neck + smooth rounded head + sculpted hair cap + wrap-around sunglasses
 geomPart(g,neckGeo,skin,0,1.38,0);
 const head=geomPart(g,headGeo,skin,0,1.54,0,.95,1.08,.95);
 geomPart(g,hairGeo,hairMat,0,1.62,-.012,.98,.72,1.02);
 part(g,.23,.14,.12,hairMat,0,1.56,-.09);
 part(g,.24,.058,.06,visorMat,0,1.55,.13);
 // Tapered articulated arms with hands
 const armL=new THREE.Group(),armR=new THREE.Group();
 armL.position.set(-.29,1.28,0);armR.position.set(.29,1.28,0);
 for(const arm of [armL,armR]){
  geomPart(arm,upperArmGeo,shirt,0,-.14,0);
  geomPart(arm,foreArmGeo,skin,0,-.35,0);
  geomPart(arm,handGeo,skin,0,-.49,0);
 }
 g.add(armL,armR);
 // Tapered articulated legs with two-tone sneakers
 const legL=new THREE.Group(),legR=new THREE.Group();
 legL.position.set(-.125,.76,0);legR.position.set(.125,.76,0);
 for(const leg of [legL,legR]){
  geomPart(leg,thighGeo,pants,0,-.17,0);
  geomPart(leg,calfGeo,pants,0,-.46,0);
  part(leg,.17,.09,.28,m(0x1e242c),0,-.67,.035);
  part(leg,.18,.04,.30,0xf2f2f0,0,-.72,.035);
 }
 g.add(legL,legR);
 if(opts.cap){
  geomPart(g,hairGeo,m(opts.cap),0,1.64,0,1.04,.65,1.05);
  part(g,.26,.028,.16,m(opts.cap),0,1.62,.17);
 }
 if(opts.gun){
  const gun=new THREE.Group();gun.name='sidearm';
  gun.position.set(0,-.50,.15);
  part(gun,.062,.085,.34,gunBodyMat,0,0,.02);
  part(gun,.054,.045,.30,gunSlideMat,0,.05,.04);
  part(gun,.035,.035,.14,gunSlideMat,0,.025,.22); // barrel shroud
  part(gun,.05,.12,.07,gunBodyMat,0,-.08,-.07);  // pistol grip
  part(gun,.042,.13,.055,gunSlideMat,0,-.09,.06); // forward SMG magazine
  armR.add(gun);
 }
 if(opts.satchel)part(g,.18,.24,.13,m(0x5a4632),-.27,.94,-.02);
 g.userData={armL,armR,legL,legR,torso,head,phase:rng()*6};
 return g;
}
export function animateHuman(g,speed,dt,aiming=false,airY=0){
 const u=g.userData;u.phase+=dt*(2+speed*1.6);
 const swing=Math.sin(u.phase)*Math.min(.8,speed*.16);
 if(airY>.02){
  u.legL.rotation.x=-.55;u.legR.rotation.x=.38;
  if(!aiming){u.armL.rotation.x=-.45;u.armR.rotation.x=.35;u.armL.rotation.z=0;}
 }else{
  u.legL.rotation.x=swing;u.legR.rotation.x=-swing;
  if(airY===0)g.position.y=Math.abs(Math.sin(u.phase))*Math.min(.06,speed*.012);
 }
 if(aiming){u.armR.rotation.x=-Math.PI/2;u.armL.rotation.x=-Math.PI/2.4;u.armL.rotation.z=.4;}
 else if(airY<=.02){u.armR.rotation.x=-swing*.8;u.armL.rotation.x=swing*.8;u.armL.rotation.z=0;}
}
export function ragdoll(g){g.rotation.x=-Math.PI/2;g.position.y=.25;}
