// DOM HUD: health/armor bars, cash, wanted stars, weapon/ammo, objective, dialogue, speed, prompts.
import {state} from './state.js';
import {world} from './world.js';
import {WEAPONS,districtAt} from './config.js';
import {drawMinimap} from './minimap.js';
const $=id=>document.getElementById(id);
let lastDistrict='',districtT=0;
export function updateHUD(dt){
 $('healthText').textContent=Math.ceil(state.foot.health);
 $('healthBar').style.width=Math.max(0,state.foot.health)+'%';
 $('armorBar').style.width=Math.max(0,state.foot.armor)+'%';
 $('cash').textContent='$'+state.cash.toLocaleString('en-US');
 $('stars').textContent='★'.repeat(state.wanted)+'☆'.repeat(5-state.wanted);
 $('stars').style.color=state.wanted>0?'#ffd36f':'#63737c';
 $('weapon').textContent=WEAPONS[state.weapon].name;
 const a=state.ammo[state.weapon];
 $('ammo').textContent=a===Infinity?'∞':a+' ROUNDS';
 $('missionTitle').textContent=state.missionTitle+(state.side?' · '+state.side.toUpperCase():'');
 $('objective').textContent=state.side?state.sideText:state.objective;
 const inCar=state.inCar>=0;
 $('speed').classList.toggle('hide',!inCar);
 if(inCar)$('speed').innerHTML=Math.round(Math.abs(state.carSpeed)*2.2)+' <small>MPH</small>';
 // dialogue box
 const dlg=$('dialogue');
 if(state.dialogue){dlg.style.display='block';$('speaker').textContent=state.speaker;$('line').textContent=state.dialogue;}
 else dlg.style.display='none';
 // contextual prompt
 let prompt='WASD move · E enter vehicle · F interact · Click fire · 1–4 weapons · Esc pause';
 if(inCar)prompt='WASD drive · Space handbrake · E exit · H horn · Esc pause';
 else if(state.hubPrompt)prompt=state.hubPrompt;
 else{
  for(const car of world.cars){if(car.dead)continue;const dx=car.x-state.foot.x,dz=car.z-state.foot.z;if(dx*dx+dz*dz<16){prompt='E — '+(car.driver?'jack':'enter')+' the '+car.spec.name;break;}}
 }
 $('prompt').textContent=prompt;
 // toast fade
 if(state.toastTime>0){state.toastTime-=dt;if(state.toastTime<=0)$('toast').style.opacity=0;}
 // district banner
 const d=districtAt(state.foot.x,state.foot.z);
 if(d!==lastDistrict){lastDistrict=d;districtT=3;$('toast').textContent=d.toUpperCase();$('toast').style.opacity=1;}
 if(districtT>0){districtT-=dt;if(districtT<=0&&state.toastTime<=0)$('toast').style.opacity=0;}
 $('reticle').style.display=(!inCar&&state.weapon>0&&state.mode==='play')?'block':'none';
 drawMinimap();
}
export function showHUD(on){$('overlay').classList.toggle('hide',!on);}
