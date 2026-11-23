import type { Facing } from './world.ts';

export const STRIDE_DISTANCE = 32;
export const WALK_PHASES = [1, 0, 3, 2] as const;

export function advanceStride(phase: number, distance: number): number {
	return (phase + Math.max(0, distance)) % STRIDE_DISTANCE;
}

export function walkingFrame(facing: Facing, phase: number, moving: boolean): number {
	const row = { down: 0, left: 1, right: 2, up: 3 }[facing];
	return row * 4 + (moving ? WALK_PHASES[Math.floor(phase / (STRIDE_DISTANCE / WALK_PHASES.length)) % WALK_PHASES.length] : 0);
}

export function movementFacing(dx: number, dy: number, current: Facing): Facing {
	if (!dx && !dy) return current;
	const horizontal = dx < 0 ? 'left' : 'right';
	const vertical = dy < 0 ? 'up' : 'down';
	if (dx && dy && Math.abs(Math.abs(dx) - Math.abs(dy)) < .15) {
		return current === horizontal || current === vertical ? current : horizontal;
	}
	return Math.abs(dx) > Math.abs(dy) ? horizontal : vertical;
}

export function movementHold(previousIdleMs: number, distance: number, delta: number, intent: boolean): { idleMs: number; moving: boolean } {
	const idleMs = distance > .01 ? 0 : previousIdleMs + delta;
	return { idleMs, moving: intent && idleMs < 80 };
}
