<div align="center">

# Waveform Playlist for Svelte

**Svelte 5 component wrapper for `@arraypress/waveform-playlist`.**
Declarative `tracks`, typed props for every option, and an exported imperative navigation API.

[![npm version](https://img.shields.io/npm/v/@arraypress/waveform-playlist-svelte?style=flat-square&labelColor=09090b&color=3f3f46)](https://www.npmjs.com/package/@arraypress/waveform-playlist-svelte)
[![license](https://img.shields.io/npm/l/@arraypress/waveform-playlist-svelte?style=flat-square&labelColor=09090b&color=3f3f46)](https://github.com/arraypress)

**[Documentation](https://docs.waveformplayer.com/)** · [npm](https://www.npmjs.com/package/@arraypress/waveform-playlist-svelte)

</div>

---

## Install

```bash
npm install @arraypress/waveform-playlist-svelte @arraypress/waveform-playlist @arraypress/waveform-player svelte
```

```svelte
<script lang="ts">
  import { WaveformPlaylist } from '@arraypress/waveform-playlist-svelte';
</script>

<WaveformPlaylist tracks={[{ url: '/a.mp3', title: 'A', artist: 'Artist' }]} />
```

## Documentation

Every prop, the imperative API, and SSR notes live in the docs.

### -> [docs.waveformplayer.com](https://docs.waveformplayer.com/)

[Svelte guide](https://docs.waveformplayer.com/frameworks/svelte/) — install, props, the imperative API, and SSR notes. All four Svelte wrappers (player / bar / playlist) are on that page.

## License

MIT © [ArrayPress](https://github.com/arraypress)
