# Solstice Bay

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/gussamkodin/gta6-solstice-bay/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/gussamkodin/gta6-solstice-bay/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

**Solstice Bay** is an original open-world crime game that runs entirely in a desktop browser from static files — no build step, no network requests, no borrowed assets. You play Remy Cortez, a wheelman pulled back into the life when Silas Crane's syndicate squeezes the city he grew up in.

The city is yours to roam: art-deco pastel towers downtown, a palm-lined beach and boardwalk, an industrial port of cranes and container stacks, quiet suburbs, and green hills with a lookout over the whole bay. Walk it, steal any car on the street, and drive — traffic, pedestrians, and a five-star police force that escalates from patrols to pursuits to roadblocks all react to what you do.

- Six story missions with dialogue, waypoints, chases, shootouts and a heist finale
- Side work: street races, taxi fares, and rampages, with cash and weapon unlocks
- Fists, pistol, SMG and shotgun; sedans, sports cars, pickups, taxis and police cruisers
- Full HUD: health, armor, cash, wanted stars, weapon/ammo, speedometer and a live rotating minimap
- Third-person camera tuned separately for foot and car, skid marks, muzzle flashes, explosions, golden-hour lighting
- Procedural WebAudio engine notes, sirens, gunfire and an original synth soundtrack — zero audio files
- Start screen, pause menu, hospital/police respawn, and save/load through localStorage

Everything is original: the city, characters, vehicles, names, story, art and sound were authored for this entry. Rendered with a vendored three.js r160 under `game/vendor/`.

## Play it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. WASD to move, mouse to aim, E to enter/exit cars, Shift to sprint, Space to handbrake, 1–4 for weapons, Esc to pause (and save).

## Hand it in

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's vendored `buildDossier`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=c0b5n3bn&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>
