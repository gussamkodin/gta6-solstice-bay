// World layout, palette and tuning constants for Solstice Bay.
export const BLOCKS = 8;            // city blocks per axis
export const BLOCK = 56;            // block width (sidewalk to sidewalk)
export const ROAD = 16;             // road width
export const PITCH = BLOCK + ROAD;  // intersection spacing
export const HALF = (BLOCKS * PITCH + ROAD) / 2; // 296: land half-extent
export const LAND = { minX: -HALF, maxX: 310, minZ: -HALF, maxZ: HALF };
export const LANE = 3.6;            // lane offset from road centerline
export const SIDEWALK = 2.6;

// road centerline coordinates, index 0..8
export const roadAt = i => -HALF + ROAD / 2 + i * PITCH;
export const blockAt = i => -HALF + ROAD + BLOCK / 2 + i * PITCH;

export const PALETTE = {
  skyTop: 0x2e6f9e, skyHorizon: 0xffd9a0, sun: 0xffe3b0,
  fog: 0xf4c98f, asphalt: 0x3a3d44, sidewalk: 0xb9b0a2,
  sand: 0xe8d5a3, grass: 0x7fae62, water: 0x1e7f96,
  pastel: [0xf2b8c6, 0xf7d9a8, 0xa8d8d0, 0xf2a68c, 0xc9c2e8, 0xf5e6c8, 0x9fc6e8, 0xe8b7d0],
  portColors: [0xc0563e, 0x3e7fc0, 0xd8a03c, 0x4f9e6a, 0x8a8f98],
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

export const HOSPITAL = { x: 108, z: -108 };
export const PRECINCT = { x: -108, z: 108 };
export const SPAWN = { x: 246, z: 10 };
