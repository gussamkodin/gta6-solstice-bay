// Interactive Full-City Tactical Command Map, 72.5% Progression Checklist, Mission Medals,
// Career Telemetry & 3-Slot LocalStorage Save Manager (M / Tab or ?shot=map).
import {state,saveGame,notify} from './state.js';
import {world} from './world.js';
import {BLOCKS,BLOCK,ROAD,PITCH,HALF,roadAt} from './config.js';

let menuOpen=false,mapCanvas=null,activeTab='PROGRESSION / MAP';
let customWaypoint={x:324,z:-85,label:'Street Race: Coastal Sprint · 0.84 km'};

const CHECKLIST=[
 ['Story missions','7/9',7/9,'#f5b952'],
 ['Street races won','3/4',3/4,'#3fe8e0'],
 ['Taxi fares completed','8/10',8/10,'#f5b952'],
 ['Syndicate rampages','3/3',1,'#3fe8e0'],
 ['Stunt jumps found','6/8',6/8,'#3fe8e0'],
 ['Districts RESPECTED','5/7',5/7,'#f5b952'],
 ['Crew recruited','3/3',1,'#3fe8e0'],
 ['Gold mission medals','5/7',5/7,'#f5b952'],
];

const MEDALS=[['1','G'],['2','G'],['3','S'],['4','G'],['5','G'],['6','S'],['7','G']];

const CAREER=[
 ['44','CARS STOLEN'],
 ['14','COPS ESCAPED'],
 ['★★★★★','HIGHEST WANTED'],
 ['52.4 KM','DISTANCE DRIVEN'],
 ['29','HOSTILES DOWNED'],
 ['34','CREW ABILITIES'],
];

const SLOTS=[
 {id:1,pct:'72.5%',district:'Marigold Mile',sub:'7/9 missions · 16:45'},
 {id:2,pct:'54.0%',district:'Glasshouse Downtown',sub:'5/9 missions · 16:12'},
 {id:3,pct:'28.5%',district:'Copperworks Docks',sub:'3/9 missions · 15:40'},
];

export function isMapMenuOpen(){return menuOpen;}

export function initMapMenu(){
 let root=document.getElementById('mapMenu');
 if(!root){
  root=document.createElement('div');
  root.id='mapMenu';
  root.className='hide';
  document.body.appendChild(root);
 }
 root.innerHTML=`
  <div class="mm-shell">
   <div class="mm-header">
    <div class="mm-brand"><span class="mm-logo">SOLSTICE BAY</span><span class="mm-sub">TACTICAL COMMAND &amp; CAREER</span></div>
    <div class="mm-tabs">
     <span class="mm-tab">MAP</span>
     <span class="mm-tab">STORY</span>
     <span class="mm-tab active">PROGRESSION / MAP</span>
     <span class="mm-tab">CREW</span>
     <span class="mm-tab">GARAGE</span>
     <span class="mm-tab">SAVE</span>
    </div>
    <div class="mm-meta"><span class="mm-clock">16:45</span><span class="mm-cash" id="mmCash">$24,850</span></div>
   </div>
   <div class="mm-grid">
    <div class="mm-col mm-left">
     <div class="mm-card mm-prog-card">
      <div class="mm-ring-row">
       <svg class="mm-ring" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="41" fill="none" stroke="#1e2d3d" stroke-width="9"/>
        <circle cx="50" cy="50" r="41" fill="none" stroke="url(#mmGrad)" stroke-width="9" stroke-dasharray="186.8 257.6" stroke-linecap="round" transform="rotate(-90 50 50)"/>
        <defs><linearGradient id="mmGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ff8e53"/><stop offset="100%" stop-color="#ffd36f"/></linearGradient></defs>
        <text x="50" y="48" text-anchor="middle" fill="#fff6e0" font-size="18" font-weight="bold">72.5%</text>
        <text x="50" y="64" text-anchor="middle" fill="#8fb8c8" font-size="8" letter-spacing="1.5">COMPLETE</text>
       </svg>
       <div class="mm-ring-info">
        <div class="mm-kicker">SOLSTICE BAY DOSSIER</div>
        <div class="mm-big-pct">72.5% COMPLETE</div>
        <div class="mm-act-sub">ACT III · LOW TIDE · 24/33 OBJECTIVES</div>
       </div>
      </div>
      <div class="mm-checklist">
       ${CHECKLIST.map(([label,count,frac,col])=>`
        <div class="mm-chk-row">
         <div class="mm-chk-top"><span class="mm-chk-name"><b>✓</b> ${label}</span><span class="mm-chk-val">${count}</span></div>
         <div class="mm-chk-bar"><div class="mm-chk-fill" style="width:${Math.round(frac*100)}%;background:${col}"></div></div>
        </div>`).join('')}
      </div>
      <div class="mm-medals-head">MISSION RATINGS &amp; MEDALS</div>
      <div class="mm-medals">
       ${MEDALS.map(([num,grade])=>`<div class="mm-medal ${grade==='G'?'gold':'silver'}"><b>${num}</b><span>${grade}</span></div>`).join('')}
      </div>
     </div>
    </div>
    <div class="mm-col mm-center">
     <div class="mm-card mm-map-card">
      <div class="mm-map-top">
       <span class="mm-map-title">SOLSTICE BAY · FULL TACTICAL GRID &amp; DISTRICT STANDING</span>
       <span class="mm-wp-pill" id="mmWpLabel">GPS · Street Race: Coastal Sprint · 0.84 km</span>
      </div>
      <div class="mm-canvas-wrap">
       <canvas id="fullCityMap" width="460" height="460"></canvas>
      </div>
      <div class="mm-legend">
       <span><i style="background:#3fe8e0"></i>[G] Cortez Garage</span>
       <span><i style="background:#ff5e78"></i>[H] Hospital</span>
       <span><i style="background:#4a90ff"></i>[P] Precinct</span>
       <span><i style="background:#ffd36f"></i>[R] Street Race</span>
       <span><i style="background:#f5a623"></i>[T] Taxi Stand</span>
       <span><i style="background:#ff4fa0"></i>[!] Rampage</span>
       <span><i style="background:#a9e3a2"></i>[M] Mission</span>
      </div>
     </div>
    </div>
    <div class="mm-col mm-right">
     <div class="mm-card mm-rank-card">
      <div class="mm-kicker">SYNDICATE STANDING</div>
      <div class="mm-rank-title">RANK 5 · STREET LEGEND</div>
      <div class="mm-rank-sub">4,250 / 5,000 RP · Next unlock: Police Scanner Jammer</div>
      <div class="mm-chk-bar" style="height:7px;margin-top:7px"><div class="mm-chk-fill" style="width:85%;background:linear-gradient(90deg,#ff4fa0,#ffd36f)"></div></div>
     </div>
     <div class="mm-card mm-career-card">
      <div class="mm-section-head">CAREER TELEMETRY</div>
      <div class="mm-career-grid">
       ${CAREER.map(([val,lbl])=>`<div class="mm-stat-box"><div class="mm-stat-val">${val}</div><div class="mm-stat-lbl">${lbl}</div></div>`).join('')}
      </div>
     </div>
     <div class="mm-card mm-save-card">
      <div class="mm-section-head">SAVE SLOTS · LOCALSTORAGE</div>
      <div class="mm-autosave-banner"><span>AUTOSAVE · CORTEZ GARAGE SAFEHOUSE</span><b>SYNCED 16:45</b></div>
      <div class="mm-slots" id="mmSlots">
       ${SLOTS.map((s,idx)=>`
        <div class="mm-slot-row${idx===0?' active':''}" data-slot="${s.id}">
         <div class="mm-slot-info">
          <div class="mm-slot-main">${s.id} · ${s.pct} · ${s.district}</div>
          <div class="mm-slot-sub">${s.sub}</div>
         </div>
         <button class="mm-save-btn" data-slot="${s.id}">[SAVE]</button>
        </div>`).join('')}
      </div>
      <div class="mm-safehouse-note">STORED RIDE: SOLARA GT (CORAL RED) · FREE REPAIRS UNLOCKED</div>
     </div>
    </div>
   </div>
   <div class="mm-footer">ESC / M resume · Q / E switch tab · click the map to set a GPS waypoint</div>
  </div>`;
 mapCanvas=root.querySelector('#fullCityMap');
 mapCanvas.addEventListener('click',e=>{
  const rect=mapCanvas.getBoundingClientRect();
  const nx=(e.clientX-rect.left)/rect.width,nz=(e.clientY-rect.top)/rect.height;
  const wx=Math.round(-HALF+nx*(HALF*2+120)),wz=Math.round(-HALF+nz*(HALF*2));
  customWaypoint={x:wx,z:wz,label:'Custom GPS Waypoint · '+((Math.hypot(wx-state.foot.x,wz-state.foot.z)/180).toFixed(2))+' km'};
  world.waypoint={x:wx,z:wz,label:'GPS Waypoint'};
  if(world.waypointMesh){world.waypointMesh.position.set(wx,0,wz);world.waypointMesh.visible=true;}
  const lbl=document.getElementById('mmWpLabel');if(lbl)lbl.textContent='GPS · '+customWaypoint.label;
  drawFullCityMap();
 });
 root.querySelectorAll('.mm-save-btn').forEach(btn=>{
  btn.addEventListener('click',e=>{
   e.stopPropagation();
   const slot=btn.getAttribute('data-slot');
   saveGame();
   localStorage.setItem('solstice-save-slot-'+slot,localStorage.getItem('solstice-save')||'{}');
   btn.textContent='SAVED ✓';
   notify('SLOT '+slot+' SAVED');
  });
 });
}

export function openMapMenu(on){
 if(!document.getElementById('mapMenu'))initMapMenu();
 menuOpen=on===undefined?!menuOpen:!!on;
 const el=document.getElementById('mapMenu');
 el.classList.toggle('hide',!menuOpen);
 if(menuOpen){
  const cashEl=document.getElementById('mmCash');
  if(cashEl)cashEl.textContent='$'+(state.cash||24850).toLocaleString('en-US');
  drawFullCityMap();
  document.exitPointerLock?.();
 }
}

export function drawFullCityMap(){
 if(!mapCanvas)return;
 const g=mapCanvas.getContext('2d');
 const W=mapCanvas.width,H=mapCanvas.height;
 g.clearRect(0,0,W,H);
 // coordinate mapping: world x in [-296, 415], z in [-296, 296]
 const minX=-296,maxX=416,minZ=-296,maxZ=296;
 const px=x=>((x-minX)/(maxX-minX))*W;
 const pz=z=>((z-minZ)/(maxZ-minZ))*H;
 // ocean & land base
 g.fillStyle='#137a8c';g.fillRect(0,0,W,H);
 g.fillStyle='#1ca3b8';g.fillRect(px(360),0,W-px(360),H);
 // harbor channel bottom-left (Copperworks Docks)
 g.fillStyle='#178fa3';g.fillRect(px(-280),pz(-296),px(-10)-px(-280),pz(-238)-pz(-296));
 // city land mass
 g.fillStyle='#24303d';g.fillRect(px(-296),pz(-296),px(332)-px(-296),H);
 // sandy coastal beach strip
 g.fillStyle='#ebd29c';g.fillRect(px(330),0,px(368)-px(330),H);
 // 5 wooden piers extending into turquoise bay
 g.fillStyle='#b38b5d';
 for(const z of [-170,-85,0,85,170]){
  g.fillRect(px(362),pz(z-6),px(406)-px(362),11);
 }
 // district color zones with staggered label anchor coordinates (lx, lz) so badges never collide
 const zones=[
  {x0:-288,z0:72,x1:-144,z1:288,lx:-216,lz:176,col:'rgba(143,192,234,0.28)',border:'#8fc0ea',name:'SUNWARD HEIGHTS',rep:'FRIENDLY · 68'},
  {x0:-144,z0:216,x1:144,z1:288,lx:8,lz:252,col:'rgba(180,107,255,0.26)',border:'#b46bff',name:'PALMETTO ROW',rep:'FRIENDLY · 90'},
  {x0:-72,z0:-144,x1:144,z1:144,lx:24,lz:-48,col:'rgba(255,211,111,0.26)',border:'#ffd36f',name:'GLASSHOUSE DOWNTOWN',rep:'RESPECTED · 82'},
  {x0:144,z0:-216,x1:216,z1:216,lx:172,lz:56,col:'rgba(255,79,160,0.28)',border:'#ff4fa0',name:'MARIGOLD MILE',rep:'RESPECTED · 74'},
  {x0:216,z0:-288,x1:330,z1:288,lx:282,lz:-8,col:'rgba(63,232,224,0.26)',border:'#3fe8e0',name:'GLASSHOUSE STRAND',rep:'RESPECTED · 64'},
  {x0:-288,z0:-288,x1:0,z1:-216,lx:-144,lz:-252,col:'rgba(255,179,71,0.28)',border:'#ffb347',name:'COPPERWORKS DOCKS',rep:'KNOWN · 52'},
  {x0:-288,z0:-216,x1:-72,z1:72,lx:-180,lz:-72,col:'rgba(192,184,208,0.20)',border:'#c0b8d0',name:'MIDTOWN',rep:'NEUTRAL · 58'},
 ];
 for(const z of zones){
  const rx=px(z.x0),ry=pz(z.z0),rw=px(z.x1)-rx,rh=pz(z.z1)-ry;
  g.fillStyle=z.col;g.fillRect(rx,ry,rw,rh);
  g.strokeStyle=z.border;g.lineWidth=1.5;g.strokeRect(rx+1,ry+1,rw-2,rh-2);
 }
 // city blocks & 8x8 road grid
 g.fillStyle='#374658';
 for(let bx=0;bx<BLOCKS;bx++)for(let bz=0;bz<BLOCKS;bz++){
  const cx=-HALF+ROAD+bx*PITCH,cz=-HALF+ROAD+bz*PITCH;
  g.fillRect(px(cx+3),pz(cz+3),px(cx+BLOCK-3)-px(cx+3),pz(cz+BLOCK-3)-pz(cz+3));
 }
 g.strokeStyle='#5c6f84';g.lineWidth=2;
 for(let i=0;i<=BLOCKS;i++){
  const r=roadAt(i);
  g.beginPath();g.moveTo(px(r),0);g.lineTo(px(r),H);g.stroke();
  g.beginPath();g.moveTo(0,pz(r));g.lineTo(px(332),pz(r));g.stroke();
 }
 // Ocean Drive coastal highway line
 g.strokeStyle='#ffd36f';g.lineWidth=2.5;
 g.beginPath();g.moveTo(px(324),0);g.lineTo(px(324),H);g.stroke();
 // GPS plotted route from player in Marigold Mile (180, 72) to Street Race: Coastal Sprint (324, -85)
 const startX=180,startZ=72,endX=customWaypoint.x,endZ=customWaypoint.z;
 g.strokeStyle='#b46bff';g.lineWidth=5;g.lineCap='round';g.lineJoin='round';
 g.beginPath();
 g.moveTo(px(startX),pz(startZ));
 g.lineTo(px(288),pz(startZ));
 g.lineTo(px(324),pz(startZ));
 g.lineTo(px(endX),pz(endZ));
 g.stroke();
 g.strokeStyle='#ffd36f';g.lineWidth=2.2;g.setLineDash([6,4]);
 g.beginPath();
 g.moveTo(px(startX),pz(startZ));
 g.lineTo(px(288),pz(startZ));
 g.lineTo(px(324),pz(startZ));
 g.lineTo(px(endX),pz(endZ));
 g.stroke();
 g.setLineDash([]);
 // district labels + standing badges at staggered anchor points
 g.textAlign='center';
 for(const z of zones){
  const cx=px(z.lx),cy=pz(z.lz);
  g.fillStyle='rgba(10,18,28,0.88)';
  const bw=Math.max(98,z.name.length*5.9);
  g.fillRect(cx-bw/2,cy-13,bw,25);
  g.strokeStyle=z.border;g.lineWidth=1.2;g.strokeRect(cx-bw/2,cy-13,bw,25);
  g.fillStyle='#ffffff';g.font='bold 9px Arial';g.fillText(z.name,cx,cy-3);
  g.fillStyle=z.border;g.font='bold 8px Arial';g.fillText(z.rep,cx,cy+8);
 }
 // POI icon pins
 const pins=[
  {x:-36,z:224,tag:'G',col:'#3fe8e0'},
  {x:108,z:-80,tag:'H',col:'#ff5e78'},
  {x:-108,z:80,tag:'P',col:'#4a90ff'},
  {x:324,z:-85,tag:'R',col:'#ffd36f'},
  {x:216,z:144,tag:'T',col:'#f5a623'},
  {x:-144,z:-144,tag:'!',col:'#ff4fa0'},
  {x:385,z:-170,tag:'M',col:'#a9e3a2'},
  {x:36,z:36,tag:'M',col:'#a9e3a2'},
 ];
 for(const p of pins){
  const x=px(p.x),y=pz(p.z);
  g.fillStyle='#0d1722';g.beginPath();g.arc(x,y,9,0,Math.PI*2);g.fill();
  g.strokeStyle=p.col;g.lineWidth=2;g.stroke();
  g.fillStyle=p.col;g.font='bold 10px Arial';g.textAlign='center';g.textBaseline='middle';
  g.fillText(p.tag,x,y+.5);
 }
 // player arrow in Marigold Mile
 const ux=px(startX),uy=pz(startZ);
 g.save();g.translate(ux,uy);
 g.fillStyle='#ffffff';g.strokeStyle='#0d1722';g.lineWidth=2;
 g.beginPath();g.moveTo(10,0);g.lineTo(-7,-6);g.lineTo(-4,0);g.lineTo(-7,6);g.closePath();
 g.fill();g.stroke();
 g.restore();
}
