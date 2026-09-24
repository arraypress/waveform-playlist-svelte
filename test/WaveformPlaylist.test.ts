/**
 * WaveformPlaylist.test.ts
 * ------------------------
 *
 * The core `@arraypress/waveform-playlist` library is mocked at the
 * module boundary (jsdom has no Web Audio / Canvas). These tests cover
 * the wrapper's own responsibilities: rendering the host element + the
 * `[data-track]` / `[data-chapter]` markup, constructing the instance
 * with mapped options (tracks come from markup, NOT options),
 * boolean-prop omission, destroy-on-unmount, identity-prop re-mount,
 * and the exported imperative navigation API.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { flushSync } from 'svelte';

/** Captures every constructed instance so assertions can inspect them. */
const instances: MockPlaylist[] = [];

class MockPlaylist {
	el: HTMLElement;
	opts: Record<string, unknown>;
	selectTrack = vi.fn();
	seekToChapter = vi.fn();
	nextTrack = vi.fn();
	previousTrack = vi.fn();
	getPlayer = vi.fn(() => null);
	getCurrentTrackIndex = vi.fn(() => 0);
	getTracks = vi.fn(() => []);
	destroy = vi.fn();
	constructor(el: HTMLElement, opts: Record<string, unknown>) {
		this.el = el;
		this.opts = opts;
		instances.push(this);
	}
}

vi.mock('@arraypress/waveform-playlist', () => ({
	default: MockPlaylist,
	WaveformPlaylist: MockPlaylist,
}));

import WaveformPlaylist from '../src/lib/WaveformPlaylist.svelte';
import Harness from './fixtures/Harness.svelte';

const tracksA = [
	{ url: '/a.mp3', title: 'Track A' },
	{ url: '/b.mp3', title: 'Track B', chapters: [{ time: 30, label: 'Verse', color: '#fff' }] },
];

const firstInstance = () => vi.waitFor(() => expect(instances.length).toBeGreaterThan(0));

beforeEach(() => {
	instances.length = 0;
});

describe('WaveformPlaylist (Svelte)', () => {
	it('renders a div.wfp-host with [data-track] children', () => {
		const { container } = render(WaveformPlaylist, { props: { tracks: tracksA } });
		const host = container.querySelector('div.wfp-host');
		expect(host).not.toBeNull();
		const trackEls = host!.querySelectorAll('[data-track]');
		expect(trackEls).toHaveLength(2);
		expect(trackEls[0].getAttribute('data-url')).toBe('/a.mp3');
		expect(trackEls[0].getAttribute('data-title')).toBe('Track A');
	});

	it('renders [data-chapter] markup for a track with chapters', () => {
		const { container } = render(WaveformPlaylist, { props: { tracks: tracksA } });
		const chapter = container.querySelector('[data-track]:nth-child(2) [data-chapter]');
		expect(chapter).not.toBeNull();
		expect(chapter!.getAttribute('data-time')).toBe('30');
		expect(chapter!.textContent).toContain('Verse');
	});

	it('constructs the core instance over the host', async () => {
		const { container } = render(WaveformPlaylist, { props: { tracks: tracksA } });
		await firstInstance();
		expect(instances).toHaveLength(1);
		expect(instances[0].el).toBe(container.querySelector('div.wfp-host'));
	});

	it('maps playlist + player options (but NOT tracks) into the constructor', async () => {
		render(WaveformPlaylist, {
			props: { tracks: tracksA, layout: 'minimal', continuous: true, waveformStyle: 'bars', height: 64 },
		});
		await firstInstance();
		expect(instances[0].opts).toMatchObject({
			layout: 'minimal',
			continuous: true,
			waveformStyle: 'bars',
			height: 64,
		});
		expect('tracks' in instances[0].opts).toBe(false);
	});

	it('forwards the audio-loading options (preload, crossOrigin)', async () => {
		render(WaveformPlaylist, {
			props: { tracks: tracksA, preload: 'metadata', crossOrigin: 'anonymous' },
		});
		await firstInstance();
		expect(instances[0].opts).toMatchObject({
			preload: 'metadata',
			crossOrigin: 'anonymous',
		});
	});

	it('forwards the hero / grid layouts and their options', async () => {
		const { container } = render(WaveformPlaylist, {
			props: {
				tracks: tracksA,
				layout: 'grid',
				showArtist: false,
				coverSize: 120,
				thumbnailSize: 64,
				density: 'compact',
				coverPosition: 'top',
				barPosition: 'top',
			},
		});
		await firstInstance();
		expect(instances[0].opts).toMatchObject({
			layout: 'grid',
			showArtist: false,
			coverSize: 120,
			thumbnailSize: 64,
			density: 'compact',
			coverPosition: 'top',
			barPosition: 'top',
		});
		// Destructured, so none of them fell through onto the host element.
		const host = container.querySelector('div.wfp-host')!;
		expect(host.hasAttribute('density')).toBe(false);
		expect(host.hasAttribute('coversize')).toBe(false);
	});

	it('forwards waveformGradient, seekHandle, buttonSize, buttonRadius, artworkPosition', async () => {
		const { container } = render(WaveformPlaylist, {
			props: {
				tracks: tracksA,
				waveformGradient: 'diagonal',
				seekHandle: true,
				buttonSize: '4rem',
				buttonRadius: 0,
				artworkPosition: 'button',
			},
		});
		await firstInstance();
		expect(instances[0].opts).toMatchObject({
			waveformGradient: 'diagonal',
			seekHandle: true,
			buttonSize: '4rem',
			// 0 is a real value (a square button), not "unset".
			buttonRadius: 0,
			artworkPosition: 'button',
		});
		// An undestructured prop falls into ...rest and lands on the host.
		const host = container.querySelector('div.wfp-host')!;
		for (const attr of ['waveformgradient', 'seekhandle', 'buttonradius', 'artworkposition']) {
			expect(host.hasAttribute(attr), attr).toBe(false);
		}
	});

	it('accepts layout="hero"', async () => {
		render(WaveformPlaylist, { props: { tracks: tracksA, layout: 'hero' } });
		await firstInstance();
		expect(instances[0].opts.layout).toBe('hero');
	});

	it('does not forward audioMode (the playlist always owns its audio)', async () => {
		// An `'external'` player inside a playlist dispatches request-play
		// events nobody answers; playlist 1.8.0 ignores the option, and the
		// wrapper no longer accepts or forwards it — nor leaks it onto the DOM.
		const { container } = render(WaveformPlaylist, {
			// @ts-expect-error — audioMode is not a playlist prop
			props: { tracks: tracksA, audioMode: 'external' },
		});
		await firstInstance();
		expect('audioMode' in instances[0].opts).toBe(false);
		expect(container.querySelector('div.wfp-host')!.hasAttribute('audiomode')).toBe(false);
	});

	it('omits absent props so the core defaults win', async () => {
		render(WaveformPlaylist, { props: { tracks: tracksA } });
		await firstInstance();
		expect('continuous' in instances[0].opts).toBe(false);
		expect('showControls' in instances[0].opts).toBe(false);
		expect('crossOrigin' in instances[0].opts).toBe(false);
	});

	it('forwards explicit boolean props (including false)', async () => {
		render(WaveformPlaylist, { props: { tracks: tracksA, continuous: false, showDuration: true } });
		await firstInstance();
		expect(instances[0].opts.continuous).toBe(false);
		expect(instances[0].opts.showDuration).toBe(true);
	});

	/* The playlist (1.8.0+) chains these after its own handling, so each
	 * reaches the embedded player's same-named callback. */
	const CALLBACKS = {
		onload: 'onLoad',
		onplay: 'onPlay',
		onpause: 'onPause',
		onend: 'onEnd',
		ontimeupdate: 'onTimeUpdate',
		onerror: 'onError',
		onnexttrack: 'onNextTrack',
		onprevioustrack: 'onPreviousTrack',
	} as const;

	it('forwards every callback prop to the playlist, with the core arguments', async () => {
		const handlers = Object.fromEntries(Object.keys(CALLBACKS).map((prop) => [prop, vi.fn()]));
		render(WaveformPlaylist, { props: { tracks: tracksA, ...handlers } });
		await firstInstance();

		for (const [prop, option] of Object.entries(CALLBACKS)) {
			const fn = instances[0].opts[option];
			expect(typeof fn, option).toBe('function');
			(fn as (...a: unknown[]) => void)('a', 'b', 'c');
			expect(handlers[prop], prop).toHaveBeenCalledWith('a', 'b', 'c');
		}
	});

	it('reaches the latest handler without re-mounting when a callback changes', async () => {
		const first = vi.fn();
		const second = vi.fn();
		const { component } = render(Harness, { props: { initial: { onplay: first } } });
		await firstInstance();

		(component as unknown as { set: (k: string, v: unknown) => void }).set('onplay', second);
		flushSync();
		await new Promise<void>((resolve) => setTimeout(resolve, 50));
		expect(instances).toHaveLength(1);

		(instances[0].opts.onPlay as (p: unknown) => void)('player');
		expect(first).not.toHaveBeenCalled();
		expect(second).toHaveBeenCalledWith('player');
	});

	it('destroys the instance on unmount', async () => {
		const { unmount } = render(WaveformPlaylist, { props: { tracks: tracksA } });
		await firstInstance();
		const inst = instances[0];
		unmount();
		expect(inst.destroy).toHaveBeenCalledTimes(1);
	});

	it('re-mounts when the tracks change', async () => {
		const { rerender, container } = render(WaveformPlaylist, { props: { tracks: tracksA } });
		await firstInstance();
		const first = instances[0];
		await rerender({ tracks: [{ url: '/c.mp3', title: 'Track C' }] });
		await vi.waitFor(() => expect(instances.length).toBe(2));
		expect(first.destroy).toHaveBeenCalledTimes(1);
		expect(container.querySelector('[data-track]')!.getAttribute('data-url')).toBe('/c.mp3');
	});

	it('exposes the imperative navigation API via the component instance', async () => {
		const result = render(WaveformPlaylist, { props: { tracks: tracksA } });
		await firstInstance();
		const api = result.component as unknown as {
			nextTrack: () => void;
			selectTrack: (i: number) => void;
			getCurrentTrackIndex: () => number;
			getInstance: () => MockPlaylist | null;
		};
		api.nextTrack();
		api.selectTrack(1);
		expect(instances[0].nextTrack).toHaveBeenCalledTimes(1);
		expect(instances[0].selectTrack).toHaveBeenCalledWith(1);
		expect(api.getCurrentTrackIndex()).toBe(0);
		expect(api.getInstance()).toBe(instances[0]);
	});

	it('merges fall-through class + id with the base wfp-host class', () => {
		const { container } = render(WaveformPlaylist, {
			props: { tracks: tracksA, class: 'custom', id: 'pl-1' },
		});
		const el = container.querySelector('div.wfp-host') as HTMLDivElement;
		expect(el.classList.contains('custom')).toBe(true);
		expect(el.id).toBe('pl-1');
	});
});
