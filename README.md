# Solstice Bay

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/gussamkodin/gta6-solstice-bay/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/gussamkodin/gta6-solstice-bay/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

**Solstice Bay** is an original open-world crime game that runs entirely in a desktop browser from static files — no build step, no network requests, no borrowed assets. You play Remy Cortez, a wheelman pulled back into the life when Silas Crane's syndicate squeezes the city he grew up in.

The city is yours to roam: art-deco pastel towers downtown under a neon-sunset sky, a palm-lined beach and boardwalk, an industrial port of cranes and container stacks, quiet suburbs, and green hills with a lookout over the whole bay. Walk it, steal any car on the street, and drive — traffic, pedestrians, and a five-star police force that escalates from patrols to pursuits to roadblocks all react to what you do. Push the heat to three stars and **AIR ONE**, the police helicopter, takes to the sky with a searchlight and radio chatter; duck under a pier deck or into your garage to shake it.

- Nine story missions with dialogue, waypoints, chases, shootouts, a garage heist, a crew rescue and a helicopter-escape finale
- RESPECT ranks from STREET NAME to BAY LEGEND, each unlocking real perks (faster nitro regen, tougher bail deals)
- Your own garage safehouse: store a ride, repair it, save the game, and hide from AIR ONE
- Car radio with three original procedural stations — WAVE 101.5 synthwave, FUEGO 99 latin-funk, DRIFT FM lo-fi hop — cycled with R, all synthesized live
- NOS boost on Shift with a HUD meter and twin exhaust flames; hold Q for the weapon wheel
- Side work: street races, taxi fares, and rampages, with cash and weapon unlocks
- Fists, pistol, SMG and shotgun; sedans, sports cars, pickups, taxis and police cruisers
- Full HUD: health, armor, cash, wanted stars, weapon/ammo, respect, nitro, radio chip, AIR ONE chatter, speedometer and a live rotating minimap with pursuit blips
- Neon storefront signage with sidewalk spill, glowing windows and street lamps, wet-look asphalt, long golden-hour shadows, mission banners with cash/respect tallies, damage vignette and bust cinematics
- Procedural WebAudio engine notes, sirens, gunfire, rotor wash and three original radio soundtracks — zero audio files
- Start screen, pause menu, hospital/police respawn, and save/load through localStorage

Everything is original: the city, characters, vehicles, names, story, art and sound were authored for this entry. Rendered with a vendored three.js r160 under `game/vendor/`.

## Play it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. WASD to move, mouse to aim, E to enter/exit cars, Shift to sprint (NOS while driving), Space to handbrake, R to cycle the car radio, hold Q for the weapon wheel, F to interact at missions and your garage, Esc to pause (and save).

The four submission captures are real renders staged by the game's own photo mode — open `index.html?shot=street&seed=7` (also `chase`, `mission`, `combat`) to reproduce each frame deterministically.

## Hand it in

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's vendored `buildDossier`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=c0b5n3bn&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>
