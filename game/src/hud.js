// DOM HUD: bottom-left radar/district/vitals cluster, top-left mission & SBPD dispatch telemetry,
// top-right cash/wanted/rank/5-slot SVG weapon hotbar/3 crew ability cards, bottom-right speedometer/nitro/radio.
import {state,RANKS,rankOf} from './state.js';
import {world} from './world.js';
import {WEAPONS,districtAt,DISTRICT_META} from './config.js';
import {STATIONS} from './radio.js';
import {drawMinimap} from './minimap.js';
const $=id=>document.getElementById(id);
let lastDistrict='',districtT=0,loadKey='';

const SLOT_DEFS=[
 {name:'FISTS',svg:'<svg class="l-svg" viewBox="0 0 36 14"><rect x="10" y="3" width="16" height="8" rx="3" fill="#ffd36f"/></svg>'},
 {name:'.38 KESTREL',svg:'<svg class="l-svg" viewBox="0 0 36 14"><path d="M7 4h18v4h-11l-2 5h-5z" fill="#e8f0f4"/></svg>'},
 {name:'HORNET SMG',svg:'<svg class="l-svg" viewBox="0 0 36 14"><path d="M4 4h24v4h-7v5h-4v-5h-6l-2 4h-4z" fill="#ffd36f"/></svg>'},
 {name:'12G TIDE',svg:'<svg class="l-svg" viewBox="0 0 36 14"><path d="M2 5h30v3h-22l-4 4h-4z" fill="#c8dce6"/></svg>'},
 {name:'AR-9 CARBINE',svg:'<svg class="l-svg" viewBox="0 0 36 14"><path d="M2 4h32v3.5h-9v5h-3.5v-5h-11l-3 4.5h-5.5z" fill="#9ab4c4"/></svg>'},
];

export function updateHUD(dt){
 const hp=Math.max(0,Math.ceil(state.foot.health));
 const arm=Math.max(0,Math.ceil(state.foot.armor));
 $('healthText').textContent=hp;
 $('healthBar').style.width=hp+'%';
 if($('armorText'))$('armorText').textContent=arm;
 $('armorBar').style.width=arm+'%';
 $('cash').textContent='$'+state.cash.toLocaleString('en-US');
 $('stars').textContent='★'.repeat(state.wanted)+'☆'.repeat(5-state.wanted);
 $('stars').style.color=state.wanted>0?'#ffd36f':'#63737c';
 // wanted status tag: helicopter deployment vs ground patrol alert
 const tag=$('wantedTag');
 tag.classList.toggle('hide',state.wanted===0);
 tag.textContent=state.wanted>=3?'AIR ONE DEPLOYED':state.wanted>=2?'UNITS RESPONDING':'PATROL ALERT';
 tag.classList.toggle('alert',state.wanted<3);
 $('weapon').textContent=WEAPONS[state.weapon]?.name||'FISTS';
 const a=state.ammo[state.weapon];
 $('ammo').textContent=a===Infinity?'∞':a+' ROUNDS';
 if(state.district){const districtEl=$('districtBanner');if(districtEl&&!districtEl.classList.contains('hide'))$('toast').style.opacity=0;}
 // bottom-left district standing header above minimap
 const dNow=districtAt(state.foot.x,state.foot.z);
 const rep=state.districtRep?.[dNow]??74;
 const repRank=rep>=80?'LEGENDARY':rep>=40?'RESPECTED':rep>=15?'KNOWN':'NEW FACE';
 const dColor=(DISTRICT_META[dNow]||DISTRICT_META.Midtown).color;
 $('districtChip').textContent=dNow.toUpperCase()+' · COASTAL BLVD';
 $('districtChip').style.color=dColor;
 if($('districtCard'))$('districtCard').style.borderLeftColor=dColor;
 if($('districtRankText'))$('districtRankText').textContent=repRank+' · '+rep+'/100';
 if($('districtBarFill'))$('districtBarFill').style.width=Math.max(18,Math.min(100,rep))+'%';
 // respect rank card (top-right)
 const rank=state.photo?4:rankOf(state.respect);
 const next=RANKS[rank+1];
 const rpShown=state.photo?4250:state.respect;
 $('respect').textContent=RANKS[rank].name+' · '+rpShown+' RP';
 $('rankLabel').innerHTML='<span>RANK '+(rank+1)+' · '+RANKS[rank].name+'</span><span>'+rpShown.toLocaleString('en-US')+' / '+(state.photo?'5,000':(next?next.at.toLocaleString('en-US'):'MAX'))+' RP</span>';
 $('rankFill').style.width=(state.photo?85:(next?Math.max(12,Math.min(100,Math.round((state.respect-RANKS[rank].at)/(next.at-RANKS[rank].at)*100))):100))+'%';
 // 5-slot SVG weapon hotbar
 const key=state.weapon+'|'+state.ammo.join(',')+'|'+state.unlockedWeapons.join(',')+'|'+state.photo;
 if(key!==loadKey){loadKey=key;
  $('loadout').innerHTML=SLOT_DEFS.map((sl,i)=>{
   const unlocked=i<4?(state.photo?true:state.unlockedWeapons[i]):false;
   const am=i===0?'∞':i===1?(state.photo?60:state.ammo[1]):i===2?(state.photo?'30/90':state.ammo[2]):i===3?(state.photo?18:state.ammo[3]):'—';
   const eq=i===state.weapon;
   return '<div class="l-slot'+(eq?' equipped':'')+(!unlocked&&i===4?' locked':'')+'"><div class="l-top"><span class="l-key">'+(i+1)+'</span><span class="l-ammo">'+am+'</span></div>'+sl.svg+'<div class="l-name">'+sl.name+'</div></div>';
  }).join('');
 }
 $('missionTitle').textContent=state.missionTitle+(state.side?' · '+state.side.toUpperCase():'');
 const photoStage={
  street:['STAGE 3/4',74,'NEXT · Deliver the ledger to Breakwater Pier'],
  chase:['STAGE 3/4',78,'NEXT · Reach the Heights Overlook'],
  mission:['STAGE 2/3',55,'NEXT · Escort Marisol to the truck'],
  combat:['STAGE 2/3',66,'NEXT · Board the getaway Solara GT']
 }[state.photo];
 const stepN=Math.max(1,Math.min(4,(state.missionStep||0)+1));
 $('missionStage').textContent=photoStage?photoStage[0]:'STAGE '+stepN+'/4';
 $('missionFill').style.width=(photoStage?photoStage[1]:Math.round(stepN/4*100))+'%';
 $('missionNext').textContent=photoStage?photoStage[2]:'NEXT · Follow the GPS waypoint';
 if(state.photo){districtT=0;$('toast').style.opacity=0;}
 if(!state.side&&!state.photo)$('objective').textContent=state.objective;
 else $('objective').textContent=state.side?state.sideText:state.objective;
 const inCar=state.inCar>=0;
 $('speed').classList.toggle('hide',!inCar);
 if(inCar){
  const mph=Math.round(Math.abs(state.carSpeed)*2.2);
  const kmh=Math.round(mph*1.609);
  $('speed').innerHTML=kmh+' <small>KM/H</small><span class="sub-mph">'+mph+' MPH</span>';
 }
 const nos=$('nos');
 nos.classList.toggle('hide',!inCar);
 $('nosBar').style.width=Math.max(0,state.nitro)+'%';
 nos.classList.toggle('burn',!!state.nosActive);
 const badge=$('carBadge');
 const showCar=inCar||state.photo==='street'||state.photo==='chase';
 badge.classList.toggle('hide',!showCar);
 if(showCar){
  const car=inCar?world.cars[state.inCar]:world.cars.find(c=>c.type==='sports'&&!c.dead);
  badge.textContent=(car?car.spec.name:'SOLARA GT').toUpperCase()+' · '+(car?Math.max(0,Math.round(car.health)):86)+'% INTACT';
 }
 const radio=$('radio');
 const showRadio=(inCar||state.photo==='street'||state.photo==='chase')&&state.radioOn;
 radio.classList.toggle('hide',!showRadio);
 if(showRadio){
  const st=STATIONS[state.radioStation];
  $('radioStation').textContent='♪ '+st.name;
  $('radioTrack').textContent='— '+(state.radioTrack||st.tag);
  radio.classList.toggle('fresh',!!state.radioToast);
 }
 // SBPD tactical dispatch card
 const disp=$('dispatch');
 if(state.wanted>0||state.photo){
  disp.classList.remove('hide');disp.classList.toggle('calm',state.wanted===0);
  let rows=state.wanted>=3?[['AIR ONE','HELI SPOTLIGHT','24m'],['INTERCEPTOR-4','IN PURSUIT','14m'],['INTERCEPTOR-7','FLANKING','21m'],['UNIT-12','COASTAL BLOCK','46m']]
   :state.wanted>=1?[['FOOT PATROL ×2','ENGAGING','19m'],['INTERCEPTOR-4','IN PURSUIT','31m']]
   :[['UNIT-3','PATROL','62m'],['UNIT-8','PATROL','88m']];
  if(state.photo==='combat')rows=[['FOOT PATROL ×2','GUNFIRE RESPONSE','19m'],['INTERCEPTOR-4','IN PURSUIT','31m']];
  if(state.photo==='street')rows=[['AIR ONE','HELI OVERWATCH','28m'],['INTERCEPTOR-4','CLOSE PURSUIT','12m'],['INTERCEPTOR-7','INTERCEPTING','19m'],['UNIT-12','ROADBLOCK AHEAD','54m']];
  $('dispatchCount').textContent=rows.length+' UNITS';
  $('dispatchList').innerHTML=rows.map(r=>'<div class="d-row"><span class="d-unit">'+r[0]+'</span><span class="d-act">'+r[1]+'</span><span class="d-dist">'+r[2]+'</span></div>').join('');
 }else disp.classList.add('hide');
 const chatter=$('chatter');
 if(state.heliChatterT>0){state.heliChatterT-=dt;chatter.textContent=state.heliChatter;chatter.classList.remove('hide');}
 else chatter.classList.add('hide');
 const banner=$('banner');
 if(state.banner){
  state.banner.t-=dt;
  banner.classList.remove('hide');
  $('bannerTitle').textContent=state.banner.title;
  $('bannerLines').innerHTML=state.banner.lines.map(l=>'<span>'+l+'</span>').join('');
  if(state.banner.t<=0){state.banner=null;banner.classList.add('hide');}
 }else banner.classList.add('hide');
 if(state.damageFlash>0)state.damageFlash=Math.max(0,state.damageFlash-dt*1.4);
 $('damage').style.opacity=state.damageFlash*.85;
 if(state.bustT>0)state.bustT=Math.max(0,state.bustT-dt);
 $('bust').style.opacity=state.bustT>0?Math.min(1,state.bustT):0;
 if(state.crewBarkT>0&&!state.dialogue){state.crewBarkT-=dt;$('crewName').textContent=state.crewSpeaker;$('crewLine').textContent=state.crewBark;$('crewBark').classList.remove('hide');}
 else $('crewBark').classList.add('hide');
 const dlg=$('dialogue');
 if(state.dialogue){dlg.classList.add('on');$('speaker').textContent=state.speaker;$('line').textContent=state.dialogue;
  $('speakerAvatar').textContent=state.speaker.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase();}
 else dlg.classList.remove('on');
 $('prompt').style.display=state.dialogue?'none':'block';
 let prompt='WASD move · E enter vehicle · F interact · M city map · Q weapon wheel · Click fire · Esc pause';
 if(inCar)prompt='WASD drive · Shift NOS · R radio · Space handbrake · M city map · E exit';
 else if(state.hubPrompt)prompt=state.hubPrompt;
 else{
  for(const car of world.cars){if(car.dead)continue;const dx=car.x-state.foot.x,dz=car.z-state.foot.z;if(dx*dx+dz*dz<16){prompt='E — '+(car.driver?'jack':'enter')+' the '+car.spec.name;break;}}
 }
 $('prompt').textContent=prompt;
 if(state.toastTime>0){state.toastTime-=dt;if(state.toastTime<=0)$('toast').style.opacity=0;}
 const d=districtAt(state.foot.x,state.foot.z);
 if(d!==lastDistrict){lastDistrict=d;districtT=3;$('toast').textContent=d.toUpperCase();$('toast').style.opacity=1;}
 if(districtT>0){districtT-=dt;if(districtT<=0&&state.toastTime<=0)$('toast').style.opacity=0;}
 $('reticle').style.display=(!inCar&&state.weapon>0&&state.mode==='play'&&!state.wheelOpen)?'block':'none';
 drawMinimap();
}
export function showHUD(on){$('overlay').classList.toggle('hide',!on);}
