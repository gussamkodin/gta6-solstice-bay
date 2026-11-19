// Circle-vs-AABB collision against city footprints plus world bounds; shared by all movers.
import {obstacles} from './city.js';
import {LAND,PITCH} from './config.js';
// uniform grid: only test footprints in nearby cells
const CELL=PITCH,grid=new Map();
let indexed=false;
const cellKey=(cx,cz)=>cx+','+cz;
function indexObstacles(){
 indexed=true;
 for(const o of obstacles){
  const x0=Math.floor(o.minX/CELL),x1=Math.floor(o.maxX/CELL);
  const z0=Math.floor(o.minZ/CELL),z1=Math.floor(o.maxZ/CELL);
  for(let cx=x0;cx<=x1;cx++)for(let cz=z0;cz<=z1;cz++){
   const k=cellKey(cx,cz);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(o);
  }
 }
}
export function collideCircle(x,z,r){
 if(!indexed)indexObstacles();
 let nx=x,nz=z,hit=false;
 const x0=Math.floor((nx-r)/CELL),x1=Math.floor((nx+r)/CELL);
 const z0=Math.floor((nz-r)/CELL),z1=Math.floor((nz+r)/CELL);
 const seen=new Set();
 for(let gx=x0;gx<=x1;gx++)for(let gz=z0;gz<=z1;gz++){
  const list=grid.get(cellKey(gx,gz));if(!list)continue;
  for(const o of list){
   if(seen.has(o))continue;seen.add(o);
   if(nx+r<o.minX||nx-r>o.maxX||nz+r<o.minZ||nz-r>o.maxZ)continue;
   const px=Math.max(o.minX,Math.min(o.maxX,nx)),pz=Math.max(o.minZ,Math.min(o.maxZ,nz));
   const dx=nx-px,dz=nz-pz,d2=dx*dx+dz*dz;
   if(d2>=r*r)continue;
   hit=true;
   if(d2>1e-6){const d=Math.sqrt(d2);nx=px+dx/d*r;nz=pz+dz/d*r;}
   else{ // center inside the box: push out along smallest penetration
    const pl=nx-o.minX,pr=o.maxX-nx,pt=nz-o.minZ,pb=o.maxZ-nz;
    const m=Math.min(pl,pr,pt,pb);
    if(m===pl)nx=o.minX-r;else if(m===pr)nx=o.maxX+r;else if(m===pt)nz=o.minZ-r;else nz=o.maxZ+r;
   }
  }
 }
 if(nx<LAND.minX+r){nx=LAND.minX+r;hit=true;}
 if(nx>LAND.maxX-r){nx=LAND.maxX+r;hit=true;}
 if(nz<LAND.minZ+r){nz=LAND.minZ+r;hit=true;}
 if(nz>LAND.maxZ-r){nz=LAND.maxZ+r;hit=true;}
 return{x:nx,z:nz,hit};
}
export function blocked(x,z,r=0.5){return collideCircle(x,z,r).hit;}
export const dist2=(ax,az,bx,bz)=>{const dx=ax-bx,dz=az-bz;return dx*dx+dz*dz;};
