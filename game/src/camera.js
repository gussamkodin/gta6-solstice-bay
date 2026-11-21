// Third-person follow camera: mouse orbit, wall sweep, speed FOV kick and NOS rumble,
// tuned separately for foot and car. Staged photos snap the camera so captures are exact;
// v3 photo framing can aim off-axis for hero compositions.
import {THREE} from './three.js';
import {state} from './state.js';
import {mouse} from './input.js';
import {collideCircle} from './physics.js';
export const cam={yaw:Math.PI,pitch:.32,dist:7.5,shake:0,fov:62,snap:false,fixedPos:null,fixedLook:null};
export function updateCamera(camera,dt){
 if(state.photo&&cam.fixedPos){
  camera.position.copy(cam.fixedPos);
  camera.lookAt(cam.fixedLook);
  camera.fov=cam.fovWish||60;
  camera.updateProjectionMatrix();
  return;
 }
 cam.yaw-=mouse.dx*.0026;cam.pitch=Math.max(-.15,Math.min(1.15,cam.pitch+mouse.dy*.0022));
 const inCar=state.inCar>=0;
 const target=state.foot;
 const wantDist=state.photo?cam.dist:(inCar?10.5:7.5);
 // staged photos can drop the pivot for a low hero angle (cam.baseY)
 const wantHeight=state.photo&&cam.baseY!=null?cam.baseY:(inCar?4.4:3.1);
 cam.dist+=(wantDist-cam.dist)*Math.min(1,dt*3);
 // in car, camera drifts behind travel direction when moving fast (not in staged photo mode)
 if(inCar&&!state.photo&&Math.abs(state.carSpeed||0)>6){
  let behind=state.carHeading+Math.PI;
  let diff=behind-cam.yaw;while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;
  cam.yaw+=diff*Math.min(1,dt*1.4)*Math.min(1,Math.abs(state.carSpeed)/20);
 }
 const pitch=cam.pitch;
 // sweep from the target outward and stop at the first wall, so the camera never
 // lands inside a building (which would flip lookAt and point the view at the sky)
 let frac=1;
 for(let t=.25;t<=1.001;t+=.125){
  const sxp=target.x+Math.sin(cam.yaw)*Math.cos(pitch)*cam.dist*t;
  const szp=target.z+Math.cos(cam.yaw)*Math.cos(pitch)*cam.dist*t;
  if(collideCircle(sxp,szp,.5).hit){frac=Math.max(.2,t-.15);break;}
 }
 const cx=target.x+Math.sin(cam.yaw)*Math.cos(pitch)*cam.dist*frac;
 const cz=target.z+Math.cos(cam.yaw)*Math.cos(pitch)*cam.dist*frac;
 const cy=Math.max(1.4,wantHeight+Math.sin(pitch)*cam.dist*frac);
 const solved={x:cx,z:cz};
 const cy2=cy;
 // staged photo: aim point rides higher for a skyline view (set by photo.js)
 const aimY=(state.photo&&cam.aimY)||1.5;
 // off-axis aim lets photo mode frame a hero left-of-center with the car beside them
 const aimX=state.photo&&cam.aimDX?cam.aimDX:0,aimZ=state.photo&&cam.aimDZ?cam.aimDZ:0;
 cam.shake=Math.max(0,cam.shake-dt*3);
 // deterministic photos carry no shake jitter; NOS adds a low rumble while boosting
 const shakeAmt=state.photo?0:cam.shake+(state.nosActive?.045:0);
 const sx=(Math.random()-.5)*shakeAmt,sy=(Math.random()-.5)*shakeAmt;
 const snapping=cam.snap;
 if(snapping){camera.position.set(solved.x,cy2,solved.z);}
 else camera.position.lerp(new THREE.Vector3(solved.x+sx,cy2+sy,solved.z+sx),Math.min(1,dt*9));
 camera.lookAt(target.x+aimX,aimY+(inCar&&!state.photo?.6:0),target.z+aimZ);
 const targetFov=state.photo&&cam.fovWish?cam.fovWish:62+(inCar?Math.min(14,Math.abs(state.carSpeed||0)*.4):0)+(state.nosActive?6:0);
 // v4.1 fix: snap FOV and distance on the same frame as the position, then clear the flag —
 // previously cam.snap was cleared first, so staged shots never reached their intended FOV
 if(snapping){cam.fov=targetFov;cam.dist=wantDist;cam.snap=false;}
 cam.fov+=(targetFov-cam.fov)*Math.min(1,dt*4);
 camera.fov=cam.fov;camera.updateProjectionMatrix();
}
export function aimDirection(){return{yaw:cam.yaw+Math.PI,pitch:-cam.pitch*.6};}
