import { clearSegment, type Point } from './world.ts';

export const CHARACTER_FOOTPRINT = { width: 12, height: 8 };

export function charactersOverlap(a: Point, b: Point): boolean {
	return Math.abs(a.x - b.x) < CHARACTER_FOOTPRINT.width && Math.abs(a.y - b.y) < CHARACTER_FOOTPRINT.height;
}

export function moveCharacter(start: Point, movement: Point, blocker?: Point): { point: Point; blockedByCharacter: boolean } {
	const point = { ...start };
	const steps = Math.max(1, Math.ceil(Math.max(Math.abs(movement.x), Math.abs(movement.y)) / .5));
	let blockedByCharacter = false;
	for (let i = 0; i < steps; i++) {
		for (const axis of ['x', 'y'] as const) {
			if (!movement[axis]) continue;
			const next = { ...point, [axis]: point[axis] + movement[axis] / steps };
			if (blocker && charactersOverlap(next, blocker)) {
				const separating = charactersOverlap(point, blocker) && Math.abs(next[axis] - blocker[axis]) > Math.abs(point[axis] - blocker[axis]);
				if (!separating) { blockedByCharacter = true; continue; }
			}
			if (clearSegment(point, next)) point[axis] = next[axis];
		}
	}
	return { point, blockedByCharacter };
}

export interface ReactionState { blockedMs: number; heartMs: number }
export type Reaction = 'waiting' | 'heart' | 'annoyed' | 'attention' | null;

export function advanceReaction(state: ReactionState, motion: { walking: boolean; blocked: boolean }, delta: number): ReactionState {
	if (!motion.walking) return { blockedMs: 0, heartMs: 0 };
	const dt = Math.min(Math.max(delta, 0), 100);
	if (motion.blocked) return { blockedMs: state.blockedMs + dt, heartMs: 0 };
	return { blockedMs: 0, heartMs: state.blockedMs >= 250 ? 1200 : Math.max(0, state.heartMs - dt) };
}

export function currentReaction(state: ReactionState, hasDialogue = false): Reaction {
	if (state.blockedMs >= 3000) return 'annoyed';
	if (state.blockedMs >= 250) return 'waiting';
	if (state.heartMs > 0) return 'heart';
	return hasDialogue ? 'attention' : null;
}
