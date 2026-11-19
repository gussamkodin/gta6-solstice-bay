// Neon-sunset sky: three-stop gradient dome (indigo → rose → amber), low warm sun west
// over the hills casting long shadows, pink haze fog, lit clouds and a glowing sun disc.
import {THREE} from './three.js';
import {PALETTE} from './config.js';
export function makeSky(scene,renderer){
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const sun=new THREE.DirectionalLight(0xffb36b,2.6);
 sun.castShadow=true;
 sun.shadow.mapSize.set(2048,2048);
 const sc=sun.shadow.camera;sc.left=-130;sc.right=130;sc.top=130;sc.bottom=-130;sc.near=20;sc.far=700;
 sun.shadow.bias=-0.0006;
 scene.add(sun);scene.add(sun.target);
 // cool violet sky fill against warm ground bounce keeps pastel walls saturated at dusk
 const hemi=new THREE.HemisphereLight(0x8a7ad0,0xd88a58,.75);scene.add(hemi);
 scene.fog=new THREE.Fog(PALETTE.fog,200,720);
 // gradient dome via vertex colors on a big sphere: horizon amber, mid rose, zenith indigo
 const geo=new THREE.SphereGeometry(850,28,16);
 const colors=[];const pos=geo.attributes.position;
 const top=new THREE.Color(PALETTE.skyTop),mid=new THREE.Color(PALETTE.skyMid),hor=new THREE.Color(PALETTE.skyHorizon);
 for(let i=0;i<pos.count;i++){
  const t=Math.max(0,pos.getY(i)/850);
  const c=t<.22?hor.clone().lerp(mid,Math.pow(t/.22,.8)):mid.clone().lerp(top,Math.pow((t-.22)/.78,.65));
  colors.push(c.r,c.g,c.b);
 }
 geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 const dome=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false}));
 scene.add(dome);
 // low sun disc with a soft halo, sitting just above the western hills
 const disc=new THREE.Mesh(new THREE.CircleGeometry(52,28),new THREE.MeshBasicMaterial({color:0xffe9b8,fog:false}));
 disc.position.set(-720,95,190);disc.lookAt(0,60,0);scene.add(disc);
 const halo=new THREE.Mesh(new THREE.CircleGeometry(150,28),new THREE.MeshBasicMaterial({color:0xff9e5e,fog:false,transparent:true,opacity:.35,depthWrite:false}));
 halo.position.set(-726,95,190);halo.lookAt(0,60,0);scene.add(halo);
 // drifting clouds lit pink from below by the setting sun
 const clouds=new THREE.Group();
 for(let i=0;i<12;i++){
  const g=new THREE.Group();
  const m=new THREE.MeshBasicMaterial({color:i%3?0xffc9b0:0xffe3c8,fog:false,transparent:true,opacity:.8});
  for(let b=0;b<3;b++){const box=new THREE.Mesh(new THREE.BoxGeometry(60+Math.random()*50,5,20),m);box.position.set(b*35-35,Math.random()*4,Math.random()*12);g.add(box);}
  g.position.set((Math.random()-.5)*1400,200+Math.random()*110,(Math.random()-.5)*1400);clouds.add(g);
 }
 scene.add(clouds);
 return{sun,hemi,dome,clouds,disc,
  update(dt,focus){
   // low western sun follows the player so long shadows stretch east across every street
   sun.target.position.set(focus.x,0,focus.z);
   sun.position.set(focus.x-190,85,focus.z+52);
   dome.position.set(focus.x,0,focus.z);
   disc.position.set(focus.x-720,95,focus.z+190);halo.position.set(focus.x-726,95,focus.z+190);
   for(const c of clouds.children){c.position.x+=dt*2.2;if(c.position.x-focus.x>800)c.position.x-=1600;}
  }}
}