/**
 * @module @arraypress/waveform-playlist-svelte
 * @description
 * Public entry point for the Svelte 5 wrapper around
 * `@arraypress/waveform-playlist`.
 *
 * ```svelte
 * <script lang="ts">
 *   import { WaveformPlaylist } from '@arraypress/waveform-playlist-svelte';
 * </script>
 *
 * <WaveformPlaylist
 *   tracks={[
 *     { url: '/audio/a.mp3', title: 'Track A' },
 *     { url: '/audio/b.mp3', title: 'Track B' },
 *   ]}
 * />
 * ```
 *
 * ## Types
 *
 * ```ts
 * import type {
 *   WaveformPlaylistProps,
 *   WaveformPlaylistCallbacks,
 *   WaveformPlaylistExpose,
 *   WaveformPlaylistTrackInput,
 *   WaveformPlaylistChapterInput,
 *   WaveformPlaylistOptions,
 *   WaveformPlaylistTrack,
 *   WaveformPlaylistChapter,
 *   WaveformPlaylistMarker,
 *   WaveformStyle,
 *   ColorPreset,
 *   AudioMode,
 *   AudioPreload,
 *   ButtonAlign,
 * } from '@arraypress/waveform-playlist-svelte';
 * ```
 */
export { default as WaveformPlaylist } from './WaveformPlaylist.svelte';

export type {
	WaveformPlaylistProps,
	WaveformPlaylistCallbacks,
	WaveformPlaylistExpose,
	WaveformPlaylistTrackInput,
	WaveformPlaylistChapterInput,
	WaveformPlaylistOptions,
	WaveformPlaylistTrack,
	WaveformPlaylistChapter,
	WaveformPlaylistMarker,
	WaveformStyle,
	WaveformMarker,
	WaveformPeaks,
	ColorPreset,
	AudioMode,
	AudioPreload,
	ButtonAlign,
} from './types.js';
