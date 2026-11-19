// Procedural WebAudio: engine loop, sirens, gunfire, impacts, and an original synth soundtrack.
let ctx=null,master,musicBus,sfxBus,engineOsc,engineGain,engineFilter,sirenOsc,sirenGain,sirenLfo,started=false;
export function initAudio(){if(started)return;started=true;try{ctx=new (window.AudioContext||window.webkitAudioContext)();}catch{return;}
 master=ctx.createGain();master.gain.value=.5;master.connect(ctx.destination);
 musicBus=ctx.createGain();musicBus.gain.value=.16;musicBus.connect(master);
 sfxBus=ctx.createGain();sfxBus.gain.value=.8;sfxBus.connect(master);
 engineOsc=ctx.createOscillator();engineOsc.type='sawtooth';engineFilter=ctx.createBiquadFilter();engineFilter.type='lowpass';engineFilter.frequency.value=320;engineGain=ctx.createGain();engineGain.gain.value=0;engineOsc.connect(engineFilter);engineFilter.connect(engineGain);engineGain.connect(sfxBus);engineOsc.start();
 sirenOsc=ctx.createOscillator();sirenOsc.type='triangle';sirenGain=ctx.createGain();sirenGain.gain.value=0;sirenLfo=ctx.createOscillator();sirenLfo.frequency.value=.7;const lg=ctx.createGain();lg.gain.value=180;sirenLfo.connect(lg);lg.connect(sirenOsc.frequency);sirenOsc.frequency.value=740;sirenOsc.connect(sirenGain);sirenGain.connect(sfxBus);sirenOsc.start();sirenLfo.start();
 scheduleMusic();}
function blip(freq,dur,type,vol,when,bus){if(!ctx)return;const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(vol,when+.01);g.gain.exponentialRampToValueAtTime(.001,when+dur);o.connect(g);g.connect(bus||sfxBus);o.start(when);o.stop(when+dur+.05);}
function noiseBurst(dur,vol,freq){if(!ctx)return;const n=ctx.createBufferSource(),buf=ctx.createBuffer(1,ctx.sampleRate*dur,ctx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);n.buffer=buf;const f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=freq;const g=ctx.createGain();g.gain.value=vol;n.connect(f);f.connect(g);g.connect(sfxBus);n.start();}
export function sfxGun(kind){if(!ctx)return;const t=ctx.currentTime;noiseBurst(kind===3?.3:.12,kind===3?.9:.55,kind===3?900:1600);blip(kind===3?70:120,.12,'square',.3,t);}
export function sfxPunch(){noiseBurst(.08,.4,500);}
export function sfxHit(){noiseBurst(.1,.35,300);}
export function sfxCrash(v){noiseBurst(.25,Math.min(.9,v*.06),250);}
export function sfxExplosion(){if(!ctx)return;noiseBurst(.9,1.2,140);blip(48,.8,'sine',.7,ctx.currentTime);}
export function sfxPickup(){if(!ctx)return;const t=ctx.currentTime;blip(660,.1,'sine',.3,t);blip(880,.14,'sine',.3,t+.09);}
export function sfxMission(){if(!ctx)return;const t=ctx.currentTime;[523,659,784,1046].forEach((f,i)=>blip(f,.3,'triangle',.35,t+i*.12));}
export function sfxSkid(){noiseBurst(.15,.2,2400);}
export function sfxHorn(){if(!ctx)return;const t=ctx.currentTime;blip(392,.3,'square',.2,t);blip(494,.3,'square',.2,t);}
export function updateEngine(speed,throttle,inCar){if(!ctx)return;const target=inCar?.05+Math.min(.12,speed*.004):0;engineGain.gain.setTargetAtTime(target,ctx.currentTime,.08);engineOsc.frequency.setTargetAtTime(40+speed*4+throttle*30,ctx.currentTime,.05);engineFilter.frequency.setTargetAtTime(240+speed*30,ctx.currentTime,.1);}
export function updateSiren(intensity){if(!ctx)return;sirenGain.gain.setTargetAtTime(Math.min(.14,intensity*.14),ctx.currentTime,.3);}
let musicTimer=0;const SCALE=[220,246.9,293.7,329.6,392,440,493.9,587.3];const BASS=[110,98,87.3,98];
function scheduleMusic(){if(!ctx)return;const bar=()=>{if(!ctx)return;const t=ctx.currentTime+.05;const chord=Math.floor(musicTimer/2)%4;blip(BASS[chord],1.6,'sine',.5,t,musicBus);blip(BASS[chord]*2,.8,'triangle',.2,t+.8,musicBus);for(let s=0;s<8;s++){if(Math.random()<.7){const n=SCALE[(chord*2+s*3+Math.floor(Math.random()*3))%8];blip(n*(s%4===0?2:1),.32,'sawtooth',.07,t+s*.4,musicBus);}}if(musicTimer%2===0)blip(SCALE[(chord+4)%8]*2,1.4,'sine',.12,t,musicBus);musicTimer++;};bar();setInterval(bar,3200);}
