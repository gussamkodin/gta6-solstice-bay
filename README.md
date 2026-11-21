# Solstice Bay

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/gussamkodin/gta6-solstice-bay/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/gussamkodin/gta6-solstice-bay/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

**Solstice Bay** is an original open-world crime game that runs entirely in a desktop browser from static files — no build step, no network requests, no borrowed assets. You play Remy Cortez, a wheelman pulled back into the life when Silas Crane's syndicate squeezes the city he grew up in.

The city is yours to roam: art-deco pastel towers downtown under a neon-sunset sky, a palm-lined beach and boardwalk, an industrial port of cranes and container stacks opening onto a shimmering harbor channel backed by soft coastal ridges, and quiet suburbs. Walk it, steal any car on the street, and drive — traffic, pedestrians, and a five-star police force that escalates from patrols to pursuits to roadblocks all react to what you do. Push the heat to three stars and **AIR ONE**, the police helicopter, takes to the sky with a searchlight and radio chatter; duck under a pier deck or into your garage to shake it.

- Nine story missions with dialogue, waypoints, chases, shootouts, a garage heist, a crew rescue and a helicopter-escape finale
- Two named crew companions, Marisol and Dex: follow on foot, cover Remy in shootouts, and trade neighborhood barks
- Seven districts remember local respect, announce arrivals with their own color banners, and unlock small neighborhood perks
- Low-angle coastal boulevard photo staging (`?shot=street&seed=7`) puts Remy at the wheel of the sculpted coral-red Solara GT racing down Ocean Drive with three Police Interceptors and AIR ONE in pursuit, pastel Art Deco hotels with rooftop landmark signs (`HOTEL SOLSTICE`, `PALMA SUITES`, `LAGUNA AZUL`, `MARIGOLD GRAND`, `CASINO SOL`) on one side and golden beach sand, colorful parasols and turquoise ocean on the other
- Interactive Full-City Tactical Command Map, 72.5% Progression Checklist, Mission Medal Ratings, Career Telemetry & 3-Slot Save Manager (`M` / `Tab` or `?shot=map&seed=7`) with click-to-plot GPS waypoints across all seven color-coded districts
- RESPECT ranks from OUTSIDER to Rank 5 STREET LEGEND (`4,250 / 5,000 RP`), each unlocking real perks (faster nitro regen, tougher bail deals, scanner jammer preview)
- Your own garage safehouse on Palmetto Row plus 3 interactive `localStorage` save slots accessible from both the 3D Skyline Start Screen (`?shot=title&seed=7`) and the Tactical Command Map
- Car radio with three original procedural stations — WAVE 101.5 Island Synthwave, FUEGO 99 Latin-Funk, DRIFT FM Lo-Fi Hop — cycled with R, all synthesized live
- NOS boost on Shift with a HUD meter and twin exhaust flames; hold Q for the weapon wheel
- Side work: street races, taxi fares, syndicate rampages and stunt jumps tracked in the 72.5% completion dossier with cash, medal and weapon unlocks
- Fists, .38 Kestrel pistol, Hornet SMG, 12G Tidebreaker shotgun and AR-9 carbine slot; sculpted sedans, sports cars with full-width LED tail bars, twin exhausts and carbon roofs, pickups, taxis, and Interceptor cruisers with white doors, push-bars and red/blue strobe halos
- Upgraded tactical HUD: bottom-left rounded-square minimap + district standing progress card (`GLASSHOUSE STRAND · RESPECTED 74/100`) + HP/ARM bars; top-left mission stage card + SBPD tactical dispatch telemetry; top-right clock (`16:45`), mint-green cash (`$24,850`), wanted stars + `AIR ONE DEPLOYED` / `UNITS RESPONDING` tag, Rank 5 Street Legend bar, 5-slot SVG weapon hotbar and 3 crew ability cards (`[Z] SWAP PLATES · Marisol`, `[X] QUICK FIX · Dex`, `[C] EYES OUT · Lena`); bottom-right dual KM/H & MPH speedometer, vehicle condition badge, nitro meter and radio chip
- Dynamic sunset (`18:40`), twilight (`19:50`) and midnight (`22:15`) city lighting (`setTimeOfDay` in `sky.js`) with illuminated ground-floor glass storefronts, dark architectural mullions, continuous glowing amber cornice fascia, dense 4-sided multi-story lit window grids, cantilevered street lamps with aerial bulb halos and smooth additive radial golden ground pools, road-hugging car headlight fans, and dual red/blue Police Interceptor strobe pools on the asphalt
- Procedural WebAudio engine notes, sirens, gunfire, rotor wash and three original radio soundtracks — zero audio files
- Transparent 3D aerial beachfront & hotel skyline start screen with 3 save slot cards, pause menu, full-city map menu, hospital/police respawn, and save/load through localStorage

Everything is original: the city, characters, vehicles, names, story, art and sound were authored for this entry. Rendered with a vendored three.js r160 under `game/vendor/`.

## Play it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. WASD to move, mouse to aim, E to enter/exit cars, Shift to sprint (NOS while driving), Space to handbrake, R to cycle the car radio, M or Tab to open the Full-City Tactical Command Map & Save Slots menu, N to cycle Sunset / Midnight / Twilight city lighting, hold Q for the weapon wheel, F to interact at missions and your garage, Esc to pause (and save).

The four submission captures are real renders staged by the game's own photo mode — open `index.html?shot=street&seed=7` (also `combat`, `map`, `title`) to reproduce each frame deterministically.

## Hand it in

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's vendored `buildDossier`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=c0b5n3bn&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>
