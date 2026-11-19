// Car radio: three original stations with distinct procedural WebAudio music loops —
// WAVE 101.5 (synthwave), SOLSTICE SOUNDS (latin-funk), NIGHTDRIVE FM (lo-fi hop).
// R cycles stations while driving; the radio goes quiet on foot. No audio files.
import {state} from './state.js';
import {hit} from './input.js';
import {setStation,getStationTime} from './audio.js';
export const STATIONS=[
 {name:'WAVE 101.5',tag:'SYNTHWAVE',tracks:['Neon Meridian','Chrome Palms','Last Light Runner','Vector Sunset']},
 {name:'SOLSTICE SOUNDS',tag:'LATIN FUNK',tracks:['Bahía Caliente','Copper Brass','Mango Street','Tide Table Mambo']},
 {name:'NIGHTDRIVE FM',tag:'LO-FI HOP',tracks:['Slow Causeway','Rain on Glass','4AM Marina','Halogen Dreams']},
];
let toastT=0;
export function initRadio(){state.radioStation=0;state.radioOn=false;}
export function updateRadio(dt){
 const inCar=state.inCar>=0;
 if(inCar&&hit('KeyR')){
  state.radioStation=(state.radioStation+1)%(STATIONS.length+1); // last slot = OFF
  state.radioOn=state.radioStation<STATIONS.length;
  toastT=4;
 }
 if(toastT>0)toastT-=dt;
 state.radioToast=toastT>0&&inCar;
 if(state.radioOn&&inCar){
  const st=STATIONS[state.radioStation];
  state.radioTrack=st.tracks[Math.floor(getStationTime()/16)%st.tracks.length];
 }
 setStation(inCar&&state.radioOn?state.radioStation:-1);
}