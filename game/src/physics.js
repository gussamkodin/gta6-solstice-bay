// Circle-vs-AABB collision against city footprints plus world bounds; shared by all movers.
import {obstacles} from './city.js';
import {LAND} from './config.js';
export function collideCircle(x,z,r){
 let nx=x,nz=z,hit=false;
 for(const o of obstacles){
  if(nx+r<o.minX||nx-r>o.maxX||nz+r<o.minZ||nz-r>o.maxZ)continue;
  const cx=Math.max(o.minX,Math.min(o.maxX,nx)),cz=Math.max(o.minZ,Math.min(o.maxZ,nz));
  let dx=nx-cx,dz=nz-cz;const d2=dx*dx+dz*dz;
  if(d2>=r*r)continue;
  hit=true;
  if(d2>1e-6){const d=Math.sqrt(d2);nx=cx+dx/d*r;nz=cz+dz/d*r;}
  else{ // center inside the box: push out along smallest penetration
   const pl=nx-o.minX,pr=o.maxX-nx,pt=nz-o.minZ,pb=o.maxZ-nz;
   const m=Math.min(pl,pr,pt,pb);
   if(m===pl)nx=o.minX-r;else if(m===pr)nx=o.maxX+r;else if(m===pt)nz=o.minZ-r;else nz=o.maxZ+r;
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
