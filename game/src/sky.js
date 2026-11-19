// Neon-sunset sky: three-stop gradient dome (indigo → rose → amber), low warm sun west
// over the hills casting long shadows, pink haze fog, lit clouds and a glowing sun disc.
// Photo mode can bias the exposure and sun strength per staged frame.
import {THREE} from './three.js';
import {PALETTE} from './config.js';
import {makeRng} from './rng.js';
export function makeSky(scene,renderer){
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const sun=new THREE.DirectionalLight(0xffb36b,2.6);
 sun.castShadow=true;
 sun.shadow.mapSize.set(2048,2048);
 const sc=sun.shadow.camera;sc.left=-130;sc.right=130;sc.top=130;sc.bottom=-130;sc.near=20;sc.far=700;
 sun.shadow.bias=-0.0006;
 scene.add(sun);scene.add(sun.target);
 // cool violet sky fill against warm ground bounce keeps pastel walls saturated at dusk
 const hemi=new THREE.HemisphereLight(0x9a8ad8,0xd8925e,1.05);scene.add(hemi);
 // gentle ambient floor so shadowed asphalt and car bodies never crush to black
 scene.add(new THREE.AmbientLight(0x7a6a98,.65));
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
 disc.position.set(-720,95,110);disc.lookAt(0,60,0);scene.add(disc);
 const halo=new THREE.Mesh(new THREE.CircleGeometry(150,28),new THREE.MeshBasicMaterial({color:0xff9e5e,fog:false,transparent:true,opacity:.35,depthWrite:false}));
 halo.position.set(-726,95,110);halo.lookAt(0,60,0);scene.add(halo);
 // drifting clouds lit pink from below by the setting sun
 const clouds=new THREE.Group();
 for(let i=0;i<12;i++){
  const g=new THREE.Group();
  const m=new THREE.MeshBasicMaterial({color:i%3?0xffc9b0:0xffe3c8,fog:false,transparent:true,opacity:.8});
  // seeded cloud layout: every reload stages the same sky, so screenshots are repeatable
  const cr=makeRng(1200+i*77);
  for(let b=0;b<3;b++){const box=new THREE.Mesh(new THREE.BoxGeometry(60+cr()*50,5,20),m);box.position.set(b*35-35,cr()*4,cr()*12);g.add(box);}
  // keep the band low and out of the western view corridor so the cover sky stays clean
  g.position.set((cr()-.5)*1400,205+cr()*70,180+cr()*560*(cr()<.5?-1:1));clouds.add(g);
 }
 scene.add(clouds);
 return{sun,hemi,dome,clouds,disc,
  update(dt,focus){
   // low western sun follows the player so long shadows stretch east across every street
   sun.target.position.set(focus.x,0,focus.z);
   sun.position.set(focus.x-190,85,focus.z+52);
   dome.position.set(focus.x,0,focus.z);
   disc.position.set(focus.x-720,95,focus.z+110);halo.position.set(focus.x-726,95,focus.z+110);
   for(const c of clouds.children){c.position.x+=dt*2.2;if(c.position.x-focus.x>800)c.position.x-=1600;}
  }}
}