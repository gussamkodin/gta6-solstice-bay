// Procedural Solstice Bay at last light: pastel art-deco blocks with lit windows and neon
// storefront signs, wet-look asphalt with neon reflection streaks, glowing street lamps,
// palms, hills, docks with gantry cranes, and five piers over the bay.
import {THREE} from './three.js';
import {BLOCK,BLOCKS,ROAD,PITCH,HALF,LAND,LANE,PALETTE,roadAt,blockAt} from './config.js';
import {rng} from './rng.js';
const mat=(color,roughness=.82,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
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
function solid(x,z,w,d){obstacles.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});}
export function addBox(parent,x,y,z,w,h,d,material){const m=new THREE.Mesh(boxGeo,material);m.position.set(x,y+h/2,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;m.userData.cityStatic=true;parent.add(m);return m;}
export function addCylinder(parent,x,y,z,r,h,material,segments=8){const m=new THREE.Mesh(new THREE.CylinderGeometry(r*.75,r,h,segments),material);m.position.set(x,y+h/2,z);m.castShadow=true;parent.add(m);return m;}
export function makeCity(scene){
 const root=new THREE.Group();root.userData.bakeRoot=true;scene.add(root);
 const mats={asphalt:mat(PALETTE.asphalt,.3,.28),side:mat(PALETTE.sidewalk),sand:mat(PALETTE.sand),grass:mat(PALETTE.grass),water:mat(PALETTE.water,.14,.65),white:mat(0xf4ead8),dark:mat(0x34424a),yellow:mat(0xf4c75e),line:mat(0xe9dfc7),palm:mat(0x78543c),leaf:mat(0x3d8057),roof:mat(0xc46954),steel:mat(0x69777c,.45,.5)};
 // dusk windows glow warm or cool; a dark share keeps the facades believable
 mats.windowLit=new THREE.MeshStandardMaterial({color:0x3a2c18,emissive:PALETTE.windowLit,emissiveIntensity:1.5,roughness:.4});
 mats.windowCool=new THREE.MeshStandardMaterial({color:0x14222c,emissive:PALETTE.windowCool,emissiveIntensity:1.2,roughness:.4});
 mats.windowDark=mat(0x39465a,.3,.3);
 mats.lampGlow=new THREE.MeshStandardMaterial({color:0xffe1a0,emissive:0xffc878,emissiveIntensity:2.2,roughness:.3});
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
 addBox(root,314.5,.03,0,3,.14,700,mats.side);addBox(root,333.5,.03,0,3,.14,700,mats.side);
 // v4.1: the lane itself stays clean sun-lit asphalt — no opaque neon planks mid-road.
 // Only subtle low-opacity curb-side reflection pools near the buildings remain, so
 // markings, car paint and long shadows carry the contrast at contact-sheet size.
 const roadGlow=[0xff4fa0,0x3fe8e0,0xffb347,0xb46bff];
 const poolMat=(color)=>new THREE.MeshBasicMaterial({color,transparent:true,opacity:.16,depthWrite:false});
 for(let row=0;row<=BLOCKS;row++){
  const c=roadAt(row);
  for(let k=0;k<10;k++){
   const along=-300+k*64;
   for(const side of [-6.6,6.6]){
    const pool=new THREE.Mesh(new THREE.PlaneGeometry(9,1.6),poolMat(roadGlow[(row+k+(side>0?1:0))%roadGlow.length]));
    pool.rotation.x=-Math.PI/2;pool.position.set(along,.085,c+side);pool.userData.cityStatic=true;root.add(pool);
    const pool2=new THREE.Mesh(new THREE.PlaneGeometry(1.6,9),poolMat(roadGlow[(row+k+(side>0?2:0))%roadGlow.length]));
    pool2.rotation.x=-Math.PI/2;pool2.position.set(c+side,.085,along);pool2.userData.cityStatic=true;root.add(pool2);
   }
  }
 }
 // v4 horizon: smooth layered coastal ridges in dusk haze instead of sharp pyramid cones
 for(let i=0;i<13;i++){const r=38+rng()*26;const m=new THREE.Mesh(new THREE.SphereGeometry(r,14,10),mat([0x5e547a,0x6e6088,0x7e6d8e][i%3]));m.scale.set(1.7,.55,1.1);m.position.set(-390+i*45+(rng()-.5)*8,-2-rng()*3,-310-rng()*70);root.add(m);}
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
 }
 // blocks: each gets sidewalk pads, varied buildings, rooftop detail, plazas and palms
 for(let bx=0;bx<BLOCKS;bx++)for(let bz=0;bz<BLOCKS;bz++){
  const cx=blockAt(bx),cz=blockAt(bz),isDowntown=bx>=3&&bx<=5&&bz>=2&&bz<=5,isPort=bz===0&&bx<=3,isBeach=bx===7,isSuburb=bz>=6&&bx<=2;
  addBox(root,cx,.03,cz,BLOCK,.12,BLOCK,mats.side);
  if(isBeach){
   // Glasshouse Strand beachfront: Art Deco resort hotels on the west side, boardwalk, dense palms & 8 parasols on the sand
   addBox(root,cx,.12,cz,BLOCK,.08,BLOCK,mat(0xebd6a7));
   addBox(root,335,.16,cz,4.5,.1,BLOCK,mat(0xc8b082));
   if(bz!==3&&bz!==7){
    const h=22+(bz%3)*6,wall=mat(PALETTE.pastel[(bz*2)%PALETTE.pastel.length]);
    building(root,cx-6,cz,32,h,36,wall,mats,true);
    neonSign(root,cx-6,cz,32,36,mats);
    addRoofSign(root,cx-6,h,cz,32,36,mats,bz,false);
    addRoofSign(root,cx-6,h,cz,32,36,mats,bz+1,true);
   }
   // boutique oceanfront Art Deco hotel row at x=303 facing Ocean Drive (x=324) and the sea
   const bh=16+(bz%4)*4.5,bWall=mat(PALETTE.pastel[(bz+3)%PALETTE.pastel.length]);
   addBox(root,303,.2,cz,16,bh,42,bWall);addBox(root,303,.2+bh,cz,17,.5,43,mat(0xf4ead8));
   for(let fl=2.8;fl<bh;fl+=3.4)for(let cl=-1;cl<=1;cl++){
    addBox(root,311.06,.2+fl,cz+cl*12,.08,1.5,4.2,mats.windowLit).castShadow=false;
    addBox(root,303+cl*4,.2+fl,cz+21.06,3.2,1.5,.08,mats.windowCool).castShadow=false;
   }
   neonSign(root,303,cz,16,42,mats);
   addRoofSign(root,303,bh,cz,16,42,mats,bz,false);
   addRoofSign(root,303,bh,cz,16,42,mats,bz+2,true);
   // dense palm rows flanking the coastal boulevard (x=315 and x=338)
   for(let p=0;p<4;p++){
    palm(root,314.5,.17,cz-22+p*15,mats);
    palm(root,337.5,.17,cz-20+p*15,mats);
   }
   // 8 colorful beach umbrellas/parasols with tilted canopy discs + beach towels on the sand
   const uCols=[0xff4f5e,0xffd23f,0x2de2e6,0xff4fa0,0xff8c42,0x3fe8b0,0x6a8dff,0xff5e7e];
   for(let k=0;k<8;k++){
    const ux=343+(k%2)*10,uz=cz-23+k*6.6,uMat=mat(uCols[k],.5);
    addBox(root,ux+.8,.18,uz,3.4,.08,1.5,uMat); // beach towel
    addCylinder(root,ux,.18,uz,.1,2.5,mats.white,6); // umbrella pole
    const canopy=new THREE.Mesh(new THREE.CylinderGeometry(.25,2.35,.55,10),uMat);
    canopy.position.set(ux,2.65,uz);canopy.rotation.z=(k%2?.14:-.14);canopy.castShadow=true;canopy.userData.cityStatic=true;root.add(canopy);
   }
   continue;
  }
  if(isPort){
   addBox(root,cx,.12,cz,48,.08,48,mat(0x707b7c));
   for(let k=0;k<4;k++)container(root,cx-17+(k%2)*19,.18,cz-17+Math.floor(k/2)*17,16,6+rng()*3,mat(PALETTE.portColors[(bx+k)%PALETTE.portColors.length]));
   // two gantry cranes frame the Copperworks docks and silhouette cleanly at sunset
   if(bx<=1){crane(root,cx+17,.15,cz+5,mats.steel);crane(root,cx-20,.15,cz-8,mats.steel);}
   continue;
  }
  if(isSuburb&&rng()<.8){house(root,cx,cz,bx,bz);for(let p=0;p<2;p++)palm(root,cx-21+p*39,.16,cz+24,mats);continue;}
  if(rng()<.15){for(let p=0;p<4;p++)palm(root,cx-21+(p%2)*42,.16,cz-20+Math.floor(p/2)*40,mats);addBox(root,cx,.15,cz,30,.08,30,mat(0x8db77b));continue;}
  const count=isDowntown?1+(rng()>.6?1:0):1;
  for(let b=0;b<count;b++){
   const x=cx+(count===1?0:(b===0?-13:13)),z=cz+(rng()-.5)*9;
   const w=count===1?40:22,d=count===1?42:24;
   const floors=isDowntown?7+rng.int(0,13):2+rng.int(0,5),h=floors*(isDowntown?4.2:3.2);
   building(root,x,z,w,h,d,mat(PALETTE.pastel[rng.int(0,PALETTE.pastel.length-1)]),mats,isDowntown);
   neonSign(root,x,z,w,d,mats);
   if(isDowntown||bx>=5)addRoofSign(root,x,h,z,w,d,mats,bx+bz+b,bx===6);
  }
  for(let p=0;p<2;p++)palm(root,cx+(p?21:-21),.15,cz+22,mats);
 }
 // waterfront promenade and pier
 addBox(root,364,.15,0,6,.3,690,mat(0xb29a70));
 for(let k=0;k<5;k++){addBox(root,385,.08,-170+k*85,42,.2,10,mat(0x967954));for(let p=0;p<4;p++)addBox(root,369+p*10,.5,-174+k*85,.6,.8,.6,mats.dark);}
 // sculpted cantilevered boulevard street lamps along every road block & Ocean Drive + intersection traffic signals
 const lampPoolMat=new THREE.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:.2,depthWrite:false});
 const sigRed=new THREE.MeshBasicMaterial({color:0xff3b4e}),sigAmber=new THREE.MeshBasicMaterial({color:0xffbe3b}),sigGreen=new THREE.MeshBasicMaterial({color:0x3bf59b});
 const streetLamp=(lx,lz,armDx,armDz)=>{
  addBox(root,lx,.1,lz,.26,6.2,.26,mats.dark);
  addBox(root,lx+armDx*.5,6.15,lz+armDz*.5,Math.abs(armDx)||.22,.18,Math.abs(armDz)||.22,mats.dark);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.48,8,6),mats.lampGlow);
  head.position.set(lx+armDx,6.0,lz+armDz);head.userData.cityStatic=true;root.add(head);
  const pool=new THREE.Mesh(new THREE.CircleGeometry(3.4,12),lampPoolMat);
  pool.rotation.x=-Math.PI/2;pool.position.set(lx+armDx,.092,lz+armDz);pool.userData.cityStatic=true;root.add(pool);
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
  }
  // intersection traffic light signal gantry with glowing red/amber/green bulbs
  const gx=x+9.2,gz=z+9.2;
  addBox(root,gx,.1,gz,.3,6.6,.3,mats.dark);
  addBox(root,gx-3.2,6.2,gz,6.4,.24,.24,mats.dark);
  addBox(root,gx-4.4,5.4,gz,.55,1.4,.45,mats.dark);
  for(const [dy,mSig] of [[.38,sigRed],[0,sigAmber],[-.38,sigGreen]]){
   const b=new THREE.Mesh(new THREE.SphereGeometry(.17,6,6),mSig);
   b.position.set(gx-4.4,5.9+dy,gz+.26);b.userData.cityStatic=true;root.add(b);
  }
 }
 // Civic landmarks and location signage
 addBox(root,blockAt(4),.2,blockAt(4),24,.3,28,mat(0x7e9d73));
 addBox(root,blockAt(4),.5,blockAt(4),16,1.2,2,mat(0xdad1b7));
 // bake all static boxes into a few hundred merged meshes: ~2000 draw calls become ~40
 bakeStatic(root);
 return {materials:mats};
}
function bakeStatic(scene){
 const buckets=new Map();
 scene.updateMatrixWorld(true);
 scene.traverse(o=>{if(o.isMesh&&o.geometry&&o.parent&&o.userData.cityStatic){const key=o.material.uuid;if(!buckets.has(key))buckets.set(key,{material:o.material,geos:[],meshes:[]});const geo=o.geometry.clone().applyMatrix4(o.matrixWorld);buckets.get(key).geos.push(geo);buckets.get(key).meshes.push(o);}});
 for(const {material,geos,meshes} of buckets.values()){
  if(meshes.length<4)continue; // keep tiny groups as-is
  const merged=mergeGeometries(geos);
  if(!merged)continue;
  const mesh=new THREE.Mesh(merged,material);mesh.castShadow=true;mesh.receiveShadow=true;
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
function palm(scene,x,y,z,m){addCylinder(scene,x,y,z,.55,9,m.palm,7);const top=new THREE.Vector3(x,y+8.7,z);for(let i=0;i<9;i++){const a=i*Math.PI*2/9;const end=new THREE.Vector3(x+Math.cos(a)*5.4,y+7.3,z+Math.sin(a)*5.4);const dir=end.clone().sub(top);const leaf=new THREE.Mesh(new THREE.ConeGeometry(.8,dir.length(),5),m.leaf);leaf.position.copy(top).add(end).multiplyScalar(.5);leaf.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());leaf.castShadow=true;scene.add(leaf);}addBox(scene,x,y+8.2,z,.55,.45,.55,m.palm);}
function building(scene,x,z,w,h,d,wall,m,isTall){solid(x,z,w,d);addBox(scene,x,.2,z,w,h,d,wall);addBox(scene,x,.2+h,z,w+1,.5,d+1,mat(0xe2ceb0));
 // window grid: mostly lit warm at dusk, a cool share and a dark share for rhythm
 const winMat=()=>{const r=rng();return r<.68?m.windowLit:r<.9?m.windowCool:m.windowDark;};
 for(let floor=2.5;floor<h;floor+=isTall?4.2:3.2){
  for(let side=-1;side<=1;side+=2){for(let col=-1;col<=1;col++){const win=addBox(scene,x+col*w*.28,.2+floor,z+side*(d/2+.04),w*.16,1.5,.08,winMat());win.castShadow=false;}}
  for(let col=-1;col<=1;col++){const win=addBox(scene,x+col*w*.28,.2+floor,z,w*.15,1.5,.08,winMat());win.castShadow=false;}
 }
 addBox(scene,x,.2+h+.55,z,w*.35,.7,d*.35,isTall?m.roof:m.white);if(isTall){addBox(scene,x,.2+h+1.4,z,w*.16,1,d*.16,m.roof);
  // art-deco neon crown strip along the roofline of every tower
  const crown=new THREE.MeshStandardMaterial({color:0x201826,emissive:rng.pick([PALETTE.neonPink,PALETTE.neonCyan,PALETTE.neonAmber,PALETTE.neonViolet]),emissiveIntensity:1.8,roughness:.4});
  const strip=addBox(scene,x,.2+h+.5,z+d/2+.06,w*.96,.22,.1,crown);strip.castShadow=false;
  const strip2=addBox(scene,x,.2+h+.5,z-d/2-.06,w*.96,.22,.1,crown);strip2.castShadow=false;
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
  // neon spill: a soft emissive strip on the sidewalk under the sign
  const spill=new THREE.MeshStandardMaterial({color:0x1a1424,emissive:matSign.userData.glow,emissiveIntensity:.55,roughness:.6});
  const strip=addBox(scene,face==='z'?x:x+w/2+1.6,.14,face==='z'?z+d/2+1.6:z,face==='z'?sw:2.6,.04,face==='z'?2.6:sw,spill);
  strip.castShadow=false;
 }
 // a vertical blade sign jutting over the sidewalk on some corners
 if(rng.chance(.3)){
  const matSign=rng.pick(signMats);
  const blade=new THREE.Mesh(new THREE.PlaneGeometry(6,1.7),matSign);
  blade.position.set(x-w/2-2.4,8.2,z+d/2-.5);blade.rotation.y=Math.PI/2;
  blade.userData.cityStatic=true;scene.add(blade);
 }
}
function house(scene,x,z,bx,bz){solid(x,z,27,22);const wall=mat(PALETTE.pastel[rng.int(0,PALETTE.pastel.length-1)]),roof=mat([0xb75243,0x905646,0x697b88][rng.int(0,2)]);addBox(scene,x,.15,z,27,8,22,wall);const r=new THREE.Mesh(new THREE.ConeGeometry(19,7,4),roof);r.position.set(x,11,z);r.rotation.y=Math.PI/4;scene.add(r);for(let side of [-1,1])addBox(scene,x+side*7,3.5,z+11.05,4,3,.12,mat(0x91bccb));}
function container(scene,x,y,z,w,h,m){solid(x,z,w,8);addBox(scene,x,y,z,w,h,8,m);for(let i=-w/2+1;i<w/2;i+=2)addBox(scene,x+i,y,z+4.05,.08,h*.9,.08,mat(0x303b40));}
function crane(scene,x,y,z,m){
 // gantry silhouette: paired uprights, crossbeam, trolley rail, diagonal bracing
 addBox(scene,x,y,z,1.2,26,1.2,m);addBox(scene,x+22,y,z,1.2,26,1.2,m);
 addBox(scene,x+11,y+25,z,25,1.3,1.3,m);addBox(scene,x+11,y+22,z+8,23,.6,.6,m);
 addBox(scene,x+11,y+18,z+8,.8,8,.8,m);
 const brace=(a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);const bar=addBox(scene,x+a[0],y+a[1],z+4,.55,len,.55,m);bar.position.set(x+(a[0]+b[0])/2,y+(a[1]+b[1])/2,z+4);bar.rotation.z=-Math.atan2(dx,dy);};
 brace([0,2],[11,24]);brace([22,2],[11,24]);
}
