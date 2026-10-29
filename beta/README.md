# Hero Kids · The GM’s Table

An unofficial, iPad-first game master companion for Hero Kids. Static PWA on GitHub Pages, with optional Firebase Realtime Database for a live, read-only OBS display.

## At the table

- Session desk with active heroes, enemy health, conditions, round/side tracking, private encounter notes, and an activity log.
- A reusable hero roster (one active hero per player) and enemy templates.
- Physical or digital dice for either side, highest-die comparison, and a separate one-time Apply Damage action. Characters with zero dice in the selected stat require another attack type or a manual resolution.
- Undo for the last 30 changes during the current visit.
- Adventures with scenes that can be loaded into encounters, and a session journal.
- Backup export/import. Older v1 backups import into the new model; original v1 browser storage is left intact.
- Large touch controls and layouts for iPad landscape, portrait, and narrower screens.

## iPad installation

Open https://david-jockisch.github.io/hero-kids-gm/beta/ in Safari. Choose **Share → Add to Home Screen**, then launch it once online to cache the app files. On an existing installation, reopen online and refresh to receive an update. Core game tools use local browser storage; deleting browser data can remove your campaign. Export backups after sessions.

## Live player display in OBS

1. On the iPad, open **Player display → Connect Firebase**.
2. Copy the **Transparent OBS URL** or **Full encounter URL**.
3. On the OBS computer, add a **Browser Source**, paste the selected URL, and set the source size to **1920 × 1080**.
4. Keep the GM app open on the iPad. Both devices need internet. iPad Safari can suspend background tabs; return to the app to resume updates.
5. Use the iPad’s visibility switches to select heroes, enemies, round/turn, and dice. Announcements are player-facing. **Hide player display** blanks the display. **End table link** removes the shared state and revokes that URL.

Display URLs are bearer-style read-only links: someone who has the complete URL can see the selected display but cannot control the game. Do not post live links publicly. A fresh table connection after ending a link generates a new random URL. The URL never contains a Firebase ID token or editor credential.

The on-device preview uses BroadcastChannel between tabs in the same browser. A link ending in `#preview` is a local preview and will not synchronize a different device; use the generated Firebase link in OBS.

## Data boundaries and Firebase

Project: `hero-kids-gm-companion`, on the Spark plan. Realtime Database is used, not Firestore. Public web-app config lives in `firebase-config.js`; this is not an admin credential. No service account keys belong in the repository.

Firebase Anonymous Authentication creates a persistent device identity without requiring an OBS sign-in prompt. The controller owns `/tableDisplays/{uid}/{random-128-bit-room}`. Rules permit only that UID to write, prevent listing at parent paths, and permit signed-in viewers to read a known room. Per-field validators reject extra fields and constrain strings, health, dice, and array keys. Only `HK.project()` output is published: active character display cards, encounter title, round/turn, dice, announcement, and display flags. No GM notes, journal, adventure library, inactive hero details, or player names are uploaded.

Campaigns remain device-local; the display is not a cloud campaign backup. Losing device authentication can strand an old display link. End links from their original controller before clearing browser data. The cloud snapshot is updated after game changes and every 15 seconds while connected. There is no automatic expiry of old cloud snapshots in this version.

`database.rules.json` is the deployed rules source; `firebase.json` and `.firebaserc` support future rule/emulator work. Deploy only the intended rules and review rule changes before publication.

## Development

No build or package installation is needed for the frontend. Serve the repository as static files over HTTP for local testing. A web server must serve `.mjs` as JavaScript.

```text
npm test
npm run check
```

Tests cover legacy backup normalization, invalid backup rejection, private/public state boundaries, health clamping, player activation, turn progression and undo, physical dice comparisons, one-time damage, character form handling, empty-page render paths, and text escaping. Browser QA and an actual iPad/OBS session are separate checks.

The service worker caches only app assets and removes only caches with this app’s prefix. Firebase SDK modules load on demand from Google’s CDN; core gameplay does not depend on Firebase loading. External fonts fall back to device fonts offline. Do not cache player-display snapshots in the service worker.

## Next stages

PDF adventure importing, portraits/maps, and richer adventure preparation are planned after validating the core game-night workflow. No PDF extraction is implemented in v2.0. No official Hero Kids adventures, artwork, character sheets, or monster content are bundled. Enter stats from your owned materials; keep adventure PDFs out of this public repository.
