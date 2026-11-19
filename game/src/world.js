// Shared live world registry so systems can find each other without circular imports.
export const world = {
  scene: null, camera: null, renderer: null, sky: null,
  cars: [],        // all vehicles: AI traffic, police, parked, player-driven
  peds: [],        // pedestrians and gang members
  player: null,    // set by player.js
  waypoint: null,  // {x,z,label} current objective marker
  effects: null,
  minimapStatic: null,
};
