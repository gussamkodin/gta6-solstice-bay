// Golden-hour sky dome, warm sun with shadows, hemisphere fill, fog and slow day drift.
import {THREE} from './three.js';
import {PALETTE} from './config.js';
export function makeSky(scene,renderer){
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const sun=new THREE.DirectionalLight(0xffe0b0,2.1);
 sun.position.set(-140,190,120);sun.castShadow=true;
 sun.shadow.mapSize.set(2048,2048);
 const sc=sun.shadow.camera;sc.left=-120;sc.right=120;sc.top=120;sc.bottom=-120;sc.near=20;sc.far=600;
 sun.shadow.bias=-0.0006;
 scene.add(sun);scene.add(sun.target);
 const hemi=new THREE.HemisphereLight(0xbfe0f0,0xd8a878,.85);scene.add(hemi);
 scene.fog=new THREE.Fog(PALETTE.fog,220,760);
 // gradient dome via vertex colors on a big sphere
 const geo=new THREE.SphereGeometry(850,24,12);
 const colors=[];const pos=geo.attributes.position;
 const top=new THREE.Color(PALETTE.skyTop),hor=new THREE.Color(PALETTE.skyHorizon);
 for(let i=0;i<pos.count;i++){const t=Math.max(0,pos.getY(i)/850);const c=hor.clone().lerp(top,Math.pow(t,.6));colors.push(c.r,c.g,c.b);}
 geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 const dome=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false}));
 scene.add(dome);
 // sun disc
 const disc=new THREE.Mesh(new THREE.CircleGeometry(38,24),new THREE.MeshBasicMaterial({color:0xfff2cc,fog:false}));
 disc.position.set(-560,180,430);disc.lookAt(0,0,0);scene.add(disc);
 // drifting clouds: flat soft boxes high up
 const clouds=new THREE.Group();
 for(let i=0;i<10;i++){const g=new THREE.Group();const m=new THREE.MeshBasicMaterial({color:0xfff3e0,fog:false,transparent:true,opacity:.85});for(let b=0;b<3;b++){const box=new THREE.Mesh(new THREE.BoxGeometry(60+Math.random()*50,6,22),m);box.position.set(b*35-35,Math.random()*4,Math.random()*12);g.add(box);}g.position.set((Math.random()-.5)*1400,240+Math.random()*90,(Math.random()-.5)*1400);clouds.add(g);}
 scene.add(clouds);
 return{sun,hemi,dome,clouds,
  update(dt,focus){sun.target.position.set(focus.x,0,focus.z);sun.position.set(focus.x-140,190,focus.z+120);dome.position.set(focus.x,0,focus.z);for(const c of clouds.children){c.position.x+=dt*2.2;if(c.position.x-focus.x>800)c.position.x-=1600;}}}
}
