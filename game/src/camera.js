// Third-person follow camera with mouse orbit, tuned separately for foot and car.
import {THREE} from './three.js';
import {state} from './state.js';
import {mouse} from './input.js';
import {collideCircle} from './physics.js';
export const cam={yaw:Math.PI,pitch:.32,dist:7.5,shake:0,fov:62};
export function updateCamera(camera,dt){
 cam.yaw-=mouse.dx*.0026;cam.pitch=Math.max(-.15,Math.min(1.15,cam.pitch+mouse.dy*.0022));
 const inCar=state.inCar>=0;
 const target=state.foot;
 const wantDist=inCar?10.5:7.5,wantHeight=inCar?4.4:3.1;
 cam.dist+=(wantDist-cam.dist)*Math.min(1,dt*3);
 // in car, camera drifts behind travel direction when moving fast
 if(inCar&&Math.abs(state.carSpeed||0)>6){
  let behind=state.carHeading+Math.PI;
  let diff=behind-cam.yaw;while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;
  cam.yaw+=diff*Math.min(1,dt*1.4)*Math.min(1,Math.abs(state.carSpeed)/20);
 }
 const pitch=cam.pitch;
 const cx=target.x+Math.sin(cam.yaw)*Math.cos(pitch)*cam.dist;
 const cz=target.z+Math.cos(cam.yaw)*Math.cos(pitch)*cam.dist;
 const cy=wantHeight+Math.sin(pitch)*cam.dist;
 const solved=collideCircle(cx,cz,.6);
 cam.shake=Math.max(0,cam.shake-dt*3);
 const sx=(Math.random()-.5)*cam.shake,sy=(Math.random()-.5)*cam.shake;
 camera.position.lerp(new THREE.Vector3(solved.x+sx,cy+sy,solved.z+sx),Math.min(1,dt*9));
 camera.lookAt(target.x,1.5+(inCar?.6:0),target.z);
 const targetFov=62+(inCar?Math.min(14,Math.abs(state.carSpeed||0)*.4):0);
 cam.fov+=(targetFov-cam.fov)*Math.min(1,dt*4);
 camera.fov=cam.fov;camera.updateProjectionMatrix();
}
export function aimDirection(){return{yaw:cam.yaw+Math.PI,pitch:-cam.pitch*.6};}
