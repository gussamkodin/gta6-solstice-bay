// Procedural Solstice Bay at last light: pastel art-deco blocks with lit windows and neon
// storefront signs, wet-look asphalt with neon reflection streaks, glowing street lamps,
// palms, hills, docks with gantry cranes, and five piers over the bay.
import {THREE} from './three.js';
import {BLOCK,BLOCKS,ROAD,PITCH,HALF,LAND,LANE,PALETTE,roadAt,blockAt} from './config.js';
import {rng,makeRng} from './rng.js';
const mat=(color,roughness=.82,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
// cached flat-colour materials: identical params share one material so bakeStatic merges them
const matCache=new Map();
const cmat=(color,roughness=.82,metalness=0)=>{const k=color+'|'+roughness+'|'+metalness;let m=matCache.get(k);if(!m){m=mat(color,roughness,metalness);matCache.set(k,m);}return m;};
// shared geometries hoisted out of per-prop builders
const cylCache=new Map();
const unitCyl=segments=>{let g=cylCache.get(segments);if(!g){g=new THREE.CylinderGeometry(.75,1,1,segments);cylCache.set(segments,g);}return g;};
const palmLeafGeo=new THREE.ConeGeometry(.8,Math.hypot(5.4,1.4),5);
const lampHeadGeo=new THREE.SphereGeometry(.44,8,6),sigBulbGeo=new THREE.SphereGeometry(.17,6,6);
const canopyGeo=new THREE.CylinderGeometry(.25,2.35,.55,10),houseRoofGeo=new THREE.ConeGeometry(19,7,4);
const hillGeo=new THREE.SphereGeometry(1,14,10);
const crownMats=new Map();
const crownMat=emissive=>{let m=crownMats.get(emissive);if(!m){m=new THREE.MeshStandardMaterial({color:0x201826,emissive,emissiveIntensity:2.0,roughness:.35});crownMats.set(emissive,m);}return m;};
const HOUSE_ROOFS=[0xb75243,0x905646,0x697b88];
const winRng=makeRng(707);

// Smooth radial-gradient CanvasTexture generator for additive ground & aerial light pools (zero hard edges)
export function makeRadialTexture(stops,size=128){
 const cv=document.createElement('canvas');cv.width=size;cv.height=size;
 const g=cv.getContext('2d'),r=size*.5;
 const grad=g.createRadialGradient(r,r,0,r,r,r);
 for(const [off,col] of stops)grad.addColorStop(off,col);
 g.fillStyle=grad;g.fillRect(0,0,size,size);
 const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
 return tex;
}
// canvas-texture neon signs: original Solstice Bay businesses, no external assets
const SIGNS=['SOLSTICE','LOW TIDE','PALMA CLUB','BAYSIDE DINER','MARIGOLD','NEON TIDE','HOTEL AZUL','CASINO SOL','COPPER & CO','SURF CITY','LAST LIGHT','EL FARO'];
const ROOF_SIGNS=['HOTEL SOLSTICE','PALMA SUITES','LAGUNA AZUL','MARIGOLD GRAND','CASINO SOL','BINTU PLAZA','CORAL PALACE'];
const signMats=[],roofMats=[];
function signMaterial(text,color){
 const cv=document.createElement('canvas');cv.width=256;cv.height=64;const g=cv.getContext('2d');
 const css='#'+color.toString(16).padStart(6,'0');
 g.fillStyle='#0d1220';g.fillRect(0,0,256,64);
 g.strokeStyle=css;g.lineWidth=3;g.strokeRect(5,5,246,54);
 g.font='bold 30px Arial';g.textAlign='center';g.textBaseline='middle';
 g.shadowColor=css;g.shadowBlur=16;g.fillStyle=css;g.fillText(text,128,34);g.fillText(text,128,34);
 const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
 const m=new THREE.MeshBasicMaterial({map:tex});
 m.userData.glow=color; // sidewalk spill strips reuse the sign's neon hue
 return m;
}
function roofSignMaterial(text,color){
 const cv=document.createElement('canvas');cv.width=320;cv.height=72;const g=cv.getContext('2d');
 const css='#'+color.toString(16).padStart(6,'0');
 g.fillStyle='#0f1726';g.fillRect(0,0,320,72);
 g.strokeStyle=css;g.lineWidth=5;g.strokeRect(4,4,312,64);
 g.font='bold 31px Arial';g.textAlign='center';g.textBaseline='middle';
 g.shadowColor=css;g.shadowBlur=14;g.fillStyle='#fff7e2';g.fillText(text,160,37);
 const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
 return new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide,fog:false});
}
function ensureRoofMats(){
 if(roofMats.length)return;
 const cols=[0xff4fa0,0x3fe8e0,0xffb347,0xff6b4a,0xb46bff,0x52e0c4,0xffd166];
 for(let i=0;i<ROOF_SIGNS.length;i++)roofMats.push(roofSignMaterial(ROOF_SIGNS[i],cols[i%cols.length]));
}
function addRoofSign(scene,x,h,z,w,d,m,idx,faceX=false){
 ensureRoofMats();
 const rMat=roofMats[idx%roofMats.length];
 const sw=Math.min((faceX?d:w)*.88,17),sh=3.5,y=.2+h+2.3;
 const board=new THREE.Mesh(new THREE.PlaneGeometry(sw,sh),rMat);
 if(faceX){board.position.set(x+w/2-.6,y,z);board.rotation.y=Math.PI/2;}
 else board.position.set(x,y,z+d/2-.6);
 board.userData.cityStatic=true;scene.add(board);
 // steel roof frame struts under the landmark sign
 addBox(scene,faceX?x+w/2-.7:x-sw*.32,.2+h+.5,faceX?z-sw*.32:z+d/2-.7,.35,1.6,.35,m.dark);
 addBox(scene,faceX?x+w/2-.7:x+sw*.32,.2+h+.5,faceX?z+sw*.32:z+d/2-.7,.35,1.6,.35,m.dark);
}
const boxGeo=new THREE.BoxGeometry(1,1,1),cylGeo=new THREE.CylinderGeometry(.45,.58,1,8),sphereGeo=new THREE.SphereGeometry(1,8,6);
// solid footprints used by player/car collision and AI avoidance
export const obstacles=[];
export const BUS_STOPS=[];
let busSignMatCache=null;
function getBusSignMat(){
 if(busSignMatCache)return busSignMatCache;
 const cv=document.createElement('canvas');cv.width=128;cv.height=64;const g=cv.getContext('2d');
 g.fillStyle='#0a1b26';g.fillRect(0,0,128,64);
 g.strokeStyle='#3fe8e0';g.lineWidth=4;g.strokeRect(4,4,120,56);
 g.font='bold 34px Arial';g.textAlign='center';g.textBaseline='middle';
 g.shadowColor='#3fe8e0';g.shadowBlur=12;g.fillStyle='#78fff8';g.fillText('BUS',64,34);
 const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
 busSignMatCache=new THREE.MeshBasicMaterial({map:tex});
 return busSignMatCache;
}
function busStop(scene,x,z,dirX,m){
 BUS_STOPS.push({x,z,dirX});
 const glassMat=cmat(0x285a78,.22,.45),benchMat=cmat(0x8a6444,.65,.1),cyanTrim=crownMat(PALETTE.neonCyan);
 const bx=x-dirX*.72;
 // steel posts + tinted glass back wall
 for(const dz of [-2.2,0,2.2])addBox(scene,bx,.15,z+dz,.12,2.55,.12,m.steel);
 addBox(scene,bx,.32,z,.08,2.25,4.35,glassMat).castShadow=false;
 // cantilevered shelter roof + glowing cyan edge trim
 addBox(scene,x+dirX*.08,2.68,z,2.15,.14,5.0,m.steel);
 addBox(scene,x+dirX*1.12,2.70,z,.08,.09,5.0,cyanTrim).castShadow=false;
 // passenger bench
 addBox(scene,x-dirX*.32,.52,z-.15,.54,.09,3.1,benchMat);
 for(const dz of [-1.25,.95])addBox(scene,x-dirX*.32,.15,z+dz,.44,.38,.1,m.steel);
 // backlit transit route panel on the side
 addBox(scene,x-dirX*.02,.25,z+2.32,1.42,2.25,.14,m.dark);
 addBox(scene,x-dirX*.02,.52,z+2.32,1.18,1.68,.18,m.storeGlass).castShadow=false;
 // glowing cyan BUS sign post
 const sx=x+dirX*.42,sz=z-2.95;
 addBox(scene,sx,.15,sz,.1,3.25,.1,m.steel);
 addBox(scene,sx,2.85,sz,.14,.58,.96,getBusSignMat()).castShadow=false;
}
function solid(x,z,w,d){obstacles.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});}
export function addBox(parent,x,y,z,w,h,d,material){const m=new THREE.Mesh(boxGeo,material);m.position.set(x,y+h/2,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;m.userData.cityStatic=true;parent.add(m);return m;}
export function addCylinder(parent,x,y,z,r,h,material,segments=8){const m=new THREE.Mesh(unitCyl(segments),material);m.position.set(x,y+h/2,z);m.scale.set(r,h,r);m.castShadow=true;m.userData.cityStatic=true;parent.add(m);return m;}
export function makeCity(scene){
 const t0=performance.now();
 const root=new THREE.Group();root.userData.bakeRoot=true;scene.add(root);
 const mats={asphalt:mat(PALETTE.asphalt,.34,.24),side:mat(PALETTE.sidewalk,.85,0),sand:mat(PALETTE.sand),grass:mat(PALETTE.grass),water:mat(PALETTE.water,.14,.65),white:new THREE.MeshStandardMaterial({color:0xf4ead8,emissive:0x3a4050,emissiveIntensity:.55,roughness:.5}),dark:mat(0x222c38),yellow:new THREE.MeshStandardMaterial({color:0xf4c75e,emissive:0x5a4214,emissiveIntensity:.65,roughness:.45}),line:mat(0xe9dfc7),palm:mat(0x78543c),leaf:mat(0x3d8057),roof:mat(0xc46954),steel:mat(0x69777c,.45,.5),hydrant:new THREE.MeshStandardMaterial({color:0xd93829,roughness:.4,metalness:.2})};
 // v5.1 high-contrast multi-story window grid & ground-floor glass storefront materials
 mats.winIvory=new THREE.MeshStandardMaterial({color:0xfff4d0,emissive:0xffe6a4,emissiveIntensity:2.1,roughness:.3});
 mats.winAmber=new THREE.MeshStandardMaterial({color:0xffc878,emissive:0xffaa44,emissiveIntensity:1.9,roughness:.3});
 mats.winCyan=new THREE.MeshStandardMaterial({color:0xa8ecff,emissive:0x64d2ff,emissiveIntensity:1.75,roughness:.3});
 mats.winDark=mat(0x182030,.32,.35);
 mats.windowLit=mats.winIvory;
 mats.windowCool=mats.winCyan;
 mats.windowDark=mats.winDark;
 mats.storeGlass=new THREE.MeshStandardMaterial({color:0xfff2cc,emissive:0xffe4a8,emissiveIntensity:1.95,roughness:.22});
 mats.storeFrame=mat(0x161e2c,.5,.2);
 mats.storeInteriorA=new THREE.MeshStandardMaterial({color:0xd87a4a,emissive:0x7a3818,emissiveIntensity:.8,roughness:.6});
 mats.storeInteriorB=new THREE.MeshStandardMaterial({color:0x2d6e7e,emissive:0x163c48,emissiveIntensity:.8,roughness:.6});
 mats.amberCornice=new THREE.MeshStandardMaterial({color:0xffcf88,emissive:0xffa838,emissiveIntensity:2.4,roughness:.25});
 mats.lampGlow=new THREE.MeshStandardMaterial({color:0xfff0c0,emissive:0xffcf78,emissiveIntensity:2.8,roughness:.2});
 const storeSpillTex=makeRadialTexture([[0,'rgba(255,236,178,0.92)'],[.42,'rgba(255,212,132,0.52)'],[.76,'rgba(255,188,96,0.16)'],[1,'rgba(255,180,85,0)']]);
 mats.storeSpill=new THREE.MeshBasicMaterial({map:storeSpillTex,transparent:true,opacity:.48,depthWrite:false,blending:THREE.AdditiveBlending});
 const lampPoolTex=makeRadialTexture([[0,'rgba(255,228,158,0.95)'],[.36,'rgba(255,212,136,0.62)'],[.72,'rgba(255,190,90,0.2)'],[1,'rgba(255,190,90,0)']]);
 mats.lampPool=new THREE.MeshBasicMaterial({map:lampPoolTex,transparent:true,opacity:.62,depthWrite:false,blending:THREE.AdditiveBlending});
 const lampHaloTex=makeRadialTexture([[0,'rgba(255,252,230,1)'],[.28,'rgba(255,220,140,0.75)'],[.65,'rgba(255,180,80,0.22)'],[1,'rgba(255,170,70,0)']]);
 mats.lampHalo=new THREE.MeshBasicMaterial({map:lampHaloTex,transparent:true,opacity:.85,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
 mats.wallMats=[];
 // ground and ocean to the eastern edge; warm beach separates city from sea
 addBox(root,-30,-1,0,720,1,680,mats.grass);
 // sand top sits a hair above the grass slab so the beach edge never z-fights green
 addBox(root,344,-.48,0,104,.5,700,mats.sand);
 addBox(root,450,-8,0,170,14,900,mats.water);
 // shallow turquoise shoreline water + white surf foam line right beside the beach sand
 addBox(root,392,-.36,0,58,.32,760,mats.water);
 const foam=new THREE.Mesh(new THREE.PlaneGeometry(3.2,760),new THREE.MeshBasicMaterial({color:0xe8fbff,transparent:true,opacity:.68,depthWrite:false}));
 foam.rotation.x=-Math.PI/2;foam.position.set(364,-.16,0);root.add(foam);
 // sun-glitter path on the water: a soft emissive band running out from the shore
 const shimmer=new THREE.Mesh(new THREE.PlaneGeometry(120,760),new THREE.MeshBasicMaterial({color:0xffbe7a,transparent:true,opacity:.26,depthWrite:false}));
 shimmer.rotation.x=-Math.PI/2;shimmer.position.set(438,-.15,40);root.add(shimmer);
 const shimmer2=new THREE.Mesh(new THREE.PlaneGeometry(46,760),new THREE.MeshBasicMaterial({color:0xfff0b8,transparent:true,opacity:.34,depthWrite:false}));
 shimmer2.rotation.x=-Math.PI/2;shimmer2.position.set(398,-.14,40);root.add(shimmer2);
 // Ocean Drive coastal boulevard along x=324 right beside the beach & ocean
 addBox(root,324,0,0,ROAD,.085,720,mats.asphalt);
 addBox(root,324-.24,.09,0,.14,.015,690,mats.yellow);addBox(root,324+.24,.09,0,.14,.015,690,mats.yellow);
 for(let seg=-330;seg<=330;seg+=14)for(const offset of [-3.7,3.7])addBox(root,324+offset,.09,seg,.12,.015,6,mats.white);
 addBox(root,305,.03,0,22,.14,700,mats.side);addBox(root,333.5,.03,0,3,.14,700,mats.side);
 // v4 horizon: smooth layered coastal ridges in dusk haze instead of sharp pyramid cones
 for(let i=0;i<13;i++){const r=38+rng()*26;const m=new THREE.Mesh(hillGeo,cmat([0x5e547a,0x6e6088,0x7e6d8e][i%3]));m.scale.set(1.7*r,.55*r,1.1*r);m.position.set(-390+i*45+(rng()-.5)*8,-2-rng()*3,-310-rng()*70);root.add(m);}
 // western harbor channel behind the docks: water + sunset shimmer so Shot 3 reads as a
 // working port on the bay (tops sit above the grass slab so they are never buried)
 addBox(root,-140,-.5,-275,260,.56,65,mats.water);
 const harborGlow=new THREE.Mesh(new THREE.PlaneGeometry(220,38),new THREE.MeshBasicMaterial({color:0xffa86a,transparent:true,opacity:.32,depthWrite:false}));
 harborGlow.rotation.x=-Math.PI/2;harborGlow.position.set(-140,.08,-268);root.add(harborGlow);
 // street and intersections
 for(let i=0;i<=BLOCKS;i++){const c=roadAt(i);addBox(root,c,0,0,ROAD,.08,720,mats.asphalt);addBox(root,0,0,c,720,.08,ROAD,mats.asphalt);
  // v4.1 boulevard markings: crisp twin center yellows + dashed white outer lane lines
  addBox(root,c-.24,.084,0,.14,.015,690,mats.yellow);addBox(root,c+.24,.084,0,.14,.015,690,mats.yellow);
  addBox(root,0,.084,c-.24,690,.015,.14,mats.yellow);addBox(root,0,.084,c+.24,690,.015,.14,mats.yellow);
  for(let seg=-330;seg<=330;seg+=14)for(const offset of [-3.7,3.7]){
   addBox(root,c+offset,.084,seg,.12,.015,6,mats.white);addBox(root,seg,.084,c+offset,6,.015,.12,mats.white);
  }
  for(let j=0;j<9;j++){const z=roadAt(j);if(i<8){addBox(root,c,0,z+ROAD/2+1.1,ROAD,.18,2.2,mats.side);addBox(root,c,0,z-ROAD/2-1.1,ROAD,.18,2.2,mats.side);} }
  // v5.1 landscaped boulevard center median strip (non-colliding visual detail between intersections)
  for(let j=0;j<BLOCKS;j++){
   const cz=blockAt(j);
   addBox(root,c,.082,cz,1.1,.1,34,mats.side);
   addBox(root,c,.14,cz,.76,.07,32.6,mats.grass);
   for(const off of [-11,0,11]){
    addBox(root,c,.18,cz+off,.64,.24,2.0,mats.leaf);
    addBox(root,c,.38,cz+off,.38,.08,1.1,mats.yellow);
   }
  }
 }
 // blocks: each gets sidewalk pads, varied buildings, rooftop detail, plazas and palms
 for(let bx=0;bx<BLOCKS;bx++)for(let bz=0;bz<BLOCKS;bz++){
  const cx=blockAt(bx),cz=blockAt(bz),isDowntown=bx>=3&&bx<=5&&bz>=2&&bz<=5,isPort=bz===0&&bx<=3,isBeach=bx===7,isSuburb=bz>=6&&bx<=2;
  addBox(root,cx,.03,cz,BLOCK,.12,BLOCK,mats.side);
  if(isBeach){
   // Glasshouse Strand beachfront: Art Deco resort hotels on the west side of Strand Ave (x=288),
   // boutique oceanfront hotel row on the east side (x=304.5), boardwalk, dense palms & 8 parasols on the sand
   addBox(root,cx,.12,cz,BLOCK,.08,BLOCK,cmat(0xebd6a7));
   addBox(root,335,.16,cz,4.5,.1,BLOCK,cmat(0xc8b082));
   if(bz!==3){
    const h=28+((bz*2)%4)*6,wall=cmat(PALETTE.pastel[(bz*2)%PALETTE.pastel.length]);
    mats.wallMats.push(wall);
    building(root,cx+6,cz,38,h,44,wall,mats,true);
    neonSign(root,cx+6,cz,38,44,mats);
    addRoofSign(root,cx+6,h,cz,38,44,mats,bz,false);
    addRoofSign(root,cx+6,h,cz,38,44,mats,bz+1,true);
   }
   // boutique oceanfront Art Deco hotel row at x=304.5 flanking Strand Ave (x=288) and Ocean Drive (x=324)
   const bh=19+(bz%4)*4.5,bWall=cmat(PALETTE.pastel[(bz+3)%PALETTE.pastel.length]);
   mats.wallMats.push(bWall);
   building(root,304.5,cz,15,bh,44,bWall,mats,true);
   neonSign(root,304.5,cz,15,44,mats);
   addRoofSign(root,304.5,bh,cz,15,44,mats,bz,false);
   addRoofSign(root,304.5,bh,cz,15,44,mats,bz+2,true);
   // dense palm rows flanking the coastal boulevard (x=314.5 and x=337.5)
   for(let p=0;p<4;p++){
    palm(root,314.5,.17,cz-22+p*15,mats);
    palm(root,337.5,.17,cz-20+p*15,mats);
   }
   // 8 colorful beach umbrellas/parasols with tilted canopy discs + beach towels on the sand
   const uCols=[0xff4f5e,0xffd23f,0x2de2e6,0xff4fa0,0xff8c42,0x3fe8b0,0x6a8dff,0xff5e7e];
   for(let k=0;k<8;k++){
    const ux=343+(k%2)*10,uz=cz-23+k*6.6,uMat=cmat(uCols[k],.5);
    addBox(root,ux+.8,.18,uz,3.4,.08,1.5,uMat); // beach towel
    addCylinder(root,ux,.18,uz,.1,2.5,mats.white,6); // umbrella pole
    const canopy=new THREE.Mesh(canopyGeo,uMat);
    canopy.position.set(ux,2.65,uz);canopy.rotation.z=(k%2?.14:-.14);canopy.castShadow=true;canopy.userData.cityStatic=true;root.add(canopy);
   }
   continue;
  }
  if(isPort){
   addBox(root,cx,.12,cz,48,.08,48,cmat(0x707b7c));
   for(let k=0;k<4;k++)container(root,cx-17+(k%2)*19,.18,cz-17+Math.floor(k/2)*17,16,6+rng()*3,cmat(PALETTE.portColors[(bx+k)%PALETTE.portColors.length]));
   // two gantry cranes frame the Copperworks docks and silhouette cleanly at sunset
   if(bx<=1){crane(root,cx+17,.15,cz+5,mats.steel);crane(root,cx-20,.15,cz-8,mats.steel);}
   continue;
  }
  if(isSuburb&&rng()<.8){house(root,cx,cz,bx,bz);for(let p=0;p<2;p++)palm(root,cx-21+p*39,.16,cz+24,mats);continue;}
  if(rng()<.15){for(let p=0;p<4;p++)palm(root,cx-21+(p%2)*42,.16,cz-20+Math.floor(p/2)*40,mats);addBox(root,cx,.15,cz,30,.08,30,cmat(0x8db77b));continue;}
  const count=isDowntown?1+(rng()>.6?1:0):1;
  for(let b=0;b<count;b++){
   const x=cx+(count===1?0:(b===0?-13:13)),z=cz+(rng()-.5)*9;
   const w=count===1?40:22,d=count===1?42:24;
   const floors=isDowntown?7+rng.int(0,13):2+rng.int(0,5),h=floors*(isDowntown?4.2:3.2);
   const wallMat=cmat(PALETTE.pastel[rng.int(0,PALETTE.pastel.length-1)]);
   mats.wallMats.push(wallMat);
   building(root,x,z,w,h,d,wallMat,mats,isDowntown);
   neonSign(root,x,z,w,d,mats);
   if(isDowntown||bx>=5)addRoofSign(root,x,h,z,w,d,mats,bx+bz+b,bx===6);
  }
  sidewalkVendors(root,cx,cz,bx,bz,mats);
  for(let p=0;p<2;p++)palm(root,cx+(p?21:-21),.15,cz+22,mats);
 }
 // waterfront promenade and pier
 addBox(root,364,.15,0,6,.3,690,cmat(0xb29a70));
 for(let k=0;k<5;k++){addBox(root,385,.08,-170+k*85,42,.2,10,cmat(0x967954));for(let p=0;p<4;p++)addBox(root,369+p*10,.5,-174+k*85,.6,.8,.6,mats.dark);}
 // sculpted cantilevered boulevard street lamps with smooth radial ground pools & aerial bulb halos
 const sigRed=new THREE.MeshBasicMaterial({color:0xff3b4e}),sigAmber=new THREE.MeshBasicMaterial({color:0xffbe3b}),sigGreen=new THREE.MeshBasicMaterial({color:0x3bf59b});
 const poolGeo=new THREE.PlaneGeometry(11,11),haloGeo=new THREE.PlaneGeometry(2.4,2.4);
 const streetLamp=(lx,lz,armDx,armDz)=>{
  addBox(root,lx,.1,lz,.26,6.2,.26,mats.dark);
  addBox(root,lx+armDx*.5,6.15,lz+armDz*.5,Math.abs(armDx)||.22,.18,Math.abs(armDz)||.22,mats.dark);
  const bx=lx+armDx,bz=lz+armDz;
  const head=new THREE.Mesh(lampHeadGeo,mats.lampGlow);
  head.position.set(bx,6.05,bz);head.castShadow=false;head.userData.cityStatic=true;root.add(head);
  for(const ry of [0,Math.PI/2]){
   const halo=new THREE.Mesh(haloGeo,mats.lampHalo);
   halo.position.set(bx,6.05,bz);halo.rotation.y=ry;halo.userData.cityStatic=true;root.add(halo);
  }
  const pool=new THREE.Mesh(poolGeo,mats.lampPool);
  pool.rotation.x=-Math.PI/2;pool.position.set(bx,.088,bz);pool.userData.cityStatic=true;root.add(pool);
 };
 for(let bx=0;bx<BLOCKS;bx++){
  const bc=blockAt(bx);
  for(const off of [-18,0,18]){
   streetLamp(324-8.4,bc+off,1.8,0);streetLamp(324+8.4,bc+off,-1.8,0);
  }
 }
 for(let i=0;i<=BLOCKS;i++)for(let j=0;j<=BLOCKS;j++){
  const x=roadAt(i),z=roadAt(j);
  if(i<8&&j<8){for(let s=0;s<5;s++){addBox(root,x-6+s*3,.086,z-7,1.3,.04,2.2,mats.white);addBox(root,x-6+s*3,.086,z+7,1.3,.04,2.2,mats.white);}}
  if(j<BLOCKS){
   const cz=blockAt(j);
   for(const off of [-18,0,18]){
    streetLamp(x-8.4,cz+off,1.8,0);streetLamp(x+8.4,cz+off,-1.8,0);
   }
   // red fire hydrants on sidewalk corners along boulevards
   addBox(root,x-8.6,.15,cz-23,.34,.72,.34,mats.hydrant);
   addBox(root,x+8.6,.15,cz+23,.34,.72,.34,mats.hydrant);
  }
  // intersection traffic light signal gantry with glowing red/amber/green bulbs
  const gx=x+9.2,gz=z+9.2;
  addBox(root,gx,.1,gz,.3,6.6,.3,mats.dark);
  addBox(root,gx-3.2,6.2,gz,6.4,.24,.24,mats.dark);
  addBox(root,gx-4.4,5.4,gz,.55,1.4,.45,mats.dark);
  for(const [dy,mSig] of [[.38,sigRed],[0,sigAmber],[-.38,sigGreen]]){
   const b=new THREE.Mesh(sigBulbGeo,mSig);
   b.position.set(gx-4.4,5.9+dy,gz+.26);b.userData.cityStatic=true;root.add(b);
  }
 }
 // Civic landmarks and location signage
 addBox(root,blockAt(4),.2,blockAt(4),24,.3,28,cmat(0x7e9d73));
 addBox(root,blockAt(4),.5,blockAt(4),16,1.2,2,cmat(0xdad1b7));
 // Sleek Bus Stop shelters along Ocean Drive and main boulevards
 BUS_STOPS.length=0;
 const stopSpots=[
  [314.6,blockAt(1)+9,1],[314.6,blockAt(3)+9,1],[314.6,blockAt(5)+9,1],
  [roadAt(8)-9.4,blockAt(2)-9,1],[roadAt(8)-9.4,blockAt(4)+9,1],[roadAt(8)-9.4,blockAt(6)-9,1],
  [roadAt(7)+9.4,blockAt(2)+9,-1],[roadAt(7)+9.4,blockAt(4)-9,-1],[roadAt(7)+9.4,blockAt(5)+9,-1],
  [roadAt(5)+9.4,blockAt(3)+9,-1],[roadAt(5)+9.4,blockAt(4)-9,-1],
  [roadAt(4)-9.4,blockAt(3)-9,1],[roadAt(4)-9.4,blockAt(5)+9,1],
 ];
 for(const [sx,sz,dx] of stopSpots)busStop(root,sx,sz,dx,mats);
 // bake all static boxes into a few hundred merged meshes: ~2000 draw calls become ~40
 bakeStatic(root);
 console.log('city built in',Math.round(performance.now()-t0),'ms, meshes:',root.children.length);
 return {materials:mats};
}
function bakeStatic(scene){
 const buckets=new Map();
 scene.updateMatrixWorld(true);
 scene.traverse(o=>{if(o.isMesh&&o.geometry&&o.parent&&o.userData.cityStatic){const key=o.material.uuid;if(!buckets.has(key))buckets.set(key,{material:o.material,geos:[],meshes:[]});const geo=o.geometry.clone().applyMatrix4(o.matrixWorld);buckets.get(key).geos.push(geo);buckets.get(key).meshes.push(o);}});
 for(const {material,geos,meshes} of buckets.values()){
  if(meshes.length<2)continue; // a single mesh gains nothing from merging
  const merged=mergeGeometries(geos);
  if(!merged)continue;
  const mesh=new THREE.Mesh(merged,material);
  const isLit=material.transparent||material.blending===THREE.AdditiveBlending||(material.emissiveIntensity&&material.emissiveIntensity>.8);
  mesh.castShadow=!isLit;
  mesh.receiveShadow=!material.transparent&&material.blending!==THREE.AdditiveBlending;
  for(const old of meshes)old.parent.remove(old);
  scene.add(mesh);
 }
}
// minimal geometry merge (position/normal/uv only, all non-indexed)
function mergeGeometries(geos){
 let total=0;const list=geos.map(g=>{const n=g.index?g.toNonIndexed():g;total+=n.attributes.position.count;return n;});
 const pos=new Float32Array(total*3),nor=new Float32Array(total*3),uv=new Float32Array(total*2);
 let o=0;
 for(const g of list){pos.set(g.attributes.position.array,o*3);if(g.attributes.normal)nor.set(g.attributes.normal.array,o*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,o*2);o+=g.attributes.position.count;}
 const out=new THREE.BufferGeometry();
 out.setAttribute('position',new THREE.BufferAttribute(pos,3));
 out.setAttribute('normal',new THREE.BufferAttribute(nor,3));
 out.setAttribute('uv',new THREE.BufferAttribute(uv,2));
 return out;
}
function palm(scene,x,y,z,m){addCylinder(scene,x,y,z,.55,9,m.palm,7);const top=new THREE.Vector3(x,y+8.7,z);for(let i=0;i<9;i++){const a=i*Math.PI*2/9;const end=new THREE.Vector3(x+Math.cos(a)*5.4,y+7.3,z+Math.sin(a)*5.4);const dir=end.clone().sub(top);const leaf=new THREE.Mesh(palmLeafGeo,m.leaf);leaf.position.copy(top).add(end).multiplyScalar(.5);leaf.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());leaf.castShadow=true;leaf.userData.cityStatic=true;scene.add(leaf);}addBox(scene,x,y+8.2,z,.55,.45,.55,m.palm);}
function building(scene,x,z,w,h,d,wall,m,isTall){
 solid(x,z,w,d);addBox(scene,x,.2,z,w,h,d,wall);addBox(scene,x,.2+h,z,w+1,.5,d+1,cmat(0xe2ceb0));
 // 1. Ground-floor illuminated glass storefronts (y = 0.35..3.45) on all 4 faces + architectural mullions + interior display depth
 const sw=Math.max(4,w-1.4),sd=Math.max(4,d-1.4);
 const mColsZ=Math.max(2,Math.floor(sw/3.5)),mColsX=Math.max(2,Math.floor(sd/3.5));
 for(const side of [-1,1]){
  // +-z storefront glass & dark frame
  addBox(scene,x,.3,z+side*(d/2+.03),sw+.32,3.22,.05,m.storeFrame).castShadow=false;
  addBox(scene,x,.38,z+side*(d/2+.065),sw,2.96,.05,m.storeGlass).castShadow=false;
  addBox(scene,x,2.62,z+side*(d/2+.1),sw,.11,.06,m.storeFrame).castShadow=false;
  for(let k=0;k<=mColsZ;k++){
   const mx=x-sw/2+(k/mColsZ)*sw;
   addBox(scene,mx,.3,z+side*(d/2+.1),.18,3.22,.07,m.storeFrame).castShadow=false;
   if(k<mColsZ){
    const bw=sw/mColsZ,bx=x-sw/2+(k+.5)*bw;
    addBox(scene,bx,.38,z+side*(d/2+.09),bw*.56,.72,.04,(k+(side>0?0:1))%2?m.storeInteriorA:m.storeInteriorB).castShadow=false;
   }
  }
  const spZ=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w*.92,16),5.5),m.storeSpill);
  spZ.rotation.x=-Math.PI/2;spZ.position.set(x,.165,z+side*(d/2+2.3));spZ.userData.cityStatic=true;scene.add(spZ);
  // +-x storefront glass & dark frame
  addBox(scene,x+side*(w/2+.03),.3,z,.05,3.22,sd+.32,m.storeFrame).castShadow=false;
  addBox(scene,x+side*(w/2+.065),.38,z,.05,2.96,sd,m.storeGlass).castShadow=false;
  addBox(scene,x+side*(w/2+.1),2.62,z,.06,.11,sd,m.storeFrame).castShadow=false;
  for(let k=0;k<=mColsX;k++){
   const mz=z-sd/2+(k/mColsX)*sd;
   addBox(scene,x+side*(w/2+.1),.3,mz,.07,3.22,.18,m.storeFrame).castShadow=false;
   if(k<mColsX){
    const bd=sd/mColsX,bz=z-sd/2+(k+.5)*bd;
    addBox(scene,x+side*(w/2+.09),.38,bz,.04,.72,bd*.56,(k+(side>0?1:0))%2?m.storeInteriorA:m.storeInteriorB).castShadow=false;
   }
  }
  const spX=new THREE.Mesh(new THREE.PlaneGeometry(5.5,Math.min(d*.92,16)),m.storeSpill);
  spX.rotation.x=-Math.PI/2;spX.position.set(x+side*(w/2+2.3),.165,z);spX.userData.cityStatic=true;scene.add(spX);
 }
 // Continuous glowing amber neon cornice strip wrapping above the ground-floor storefronts (y = 3.85)
 addBox(scene,x,3.85,z,w+.32,.22,d+.32,m.amberCornice).castShadow=false;
 // 2. Dense multi-story window grids (y = 5.0..h-1.2) across all 4 building faces (+z, -z, +x, -x)
 const winMat=()=>{const r=winRng();return r<.55?m.winIvory:r<.77?m.winAmber:r<.87?m.winCyan:m.winDark;};
 const colsZ=Math.max(4,Math.min(7,Math.floor(w/5.2)));
 const colsX=Math.max(4,Math.min(7,Math.floor(d/5.2)));
 const spanZ=w*.84,winW=(spanZ/colsZ)*.66;
 const spanX=d*.84,winD=(spanX/colsX)*.66;
 for(let floor=5.0;floor<h-1.2;floor+=3.1){
  for(const side of [-1,1]){
   for(let c=0;c<colsZ;c++){
    const wx=x-spanZ/2+(c+.5)*(spanZ/colsZ);
    addBox(scene,wx,.2+floor,z+side*(d/2+.05),winW,1.72,.08,winMat()).castShadow=false;
   }
   for(let c=0;c<colsX;c++){
    const wz=z-spanX/2+(c+.5)*(spanX/colsX);
    addBox(scene,x+side*(w/2+.05),.2+floor,wz,.08,1.72,winD,winMat()).castShadow=false;
   }
  }
 }
 addBox(scene,x,.2+h+.55,z,w*.35,.7,d*.35,isTall?m.roof:m.white);if(isTall){addBox(scene,x,.2+h+1.4,z,w*.16,1,d*.16,m.roof);
  // art-deco neon crown strip wrapping all 4 sides of the roofline
  const crown=crownMat(rng.pick([PALETTE.neonPink,PALETTE.neonCyan,PALETTE.neonAmber,PALETTE.neonViolet]));
  addBox(scene,x,.2+h+.48,z,w+1.1,.24,d+1.1,crown).castShadow=false;
 }}
// glowing storefront signs above the street-level floor: every building advertises on
// its road-facing walls, so any street view carries neon at thumbnail size
function neonSign(scene,x,z,w,d,m){
 if(!signMats.length){const colors=[PALETTE.neonPink,PALETTE.neonCyan,PALETTE.neonAmber,PALETTE.neonViolet];for(let i=0;i<SIGNS.length;i++)signMats.push(signMaterial(SIGNS[i],colors[i%colors.length]));}
 const faces=[];
 if(rng.chance(.92))faces.push('z');
 if(rng.chance(.6))faces.push('x');
 for(const face of faces){
  const matSign=rng.pick(signMats);
  const sw=Math.min((face==='z'?w:d)*.85,13),sh=2.8;
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(sw,sh),matSign);
  if(face==='z')sign.position.set(x,5.6,z+d/2+.18);
  else{sign.position.set(x+w/2+.18,5.6,z);sign.rotation.y=Math.PI/2;}
  sign.userData.cityStatic=true;scene.add(sign);
  // dark backing board so the sign reads as a mounted box, not a floating decal
  const back=addBox(scene,face==='z'?x:x+w/2+.09,4.2,face==='z'?z+d/2+.09:z,face==='z'?sw+.5:.18,sh+.4,face==='z'?.18:sw+.5,m.dark);
  back.castShadow=false;
 }
 // a vertical blade sign jutting over the sidewalk on some corners
 if(rng.chance(.3)){
  const matSign=rng.pick(signMats);
  const blade=new THREE.Mesh(new THREE.PlaneGeometry(6,1.7),matSign);
  blade.position.set(x-w/2-2.4,8.2,z+d/2-.5);blade.rotation.y=Math.PI/2;
  blade.userData.cityStatic=true;scene.add(blade);
 }
}
const vendorCanopyMats=[mat(0xff5e78,.5),mat(0x3fe8e0,.5),mat(0xffb84a,.5),mat(0xb46bff,.5)];
function sidewalkVendors(scene,cx,cz,bx,bz,m){
 // Colorful street vendor food/drink carts & sidewalk café tables along the block perimeter sidewalks
 const spots=[[cx-19,cz-24.2,0,(bx+bz)%4],[cx+19,cz+24.2,Math.PI,(bx+bz+2)%4]];
 for(const [vx,vz,rot,cIdx] of spots){
  const canopyMat=vendorCanopyMats[cIdx];
  // vendor cart counter + glowing menu strip + canopy awning + 4 support poles + warm hanging lantern
  addBox(scene,vx,.15,vz,2.8,.92,1.15,m.dark);
  addBox(scene,vx,.55,vz+(rot?-.6:.6),2.4,.42,.06,m.storeGlass).castShadow=false;
  addBox(scene,vx,2.38,vz,3.3,.2,2.1,canopyMat);
  addBox(scene,vx,2.24,vz,.24,.18,.24,m.lampGlow).castShadow=false;
  for(const dx of [-1.45,1.45])for(const dz of [-.85,.85])addBox(scene,vx+dx,.15,vz+dz,.09,2.25,.09,m.steel);
  // companion sidewalk café bistro table + parasol umbrella + 2 stools
  const tx=vx+(rot?-3.6:3.6),tz=vz;
  addBox(scene,tx,.15,tz,1.1,.74,1.1,m.white);
  addCylinder(scene,tx,.15,tz,.08,2.2,m.steel,6);
  addBox(scene,tx,2.28,tz,2.1,.16,2.1,vendorCanopyMats[(cIdx+1)%4]);
  addBox(scene,tx-.85,.15,tz,.42,.48,.42,m.roof);
  addBox(scene,tx+.85,.15,tz,.42,.48,.42,m.roof);
 }
}
function house(scene,x,z,bx,bz){solid(x,z,27,22);const wall=cmat(PALETTE.pastel[rng.int(0,PALETTE.pastel.length-1)]),roof=cmat(HOUSE_ROOFS[rng.int(0,2)]);addBox(scene,x,.15,z,27,8,22,wall);const r=new THREE.Mesh(houseRoofGeo,roof);r.position.set(x,11,z);r.rotation.y=Math.PI/4;r.userData.cityStatic=true;scene.add(r);const winM=cmat(0x91bccb);for(let side of [-1,1])addBox(scene,x+side*7,3.5,z+11.05,4,3,.12,winM);}
function container(scene,x,y,z,w,h,m){solid(x,z,w,8);addBox(scene,x,y,z,w,h,8,m);const rib=cmat(0x303b40);for(let i=-w/2+1;i<w/2;i+=2)addBox(scene,x+i,y,z+4.05,.08,h*.9,.08,rib);}
function crane(scene,x,y,z,m){
 // gantry silhouette: paired uprights, crossbeam, trolley rail, diagonal bracing
 addBox(scene,x,y,z,1.2,26,1.2,m);addBox(scene,x+22,y,z,1.2,26,1.2,m);
 addBox(scene,x+11,y+25,z,25,1.3,1.3,m);addBox(scene,x+11,y+22,z+8,23,.6,.6,m);
 addBox(scene,x+11,y+18,z+8,.8,8,.8,m);
 const brace=(a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);const bar=addBox(scene,x+a[0],y+a[1],z+4,.55,len,.55,m);bar.position.set(x+(a[0]+b[0])/2,y+(a[1]+b[1])/2,z+4);bar.rotation.z=-Math.atan2(dx,dy);};
 brace([0,2],[11,24]);brace([22,2],[11,24]);
}
