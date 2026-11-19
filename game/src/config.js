// World layout, neon-sunset palette and tuning constants for Solstice Bay.
// The whole city is lit at last light: low warm sun west over the hills, teal ocean east,
// pastel art-deco walls, glowing windows and signage, wet-look asphalt.
export const BLOCKS = 8;            // city blocks per axis
export const BLOCK = 56;            // block width (sidewalk to sidewalk)
export const ROAD = 16;             // road width
export const PITCH = BLOCK + ROAD;  // intersection spacing
export const HALF = (BLOCKS * PITCH + ROAD) / 2; // 296: land half-extent
// east edge reaches the promenade: beach sand, walkway and piers are all on foot
export const LAND = { minX: -HALF, maxX: 374, minZ: -HALF, maxZ: HALF };
// the five piers reach past the promenade out over the water
export const PIER = { minX: 364, maxX: 406, zs: [-170, -85, 0, 85, 170], halfWidth: 5 };
export const LANE = 3.6;            // lane offset from road centerline
export const SIDEWALK = 2.6;

// road centerline coordinates, index 0..8
export const roadAt = i => -HALF + ROAD / 2 + i * PITCH;
export const blockAt = i => -HALF + ROAD + BLOCK / 2 + i * PITCH;

export const PALETTE = {
  skyTop: 0x2c3a6e, skyMid: 0xd95f8a, skyHorizon: 0xffb469, sun: 0xffc07a,
  fog: 0xf09a72, asphalt: 0x554e63, sidewalk: 0xc0ab97,
  sand: 0xeccf9b, grass: 0x74a05e, water: 0x14707f,
  pastel: [0xf5a8c0, 0xf7cf96, 0x93d8cc, 0xf29a80, 0xbfaef0, 0xf5e0b8, 0x8fc0ea, 0xe8a8cc],
  portColors: [0xc0563e, 0x3e7fc0, 0xd8a03c, 0x4f9e6a, 0x8a8f98],
  neonPink: 0xff4fa0, neonCyan: 0x3fe8e0, neonAmber: 0xffb347, neonViolet: 0xb46bff,
  windowLit: 0xffca7a, windowCool: 0x9fd8e8,
};

export const DISTRICTS = [
  { name: 'Glasshouse Strand', test: (bx) => bx === 7 },
  { name: 'Marigold Mile', test: (bx, bz) => bx === 6 && bz >= 1 && bz <= 6 },
  { name: 'Copperworks Docks', test: (bx, bz) => bz === 0 && bx <= 3 },
  { name: 'Palmetto Row', test: (bx, bz) => bz === 7 && bx <= 5 },
  { name: 'Sunward Heights', test: (bx, bz) => bx <= 1 && bz >= 5 },
  { name: 'Glasshouse Downtown', test: (bx, bz) => bx >= 3 && bx <= 5 && bz >= 2 && bz <= 5 },
  { name: 'Midtown', test: () => true },
];
export function districtAt(x, z) {
  const bx = Math.max(0, Math.min(7, Math.floor((x + HALF - ROAD) / PITCH)));
  const bz = Math.max(0, Math.min(7, Math.floor((z + HALF - ROAD) / PITCH)));
  return DISTRICTS.find(d => d.test(bx, bz)).name;
}

export const CAR_TYPES = {
  sedan:  { name: 'Meridian S', speed: 26, accel: 9,  grip: 0.86, w: 2.0, l: 4.4, h: 1.35, colors: [0x8fa3b8, 0xb85c50, 0x5d7a5a, 0xc2b49a, 0x4a5568] },
  sports: { name: 'Solara GT',  speed: 40, accel: 16, grip: 0.94, w: 1.9, l: 4.3, h: 1.05, colors: [0xe8452e, 0xf2c12e, 0x2ec4e8, 0xf0f0f0] },
  truck:  { name: 'Haulmaster', speed: 20, accel: 6,  grip: 0.78, w: 2.3, l: 5.6, h: 2.0,  colors: [0x6a7f8a, 0x8a6a4a, 0x556052] },
  taxi:   { name: 'Bay Cab',    speed: 25, accel: 9,  grip: 0.86, w: 2.0, l: 4.5, h: 1.4,  colors: [0xf2c12e] },
  police: { name: 'Interceptor',speed: 34, accel: 13, grip: 0.92, w: 2.0, l: 4.7, h: 1.35, colors: [0x1c2733] },
};

export const WEAPONS = [
  { name: 'FISTS',   dmg: 12, rate: 0.45, range: 2.4,  auto: false, spread: 0,    pellets: 1 },
  { name: 'KESTREL 9', dmg: 22, rate: 0.28, range: 70, auto: false, spread: 0.012, pellets: 1 },
  { name: 'HORNET SMG', dmg: 13, rate: 0.09, range: 60, auto: true, spread: 0.035, pellets: 1 },
  { name: 'TIDEBREAKER', dmg: 11, rate: 0.85, range: 30, auto: false, spread: 0.09, pellets: 6 },
];

// respawn doors sit on the sidewalk just outside the buildings
export const HOSPITAL = { x: 108, z: -80 };
export const PRECINCT = { x: -108, z: 80 };
export const SPAWN = { x: 246, z: 10 };

// nitro tuning: meter drains while held, regenerates over time (faster at Street Legend)
export const NITRO = { drain: 34, regen: 9, regenPerk: 16, minSpeed: 4 };
// safehouse garage on the Palmetto Row curb: save, repair, swap the stored ride
export const GARAGE = { x: -36, z: 224, label: 'CORTEZ GARAGE' };
