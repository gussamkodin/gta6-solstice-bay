// Deterministic make.fun entrypoint for Solstice Bay — Last Light (v4.1 top-10 polish).
// Copies the static browser game — sun-lit slate boulevards with twin-yellow center
// lines and dashed white lane dashes, subtle curb-side neon pools, a camera-snap fix
// so staged FOV is exact, a sculpted Solara GT, the high-density tactical HUD (mission
// stage card, SBPD dispatch telemetry, weapon hotbar, crew cards, rank progress) —
// plus the four restaged captures, then lets the kit's unchanged dossier builder
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
// The four captures (street cover, AIR ONE pursuit, UNDERTOW docks rescue, strand
// shootout) are staged by the game's own photo mode (?shot=…&seed=7) with a seeded sky;
// shots.json maps each JPEG to its reproducible query and travels with the output.
if (existsSync(join(root, 'shots.json'))) cpSync(join(root, 'shots.json'), join(output, 'shots.json'));
writeFileSync(join(output, 'dossier.json'), buildDossier(output, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
}));
console.log('Solstice Bay — Last Light v4.1 (tactical dispatch HUD, weapon loadout bar, camera snap fix, boulevard pursuit cover): output ready at ' + output);
