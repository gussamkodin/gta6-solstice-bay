// DOM HUD: health/armor, cash, wanted stars, weapon/ammo, respect rank, nitro meter,
// radio station chip, AIR ONE chatter, objective, dialogue, mission banner, damage vignette,
// and the district standing banner fed by district.js.
import {state,RANKS,rankOf} from './state.js';
import {world} from './world.js';
import {WEAPONS,districtAt,DISTRICT_META} from './config.js';
import {STATIONS} from './radio.js';
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
 // district entry banners are owned by district.js; suppress the old generic toast
 // so a neighborhood arrival is never covered by a second notification.
 if(state.district){const districtEl=$('districtBanner');if(districtEl&&!districtEl.classList.contains('hide'))$('toast').style.opacity=0;}
 // local standing chip: neighborhood name + rank, colored like its arrival banner
 const dNow=districtAt(state.foot.x,state.foot.z);
 const rep=state.districtRep?.[dNow]||0;
 const repRank=rep>=80?'LEGENDARY':rep>=40?'RESPECTED':rep>=15?'KNOWN':'NEW FACE';
 $('districtChip').textContent=dNow.toUpperCase()+' · '+repRank;
 $('districtChip').classList.toggle('hide',!!state.photo);
 $('districtChip').style.color=(DISTRICT_META[dNow]||DISTRICT_META.Midtown).color;
 // respect rank chip
 const rank=rankOf(state.respect);
 const next=RANKS[rank+1];
 $('respect').textContent=RANKS[rank].name+' · '+state.respect+' RP'+(next?' · NEXT '+next.at:'');
 $('missionTitle').textContent=state.missionTitle+(state.side?' · '+state.side.toUpperCase():'');
 // in photo mode the district toast competes with the staged scene: keep it quiet
 if(state.photo){districtT=0;$('toast').style.opacity=0;}
 if(!state.side&&!state.photo)$('objective').textContent=state.objective;
 else $('objective').textContent=state.side?state.sideText:state.objective;
 const inCar=state.inCar>=0;
 $('speed').classList.toggle('hide',!inCar);
 if(inCar)$('speed').innerHTML=Math.round(Math.abs(state.carSpeed)*2.2)+' <small>MPH</small>';
 // nitro meter: visible in a car, hot while boosting
 const nos=$('nos');
 nos.classList.toggle('hide',!inCar);
 $('nosBar').style.width=Math.max(0,state.nitro)+'%';
 nos.classList.toggle('burn',!!state.nosActive);
 // radio chip: station + track while driving, toast styling right after a switch
 const radio=$('radio');
 const showRadio=(inCar||state.photo)&&state.radioOn;
 radio.classList.toggle('hide',!showRadio);
 if(showRadio){
  const st=STATIONS[state.radioStation];
  $('radioStation').textContent=st.name+' · '+st.tag;
  $('radioTrack').textContent='♪ '+(state.radioTrack||'');
  radio.classList.toggle('fresh',!!state.radioToast);
 }
 // AIR ONE chatter line under the objective
 const chatter=$('chatter');
 if(state.heliChatterT>0){state.heliChatterT-=dt;chatter.textContent=state.heliChatter;chatter.classList.remove('hide');}
 else chatter.classList.add('hide');
 // mission-complete banner with cash/respect tally
 const banner=$('banner');
 if(state.banner){
  state.banner.t-=dt;
  banner.classList.remove('hide');
  $('bannerTitle').textContent=state.banner.title;
  $('bannerLines').innerHTML=state.banner.lines.map(l=>'<span>'+l+'</span>').join('');
  if(state.banner.t<=0){state.banner=null;banner.classList.add('hide');}
 }else banner.classList.add('hide');
 // damage vignette + bust fade
 if(state.damageFlash>0)state.damageFlash=Math.max(0,state.damageFlash-dt*1.4);
 $('damage').style.opacity=state.damageFlash*.85;
 if(state.bustT>0)state.bustT=Math.max(0,state.bustT-dt);
 $('bust').style.opacity=state.bustT>0?Math.min(1,state.bustT):0;
 // independent companion bark chip, intentionally above the low mission dialogue rail
 if(state.crewBarkT>0){state.crewBarkT-=dt;$('crewName').textContent=state.crewSpeaker;$('crewLine').textContent=state.crewBark;$('crewBark').classList.remove('hide');}
 else $('crewBark').classList.add('hide');
 // dialogue box
 const dlg=$('dialogue');
 if(state.dialogue){dlg.style.display='block';$('speaker').textContent=state.speaker;$('line').textContent=state.dialogue;}
 else dlg.style.display='none';
 // hide the generic controls strip while a line plays so the two never overlap
 $('prompt').style.display=state.dialogue?'none':'block';
 // contextual prompt
 let prompt='WASD move · E enter vehicle · F interact · Q weapon wheel · Click fire · Esc pause';
 if(inCar)prompt='WASD drive · Shift NOS · R radio · Space handbrake · E exit · H horn';
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
 $('reticle').style.display=(!inCar&&state.weapon>0&&state.mode==='play'&&!state.wheelOpen)?'block':'none';
 drawMinimap();
}
export function showHUD(on){$('overlay').classList.toggle('hide',!on);}