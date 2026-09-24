<!--
  Test harness: renders <WaveformPlaylist> the way a real parent does, with
  each option in its own reactive slot, so changing one prop invalidates
  only that prop. `@testing-library/svelte`'s own `rerender()` replaces a
  single `$state.raw` props object, which invalidates EVERY prop at once
  and would make any change look like a re-mount input.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import WaveformPlaylist from '../../src/lib/WaveformPlaylist.svelte';

	let { initial = {} }: { initial?: Record<string, unknown> } = $props();

	const opts: Record<string, unknown> = $state(untrack(() => ({ ...initial })));

	/** Change one prop on the rendered playlist. */
	export function set(key: string, value: unknown): void {
		opts[key] = value;
	}
</script>

<WaveformPlaylist tracks={[{ url: '/a.mp3' }]} {...opts} />
