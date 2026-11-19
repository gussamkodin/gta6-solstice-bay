// Weapon wheel: hold Q to open a radial selector (fists + four guns), pick with the mouse,
// release Q to equip. Pointer lock is released while open so the cursor can point;
// locked weapons show which mission unlocks them.
import {state,notify} from './state.js';
import {WEAPONS} from './config.js';
import {key,mouse,setWheelActive} from './input.js';
import {sfxPickup} from './audio.js';
const ICONS=['✊','🔫','⚡','💥'];
let el=null,slots=[],hover=-1;
export function initWeaponWheel(){
 el=document.createElement('div');el.id='wheel';
 el.innerHTML='<div class="w-center">WEAPONS</div>';
 const n=WEAPONS.length;
 for(let i=0;i<n;i++){
  const a=-Math.PI/2+i*(Math.PI*2/n);
  const slot=document.createElement('div');slot.className='w-slot';
  slot.style.left=(130+Math.cos(a)*86)+'px';slot.style.top=(130+Math.sin(a)*86)+'px';
  slot.innerHTML='<div class="w-icon">'+ICONS[i]+'</div><div class="w-name">'+WEAPONS[i].name+'</div><div class="w-ammo"></div>';
  el.appendChild(slot);slots.push(slot);
 }
 document.body.appendChild(el);
}
export function updateWeaponWheel(){
 if(!el)initWeaponWheel();
 const want=key('KeyQ')&&state.mode==='play'&&state.inCar<0&&!state.photo&&!state.photoFreeze;
 if(want!==state.wheelOpen){
  state.wheelOpen=want;setWheelActive(want);
  el.classList.toggle('open',want);
  if(want){document.exitPointerLock?.();mouse.x=innerWidth/2;mouse.y=innerHeight/2;}
  else{
   if(hover>=0)equip(hover);
   hover=-1;
   const cv=document.getElementById('game');const req=cv.requestPointerLock?.();if(req&&req.catch)req.catch(()=>{});
  }
 }
 if(!state.wheelOpen)return;
 // pick the slot nearest the cursor, within reach of the ring
 const cx=innerWidth/2,cy=innerHeight/2;
 const dx=mouse.x-cx,dy=mouse.y-cy,d=Math.hypot(dx,dy);
 hover=-1;
 if(d>26){
  const n=WEAPONS.length;
  let a=Math.atan2(dy,dx)+Math.PI/2;while(a<0)a+=Math.PI*2;
  hover=Math.round(a/(Math.PI*2/n))%n;
 }
 for(let i=0;i<slots.length;i++){
  const locked=!state.unlockedWeapons[i];
  slots[i].classList.toggle('hover',i===hover);
  slots[i].classList.toggle('locked',locked);
  slots[i].classList.toggle('active',i===state.weapon);
  const ammo=state.ammo[i];
  slots[i].querySelector('.w-ammo').textContent=locked?'LOCKED':ammo===Infinity?'∞':ammo+' rnds';
 }
}
function equip(i){
 if(!state.unlockedWeapons[i]){notify('LOCKED — FINISH THE JOB');return;}
 if(i>0&&state.ammo[i]<=0){notify('NO AMMO FOR '+WEAPONS[i].name);return;}
 state.weapon=i;sfxPickup();notify(WEAPONS[i].name);
}