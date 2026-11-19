// Cortez Garage — the Palmetto Row safehouse: save the night, repair the ride, and swap
// the stored vehicle. Pull in (or walk up) and press F; the bay also hides you from AIR ONE.
import {THREE} from './three.js';
import {world} from './world.js';
import {state,saveGame,notify,say,addRespect} from './state.js';
import {GARAGE,CAR_TYPES} from './config.js';
import {dist2} from './physics.js';
import {hit} from './input.js';
import {makeCar} from './vehicles.js';
import {obstacles} from './city.js';
import {sfxPickup} from './audio.js';
export function initGarage(){
 const g=new THREE.Group();
 const wall=new THREE.MeshStandardMaterial({color:0xd8b890,roughness:.8});
 const door=new THREE.MeshStandardMaterial({color:0x27404e,roughness:.4,metalness:.3});
 const add=(w,h,d,mt,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mt);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;};
 // open-front bay: back wall, two side walls, flat roof, glowing COURTEZ GARAGE sign
 add(12,5,.6,wall,0,2.5,-4.5);
 add(.6,5,9,wall,-6,2.5,0);add(.6,5,9,wall,6,2.5,0);
 add(13,.5,10,wall,0,5.2,0);
 add(10.5,4.2,.25,door,0,2.1,-4.2);
 const cv=document.createElement('canvas');cv.width=256;cv.height=48;const c2=cv.getContext('2d');
 c2.fillStyle='#101826';c2.fillRect(0,0,256,48);
 c2.font='bold 26px Arial';c2.textAlign='center';c2.textBaseline='middle';
 c2.shadowColor='#3fe8e0';c2.shadowBlur=14;c2.fillStyle='#3fe8e0';c2.fillText('CORTEZ GARAGE',128,26);
 const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
 const sign=new THREE.Mesh(new THREE.PlaneGeometry(10,1.8),new THREE.MeshBasicMaterial({map:tex}));
 sign.position.set(0,5.9,5.05);g.add(sign);
 // neon door frame + interior glow strip
 const neon=new THREE.MeshStandardMaterial({color:0x18202c,emissive:0x3fe8e0,emissiveIntensity:1.6});
 add(.25,4.6,.25,neon,-5.6,2.3,4.9);add(.25,4.6,.25,neon,5.6,2.3,4.9);add(11.4,.25,.25,neon,0,4.7,4.9);
 g.position.set(GARAGE.x,0,GARAGE.z);
 world.scene.add(g);
 // footprint blocks cars/walkers except the open front (indexed lazily by physics.js)
 obstacles.push({minX:GARAGE.x-6.4,maxX:GARAGE.x+6.4,minZ:GARAGE.z-4.9,maxZ:GARAGE.z-3.7});
 obstacles.push({minX:GARAGE.x-6.4,maxX:GARAGE.x-5.5,minZ:GARAGE.z-4.9,maxZ:GARAGE.z+4.6});
 obstacles.push({minX:GARAGE.x+5.5,maxX:GARAGE.x+6.4,minZ:GARAGE.z-4.9,maxZ:GARAGE.z+4.6});
 world.garage={x:GARAGE.x,z:GARAGE.z,mesh:g};
}
export function updateGarage(dt){
 const px=state.foot.x,pz=state.foot.z;
 const near=dist2(px,pz,GARAGE.x,GARAGE.z+2)<100;
 if(near){
  const ride=CAR_TYPES[state.storedRide].name;
  state.hubPrompt='CORTEZ GARAGE — F: save night · repair ride · swap stored '+ride;
  if(hit('KeyF'))useGarage();
 }else if(state.hubPrompt&&state.hubPrompt.startsWith('CORTEZ GARAGE'))state.hubPrompt='';
}
function useGarage(){
 sfxPickup();
 if(state.inCar>=0){
  const car=world.cars[state.inCar];
  if(car&&!car.dead){
   car.health=100;
   if(car.type!=='police')state.storedRide=car.type;
   state.nitro=100;
   notify('RIDE REPAIRED · NITRO REFILLED · '+car.spec.name.toUpperCase()+' STORED');
  }
 }else{
  // on foot: roll the stored ride out onto the apron
  const old=world.garageCar;
  if(old&&!old.dead&&dist2(old.x,old.z,GARAGE.x,GARAGE.z)<400){world.scene.remove(old.mesh);const i=world.cars.indexOf(old);if(i>=0)world.cars.splice(i,1);}
  const car=makeCar(state.storedRide,GARAGE.x,GARAGE.z+9,0);
  car.mesh.position.set(car.x,0,car.z);car.mesh.rotation.y=Math.PI;
  world.scene.add(car.mesh);world.cars.push(car);world.garageCar=car;
  notify(CAR_TYPES[state.storedRide].name.toUpperCase()+' ROLLED OUT — E TO DRIVE');
 }
 saveGame();
 say('REMY CORTEZ','Home turf. The bay sleeps safer with the door closed.',4);
 addRespect(1);
}
