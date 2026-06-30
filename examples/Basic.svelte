<!--
  examples/Basic.svelte
  ---------------------

  Reference Svelte 5 component demonstrating <WaveformPlaylist> usage.
  Copy/paste into your own Svelte / SvelteKit app.

  Library setup (do this ONCE in your app entry — e.g. `+layout.svelte`):

    import '@arraypress/waveform-player';                              // registers window.WaveformPlayer
    import '@arraypress/waveform-player/dist/waveform-player.css';
    import '@arraypress/waveform-playlist/dist/waveform-playlist.css';

  The wrapper does NOT auto-import CSS, and the playlist needs the core
  player present as window.WaveformPlayer at construction time.
-->
<script lang="ts">
	import {
		WaveformPlaylist,
		type WaveformPlaylistTrackInput,
	} from '@arraypress/waveform-playlist-svelte';

	/* Imperative navigation via bind:this. */
	let playlist: WaveformPlaylist;

	/* Tracks with metadata + chapters. */
	const tracks: WaveformPlaylistTrackInput[] = [
		{
			url: '/audio/episode-1.mp3',
			title: 'Episode 1',
			subtitle: 'The Pilot',
			artwork: '/img/ep1.jpg',
			duration: '42:10',
			chapters: [
				{ time: 0, label: 'Cold open' },
				{ time: 90, label: 'Main topic', color: '#a855f7' },
				{ time: '38:00', label: 'Wrap-up' },
			],
		},
		{ url: '/audio/episode-2.mp3', title: 'Episode 2', subtitle: 'Deep dive' },
	];
</script>

<!-- 1 — Minimal -->
<WaveformPlaylist {tracks} />

<!-- 2 — Full list, continuous playback, durations, chosen waveform style -->
<WaveformPlaylist {tracks} layout="list" continuous showDuration waveformStyle="bars" height={72} />

<!-- 3 — Compact switcher layout -->
<WaveformPlaylist {tracks} layout="minimal" />

<!-- 4 — Imperative navigation via bind:this -->
<WaveformPlaylist bind:this={playlist} {tracks} />
<div style="display: flex; gap: 0.5rem; margin-top: 1rem">
	<button onclick={() => playlist.previousTrack()}>Prev</button>
	<button onclick={() => playlist.nextTrack()}>Next</button>
	<button onclick={() => playlist.selectTrack(1)}>Track 2</button>
</div>
