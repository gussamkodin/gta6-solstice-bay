// Low-poly articulated characters: player avatar, pedestrians, drivers, police, gang, crew.
// A held sidearm (buildHuman({gun:true})) rides the right hand so aiming poses read at a glance.
import {THREE} from './three.js';
import {rng} from './rng.js';
const SKIN=[0xd9a066,0xb07848,0x8a5a34,0xe8b88a,0x6a4426];
const SHIRT=[0xe8452e,0x2e8fc4,0xf2c12e,0x7a4fc0,0x3da35a,0xf28ab0,0xececec,0x33404e];
const PANTS=[0x2c3e50,0x4a4440,0x5d6d7e,0x33518a,0x704214];
const hairMat=new THREE.MeshStandardMaterial({color:0x2a2118,roughness:.9});
const mats={};
function m(color){if(!mats[color])mats[color]=new THREE.MeshStandardMaterial({color,roughness:.85});return mats[color];}
function part(parent,w,h,d,color,x,y,z){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof color==='number'?m(color):color);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;}
export function buildHuman(opts={}){
 const skin=opts.skin??rng.pick(SKIN),shirt=opts.shirt??rng.pick(SHIRT),pants=opts.pants??rng.pick(PANTS);
 const g=new THREE.Group();
 const torso=part(g,.46,.6,.26,shirt,0,1.05,0);
 const head=part(g,.26,.28,.26,skin,0,1.52,0);
 part(g,.28,.1,.28,hairMat===undefined?0x2a2118:hairMat,0,1.68,0);
 const armL=new THREE.Group(),armR=new THREE.Group();
 armL.position.set(-.31,1.3,0);armR.position.set(.31,1.3,0);
 part(armL,.14,.52,.16,shirt,0,-.24,0);part(armR,.14,.52,.16,shirt,0,-.24,0);
 part(armL,.13,.14,.14,skin,0,-.52,0);part(armR,.13,.14,.14,skin,0,-.52,0);
 g.add(armL,armR);
 const legL=new THREE.Group(),legR=new THREE.Group();
 legL.position.set(-.13,.75,0);legR.position.set(.13,.75,0);
 part(legL,.17,.66,.2,pants,0,-.34,0);part(legR,.17,.66,.2,pants,0,-.34,0);
 part(legL,.18,.1,.3,m(0x22262a),0,-.7,.04);part(legR,.18,.1,.3,m(0x22262a),0,-.7,.04);
 g.add(legL,legR);
 if(opts.cap){part(g,.3,.08,.3,m(opts.cap),0,1.72,0);part(g,.3,.03,.14,m(opts.cap),0,1.68,.18);}
 if(opts.gun){const gun=part(armR,.07,.09,.34,m(0x1a1d22),0,-.56,.14);gun.name='sidearm';}
 if(opts.satchel)part(g,.2,.26,.12,m(0x5a4632),-.3,.95,0);
 g.userData={armL,armR,legL,legR,torso,head,phase:rng()*6};
 return g;
}
export function animateHuman(g,speed,dt,aiming=false){
 const u=g.userData;u.phase+=dt*(2+speed*1.6);
 const swing=Math.sin(u.phase)*Math.min(.8,speed*.16);
 u.legL.rotation.x=swing;u.legR.rotation.x=-swing;
 if(aiming){u.armR.rotation.x=-Math.PI/2;u.armL.rotation.x=-Math.PI/2.4;u.armL.rotation.z=.4;}
 else{u.armR.rotation.x=-swing*.8;u.armL.rotation.x=swing*.8;u.armL.rotation.z=0;}
 g.position.y=Math.abs(Math.sin(u.phase))*Math.min(.06,speed*.012);
}
export function ragdoll(g){g.rotation.x=-Math.PI/2;g.position.y=.25;}
