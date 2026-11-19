// Procedural Solstice Bay at last light: pastel art-deco blocks with lit windows and neon
// storefront signs, wet-look asphalt with neon reflection streaks, glowing street lamps,
// palms, hills, docks with gantry cranes, and five piers over the bay.
import {THREE} from './three.js';
import {BLOCK,BLOCKS,ROAD,PITCH,HALF,LAND,LANE,PALETTE,roadAt,blockAt} from './config.js';
import {rng} from './rng.js';
const mat=(color,roughness=.82,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
// canvas-texture neon signs: original Solstice Bay businesses, no external assets
const SIGNS=['SOLSTICE','LOW TIDE','PALMA CLUB','BAYSIDE DINER','MARIGOLD','NEON TIDE','HOTEL AZUL','CASINO SOL','COPPER & CO','SURF CITY','LAST LIGHT','EL FARO'];
const signMats=[];
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
 addBox(root,352,-.48,0,120,.5,700,mats.sand);
 addBox(root,465,-8,0,150,14,900,mats.water);
 // sun-glitter path on the water: a soft emissive band running out from the shore
 const shimmer=new THREE.Mesh(new THREE.PlaneGeometry(120,760),new THREE.MeshBasicMaterial({color:0xff9e6a,transparent:true,opacity:.22,depthWrite:false}));
 shimmer.rotation.x=-Math.PI/2;shimmer.position.set(452,-.9,40);root.add(shimmer);
 const shimmer2=new THREE.Mesh(new THREE.PlaneGeometry(46,760),new THREE.MeshBasicMaterial({color:0xffd9a0,transparent:true,opacity:.28,depthWrite:false}));
 shimmer2.rotation.x=-Math.PI/2;shimmer2.position.set(430,-.88,40);root.add(shimmer2);
 // polished-road streaks: narrow, translucent neon catches on the busiest boulevard
 // make wet pavement visible in the contact sheet without obscuring traffic silhouettes
 const roadGlow=[0xff4fa0,0x3fe8e0,0xffb347,0xb46bff];
 for(let row=0;row<8;row++){
  const z=roadAt(row)+LANE;
  for(let col=0;col<8;col++){
   const streak=new THREE.Mesh(new THREE.PlaneGeometry(10+col*2,.5),new THREE.MeshBasicMaterial({color:roadGlow[(row+col)%roadGlow.length],transparent:true,opacity:.34,depthWrite:false}));
   streak.rotation.x=-Math.PI/2;streak.position.set(30+col*42,.075,z+(col%2?1.3:-1.3));streak.userData.cityStatic=true;root.add(streak);
  }
 }
 // distant hills are layered silhouettes made of irregular facets
 for(let i=0;i<13;i++){const h=30+rng()*65;const m=new THREE.Mesh(new THREE.ConeGeometry(25+rng()*30,h,7),mat([0x668365,0x75916a,0x8b986a][i%3]));m.position.set(-390+i*45,h/2-1,-290-rng()*80);m.rotation.z=(rng()-.5)*.15;root.add(m);}
 // street and intersections
 for(let i=0;i<=BLOCKS;i++){const c=roadAt(i);addBox(root,c,0,0,ROAD,.08,720,mats.asphalt);addBox(root,0,0,c,720,.08,ROAD,mats.asphalt);
  for(let offset=-2;offset<=2;offset+=4){addBox(root,c+offset,.06,0,.12,.01,690,mats.line);addBox(root,0,.06,c+offset,690,.01,.12,mats.line);}
  for(let j=0;j<9;j++){const z=roadAt(j);if(i<8){addBox(root,c,0,z+ROAD/2+1.1,ROAD,.18,2.2,mats.side);addBox(root,c,0,z-ROAD/2-1.1,ROAD,.18,2.2,mats.side);} }
 }
 // blocks: each gets sidewalk pads, varied buildings, rooftop detail, plazas and palms
 for(let bx=0;bx<BLOCKS;bx++)for(let bz=0;bz<BLOCKS;bz++){
  const cx=blockAt(bx),cz=blockAt(bz),isDowntown=bx>=3&&bx<=5&&bz>=2&&bz<=5,isPort=bz===0&&bx<=3,isBeach=bx===7,isSuburb=bz>=6&&bx<=2;
  addBox(root,cx,.03,cz,BLOCK,.12,BLOCK,mats.side);
  if(isBeach){
   // boardwalk strip along the road edge, sand beyond, palms and parasols near the walk
   addBox(root,cx,.12,cz,BLOCK,.08,BLOCK,mat(0xdbc895));
   addBox(root,cx-22,.16,cz,10,.1,BLOCK,mat(0xb29a70));
   for(let p=0;p<3;p++)palm(root,cx-22+p*4,.17,cz-18+p*17,mats);
   for(let k=0;k<4;k++)addBox(root,cx-14+k*3,.3,cz-14+k*9,3.4,.3,1.2,mat([0xd84538,0xe7bd45,0x528c95,0xe2ddd1][k]));
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
  }
  for(let p=0;p<2;p++)palm(root,cx+(p?21:-21),.15,cz+22,mats);
 }
 // waterfront promenade and pier
 addBox(root,370,.15,0,8,.3,690,mat(0xb29a70));
 for(let k=0;k<5;k++){addBox(root,385,.08,-170+k*85,42,.2,10,mat(0x967954));for(let p=0;p<4;p++)addBox(root,369+p*10,.5,-174+k*85,.6,.8,.6,mats.dark);}
 // landmarks, street furniture and painted crosswalks
 for(let i=0;i<=BLOCKS;i++)for(let j=0;j<=BLOCKS;j++){
  const x=roadAt(i),z=roadAt(j);
  if(i<8&&j<8){for(let s=0;s<5;s++){addBox(root,x-6+s*3,.08,z-7,1.3,.04,2.2,mats.white);addBox(root,x-6+s*3,.08,z+7,1.3,.04,2.2,mats.white);}}
  for(const side of [-1,1]){const px=x+side*10,pz=z+10;addBox(root,px,.1,pz,.2,4,.2,mats.dark);const lamp=new THREE.Mesh(new THREE.SphereGeometry(.35,6,4),mats.lampGlow);lamp.position.set(px,.4+4,pz);lamp.castShadow=false;lamp.userData.cityStatic=true;root.add(lamp);}
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
function palm(scene,x,y,z,m){addCylinder(scene,x,y,z,.55,9,m.palm,7);const top=new THREE.Vector3(x,y+8.7,z);for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const end=new THREE.Vector3(x+Math.cos(a)*5,y+7.5,z+Math.sin(a)*5);const dir=end.clone().sub(top);const leaf=new THREE.Mesh(new THREE.ConeGeometry(.8,dir.length(),5),m.leaf);leaf.position.copy(top).add(end).multiplyScalar(.5);leaf.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());leaf.castShadow=true;scene.add(leaf);}}
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
