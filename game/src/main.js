// Solstice Bay — Last Light: boot, game loop, menus, pause and photo mode wiring.
// v3 systems: named crew companions, district standing, hero photo staging — on top of
// AIR ONE, car radio, nitro, garage safehouse, weapon wheel and the nine-mission arc.
import {THREE} from './three.js';
import {world} from './world.js';
import {state,saveGame,loadGame,hasSave,notify} from './state.js';
import {initInput,hit,endFrame} from './input.js';
import {makeCity} from './city.js';
import {makeSky,setTimeOfDay} from './sky.js';
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
import {initCrew,updateCrew} from './crew.js';
import {updateDistrict} from './district.js';
import {initPickups,updatePickups} from './pickups.js';
import {updateEffects} from './effects.js';
import {cam,updateCamera} from './camera.js';
import {updateHUD,showHUD} from './hud.js';
import {initMinimap} from './minimap.js';
import {initMapMenu,openMapMenu,isMapMenuOpen} from './mapmenu.js';
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
world.city=makeCity(scene);
world.sky=makeSky(scene,renderer);
makePlayer();
spawnTraffic(50);
spawnPeds(110);
initMissions();
initActivities();
initCrew();
initPickups();
initGarage();
initRadio();
initMinimap();
initMapMenu();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
const $=id=>document.getElementById(id);
function syncContinueBtn(){
 const btn=$('loadGame'),ng=$('newGame'),saved=hasSave()&&!state.shot;
 if(btn){
  btn.style.display=(hasSave()||state.shot==='title')?'flex':'none';
  btn.classList.toggle('hot',saved);
  btn.classList.toggle('primary',saved);
 }
 if(ng){
  ng.classList.toggle('hot',!saved);
  ng.classList.toggle('primary',!saved);
 }
}
syncContinueBtn();
function setMode(mode){
 state.mode=mode;
 if(mode==='title')syncContinueBtn();
 $('start').classList.toggle('hide',mode!=='title');
 $('pause').classList.toggle('hide',mode!=='pause');
 showHUD((mode==='play'||mode==='pause')&&state.shot!=='map');
 if(mode==='play'&&!state.shot){const req=canvas.requestPointerLock?.();if(req&&req.catch)req.catch(()=>{});}
 else document.exitPointerLock?.();
}
function newGame(){
 initAudio();
 openMapMenu(false);
 state.mission=0;state.cash=2450;state.foot.health=100;state.foot.armor=65;state.wanted=0;state.heat=0;
 state.respect=0;state.nitro=100;state.storedRide='sports';
 saveGame();
 syncContinueBtn();
 setMode('play');
 notify('WELCOME TO SOLSTICE BAY');
}
function continueGame(){
 initAudio();
 openMapMenu(false);
 if(loadGame()){
  world.player.x=state.foot.x;world.player.z=state.foot.z;
  world.player.y=0;world.player.vy=0;world.player.grounded=true;
  world.player.dead=false;world.player.mesh.visible=true;
  world.player.mesh.position.set(world.player.x,0,world.player.z);
  cam.snap=true;
  setMode('play');
 }else newGame();
}
$('newGame').addEventListener('click',newGame);
$('loadGame').addEventListener('click',continueGame);
$('slot1Card')?.addEventListener('click',continueGame);
$('openMapStart')?.addEventListener('click',()=>openMapMenu(true));
$('openLoadSlot')?.addEventListener('click',()=>openMapMenu(true));
$('resume').addEventListener('click',()=>setMode('play'));
$('save').addEventListener('click',()=>saveGame(false));
$('title').addEventListener('click',()=>{saveGame(false);setMode('title');});
initInput(canvas,()=>{
 if(isMapMenuOpen()){openMapMenu(false);return;}
 if(state.mode==='play'){setMode('pause');$('pauseInfo').textContent='Mission: '+state.missionTitle+' · $'+state.cash.toLocaleString('en-US');}
 else if(state.mode==='pause')setMode('play');
});
// deterministic photo mode: stage the scene, keep every real system running
if(state.shot){
 setMode(state.shot==='title'?'title':'play');document.exitPointerLock?.();
 stagePhoto(state.shot);
}
let last=performance.now(),acc=0,todIdx=0,autoSaveT=0;
const TOD_MODES=[['sunset','18:40','SUNSET · 18:40'],['night','22:15','MIDNIGHT · 22:15'],['twilight','19:50','TWILIGHT · 19:50']];
function frame(now){
 requestAnimationFrame(frame);
 let dt=Math.min(.05,(now-last)/1000);last=now;
 if(state.mode==='play'){
  if(!state.shot&&(hit('KeyM')||hit('Tab')))openMapMenu();
  if(!state.shot&&hit('KeyN')){todIdx=(todIdx+1)%TOD_MODES.length;const [m,clk,lbl]=TOD_MODES[todIdx];setTimeOfDay(m);state.clock=clk;notify('TIME OF DAY — '+lbl);}
  state.time+=dt;
  if(!state.shot&&!world.player.dead){autoSaveT+=dt;if(autoSaveT>=15){autoSaveT=0;saveGame(true);}}
  if(!state.photoFreeze&&!isMapMenuOpen()){
   updatePlayer(dt);
   updateTraffic(dt);
   updatePeds(dt);
   updatePolice(dt);
   updateHelicopter(dt);
   updateCombat(dt);
   updateMissions(dt);
   updateActivities(dt);
   updateCrew(dt);
   updateGarage(dt);
   updatePickups(dt);
  }
  updateRadio(dt);
  updateWeaponWheel();
  updateEffects(dt);
  updateCamera(camera,dt);
  world.sky.update(dt,state.foot);
  updateDistrict(dt);
  updateHUD(dt);
  endFrame();
 }else{
  if(hit('KeyM')&&isMapMenuOpen())openMapMenu(false);
  // aerial beachfront & hotel skyline view for the title screen
  if(state.photo==='title'&&cam.fixedPos){
   updateCamera(camera,dt);
   world.sky.update(dt,{x:300,z:55});
  }else{
   state.time+=dt*.4;
   const t=state.time*.08;
   camera.position.set(355+Math.sin(t)*22,21+Math.sin(t*.7)*3,108+Math.cos(t)*30);
   camera.lookAt(285,14,15);
   world.sky.update(dt,{x:300,z:55});
  }
  updateEffects(dt);
  endFrame();
 }
 renderer.render(scene,camera);
}
requestAnimationFrame(frame);
