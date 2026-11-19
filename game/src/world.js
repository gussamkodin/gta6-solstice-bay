// Shared live world registry so systems can find each other without circular imports.
export const world = {
  scene: null, camera: null, renderer: null, sky: null,
  cars: [],        // all vehicles: AI traffic, police, parked, player-driven
  peds: [],        // pedestrians, drivers, police officers, gang members, crew
  player: null,    // set by player.js
  waypoint: null,  // {x,z,label} current objective marker
  waypointMesh: null,
  heli: null,      // police helicopter unit, set by helicopter.js when airborne
  garage: null,    // safehouse garage record {x,z,stored}, set by garage.js
  hubMarkers: [],  // activity hub pickups
  pickups: [],     // ammo/armor/cash/health pickups
  photoFx: false,  // staged photo scenes keep effects alive for the frozen frame
};
