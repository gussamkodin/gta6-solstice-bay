// Deterministic make.fun entrypoint for Solstice Bay — Last Light (v5.1 Sunset, Twilight & Midnight City Lighting edition).
// Copies the static browser game — Ocean Drive coastal boulevard beside sandy beach parasols
// and turquoise ocean, pastel Art Deco hotels with illuminated ground-floor glass storefronts,
// glowing amber cornice strips, dense 4-sided multi-story window grids and rooftop landmark
// boards (HOTEL SOLSTICE, PALMA SUITES, LAGUNA AZUL), cantilevered boulevard street lamps
// with smooth additive radial light pools & aerial bulb halos, road-hugging car headlight fans
// and dual red/blue Police Interceptor strobe pools, dynamic sunset/twilight/night time-of-day
// presets, the interactive full-city Tactical Command Map / 72.5% Progression / Activities /
// 3-Slot Save menu (mapmenu.js), and 3D skyline start screen with save slots —
// plus the four complementary captures, then lets the kit's unchanged dossier builder
// describe exactly those bytes.
// The copy is byte-for-byte: no transforms, no timestamps in content, so two runs with
// the same MAKEFUN_OUTPUT_DIR produce identical trees (verified with diff -r).
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const output = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(output, { recursive: true });
cpSync(join(root, 'game'), join(output, 'game'), { recursive: true });
mkdirSync(join(output, 'screenshots'), { recursive: true });
if (existsSync(join(root, 'screenshots'))) cpSync(join(root, 'screenshots'), join(output, 'screenshots'), { recursive: true });
// The four captures (Ocean Drive coastal pursuit cover, Strand Plaza crew shootout,
// Full-City Tactical Command Map & 72.5% Career/Save menu, and Aerial 3D Skyline Start
// Screen with Save Slots) are staged by the game's own photo mode (?shot=…&seed=7);
// shots.json maps each JPEG to its reproducible query and travels with the output.
if (existsSync(join(root, 'shots.json'))) cpSync(join(root, 'shots.json'), join(output, 'shots.json'));
writeFileSync(join(output, 'dossier.json'), buildDossier(output, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
}));
console.log('Solstice Bay — Last Light v5.1 (sunset/twilight/night city lighting, illuminated glass storefronts, dense multi-story window grids, additive radial road light pools & headlight fans): output ready at ' + output);
