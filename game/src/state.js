// Central game state, story data, notifications and localStorage save/load.
export const state={mode:'title',time:0,paused:false,foot:{x:0,z:0,heading:0,health:100,armor:65},cash:2450,wanted:0,heat:0,weapon:0,ammo:[Infinity,48,0,0],unlockedWeapons:[true,true,false,false],inCar:-1,carSpeed:0,carHeading:0,crimeX:0,crimeZ:0,lastCrimeT:0,gunfireT:0,mission:0,missionStep:0,objective:'Meet Lena at the Breakwater',missionTitle:'LOW TIDE',dialogue:'',speaker:'',toast:'',toastTime:0,kills:0,side:null,sideKills:0,sideTime:0,deathCause:'',shot:new URLSearchParams(location.search).get('shot')||'',seed:Number(new URLSearchParams(location.search).get('seed')||7)};
export const missions=[
 {title:'LOW TIDE',brief:'Meet Lena at the Breakwater',goal:{x:385,z:-85,label:'Breakwater Pier'},reward:650,
  intro:[['LENA VALE','You came. Crane\'s people dredged the bay at dawn — six hours off the tide charts.'],['REMY CORTEZ','Nobody dredges at dawn unless they want the sand to keep a secret.'],['LENA VALE','Find out what they buried. Start at the pier office. And Remy — keep it quiet.']]},
 {title:'PAPER TRAIL',brief:'Catch the courier on Marigold Mile',goal:{x:180,z:36,label:'Marigold Courier'},reward:900,
  intro:[['LENA VALE','The dredging permits were signed by a shell company. A courier carries the real ledger.'],['REMY CORTEZ','Marigold Mile. He runs the pastel arcade every evening.'],['LENA VALE','Take the ledger, not his life. We need him talking later.']]},
 {title:'NIGHT SHIFT',brief:'Deliver the ledger to Copperworks Docks',goal:{x:-216,z:-252,label:'Copperworks Gate'},reward:1200,
  intro:[['COURIER','This is bigger than a property deal. Crane is buying the whole waterfront.'],['REMY CORTEZ','Who is he buying it for?'],['COURIER','Get the ledger to the old dock office. Lena will read what the numbers hide.']]},
 {title:'BURN NOTICE',brief:'Hold the pier against Crane\'s crew',goal:{x:-144,z:-252,label:'Copperworks Pier'},reward:1500,
  intro:[['LENA VALE','Crane knows we have the ledger. His crew is already on the dock road.'],['REMY CORTEZ','Let them come. I grew up throwing punches on this pier.'],['LENA VALE','Hold them off while I copy the files. Then run.']]},
 {title:'THE LONG WAY',brief:'Lose the patrol, reach Sunward Heights',goal:{x:-216,z:180,label:'Heights Overlook'},reward:1800,
  intro:[['LENA VALE','The scanner says they sealed the causeway. Every cruiser in the county is yours.'],['REMY CORTEZ','Then I take the hill road. Nobody chases uphill in a straight line.'],['LENA VALE','Shake them, then meet me at the overlook. Bring the evidence.']]},
 {title:'LAST LIGHT',brief:'Stop Crane\'s convoy at the sea wall',goal:{x:252,z:252,label:'Sea Wall'},reward:5000,
  intro:[['LENA VALE','The convoy carries the originals — and Crane. Sea wall, before sunrise.'],['REMY CORTEZ','After tonight the bay belongs to the people who swim in it.'],['LENA VALE','Give the city its morning back, Remy.']]},
];
export function notify(text){state.toast=text;state.toastTime=2.6;const el=document.querySelector('#toast');if(el){el.textContent=text;el.style.opacity=1;}}
export function say(speaker,line,secs=5){state.speaker=speaker;state.dialogue=line;state.dialogueT=secs;}
export function saveGame(){const data={foot:{x:state.foot.x,z:state.foot.z,health:state.foot.health,armor:state.foot.armor},cash:state.cash,mission:state.mission,missionStep:state.missionStep,objective:state.objective,missionTitle:state.missionTitle,weapon:state.weapon,ammo:state.ammo.map(a=>a===Infinity?-1:a),unlockedWeapons:state.unlockedWeapons,kills:state.kills};localStorage.setItem('solstice-save',JSON.stringify(data));notify('NIGHT SAVED');}
export function loadGame(){try{const raw=localStorage.getItem('solstice-save');if(!raw)return false;const d=JSON.parse(raw);Object.assign(state,d);state.ammo=d.ammo.map(a=>a===-1?Infinity:a);state.inCar=-1;state.wanted=0;state.heat=0;notify('SAVE RESTORED');return true;}catch{return false;}}
export function hasSave(){return !!localStorage.getItem('solstice-save');}
