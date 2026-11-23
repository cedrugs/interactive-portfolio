import type { ActionId } from './world.ts';

export function activityFrame(action: ActionId, elapsed: number): number | null {
	const time = Math.max(0, elapsed);
	if (action === 'read') {
		const phase = time % 5200;
		return phase < 4000 ? 0 : Math.min(3, 1 + Math.floor((phase - 4000) / 400));
	}
	if (action === 'cook') return 4 + Math.floor(time / 260) % 4;
	if (action === 'chair') return 8 + (time % 2800 < 2000 ? Math.floor(time / 140) % 4 : 0);
	if (action === 'water') {
		const phase = time % 5200;
		return 12 + (phase < 1700 ? 0 : phase < 2100 ? 1 : phase < 3100 ? 2 : phase < 3500 ? 3 : 0);
	}
	return null;
}

export function blanketLift(elapsed: number): number {
	return Math.sin(Math.max(0, elapsed) / 4200 * Math.PI * 2) > .35 ? 1 : 0;
}
