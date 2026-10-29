# Hero Kids GM Companion

Unofficial, fan-made Hero Kids companion. No official adventures, characters, artwork, or copyrighted rulebook text are bundled.

## Version 2 beta — The GM’s Table

[Open the iPad-first remake](https://david-jockisch.github.io/hero-kids-gm/beta/)

The new app lives in `beta/` for hands-on iPad and OBS testing. It includes a session desk, hero roster, enemy templates, health and conditions, encounter turns, physical/digital dice, adventure scenes, journal, undo, backups, and a live read-only player display through Firebase Realtime Database. Both a transparent OBS overlay and a full encounter view are available.

See [beta/README.md](beta/README.md) for installation, OBS setup, data boundaries, Firebase configuration, limitations, and the next stages.

The original v0.1 app remains at [the main site](https://david-jockisch.github.io/hero-kids-gm/). Both versions store campaigns in the current browser; campaigns do not synchronize between devices. The new Firebase service synchronizes only the selected player display, not campaign backups.

## Checks

No frontend dependency installation or build is required.

```text
npm test
npm run check
```

App checks run on pull requests and changes to main. Firebase rules are stored in `database.rules.json` for the dedicated `hero-kids-gm-companion` project. No service account or admin credentials belong in this repository.

## Upcoming work

Validate on a real iPad/OBS table, then promote the remake to the main URL. Adventure PDF importing, portraits/maps, and expanded preparation tools will follow. Keep owned adventure PDFs and extracted content out of this public repository.
