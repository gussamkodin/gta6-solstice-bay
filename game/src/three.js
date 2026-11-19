// Bridge to the vendored classic three.js r160 UMD build loaded by index.html.
// Fail loudly at boot if the classic script did not run, instead of a cascade of
// undefined errors across every system that imports THREE from here.
export const THREE = window.THREE;
if (!THREE) throw new Error('vendor/three.min.js must load before src/three.js');
