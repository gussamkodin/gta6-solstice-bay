// District standing: seven neighborhoods track local respect, announce arrival with
// a color-coded banner and grant one small, transparent perk while inside their bounds.
import {state} from './state.js';
import {districtAt,DISTRICT_META} from './config.js';
let current='',bannerTime=0;
const rank=score=>score>=80?'LEGENDARY':score>=40?'RESPECTED':score>=15?'KNOWN':'NEW FACE';
export function addDistrictRep(name,amount){
 state.districtRep??={};state.districtRep[name]=Math.max(0,(state.districtRep[name]||0)+amount);
 if(name===current){const el=document.getElementById('districtBanner');if(el)el.querySelector('.district-rank').textContent=rank(state.districtRep[name])+' · '+state.districtRep[name]+' LOCAL RP';}
}
export function districtPerk(name){
 const rep=state.districtRep?.[name]||0;
 if(rep<15)return 0;
 if(name==='Copperworks Docks')return .08;
 if(name==='Glasshouse Downtown')return .12;
 if(name==='Sunward Heights')return .2;
 return .05;
}
export function updateDistrict(dt){
 const name=districtAt(state.foot.x,state.foot.z);
 if(name!==current){
  current=name;bannerTime=state.photo?0:3.6; // staged frames keep the center clear
  const meta=DISTRICT_META[name]||DISTRICT_META.Midtown,rep=state.districtRep?.[name]||0;
  state.district=name;state.districtPerk=meta.perk;
  const el=document.getElementById('districtBanner');
  if(el&&!state.photo){el.querySelector('.district-name').textContent=name.toUpperCase();el.querySelector('.district-rank').textContent=rank(rep)+' · '+rep+' LOCAL RP';el.querySelector('.district-perk').textContent=meta.perk;el.style.setProperty('--district-color',meta.color);el.classList.remove('hide');}
 }
 if(bannerTime>0){bannerTime-=dt;if(bannerTime<=0)document.getElementById('districtBanner')?.classList.add('hide');}
}
export function districtRank(name){return rank(state.districtRep?.[name]||0);}
// Street work earns trust where it happens; tidy missions and pickups both call this hook.
export function districtBonus(name,base){return Math.round(base*(1+districtPerk(name)));}
