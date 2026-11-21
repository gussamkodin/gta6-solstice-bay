// Central game state: the nine-mission Last Light story, respect progression, nitro,
// radio/garage records, notifications and localStorage save/load. v3 adds crew barks
// and per-district standing alongside the respect ranks.
export const state={mode:'title',time:0,paused:false,foot:{x:0,z:0,heading:0,health:100,armor:65},cash:2450,wanted:0,heat:0,weapon:0,ammo:[Infinity,48,0,0],unlockedWeapons:[true,true,false,false],inCar:-1,carSpeed:0,carHeading:0,crimeX:0,crimeZ:0,lastCrimeT:0,gunfireT:0,mission:0,missionStep:0,objective:'Meet Lena at the Breakwater',missionTitle:'LOW TIDE',dialogue:'',speaker:'',dialogueT:0,toast:'',toastTime:0,kills:0,side:null,sideKills:0,sideTime:0,deathCause:'',shot:new URLSearchParams(location.search).get('shot')||'',seed:Number(new URLSearchParams(location.search).get('seed')||7),
 // v2 progression + systems
 clock:'18:40',respect:0,nitro:100,nosActive:false,storedRide:'sports',radioStation:0,radioOn:false,districtRep:{},
 heliChatter:'',heliChatterT:0,banner:null,damageFlash:0,combo:0,comboT:0,wheelOpen:false,bustT:0,crewBark:'',crewSpeaker:'',crewBarkT:0,district:'',districtPerk:''};
// respect ranks: earned per mission and side job; rank 2 halves bail, rank 4 doubles NOS regen
export const RANKS=[
 {at:0,name:'OUTSIDER'},{at:30,name:'KNOWN FACE'},{at:70,name:'CONNECTED'},
 {at:120,name:'MADE'},{at:180,name:'STREET LEGEND'},
];
export function rankOf(respect){let r=0;for(let i=0;i<RANKS.length;i++)if(respect>=RANKS[i].at)r=i;return r;}
export const missions=[
 {title:'LOW TIDE',brief:'Meet Lena at the Breakwater',goal:{x:385,z:-85,label:'Breakwater Pier'},reward:650,respect:10,
  intro:[['LENA VALE','You came. Crane\'s people dredged the bay at dawn — six hours off the tide charts.'],['REMY CORTEZ','Nobody dredges at dawn unless they want the sand to keep a secret.'],['LENA VALE','Find out what they buried. Start at the pier office. And Remy — keep it quiet.']]},
 {title:'PAPER TRAIL',brief:'Catch the courier on Marigold Mile',goal:{x:180,z:64,label:'Marigold Courier'},reward:900,respect:12,
  intro:[['LENA VALE','The dredging permits were signed by a shell company. A courier carries the real ledger.'],['REMY CORTEZ','Marigold Mile. He runs the pastel arcade every evening.'],['LENA VALE','Take the ledger, not his life. We need him talking later.']]},
 {title:'NIGHT SHIFT',brief:'Deliver the ledger to Copperworks Docks',goal:{x:-216,z:-252,label:'Copperworks Gate'},reward:1200,respect:14,
  intro:[['COURIER','This is bigger than a property deal. Crane is buying the whole waterfront.'],['REMY CORTEZ','Who is he buying it for?'],['COURIER','Get the ledger to the old dock office. Lena will read what the numbers hide.']]},
 {title:'BURN NOTICE',brief:'Hold the pier against Crane\'s crew',goal:{x:-144,z:-252,label:'Copperworks Pier'},reward:1500,respect:16,
  intro:[['LENA VALE','Crane knows we have the ledger. His crew is already on the dock road.'],['REMY CORTEZ','Let them come. I grew up throwing punches on this pier.'],['LENA VALE','Hold them off while I copy the files. Then run.']]},
 {title:'THE LONG WAY',brief:'Lose the patrol, reach Sunward Heights',goal:{x:-216,z:180,label:'Heights Overlook'},reward:1800,respect:18,
  intro:[['LENA VALE','The scanner says they sealed the causeway. Every cruiser in the county is yours.'],['REMY CORTEZ','Then I take the hill road. Nobody chases uphill in a straight line.'],['LENA VALE','Shake them, then meet me at the overlook. Bring the evidence.']]},
 {title:'CHOP SHOP',brief:'Lift Crane\'s Solara from the guarded dock lot',goal:{x:-108,z:-216,label:'Copperworks Lot'},reward:2200,respect:20,
  intro:[['LENA VALE','Crane keeps his prized Solara GT at the docks. His crew guards it like a vault.'],['REMY CORTEZ','A vault with wheels. I like those.'],['LENA VALE','Bring it to your garage on Palmetto Row. We strip it for what Crane hid inside.']]},
 {title:'UNDERTOW',brief:'Free Marisol from Crane\'s strand crew',goal:{x:288,z:60,label:'Glasshouse Strand'},reward:2600,respect:22,
  intro:[['LENA VALE','They took Marisol — she copied the ledger for us. Crane\'s crew holds her on the strand.'],['REMY CORTEZ','Nobody holds anyone on my beach.'],['LENA VALE','Get her out and walk her to the cab stand. She knows who signs Crane\'s checks.']]},
 {title:'LAST LIGHT',brief:'Stop Crane\'s convoy at the sea wall',goal:{x:252,z:252,label:'Sea Wall'},reward:5000,respect:30,
  intro:[['LENA VALE','The convoy carries the originals — and Crane. Sea wall, before sunrise.'],['REMY CORTEZ','After tonight the bay belongs to the people who swim in it.'],['LENA VALE','Give the city its morning back, Remy.']]},
 {title:'FIRST LIGHT',brief:'Outrun AIR ONE to the Heights helipad',goal:{x:-216,z:252,label:'Heights Helipad'},reward:8000,respect:40,
  intro:[['LENA VALE','Crane is finished — but the county wants a scapegoat. AIR ONE is already overhead.'],['REMY CORTEZ','Then I give them a ghost. The hill road again, one last time.'],['LENA VALE','Reach the old helipad in Sunward Heights. I have a ride waiting. Sunrise is ours.']]},
];
export function notify(text){state.toast=text;state.toastTime=2.6;const el=document.querySelector('#toast');if(el){el.textContent=text;el.style.opacity=1;}}
export function say(speaker,line,secs=5){state.speaker=speaker;state.dialogue=line;state.dialogueT=secs;}
// crew radio barks ride a separate HUD chip so they never fight the mission dialogue box
export function bark(speaker,line,secs=4){state.crewSpeaker=speaker;state.crewBark=line;state.crewBarkT=secs;}
// mission-complete banner with the cash + respect tally, drawn by hud.js
export function showBanner(title,lines,secs=4.5){state.banner={title,lines,t:secs};}
export function addRespect(amount){
 const before=rankOf(state.respect);
 state.respect+=amount;
 const after=rankOf(state.respect);
 if(after>before)notify('RESPECT UP — '+RANKS[after].name+(after===2?' · BAIL HALVED':after===4?' · NITRO REGEN x2':''));
}
export function saveGame(silent=false){const data={foot:{x:state.foot.x,z:state.foot.z,heading:state.foot.heading||0,health:state.foot.health,armor:state.foot.armor},cash:state.cash,mission:state.mission,missionStep:state.missionStep,objective:state.objective,missionTitle:state.missionTitle,weapon:state.weapon,ammo:state.ammo.map(a=>a===Infinity?-1:a),unlockedWeapons:state.unlockedWeapons,kills:state.kills,respect:state.respect,nitro:state.nitro,storedRide:state.storedRide,radioStation:state.radioStation,districtRep:state.districtRep||{}};localStorage.setItem('solstice-save',JSON.stringify(data));if(!silent)notify('NIGHT SAVED');}
export function loadGame(){try{const raw=localStorage.getItem('solstice-save');if(!raw)return false;const d=JSON.parse(raw);Object.assign(state,d);if(!state.foot)state.foot={x:246,z:10,heading:0,health:100,armor:65};if(!Number.isFinite(state.foot.x)||!Number.isFinite(state.foot.z)||(state.foot.x===0&&state.foot.z===0)){state.foot.x=246;state.foot.z=10;}state.foot.health=Math.max(35,state.foot.health||100);state.foot.heading=Number.isFinite(state.foot.heading)?state.foot.heading:0;state.ammo=d.ammo.map(a=>a===-1?Infinity:a);state.districtRep=d.districtRep||{};state.inCar=-1;state.wanted=0;state.heat=0;state.nosActive=false;state.banner=null;notify('SAVE RESTORED');return true;}catch{return false;}}
export function hasSave(){return !!localStorage.getItem('solstice-save');}