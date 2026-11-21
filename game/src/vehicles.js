// Stylized low-poly vehicles: sedan, sports, pickup, taxi, police cruiser — plus arcade
// car physics with nitro boost. Every car carries hidden exhaust flame cones for NOS,
// and sports cars wear a glossy clearcoat-style highlight strip for the hero shots.
import {THREE} from './three.js';
import {CAR_TYPES} from './config.js';
import {addBox,makeRadialTexture} from './city.js';
import {rng} from './rng.js';
const bodyMats={},glassMat=new THREE.MeshStandardMaterial({color:0x5c96c8,emissive:0x18304a,emissiveIntensity:.45,roughness:.08,metalness:.72});
const darkGlassCoreMat=new THREE.MeshStandardMaterial({color:0x162638,roughness:.18,metalness:.5});
const trimMat=new THREE.MeshStandardMaterial({color:0x181c24,roughness:.42,metalness:.3});
const wheelMat=new THREE.MeshStandardMaterial({color:0x14181c,roughness:.88});
const hubMat=new THREE.MeshStandardMaterial({color:0xa8b4be,roughness:.32,metalness:.7});
const sportHubMat=new THREE.MeshStandardMaterial({color:0xe2eaf2,roughness:.2,metalness:.85});
const whiteMat=new THREE.MeshStandardMaterial({color:0xf4f4f0,roughness:.38,metalness:.15});
const tailMat=new THREE.MeshStandardMaterial({color:0xff2e20,roughness:.3,emissive:0xe61e10,emissiveIntensity:2.1});
const headMat=new THREE.MeshStandardMaterial({color:0xfff8e2,roughness:.18,emissive:0xffeaad,emissiveIntensity:2.8});
const amberSignMat=new THREE.MeshStandardMaterial({color:0xffe49e,emissive:0xffb838,emissiveIntensity:1.9,roughness:.25});
const busLedMat=new THREE.MeshStandardMaterial({color:0xffe699,emissive:0xffc844,emissiveIntensity:2.6,roughness:.2});
const flameMat=new THREE.MeshBasicMaterial({color:0x66d9ff,transparent:true,opacity:.72});
const flameCoreMat=new THREE.MeshBasicMaterial({color:0xfff6d8,transparent:true,opacity:.88});
const hoodFireOuterMat=new THREE.MeshBasicMaterial({color:0xff5214,transparent:true,opacity:.88,depthWrite:false,blending:THREE.AdditiveBlending});
const hoodFireMidMat=new THREE.MeshBasicMaterial({color:0xff9e24,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending});
const hoodFireCoreMat=new THREE.MeshBasicMaterial({color:0xfff098,transparent:true,opacity:.95,depthWrite:false,blending:THREE.AdditiveBlending});

// Smooth road-hugging forward headlight fan CanvasTexture (alpha=0 on all 4 borders so zero sharp edges)
function makeHeadlightFanTexture(){
 const S=128,cv=document.createElement('canvas');cv.width=S;cv.height=S;
 const ctx=cv.getContext('2d'),img=ctx.createImageData(S,S),d=img.data;
 for(let y=0;y<S;y++){
  const v=y/(S-1); // v=0 near front axle -> v=0.12 at front bumper -> v=1.0 far ahead (+z)
  const fadeIn=v<.03?0:v<.14?(v-.03)/.11:1;
  const fadeOut=Math.pow(Math.max(0,1-v),1.5);
  const longEnv=fadeIn*fadeOut;
  const spread=.17+v*.56;
  const sep=.21*(1+v*.52);
  for(let x=0;x<S;x++){
   const u=(x/(S-1))*2-1;
   const edgeMask=Math.pow(Math.max(0,1-u*u),1.35);
   const dL=Math.abs(u+sep)/spread,dR=Math.abs(u-sep)/spread,dC=Math.abs(u)/(spread*1.25);
   const bL=dL<1?Math.pow(1-dL*dL,1.75):0;
   const bR=dR<1?Math.pow(1-dR*dR,1.75):0;
   const bC=dC<1?Math.pow(1-dC*dC,2.1)*.48:0;
   const a=Math.min(1,(bL+bR+bC)*.82)*longEnv*edgeMask;
   const idx=(y*S+x)*4;
   d[idx]=255;d[idx+1]=248;d[idx+2]=216;
   d[idx+3]=Math.round(a*228);
  }
 }
 ctx.putImageData(img,0,0);
 const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
 return tex;
}

// Smooth dual red/blue radial strobe road pool CanvasTexture under Police Interceptors
function makePoliceStrobeTexture(){
 const S=128,cv=document.createElement('canvas');cv.width=S;cv.height=S;
 const ctx=cv.getContext('2d'),img=ctx.createImageData(S,S),d=img.data;
 for(let y=0;y<S;y++){
  const v=(y/(S-1))*2-1;
  for(let x=0;x<S;x++){
   const u=(x/(S-1))*2-1;
   const edge=Math.max(0,1-Math.max(u*u,v*v));
   const dRed=Math.hypot((u+.35)/.68,v/.86);
   const dBlue=Math.hypot((u-.35)/.68,v/.86);
   const wRed=dRed<1?Math.pow(1-dRed*dRed,1.75)*.72*edge:0;
   const wBlue=dBlue<1?Math.pow(1-dBlue*dBlue,1.75)*.82*edge:0;
   const a=Math.min(1,wRed+wBlue);
   const idx=(y*S+x)*4;
   if(a>0){
    const t=wBlue/(wRed+wBlue+1e-5);
    d[idx]=Math.round(255*(1-t)+42*t);
    d[idx+1]=Math.round(40*(1-t)+142*t);
    d[idx+2]=Math.round(74*(1-t)+255*t);
    d[idx+3]=Math.round(a*215);
   }
  }
 }
 ctx.putImageData(img,0,0);
 const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
 return tex;
}

const headFanGeo=new THREE.PlaneGeometry(6.2,13.5);
const headFanMat=new THREE.MeshBasicMaterial({map:makeHeadlightFanTexture(),transparent:true,opacity:.88,depthWrite:false,blending:THREE.AdditiveBlending});
const headHaloGeo=new THREE.PlaneGeometry(1.15,1.15);
const headHaloMat=new THREE.MeshBasicMaterial({map:makeRadialTexture([[0,'rgba(255,252,230,1)'],[.35,'rgba(255,232,168,0.68)'],[1,'rgba(255,210,120,0)']]),transparent:true,opacity:.85,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
const policePoolGeo=new THREE.PlaneGeometry(9.5,10.5);
const policePoolMat=new THREE.MeshBasicMaterial({map:makePoliceStrobeTexture(),transparent:true,opacity:.88,depthWrite:false,blending:THREE.AdditiveBlending});
const redHaloMat=new THREE.MeshBasicMaterial({map:makeRadialTexture([[0,'rgba(255,190,200,1)'],[.32,'rgba(255,45,75,0.78)'],[1,'rgba(255,30,60,0)']]),transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
const blueHaloMat=new THREE.MeshBasicMaterial({map:makeRadialTexture([[0,'rgba(200,235,255,1)'],[.32,'rgba(45,145,255,0.82)'],[1,'rgba(30,115,255,0)']]),transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
const barHaloGeo=new THREE.PlaneGeometry(1.75,1.75);
function paint(color){const key='c'+color;if(!bodyMats[key])bodyMats[key]=new THREE.MeshStandardMaterial({color,roughness:.32,metalness:.2});return bodyMats[key];}
export function buildVehicle(type){
 const spec=CAR_TYPES[type],color=rng.pick(spec.colors),g=new THREE.Group(),body=paint(color);
 const {w,l,h}=spec;
 const isTruck=type==='truck',isSports=type==='sports',isPolice=type==='police',isBus=type==='bus';
 if(isBus){
  // Full-length Metro Bus transit coach: colored lower livery + white upper cabin + accent stripe
  addBox(g,0,.38,0,w*.98,1.02,l*.98,body);
  addBox(g,0,1.40,0,w*.96,1.16,l*.96,whiteMat);
  addBox(g,0,1.34,0,w*1.00,.14,l*.97,amberSignMat); // bright livery accent stripe
  addBox(g,0,2.56,0,w*.94,.16,l*.95,whiteMat); // roof cap
  // Panoramic dark tinted side windows + large front windshield + rear window
  addBox(g,0,1.52,-.12,w*.98,.86,l*.78,darkGlassCoreMat);
  addBox(g,0,1.54,-.12,w*1.00,.78,l*.76,glassMat);
  addBox(g,0,1.22,l*.485,w*.88,1.08,.07,glassMat); // front windshield
  addBox(g,0,1.62,-l*.485,w*.82,.72,.07,darkGlassCoreMat); // rear engine-bay window
  // Glowing amber LED destination sign above the windshield
  addBox(g,0,2.34,l*.485,w*.68,.24,.08,trimMat);
  addBox(g,0,2.36,l*.495,w*.60,.18,.05,busLedMat);
  // Twin roof AC units
  for(const az of [-1.45,1.55]){
   addBox(g,0,2.72,az,1.48,.24,1.55,whiteMat);
   addBox(g,0,2.74,az,1.24,.26,1.15,trimMat);
  }
  // Double side doors on the curb side (+x) & side mirrors
  for(const dz of [l*.31,-l*.05]){
   addBox(g,w*.495,.46,dz,.05,1.88,1.05,trimMat);
   addBox(g,w*.505,1.34,dz,.04,.84,.86,glassMat);
  }
  for(const sx of [-1,1])addBox(g,sx*(w*.54),1.48,l*.42,.18,.28,.12,trimMat);
  // Bumpers, headlights, taillights + road-hugging headlight fan
  addBox(g,0,.32,l/2+.02,w*.98,.28,.18,trimMat);addBox(g,0,.32,-l/2-.02,w*.98,.28,.18,trimMat);
  for(const s of [-1,1]){
   addBox(g,s*w*.35,.72,l/2+.02,w*.20,.18,.06,headMat);
   addBox(g,s*w*.36,.82,-l/2-.02,w*.18,.24,.06,tailMat);
   const hHalo=new THREE.Mesh(headHaloGeo,headHaloMat);
   hHalo.position.set(s*w*.35,.72,l/2+.09);g.add(hHalo);
  }
  const headFan=new THREE.Mesh(headFanGeo,headFanMat);
  headFan.rotation.x=-Math.PI/2;headFan.position.set(0,.088,l/2+5.4);g.add(headFan);
  // 4 big transit wheels
  const wheels=[];const wr=.52;
  for(const [sx,sz] of [[-1,1],[1,1],[-1,-1],[1,-1]]){
   const wheel=new THREE.Mesh(new THREE.CylinderGeometry(wr,wr,.36,12),wheelMat);
   wheel.rotation.z=Math.PI/2;wheel.position.set(sx*(w/2-.04),wr,sz*l*.30);wheel.castShadow=true;g.add(wheel);
   const hub=new THREE.Mesh(new THREE.CylinderGeometry(wr*.5,wr*.5,.38,10),hubMat);
   hub.rotation.z=Math.PI/2;hub.position.copy(wheel.position);g.add(hub);
   if(sz===1)wheels.push(wheel);
  }
  // Nitro exhaust flames + rear engine-bay fire (z = -l * 0.38)
  const flames=new THREE.Group();
  for(const s of [-1,1]){
   const outer=new THREE.Mesh(new THREE.ConeGeometry(.18,.95,6),flameMat);
   outer.rotation.x=-Math.PI/2;outer.position.set(s*w*.30,.38,-l/2-.40);flames.add(outer);
   const core=new THREE.Mesh(new THREE.ConeGeometry(.09,.60,6),flameCoreMat);
   core.rotation.x=-Math.PI/2;core.position.set(s*w*.30,.38,-l/2-.24);flames.add(core);
  }
  flames.visible=false;g.add(flames);
  const hoodFire=new THREE.Group();
  hoodFire.position.set(0,.95,-l*.38);
  const hf1=new THREE.Mesh(new THREE.ConeGeometry(.34,.95,7),hoodFireOuterMat);hf1.position.set(0,.40,0);hoodFire.add(hf1);
  const hf2=new THREE.Mesh(new THREE.ConeGeometry(.26,.75,7),hoodFireMidMat);hf2.position.set(.18,.32,-.10);hoodFire.add(hf2);
  const hf3=new THREE.Mesh(new THREE.ConeGeometry(.18,.55,6),hoodFireCoreMat);hf3.position.set(-.12,.26,.08);hoodFire.add(hf3);
  hoodFire.visible=false;g.add(hoodFire);
  g.userData={type,spec,color,wheels,lightbar:null,flames,hoodFire};
  return g;
 }
 // 1. Low sculpted lower chassis, sloped front hood deck, flared wheel-arch fenders & dark rocker skirts
 addBox(g,0,.26,0,w*.94,.42,l*.95,body);
 const hood=addBox(g,0,.62,l*.28,w*.90,.12,l*.36,body);hood.rotation.x=.08;
 if(!isTruck)addBox(g,0,.64,-l*.33,w*.90,.12,l*.26,body);
 // Flared wheel-arch fenders + lower side rocker skirts
 for(const sx of [-1,1]){
  addBox(g,sx*(w*.46),.23,0,.09,.12,l*.54,trimMat);
  for(const sz of [-1,1])addBox(g,sx*(w*.45),.34,sz*l*.32,.17,.36,.86,body);
  // side view mirrors
  addBox(g,sx*(w*.50),.78,l*.13,.15,.09,.16,isPolice?whiteMat:body);
 }
 // 2. Tapered cabin greenhouse (w*0.78) with high-contrast sky-tinted windshields & side windows
 const cabinW=w*(isSports?.76:.80),cabinH=h*(isSports?.44:.46);
 const cabinL=l*(isTruck?.32:isSports?.42:.44),cabinZ=isTruck?l*.20:isSports?-.03:-.02;
 const roofMat=isSports?trimMat:isPolice?whiteMat:body;
 // recessed dark cabin interior core + flush side glass panes + painted roof cap
 addBox(g,0,.64,cabinZ,cabinW*.92,cabinH*.92,cabinL*.74,darkGlassCoreMat);
 addBox(g,0,.66,cabinZ,cabinW*.98,cabinH*.78,cabinL*.68,glassMat);
 addBox(g,0,.64+cabinH*.92,cabinZ,cabinW*.92,.07,cabinL*.76,roofMat);
 // A-pillars & C-pillars framing the cabin
 for(const sx of [-1,1]){
  const ap=addBox(g,sx*(cabinW*.44),.66,cabinZ+cabinL*.38,.06,cabinH*.85,.07,roofMat);ap.rotation.x=-.48;
  if(!isTruck){const cp=addBox(g,sx*(cabinW*.44),.66,cabinZ-cabinL*.38,.06,cabinH*.82,.08,roofMat);cp.rotation.x=.48;}
 }
 // Raked front windshield & rear fastback window (fully exposed outside the tapered cabin core)
 const ws=addBox(g,0,.66,cabinZ+cabinL*.41,cabinW*.88,cabinH*.92,.06,glassMat);
 ws.rotation.x=isSports?-.58:isTruck?-.34:-.48;
 if(!isTruck){
  const rw=addBox(g,0,.66,cabinZ-cabinL*.41,cabinW*.86,cabinH*.88,.06,glassMat);
  rw.rotation.x=isSports?.58:.46;
 }
 if(isTruck){
  // Recessed open cargo bed with side walls, dark bed liner & tailgate
  addBox(g,0,.66,-l*.24,w*.92,.36,l*.44,body);
  addBox(g,0,.78,-l*.24,w*.80,.26,l*.38,trimMat);
  addBox(g,0,.48,l/2+.02,w*.68,.32,.08,sportHubMat); // chrome truck grille
 }else{
  addBox(g,0,.42,l/2+.02,w*.56,.20,.07,trimMat); // dark mesh front intake grille
 }
 if(isSports){
  // Solara GT sculpt: twin hood vents, carbon front splitter, side air intakes, full-width LED tail bar & carbon GT wing
  for(const sx of [-1,1]){
   addBox(g,sx*w*.20,.72,l*.27,w*.14,.04,.46,trimMat);
   addBox(g,sx*(w*.47),.46,-.12,.08,.22,.48,trimMat);
   addBox(g,sx*w*.28,.28,-l/2-.08,.12,.12,.16,wheelMat);
  }
  addBox(g,0,.24,l/2+.07,w*.98,.07,.32,trimMat); // carbon front splitter
  addBox(g,0,.62,-l/2-.03,w*.88,.11,.06,tailMat); // full-width glowing LED tail bar
  // elevated carbon GT wing on twin stalks
  addBox(g,0,.98,-l*.45,w*.94,.06,.30,trimMat);
  for(const sx of [-1,1])addBox(g,sx*w*.30,.80,-l*.43,.07,.20,.12,body);
 }
 // Bumpers, headlights, taillights + road-hugging additive forward headlight fan
 addBox(g,0,.28,l/2,w*.94,.20,.15,trimMat);addBox(g,0,.28,-l/2,w*.94,.20,.15,trimMat);
 for(const s of [-1,1]){
  addBox(g,s*w*.32,.56,l/2+.02,w*.22,.14,.06,headMat);
  addBox(g,s*w*.32,.58,-l/2-.02,w*.22,.14,.06,tailMat);
  const hHalo=new THREE.Mesh(headHaloGeo,headHaloMat);
  hHalo.position.set(s*w*.32,.56,l/2+.08);g.add(hHalo);
 }
 const headFan=new THREE.Mesh(headFanGeo,headFanMat);
 headFan.rotation.x=-Math.PI/2;headFan.position.set(0,.088,7.4);g.add(headFan);
 // Wheels + metallic rims
 const wheels=[];const wr=isTruck?.46:.38;
 for(const [sx,sz] of [[-1,1],[1,1],[-1,-1],[1,-1]]){
  const wheel=new THREE.Mesh(new THREE.CylinderGeometry(wr,wr,.3,12),wheelMat);
  wheel.rotation.z=Math.PI/2;wheel.position.set(sx*(w/2-.04),wr,sz*l*.32);wheel.castShadow=true;g.add(wheel);
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(wr*.5,wr*.5,.32,10),isSports?sportHubMat:hubMat);
  hub.rotation.z=Math.PI/2;hub.position.copy(wheel.position);g.add(hub);
  if(sz===1)wheels.push(wheel);
 }
 let lightbar=null;
 if(isPolice){
  // Classic black-and-white Police Interceptor livery: crisp white doors, bullbar push-bumper & dual-pod strobe bar
  addBox(g,0,.28,0,w*.98,.42,l*.38,whiteMat);
  addBox(g,0,.38,l/2+.10,w*.56,.34,.10,trimMat); // front push-bar
  for(const sx of [-1,1])addBox(g,sx*w*.22,.38,l/2+.12,.08,.38,.12,trimMat);
  const barY=.66+cabinH*.94;
  addBox(g,0,barY,cabinZ,cabinW*.86,.06,.34,hubMat);
  const red=new THREE.MeshStandardMaterial({color:0xff3040,emissive:0xff1828,emissiveIntensity:3.5});
  const blue=new THREE.MeshStandardMaterial({color:0x3088ff,emissive:0x1868ff,emissiveIntensity:3.5});
  const lr=addBox(g,-cabinW*.24,barY+.05,cabinZ,cabinW*.34,.13,.30,red);
  const lb=addBox(g,cabinW*.24,barY+.05,cabinZ,cabinW*.34,.13,.30,blue);
  lightbar={red:lr.material,blue:lb.material};
  for(const [s,hMat] of [[-1,redHaloMat],[1,blueHaloMat]]){
   for(const ry of [0,Math.PI/2]){
    const halo=new THREE.Mesh(barHaloGeo,hMat);
    halo.position.set(s*cabinW*.24,barY+.12,cabinZ);halo.rotation.y=ry;g.add(halo);
   }
  }
  const strobePool=new THREE.Mesh(policePoolGeo,policePoolMat);
  strobePool.rotation.x=-Math.PI/2;strobePool.position.set(0,.09,0);g.add(strobePool);
 }
 if(type==='taxi'){
  const roofY=.66+cabinH*.94;
  addBox(g,0,roofY,cabinZ,.58,.18,.28,amberSignMat);
  addBox(g,0,.48,0,w*.98,.08,l*.72,trimMat); // taxi side accent stripe
 }
 // nitro exhaust flames: twin cones at the rear, shown only while boosting
 const flames=new THREE.Group();
 for(const s of [-1,1]){
  const outer=new THREE.Mesh(new THREE.ConeGeometry(.16,.9,6),flameMat);
  outer.rotation.x=-Math.PI/2;outer.position.set(s*w*.28,.34,-l/2-.38);flames.add(outer);
  const core=new THREE.Mesh(new THREE.ConeGeometry(.08,.55,6),flameCoreMat);
  core.rotation.x=-Math.PI/2;core.position.set(s*w*.28,.34,-l/2-.24);flames.add(core);
 }
 flames.visible=false;g.add(flames);
 // Engine hood fire tongues (shown in Stage 3 critical damage before explosion)
 const hoodFire=new THREE.Group();
 hoodFire.position.set(0,.68,l*.28);
 const hf1=new THREE.Mesh(new THREE.ConeGeometry(.28,.82,7),hoodFireOuterMat);hf1.position.set(0,.34,0);hoodFire.add(hf1);
 const hf2=new THREE.Mesh(new THREE.ConeGeometry(.22,.65,7),hoodFireMidMat);hf2.position.set(.14,.28,-.08);hoodFire.add(hf2);
 const hf3=new THREE.Mesh(new THREE.ConeGeometry(.15,.48,6),hoodFireCoreMat);hf3.position.set(-.09,.22,.07);hoodFire.add(hf3);
 hoodFire.visible=false;g.add(hoodFire);
 g.userData={type,spec,color,wheels,lightbar,flames,hoodFire};
 return g;
}
// simple arcade car physics: heading, speed, crisp grip + Space handbrake drift + collision knockback/spin
export function makeCar(type,x,z,heading=0){
 const mesh=buildVehicle(type);mesh.position.set(x,0,z);mesh.rotation.y=Math.PI-heading;
 return{mesh,type,spec:CAR_TYPES[type],x,z,heading,speed:0,steer:0,slip:0,kbX:0,kbZ:0,spinVel:0,crashCd:0,smokeT:0,fireWarned:false,health:100,ai:null,driver:null,dead:false,vy:0,nos:false};
}
export function stepCar(car,dt,throttle,brake,steerInput){
 car.crashCd=Math.max(0,(car.crashCd||0)-dt);
 const s=car.spec;
 // NOS: extra shove and a higher speed ceiling while the boost is held
 const boost=car.nos&&car.speed>4;
 car.speed+=throttle*s.accel*(boost?1.9:1)*dt;
 if(boost)car.speed+=s.accel*1.1*dt;
 const drifting=brake&&Math.abs(car.speed)>5.5&&Math.abs(steerInput)>.05;
 if(brake)car.speed-=Math.sign(car.speed)*s.accel*(drifting?.85:1.6)*dt;
 car.speed-=car.speed*.35*dt; // drag
 car.speed=Math.max(-s.speed*.38,Math.min(s.speed*(boost?1.45:1),car.speed));
 const steerMax=.62/(1+Math.abs(car.speed)*.038);
 car.steer+=(steerInput*steerMax-car.steer)*Math.min(1,dt*14);
 if(drifting){
  car.slip=Math.max(-.44,Math.min(.44,(car.slip||0)+steerInput*dt*.95));
 }else{
  car.slip=(car.slip||0)*Math.max(0,1-dt*10);
 }
 const turnRate=drifting?.38:.29;
 car.heading+=car.steer*car.speed*dt*turnRate+(car.spinVel||0)*dt;
 const moveHeading=car.heading-(car.slip||0)*.34;
 car.x+=Math.sin(moveHeading)*car.speed*dt+(car.kbX||0)*dt;
 car.z-=Math.cos(moveHeading)*car.speed*dt+(car.kbZ||0)*dt;
 car.kbX=(car.kbX||0)*Math.max(0,1-dt*5.5);
 car.kbZ=(car.kbZ||0)*Math.max(0,1-dt*5.5);
 car.spinVel=(car.spinVel||0)*Math.max(0,1-dt*6.5);
 car.mesh.position.set(car.x,0,car.z);
 // Local +Z (front bumper) rotated by (Math.PI - heading) points to (+sin(heading), -cos(heading)), matching velocity!
 car.mesh.rotation.y=Math.PI-car.heading-(car.slip||0)*.55;
 // body roll and wheel spin
 car.mesh.rotation.z=(car.steer+(car.slip||0)*.4)*Math.min(1,Math.abs(car.speed)/11)*.13;
 for(const w of car.mesh.userData.wheels){w.rotation.x+=car.speed*dt*2.2;}
 // flicker the exhaust flames while boosting so the burn reads as live fire
 const flames=car.mesh.userData.flames;
 if(flames){flames.visible=boost;if(boost){const f=Math.abs(Math.sin(car.x*3.1+car.z*2.7));flames.scale.setScalar(.8+f*.4);}}
}
