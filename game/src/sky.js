// Dynamic sunset, twilight & midnight sky system: three-stop gradient dome, directional
// sun/moon light, hemisphere & ambient fill, atmospheric fog, and corridor street point lights.
import {THREE} from './three.js';
import {PALETTE} from './config.js';
import {makeRng} from './rng.js';
import {world} from './world.js';

function paintDome(geo,topHex,midHex,horHex){
 const pos=geo.attributes.position;
 const colors=geo.attributes.color?geo.attributes.color.array:new Float32Array(pos.count*3);
 const top=new THREE.Color(topHex),mid=new THREE.Color(midHex),hor=new THREE.Color(horHex);
 for(let i=0;i<pos.count;i++){
  const t=Math.max(0,pos.getY(i)/850);
  const c=t<.22?hor.clone().lerp(mid,Math.pow(t/.22,.8)):mid.clone().lerp(top,Math.pow((t-.22)/.78,.65));
  colors[i*3]=c.r;colors[i*3+1]=c.g;colors[i*3+2]=c.b;
 }
 if(!geo.attributes.color)geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 else geo.attributes.color.needsUpdate=true;
}

export function makeSky(scene,renderer){
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const sun=new THREE.DirectionalLight(0xffcc90,2.65);
 sun.castShadow=true;
 sun.shadow.mapSize.set(2048,2048);
 const sc=sun.shadow.camera;sc.left=-130;sc.right=130;sc.top=130;sc.bottom=-130;sc.near=20;sc.far=700;
 sun.shadow.bias=-0.0006;
 scene.add(sun);scene.add(sun.target);
 const hemi=new THREE.HemisphereLight(0xc8dcff,0xeeb078,1.25);scene.add(hemi);
 const ambient=new THREE.AmbientLight(0x74708e,.72);scene.add(ambient);
 scene.fog=new THREE.Fog(0xf0b88e,250,820);
 // gradient dome via vertex colors on a big sphere
 const geo=new THREE.SphereGeometry(850,28,16);
 paintDome(geo,0x3458a2,0xe67c6e,0xffd892);
 const dome=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false}));
 scene.add(dome);
 // low sun disc with a soft halo, sitting just above the western hills
 const disc=new THREE.Mesh(new THREE.CircleGeometry(52,28),new THREE.MeshBasicMaterial({color:0xffe9b8,fog:false}));
 disc.position.set(-720,95,110);disc.lookAt(0,60,0);scene.add(disc);
 const halo=new THREE.Mesh(new THREE.CircleGeometry(150,28),new THREE.MeshBasicMaterial({color:0xff9e5e,fog:false,transparent:true,opacity:.35,depthWrite:false}));
 halo.position.set(-726,95,110);halo.lookAt(0,60,0);scene.add(halo);
 // drifting clouds lit pink from below by the setting sun
 const clouds=new THREE.Group(),cloudMats=[];
 for(let i=0;i<12;i++){
  const g=new THREE.Group();
  const m=new THREE.MeshBasicMaterial({color:i%3?0xffc9b0:0xffe3c8,fog:false,transparent:true,opacity:.72});
  cloudMats.push(m);
  const cr=makeRng(1200+i*77);
  for(let b=0;b<3;b++){const box=new THREE.Mesh(new THREE.BoxGeometry(60+cr()*50,5,20),m);box.position.set(b*35-35,cr()*4,cr()*12);g.add(box);}
  g.position.set((cr()-.5)*1400,205+cr()*70,180+cr()*560*(cr()<.5?-1:1));clouds.add(g);
 }
 scene.add(clouds);
 // 4 corridor street point lights for sunset, twilight and midnight street staging
 const corridorLights=[];
 for(let i=0;i<4;i++){
  const pl=new THREE.PointLight(0xffcf80,0,46,1.6);
  scene.add(pl);corridorLights.push(pl);
 }
 return{sun,hemi,ambient,dome,clouds,cloudMats,disc,halo,corridorLights,
  update(dt,focus){
   sun.target.position.set(focus.x,0,focus.z);
   sun.position.set(focus.x-190,85,focus.z+52);
   dome.position.set(focus.x,0,focus.z);
   disc.position.set(focus.x-720,95,focus.z+110);halo.position.set(focus.x-726,95,focus.z+110);
   for(const c of clouds.children){c.position.x+=dt*2.2;if(c.position.x-focus.x>800)c.position.x-=1600;}
  }};
}

export function setTimeOfDay(mode='sunset'){
 const sky=world.sky,scene=world.scene,mats=world.city?.materials;
 if(!sky||!scene)return;
 if(mode==='night'){
  paintDome(sky.dome.geometry,0x060c1c,0x0e1c38,0x16284c);
  scene.fog.color.setHex(0x0c172e);scene.fog.near=175;scene.fog.far=660;
  sky.sun.color.setHex(0x6888c8);sky.sun.intensity=.38;
  sky.hemi.color.setHex(0x2c4270);sky.hemi.groundColor.setHex(0x181c28);sky.hemi.intensity=.36;
  sky.ambient.color.setHex(0x303c58);sky.ambient.intensity=.42;
  sky.disc.visible=false;sky.halo.visible=false;
  for(const m of sky.cloudMats){m.color.setHex(0x152240);m.opacity=.32;}
  if(mats){
   mats.asphalt.color.setHex(0x182030);
   mats.side.color.setHex(0x3a4254);
   mats.grass.color.setHex(0x1b3024);
   mats.sand.color.setHex(0x524c48);
   mats.water.color.setHex(0x092c44);
  }
  const pts=[[283,7.5,96,0xffc870,3.8,44],[293,7.5,104,0xffb868,3.6,44],[283,7.5,116,0x64d2ff,3.2,46],[293,7.5,126,0xffa858,3.5,48]];
  sky.corridorLights.forEach((pl,i)=>{const p=pts[i];pl.position.set(p[0],p[1],p[2]);pl.color.setHex(p[3]);pl.intensity=p[4];pl.distance=p[5];});
 }else if(mode==='golden'){
  // 'golden' (17:15 — coastal daylight preset for Shot 4 aerial start screen)
  paintDome(sky.dome.geometry,0x3b6db5,0xe8826b,0xffe09e);
  scene.fog.color.setHex(0xf4bc94);scene.fog.near=260;scene.fog.far=840;
  sky.sun.color.setHex(0xffd496);sky.sun.intensity=2.95;
  sky.hemi.color.setHex(0xd2e4ff);sky.hemi.groundColor.setHex(0xf2ba84);sky.hemi.intensity=1.38;
  sky.ambient.color.setHex(0x7c7894);sky.ambient.intensity=.85;
  sky.disc.visible=true;sky.halo.visible=true;
  for(let i=0;i<sky.cloudMats.length;i++){sky.cloudMats[i].color.setHex(i%3?0xffd8be:0xfff0da);sky.cloudMats[i].opacity=.76;}
  if(mats){
   mats.asphalt.color.setHex(0x52586c);
   mats.side.color.setHex(0xe2d2ba);
   mats.grass.color.setHex(0x66a05c);
   mats.sand.color.setHex(0xf7e2b2);
   mats.water.color.setHex(0x1eb4ca);
  }
  const pts=[[324,9,45,0xffcf78,2.4,55],[312,8,65,0xffb468,2.2,55],[324,9,85,0xffcf78,2.4,55],[288,8,50,0x58d4ff,2.0,52]];
  sky.corridorLights.forEach((pl,i)=>{const p=pts[i];pl.position.set(p[0],p[1],p[2]);pl.color.setHex(p[3]);pl.intensity=p[4];pl.distance=p[5];});
 }else if(mode==='twilight'){
  paintDome(sky.dome.geometry,0x182958,0x8e4866,0xf09c70);
  scene.fog.color.setHex(0x784862);scene.fog.near=230;scene.fog.far=780;
  sky.sun.color.setHex(0xffae70);sky.sun.intensity=1.25;
  sky.hemi.color.setHex(0x7094d8);sky.hemi.groundColor.setHex(0x98644e);sky.hemi.intensity=.72;
  sky.ambient.color.setHex(0x585272);sky.ambient.intensity=.42;
  sky.disc.visible=true;sky.halo.visible=true;
  for(let i=0;i<sky.cloudMats.length;i++){sky.cloudMats[i].color.setHex(i%3?0xd88890:0xf4b298);sky.cloudMats[i].opacity=.62;}
  if(mats){
   mats.asphalt.color.setHex(0x1e2638);
   mats.side.color.setHex(0x746e76);
   mats.grass.color.setHex(0x3e6848);
   mats.sand.color.setHex(0xc8aa82);
   mats.water.color.setHex(0x127892);
  }
  const pts=[[324,9,45,0xffcf78,2.6,55],[312,8,65,0xffb468,2.4,55],[324,9,85,0xffcf78,2.5,55],[288,8,50,0x58d4ff,2.2,52]];
  sky.corridorLights.forEach((pl,i)=>{const p=pts[i];pl.position.set(p[0],p[1],p[2]);pl.color.setHex(p[3]);pl.intensity=p[4];pl.distance=p[5];});
 }else{
  // 'sunset' (18:10 — sun-drenched golden sunset used in Shot 1 1-solstice-bay.jpg and default gameplay)
  paintDome(sky.dome.geometry,0x3458a2,0xe67c6e,0xffd892);
  scene.fog.color.setHex(0xf0b88e);scene.fog.near=250;scene.fog.far=820;
  sky.sun.color.setHex(0xffcc90);sky.sun.intensity=2.65;
  sky.hemi.color.setHex(0xc8dcff);sky.hemi.groundColor.setHex(0xeeb078);sky.hemi.intensity=1.25;
  sky.ambient.color.setHex(0x74708e);sky.ambient.intensity=.72;
  sky.disc.visible=true;sky.halo.visible=true;
  for(let i=0;i<sky.cloudMats.length;i++){sky.cloudMats[i].color.setHex(i%3?0xffd2b8:0xffead2);sky.cloudMats[i].opacity=.74;}
  if(mats){
   mats.asphalt.color.setHex(0x424a5e);
   mats.side.color.setHex(0xdcccb4);
   mats.grass.color.setHex(0x5e9656);
   mats.sand.color.setHex(0xf5dda8);
   mats.water.color.setHex(0x1ca8be);
  }
  const pts=[[324,8.5,46,0xffd488,2.4,48],[324,8.5,64,0x70a8ff,2.2,46],[314,8.0,56,0xffbe68,2.4,48],[324,8.5,84,0xffd488,2.0,46]];
  sky.corridorLights.forEach((pl,i)=>{const p=pts[i];pl.position.set(p[0],p[1],p[2]);pl.color.setHex(p[3]);pl.intensity=p[4];pl.distance=p[5];});
 }
}