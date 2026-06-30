<!--
  WaveformPlaylist.svelte
  -----------------------

  Svelte 5 wrapper around `@arraypress/waveform-playlist`. Renders a host
  `<div>` containing the playlist's tracks as `[data-track]` /
  `[data-chapter]` child markup, then — on mount — constructs a
  `WaveformPlaylist` over that host. The library's constructor parses the
  track markup, hides it, and renders the interactive playlist + embedded
  player into the host. On unmount (or identity-prop change) the instance
  is destroyed and rebuilt.

  Why child markup instead of an options array? The `WaveformPlaylist`
  constructor reads its tracks from `[data-track]` child elements (the
  same contract the vanilla library uses), then auto-initialises. So this
  wrapper renders that markup declaratively from the `tracks` prop and lets
  the constructor consume it. The host deliberately does NOT carry
  `data-waveform-playlist` — that attribute drives the library's *global*
  auto-init, which would double-mount on top of the instance we create.

  Like the React / Vue counterparts, non-identity prop changes also
  re-create the instance, which is simpler than diffing every option. The
  core re-uses waveform peaks cached by URL, so same-URL re-mounts are
  cheap.

  Library setup — import BOTH cores' CSS ONCE in your app entry; this
  component does NOT import it for you:

      import '@arraypress/waveform-player/dist/waveform-player.css';
      import '@arraypress/waveform-playlist/dist/waveform-playlist.css';

  The playlist constructs a `new window.WaveformPlayer(...)` for the active
  track, so the player core must be registered as a global before the
  playlist mounts. Import the player package for its side effect once:

      import '@arraypress/waveform-player'; // registers window.WaveformPlayer

  The playlist's JS is imported dynamically inside a `$effect` (which only
  runs in the browser), so SSR never evaluates the audio surface.
-->
<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WaveformPlayer as WaveformPlayerInstance } from '@arraypress/waveform-player';
	import type { WaveformPlaylist as WaveformPlaylistInstance } from '@arraypress/waveform-playlist';
	import type {
		WaveformPlaylistCallbacks,
		WaveformPlaylistProps,
		WaveformPlaylistTrack,
	} from './types.js';

	/** Minimal structural view of the methods the wrapper calls. */
	type PlaylistInstance = {
		destroy?: () => void;
		selectTrack?: (i: number) => void;
		seekToChapter?: (t: number, s: number) => void;
		nextTrack?: () => void;
		previousTrack?: () => void;
		getPlayer?: () => unknown;
		getCurrentTrackIndex?: () => number;
		getTracks?: () => WaveformPlaylistTrack[];
	};
	type PlaylistCtor = new (el: HTMLElement, opts: Record<string, unknown>) => PlaylistInstance;

	type Props = WaveformPlaylistProps & WaveformPlaylistCallbacks & HTMLAttributes<HTMLDivElement>;

	let {
		// ── Tracks (rendered into [data-track] markup, not options) ────
		tracks = [],
		// ── Playlist-level options ─────────────────────────────────────
		layout,
		continuous,
		expandChapters,
		showDuration,
		showChapterMarkers,
		chapterMarkerColor,
		showPlayState,
		// ── Audio source (forwarded to the embedded player) ────────────
		audioMode,
		preload,
		// ── Waveform visualisation ─────────────────────────────────────
		waveformStyle,
		height,
		samples,
		barWidth,
		barSpacing,
		barRadius,
		// ── Colours ────────────────────────────────────────────────────
		colorPreset,
		waveformColor,
		progressColor,
		buttonColor,
		buttonHoverColor,
		textColor,
		textSecondaryColor,
		backgroundColor,
		borderColor,
		// ── Playback controls ──────────────────────────────────────────
		playbackRate,
		showPlaybackSpeed,
		playbackRates,
		// ── UI toggles ─────────────────────────────────────────────────
		showControls,
		showInfo,
		showTime,
		showHoverTime,
		showBPM,
		bpm,
		buttonAlign,
		buttonStyle,
		buttonSize,
		// ── Accessibility ──────────────────────────────────────────────
		accessibleSeek,
		seekLabel,
		// ── Error UI ───────────────────────────────────────────────────
		errorText,
		// ── Markers (render toggle; per-track data comes from `tracks`) ─
		showMarkers,
		// ── Behaviour ──────────────────────────────────────────────────
		autoplay,
		singlePlay,
		playOnSeek,
		enableMediaSession,
		// ── Icons ──────────────────────────────────────────────────────
		playIcon,
		pauseIcon,
		// ── Lifecycle callbacks (forwarded to the embedded player) ─────
		onload,
		onplay,
		onpause,
		onend,
		ontimeupdate,
		onerror,
		// ── Host element ───────────────────────────────────────────────
		class: className = '',
		...rest
	}: Props = $props();

	let container: HTMLDivElement;
	let instance: PlaylistInstance | null = null;
	/* Monotonic token: every (re)mount bumps it; an in-flight async
	 * import whose token is stale bails instead of attaching a zombie. */
	let token = 0;

	/**
	 * Map the current props into the playlist constructor's option shape.
	 * Tracks are intentionally excluded — the constructor reads them from
	 * the `[data-track]` child markup this component renders, not options.
	 */
	function buildOptions(): Record<string, unknown> {
		const opts: Record<string, unknown> = {};
		const set = (key: string, value: unknown) => {
			if (value !== undefined && value !== null) opts[key] = value;
		};

		/* Playlist-level options */
		set('layout', layout);
		set('continuous', continuous);
		set('expandChapters', expandChapters);
		set('showDuration', showDuration);
		set('showChapterMarkers', showChapterMarkers);
		set('chapterMarkerColor', chapterMarkerColor);
		set('showPlayState', showPlayState);

		/* Pass-through player options */
		set('audioMode', audioMode);
		set('preload', preload);

		set('waveformStyle', waveformStyle);
		set('height', height);
		set('samples', samples);
		set('barWidth', barWidth);
		set('barSpacing', barSpacing);
		set('barRadius', barRadius);

		set('colorPreset', colorPreset);
		set('waveformColor', waveformColor);
		set('progressColor', progressColor);
		set('buttonColor', buttonColor);
		set('buttonHoverColor', buttonHoverColor);
		set('textColor', textColor);
		set('textSecondaryColor', textSecondaryColor);
		set('backgroundColor', backgroundColor);
		set('borderColor', borderColor);

		set('playbackRate', playbackRate);
		set('showPlaybackSpeed', showPlaybackSpeed);
		set('playbackRates', playbackRates);

		set('showControls', showControls);
		set('showInfo', showInfo);
		set('showTime', showTime);
		set('showHoverTime', showHoverTime);
		set('showBPM', showBPM);
		set('bpm', bpm);
		set('buttonAlign', buttonAlign);
		set('buttonStyle', buttonStyle);
		set('buttonSize', buttonSize);

		set('accessibleSeek', accessibleSeek);
		set('seekLabel', seekLabel);

		set('errorText', errorText);

		set('showMarkers', showMarkers);

		set('autoplay', autoplay);
		set('singlePlay', singlePlay);
		set('playOnSeek', playOnSeek);
		set('enableMediaSession', enableMediaSession);

		set('playIcon', playIcon);
		set('pauseIcon', pauseIcon);

		return opts;
	}

	function teardown() {
		if (instance && typeof instance.destroy === 'function') {
			try {
				instance.destroy();
			} catch (err) {
				console.warn('[WaveformPlaylistSvelte] destroy() threw:', err);
			}
		}
		instance = null;
	}

	function mount(opts: Record<string, unknown>) {
		const my = ++token;
		if (!container) return;

		import('@arraypress/waveform-playlist')
			.then((mod) => {
				if (my !== token || !container) return;

				const Ctor = (mod.default ??
					(mod as { WaveformPlaylist?: unknown }).WaveformPlaylist) as PlaylistCtor;
				if (typeof Ctor !== 'function') {
					console.error('[WaveformPlaylistSvelte] Failed to resolve WaveformPlaylist constructor from module.');
					return;
				}

				/* Wire callbacks. The playlist forwards unknown options
				 * straight to the embedded player, so these reach its
				 * lifecycle hooks. The lowercase props are reactive, so the
				 * closures always reach the latest handler without a remount. */
				opts.onLoad = (i: WaveformPlayerInstance) => onload?.(i);
				opts.onPlay = (i: WaveformPlayerInstance) => onplay?.(i);
				opts.onPause = (i: WaveformPlayerInstance) => onpause?.(i);
				opts.onEnd = (i: WaveformPlayerInstance) => onend?.(i);
				opts.onTimeUpdate = (c: number, d: number, i: WaveformPlayerInstance) => ontimeupdate?.(c, d, i);
				opts.onError = (e: Error, i: WaveformPlayerInstance) => onerror?.(e, i);

				try {
					instance = new Ctor(container, opts);
				} catch (err) {
					/* The most common cause is a missing core player —
					 * `window.WaveformPlayer` must be present before the
					 * playlist constructs. Surface it clearly. */
					console.error('[WaveformPlaylistSvelte] Failed to construct playlist:', err);
				}
			})
			.catch((err) => {
				console.error('[WaveformPlaylistSvelte] Failed to load library:', err);
			});
	}

	/* Mount / re-mount lifecycle. `JSON.stringify(tracks)` reads the track
	 * set and `buildOptions()` reads every construction option — both
	 * synchronously — so the effect re-runs (and re-mounts) when the tracks
	 * or any construction prop change. The freshly-rendered `[data-track]`
	 * markup is in the DOM before this runs. Browser-only: SSR renders just
	 * the bare host `<div>` + track markup. */
	$effect(() => {
		// Read tracks so a changed track set tears down and rebuilds the
		// playlist (the constructor re-parses the updated child markup).
		JSON.stringify(tracks);
		const opts = buildOptions();
		teardown();
		mount(opts);
		return () => {
			token += 1;
			teardown();
		};
	});

	/* Imperative API — reachable via `bind:this`. Thin pass-throughs;
	 * calls before the async instance mounts are safe no-ops. */
	export function selectTrack(index: number): void {
		instance?.selectTrack?.(index);
	}
	export function seekToChapter(trackIndex: number, time: number): void {
		instance?.seekToChapter?.(trackIndex, time);
	}
	export function nextTrack(): void {
		instance?.nextTrack?.();
	}
	export function previousTrack(): void {
		instance?.previousTrack?.();
	}
	export function getPlayer(): unknown | null {
		return instance?.getPlayer?.() ?? null;
	}
	export function getCurrentTrackIndex(): number {
		return instance?.getCurrentTrackIndex?.() ?? 0;
	}
	export function getTracks(): WaveformPlaylistTrack[] {
		return instance?.getTracks?.() ?? [];
	}
	export function getInstance(): WaveformPlaylistInstance | null {
		return instance as unknown as WaveformPlaylistInstance | null;
	}
</script>

<div bind:this={container} class={`wfp-host ${className}`.trim()} {...rest}>
	{#each tracks as track, i (i)}
		<div
			data-track=""
			data-url={track.url}
			data-title={track.title}
			data-subtitle={track.subtitle}
			data-artwork={track.artwork}
			data-album={track.album}
			data-duration={track.duration}
			data-markers={track.markers ? JSON.stringify(track.markers) : undefined}
		>
			{#each track.chapters ?? [] as chapter, ci (ci)}
				<div data-chapter="" data-time={String(chapter.time)} data-color={chapter.color}>
					{chapter.label}
				</div>
			{/each}
		</div>
	{/each}
</div>
