# Changelog

All notable changes to `@arraypress/waveform-playlist-svelte` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [Unreleased]

### Added

- The hero and grid layouts: `layout` now accepts `'hero'` and `'grid'`
  alongside `'list'` / `'minimal'` (it was typed `'list' | 'minimal'`
  although both ship in the core), and their options are typed props,
  destructured from `$props()` and forwarded to the playlist:
  `showArtist`, `coverSize`, `thumbnailSize`, `density`
  (`'comfortable' | 'compact'`), `coverPosition` (`'left' | 'top'`) and
  `barPosition` (`'top' | 'bottom'`). Exported as
  `WaveformPlaylistLayoutProps`. Types come from the playlist core's
  `index.d.ts` (1.8.0 declares them all); against an older core they fall
  back to the same 1.8.0 shapes instead of degrading to `unknown`.
- `onnexttrack` / `onprevioustrack` callback props (Media Session
  next/previous), forwarded like the other callbacks. The camelCase
  `onNextTrack` / `onPreviousTrack` the props type used to inherit are
  removed: they were never destructured, so they fell into `...rest`.
- Per-track `waveform` peaks on `WaveformPlaylistTrackInput`
  (`number[] | string`), rendered as the track's `data-waveform`: an array
  is JSON-encoded, a string (e.g. a `.json` peaks URL) passed through.
  With peaks the player skips decoding that track's audio. Playlist 1.8.0
  is the first version that reads `data-waveform`.

### Fixed

- `onload`, `onplay`, `onpause`, `onend`, `ontimeupdate` and `onerror`
  fire. They were wired correctly, but the playlist overwrote the
  embedded player's callbacks with its own, so they never ran;
  `@arraypress/waveform-playlist@1.8.0` chains them after its own
  handling. Every argument the core passes now reaches the handler, and
  a new handler still never re-mounts the playlist (now tested with a
  harness that updates one prop at a time).
- `waveformGradient`, `seekHandle`, `buttonRadius` and `artworkPosition`
  reach the embedded player. All four are core player options the props
  type inherited, but they were never destructured from `$props()`, so
  each fell into `...rest`, landed on the host `<div>` as an attribute and
  was never forwarded. They are now destructured and set in the options
  builder (`buttonSize` already was).
- Changing only `class` no longer strips the playlist's own host classes
  (`waveform-playlist`, `wp-hero-layout`, `wp-grid-layout`,
  `wp-density-compact`, `wp-cover-top`, `wp-no-artist`, `wp-minimal`). A
  class-only change (correctly) doesn't remount, so when Svelte rewrote the
  `class` attribute those were gone until some other prop changed —
  hero/grid layouts collapsed and density/artist styling reverted. The host
  now binds a class value frozen at init (server markup and hydration are
  unchanged) and later `class` changes are applied with `classList`, adding
  and removing only the user's tokens. The DOM structure is unchanged — the
  tracks and the playlist UI still live directly in the one host `<div>`.
  (Mounting the playlist into an inner element was considered and rejected:
  it would break `.your-class.waveform-playlist` selectors and push CSS
  variables set via `style` / `class` onto a parent, where the core's
  defaults shadow them.)

### Changed

- **Requires `@arraypress/waveform-playlist@^1.8.0`** (was `^1.7.2`) —
  the upcoming release that makes these props work. Before it, the
  playlist ignored the constructor options this wrapper passes
  (`expandChapters`, `showDuration`, `showPlayState`, `showChapterMarkers`,
  `chapterMarkerColor`), leaked `layout` into the embedded player (fixed
  in 1.7.4), overwrote the forwarded callbacks, never read
  `data-waveform`, and its `destroy()` wiped the rendered tracks, so any
  prop change re-mounted an empty playlist. With 1.8.0 a re-mount keeps
  the tracks (now covered by a test).
- **Requires `@arraypress/waveform-player@^1.24.5`** (was `^1.23.0`), the
  playlist core's own floor.

### Removed

- The `audioMode` prop. The playlist always owns its audio, and an
  `'external'` embedded player dispatches request-play events nobody
  answers — a playlist that never plays. It was forwarded to the
  constructor; `@arraypress/waveform-playlist@1.8.0` ignores it, and the
  wrapper no longer accepts or forwards it (a stray one is swallowed
  rather than landing on the host element via `...rest`).

## [0.4.0] — 2026-08-07

### Added

- Forward the core player's `crossOrigin` option to the embedded player.
  Added to the `$props()` destructure (an undestructured prop falls
  into `...rest` and is never forwarded) and set in the options builder.
  This option shipped across the rest of the waveform family in
  `@arraypress/waveform-player@1.23.0` but was missed in the playlist
  wrappers, so it was previously accepted by the types and silently
  dropped at runtime. Requires `@arraypress/waveform-player@^1.23.0`
  and `@arraypress/waveform-playlist@^1.7.2` (the version that began
  forwarding it to each track's player).

## [0.3.0] — 2026-07-05

### Added

- Forward the core player's new localizable UI-string options —
  `seekValueText`, `playPauseLabel`, `speedLabel`, `artworkAlt`, and
  `unknownTrackText` — through to the underlying player. Requires
  `@arraypress/waveform-player@^1.20.0`.

## [0.1.0] — Unreleased

Initial release.

### Added

- `<WaveformPlaylist>` Svelte 5 component (built with runes) wrapping
  `@arraypress/waveform-playlist`:
  - Declarative `tracks` prop (with optional per-track `chapters` and
    `markers`), rendered into the `[data-track]` / `[data-chapter]` markup
    the playlist constructor parses on mount.
  - Playlist options as typed props: `layout` (`'list' | 'minimal'`),
    `continuous`, `expandChapters`, `showDuration`, `showChapterMarkers`,
    `chapterMarkerColor`, `showPlayState`.
  - The full pass-through player-option surface (waveform style, sizing,
    colours, playback, UI toggles, accessibility, icons) — inherited from
    the core `WaveformPlayerOptions` via `Omit<>`, minus per-track content
    fields (which come from `tracks`).
- Imperative navigation API exported by the component instance (reachable
  via `bind:this`): `selectTrack()`, `seekToChapter()`, `nextTrack()`,
  `previousTrack()`, `getPlayer()`, `getCurrentTrackIndex()`,
  `getTracks()`, and `getInstance()`.
- `class`, `style`, `id`, and other element attributes fall through to the
  host element via `...rest`; the base class `wfp-host` always applies.
- SSR / SvelteKit safe: the core library is loaded via dynamic
  `import('@arraypress/waveform-playlist')` inside a browser-only `$effect`.
- Identity-prop re-mount: a single `$effect` reads `JSON.stringify(tracks)`
  + every construction option, so any change destroys and rebuilds the
  instance over the freshly-rendered markup. A monotonic mount token
  discards a superseded in-flight import.
- Public types adopted from both cores (`@arraypress/waveform-playlist` +
  `@arraypress/waveform-player`), re-exported so they can never drift.
- Built with `svelte-package` (`dist/` ships the preprocessed `.svelte` +
  generated `.d.ts`). Svelte + both cores are peer dependencies.
- Vitest test suite (jsdom + `@testing-library/svelte`) covering host +
  track markup rendering, option mapping (tracks excluded), boolean-prop
  omission, destroy-on-unmount, identity-prop re-mount, and the exported
  navigation API. The core is mocked at the module boundary.
