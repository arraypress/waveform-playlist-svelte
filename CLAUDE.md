# CLAUDE.md — @arraypress/waveform-playlist-svelte

Svelte 5 wrapper for `@arraypress/waveform-playlist`. Renders a declarative `tracks`
array into the `data-*` markup the playlist parses.

## Commands
- `npm test` — vitest + jsdom (run before committing).
- `npm run build` — bundles to `dist/`. `prepublishOnly` runs it. `dist/` is gitignored.

## The rule that matters: an undestructured prop vanishes

`src/lib/WaveformPlaylist.svelte`. **This follows the player-wrapper pattern, not the
bar's verbatim pass-through.** A new option needs:
1. Add it to the `$props()` destructure (~line 136).
2. `set('<key>', <key>);` in the options builder (~line 156+).

Step 1 is the trap: a prop that isn't destructured falls into `...rest`, lands on the
DOM element, and is **never forwarded**. No error, typechecks clean.

## Conventions
- Types derive from **both** cores — `waveform-playlist` owns playlist options,
  `waveform-player` owns the visualisation options forwarded to embedded players.
  Never re-declare either surface here.
- Forward a new *player* option only if the playlist should pass it to its embedded
  players — usually yes (`preload`, `waveformStyle`, `height` all do) — never `audioMode`, which the playlist ignores since 1.8.0 (it always owns its audio).
- Add a test under `test/` + a `CHANGELOG.md` entry.

## History
`crossOrigin` shipped across the rest of the family in 2026-07 but was missed in
all four playlist wrappers — accepted by the types, silently dropped at runtime.
Fixed in 0.4.0. That miss is why this group is now steps 12–15 of the
`waveform-release` checklist rather than an afterthought.

## Cross-repo
One of 15 packages that must change together — load the `waveform-release` skill.
