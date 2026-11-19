// Procedural WebAudio: engine loop, sirens, gunfire, impacts, helicopter rotor, NOS whoosh,
// title ambience and the car radio's three station engines (synthwave / latin-funk / lo-fi).
// Everything is synthesized — the game ships zero audio files.
import {state} from './state.js';
let ctx=null,master,musicBus,sfxBus,radioBus,engineOsc,engineGain,engineFilter,sirenOsc,sirenGain,sirenLfo,rotorGain,rotorLfo,started=false;
let currentStation=-1,stationTimer=null,stationBar=0,stationStart=0;
export function initAudio(){if(started)return;started=true;try{ctx=new (window.AudioContext||window.webkitAudioContext)();}catch{return;}
 master=ctx.createGain();master.gain.value=.5;master.connect(ctx.destination);
 musicBus=ctx.createGain();musicBus.gain.value=.14;musicBus.connect(master);
 radioBus=ctx.createGain();radioBus.gain.value=.3;radioBus.connect(master);
 sfxBus=ctx.createGain();sfxBus.gain.value=.8;sfxBus.connect(master);
 engineOsc=ctx.createOscillator();engineOsc.type='sawtooth';engineFilter=ctx.createBiquadFilter();engineFilter.type='lowpass';engineFilter.frequency.value=320;engineGain=ctx.createGain();engineGain.gain.value=0;engineOsc.connect(engineFilter);engineFilter.connect(engineGain);engineGain.connect(sfxBus);engineOsc.start();
 sirenOsc=ctx.createOscillator();sirenOsc.type='triangle';sirenGain=ctx.createGain();sirenGain.gain.value=0;sirenLfo=ctx.createOscillator();sirenLfo.frequency.value=.7;const lg=ctx.createGain();lg.gain.value=180;sirenLfo.connect(lg);lg.connect(sirenOsc.frequency);sirenOsc.frequency.value=740;sirenOsc.connect(sirenGain);sirenGain.connect(sfxBus);sirenOsc.start();sirenLfo.start();
 // helicopter rotor: chopped low saw through a bandpass, amplitude keyed by the blade LFO
 const rotorOsc=ctx.createOscillator();rotorOsc.type='sawtooth';rotorOsc.frequency.value=52;
 const rf=ctx.createBiquadFilter();rf.type='bandpass';rf.frequency.value=160;rf.Q.value=1.2;
 rotorGain=ctx.createGain();rotorGain.gain.value=0;
 rotorLfo=ctx.createOscillator();rotorLfo.type='square';rotorLfo.frequency.value=13;
 const chop=ctx.createGain();chop.gain.value=.5;
 const chopDepth=ctx.createGain();chopDepth.gain.value=0;
 rotorLfo.connect(chopDepth);chopDepth.connect(rotorGain.gain);
 rotorOsc.connect(rf);rf.connect(chop);chop.connect(rotorGain);rotorGain.connect(sfxBus);
 rotorOsc.start();rotorLfo.start();
 scheduleTitleMusic();}
function blip(freq,dur,type,vol,when,bus){if(!ctx)return;const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(vol,when+.01);g.gain.exponentialRampToValueAtTime(.001,when+dur);o.connect(g);g.connect(bus||sfxBus);o.start(when);o.stop(when+dur+.05);}
function noiseBurst(dur,vol,freq){if(!ctx)return;const n=ctx.createBufferSource(),buf=ctx.createBuffer(1,Math.max(1,ctx.sampleRate*dur),ctx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);n.buffer=buf;const f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=freq;const g=ctx.createGain();g.gain.value=vol;n.connect(f);f.connect(g);g.connect(sfxBus);n.start();}
export function sfxGun(kind){if(!ctx)return;const t=ctx.currentTime;noiseBurst(kind===3?.3:.12,kind===3?.9:.55,kind===3?900:1600);blip(kind===3?70:120,.12,'square',.3,t);}
export function sfxPunch(){noiseBurst(.08,.4,500);}
export function sfxHit(){noiseBurst(.1,.35,300);}
export function sfxCrash(v){noiseBurst(.25,Math.min(.9,v*.06),250);}
export function sfxExplosion(){if(!ctx)return;noiseBurst(.9,1.2,140);blip(48,.8,'sine',.7,ctx.currentTime);}
export function sfxPickup(){if(!ctx)return;const t=ctx.currentTime;blip(660,.1,'sine',.3,t);blip(880,.14,'sine',.3,t+.09);}
export function sfxMission(){if(!ctx)return;const t=ctx.currentTime;[523,659,784,1046].forEach((f,i)=>blip(f,.3,'triangle',.35,t+i*.12));}
export function sfxSkid(){noiseBurst(.15,.2,2400);}
export function sfxHorn(){if(!ctx)return;const t=ctx.currentTime;blip(392,.3,'square',.2,t);blip(494,.3,'square',.2,t);}
export function sfxNos(){noiseBurst(.5,.35,3200);if(ctx)blip(180,.4,'sawtooth',.12,ctx.currentTime);}
export function updateEngine(speed,throttle,inCar){if(!ctx)return;const target=inCar?.05+Math.min(.12,speed*.004):0;engineGain.gain.setTargetAtTime(target,ctx.currentTime,.08);engineOsc.frequency.setTargetAtTime(40+speed*4+throttle*30,ctx.currentTime,.05);engineFilter.frequency.setTargetAtTime(240+speed*30,ctx.currentTime,.1);}
export function updateSiren(intensity){if(!ctx)return;sirenGain.gain.setTargetAtTime(Math.min(.14,intensity*.14),ctx.currentTime,.3);}
export function startRotor(){if(!ctx)return;rotorGain.gain.setTargetAtTime(.16,ctx.currentTime,.6);}
export function stopRotor(){if(!ctx)return;rotorGain.gain.setTargetAtTime(0,ctx.currentTime,1.2);}
export function updateRotor(on){if(!ctx)return;rotorGain.gain.setTargetAtTime(on?.16:0,ctx.currentTime,.5);}
// ---- radio stations -------------------------------------------------------
export function getStationTime(){return ctx?ctx.currentTime-stationStart:0;}
export function setStation(idx){
 if(idx===currentStation)return;
 currentStation=idx;
 if(stationTimer){clearInterval(stationTimer);stationTimer=null;}
 if(!ctx||idx<0)return;
 stationBar=0;stationStart=ctx.currentTime;
 const engines=[synthwaveBar,latinBar,lofiBar];
 const periods=[3200,2800,3600];
 const bar=()=>{if(currentStation!==idx||!ctx)return;engines[idx](ctx.currentTime+.06,stationBar++);};
 bar();stationTimer=setInterval(bar,periods[idx]);
}
// WAVE 101.5 — driving synthwave: pumping eighth bass, saw arps, airy pad
const SW_BASS=[55,55,65.4,49],SW_ARP=[220,261.6,329.6,392,440,523.3];
function synthwaveBar(t,bar){
 const root=SW_BASS[Math.floor(bar/2)%4];
 for(let s=0;s<8;s++)blip(root*(s%4===3?2:1),.22,'sawtooth',.16,t+s*.4,radioBus);
 for(let s=0;s<8;s++){const n=SW_ARP[(bar*3+s*2)%6];blip(n,.3,'square',.05,t+s*.4+.2,radioBus);}
 blip(root*4,3,'triangle',.06,t,radioBus);blip(root*6,3,'triangle',.04,t,radioBus);
 if(bar%2===0)blip(root*8,1.2,'sine',.07,t+1.6,radioBus);
}
// SOLSTICE SOUNDS — latin funk: syncopated bass, bright brass stabs, clave clicks
const LF_BASS=[73.4,73.4,87.3,65.4],LF_STAB=[[293.7,349.2,440],[261.6,329.6,392],[349.2,440,523.3],[261.6,311.1,392]];
function latinBar(t,bar){
 const root=LF_BASS[bar%4];
 const beats=[0,.7,.9,1.4,2.1,2.3];
 for(const b of beats)blip(root*(b===1.4?1.5:1),.2,'triangle',.22,t+b,radioBus);
 const chord=LF_STAB[bar%4];
 for(const off of [.35,1.75])for(const n of chord)blip(n,.24,'sawtooth',.06,t+off,radioBus);
 for(const off of [0,.7,1.4,1.75,2.45])blip(2200,.03,'square',.05,t+off,radioBus); // clave
 blip(root*2,.5,'sine',.1,t+2.8,radioBus);
}
// NIGHTDRIVE FM — lo-fi hop: dusty Rhodes chords, round sub bass, swung hats
const LO_CHORD=[[174.6,220,261.6,329.6],[164.8,196,246.9,293.7],[146.8,174.6,220,261.6],[130.8,164.8,196,246.9]];
function lofiBar(t,bar){
 const chord=LO_CHORD[Math.floor(bar/2)%4];
 for(const n of chord){blip(n,.9,'sine',.09,t+.02,radioBus);blip(n*2,.5,'sine',.02,t+.04,radioBus);}
 blip(chord[0]/2,.7,'sine',.2,t,radioBus);blip(chord[0]/2,.5,'sine',.14,t+1.8,radioBus);
 for(let s=0;s<8;s++)blip(6000,.02,'square',s%2?.015:.03,t+s*.45+(s%2?.06:0),radioBus);
 if(bar%2)blip(chord[2]*2,.6,'triangle',.05,t+2.6,radioBus);
}
// quiet title ambience so the menu has a pulse before the radio exists
let titleTimer=0;const SCALE=[220,246.9,293.7,329.6,392,440,493.9,587.3];const BASS=[110,98,87.3,98];
function scheduleTitleMusic(){if(!ctx)return;const bar=()=>{if(!ctx||state.mode!=='title')return;const t=ctx.currentTime+.05;const chord=Math.floor(titleTimer/2)%4;blip(BASS[chord],1.6,'sine',.5,t,musicBus);for(let s=0;s<8;s++){if(Math.random()<.6){const n=SCALE[(chord*2+s*3)%8];blip(n*(s%4===0?2:1),.32,'sawtooth',.06,t+s*.4,musicBus);}}titleTimer++;};bar();setInterval(bar,3200);}