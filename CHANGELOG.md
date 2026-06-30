# Changelog

All notable changes to `@arraypress/waveform-playlist-svelte` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
