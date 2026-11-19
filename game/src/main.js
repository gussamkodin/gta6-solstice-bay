// Solstice Bay — Last Light: boot, game loop, menus, pause and photo mode wiring.
// v2 systems: AIR ONE helicopter, car radio, nitro, garage safehouse, weapon wheel,
// respect ranks and the nine-mission story arc.
import {THREE} from './three.js';
import {world} from './world.js';
import {state,saveGame,loadGame,hasSave,notify} from './state.js';
import {initInput,endFrame} from './input.js';
import {makeCity} from './city.js';
import {makeSky} from './sky.js';
import {makePlayer,updatePlayer} from './player.js';
import {spawnTraffic,spawnPeds,updateTraffic,updatePeds} from './traffic.js';
import {updatePolice} from './police.js';
import {updateHelicopter} from './helicopter.js';
import {updateCombat} from './combat.js';
import {updateWeaponWheel} from './weaponwheel.js';
import {initRadio,updateRadio} from './radio.js';
import {initGarage,updateGarage} from './garage.js';
import {initMissions,updateMissions} from './missions.js';
import {initActivities,updateActivities} from './activities.js';
import {initPickups,updatePickups} from './pickups.js';
import {updateEffects} from './effects.js';
import {updateCamera} from './camera.js';
import {updateHUD,showHUD} from './hud.js';
import {initMinimap} from './minimap.js';
import {initAudio} from './audio.js';
import {stagePhoto} from './photo.js';
const canvas=document.getElementById('game');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.12;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,1200);
camera.position.set(240,8,30);
world.scene=scene;world.camera=camera;world.renderer=renderer;
makeCity(scene);
world.sky=makeSky(scene,renderer);
makePlayer();
spawnTraffic(26);
spawnPeds(44);
initMissions();
initActivities();
initPickups();
initGarage();
initRadio();
initMinimap();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
const $=id=>document.getElementById(id);
function setMode(mode){
 state.mode=mode;
 $('start').classList.toggle('hide',mode!=='title');
 $('pause').classList.toggle('hide',mode!=='pause');
 showHUD(mode==='play'||mode==='pause');
 if(mode==='play'&&!state.shot){const req=canvas.requestPointerLock?.();if(req&&req.catch)req.catch(()=>{});}
 else document.exitPointerLock?.();
}
function newGame(){
 initAudio();
 state.mission=0;state.cash=2450;state.foot.health=100;state.foot.armor=65;state.wanted=0;state.heat=0;
 state.respect=0;state.nitro=100;state.storedRide='sports';
 setMode('play');
 notify('WELCOME TO SOLSTICE BAY');
}
$('newGame').addEventListener('click',newGame);
$('loadGame').addEventListener('click',()=>{initAudio();if(loadGame()){world.player.x=state.foot.x;world.player.z=state.foot.z;world.player.mesh.position.set(state.foot.x,0,state.foot.z);setMode('play');}else notify('NO SAVE FOUND');});
$('resume').addEventListener('click',()=>setMode('play'));
$('save').addEventListener('click',saveGame);
$('title').addEventListener('click',()=>{saveGame();setMode('title');});
if(!hasSave())$('loadGame').style.opacity=.45;
initInput(canvas,()=>{
 if(state.mode==='play'){setMode('pause');$('pauseInfo').textContent='Mission: '+state.missionTitle+' · $'+state.cash.toLocaleString('en-US');}
 else if(state.mode==='pause')setMode('play');
});
// deterministic photo mode: skip menus, stage the scene, keep every real system running
if(state.shot){
 setMode('play');document.exitPointerLock?.();
 stagePhoto(state.shot);
}
let last=performance.now(),acc=0;
function frame(now){
 requestAnimationFrame(frame);
 let dt=Math.min(.05,(now-last)/1000);last=now;
 if(state.mode==='play'){
  state.time+=dt;
  if(!state.photoFreeze){
   updatePlayer(dt);
   updateTraffic(dt);
   updatePeds(dt);
   updatePolice(dt);
   updateHelicopter(dt);
   updateCombat(dt);
   updateMissions(dt);
   updateActivities(dt);
   updateGarage(dt);
   updatePickups(dt);
  }
  updateRadio(dt);
  updateWeaponWheel();
  updateEffects(dt);
  updateCamera(camera,dt);
  world.sky.update(dt,state.foot);
  updateHUD(dt);
  endFrame();
 }else{
  // idle orbit over downtown for the title screen
  state.time+=dt*.4;
  const t=state.time*.08;
  camera.position.set(60+Math.sin(t)*150,60+Math.sin(t*.7)*15,20+Math.cos(t)*150);
  camera.lookAt(60,10,20);
  world.sky.update(dt,{x:60,z:20});
  updateEffects(dt);
  endFrame();
 }
 renderer.render(scene,camera);
}
requestAnimationFrame(frame);
