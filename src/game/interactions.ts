import { TILE_SIZE, cellCenter } from './grid.ts';
import { props, interactions, type Interaction, type Prop } from './room.ts';
import { obstacles, walkable, clearSegment, type Point, type Rectangle } from './navigation.ts';

export const INTERACTION_REACH = TILE_SIZE * 1.5;

function footprint(prop: Prop): Rectangle | null {
	return prop.footprint ? { ...prop.footprint, x: prop.x + prop.footprint.x, y: prop.y + prop.footprint.y } : null;
}
function interactionFootprints(target: Interaction): Rectangle[] {
	return props.filter(prop => prop.interaction === target.id).flatMap(prop => {
		const bounds = footprint(prop);
		return bounds ? [bounds] : [];
	});
}
export function interactionBounds(target: Interaction): Rectangle | null {
	const parts = interactionFootprints(target);
	if (!parts.length) return null;
	const x = Math.min(...parts.map(part => part.x));
	const y = Math.min(...parts.map(part => part.y));
	return { x, y, width: Math.max(...parts.map(part => part.x + part.width)) - x, height: Math.max(...parts.map(part => part.y + part.height)) - y };
}
function closestEdge(bounds: Rectangle, point: Point): Point {
	return { x: Math.max(bounds.x, Math.min(point.x, bounds.x + bounds.width)), y: Math.max(bounds.y, Math.min(point.y, bounds.y + bounds.height)) };
}
export function interactionDistance(target: Interaction, point: Point): number {
	return Math.min(...interactionFootprints(target).map(bounds => {
		const edge = closestEdge(bounds, point);
		return Math.hypot(point.x - edge.x, point.y - edge.y);
	}));
}
export function canInteract(target: Interaction, point: Point): boolean {
	if (!walkable(point)) return false;
	const parts = interactionFootprints(target);
	const otherBlocks = obstacles.filter(block => !parts.some(part => block.x === part.x && block.y === part.y && block.width === part.width && block.height === part.height));
	return parts.some(bounds => {
		const edge = closestEdge(bounds, point);
		return Math.hypot(point.x - edge.x, point.y - edge.y) <= INTERACTION_REACH && clearSegment(point, edge, otherBlocks);
	});
}
export function closestInteraction(point: Point): Interaction | null {
	return interactions.filter(target => canInteract(target, point))
		.sort((a, b) => interactionDistance(a, point) - interactionDistance(b, point))[0] ?? null;
}
export function interactionApproaches(target: Interaction): Point[] {
	const candidates: Point[] = [];
	for (const bounds of interactionFootprints(target)) {
		const column = bounds.x / TILE_SIZE;
		const row = bounds.y / TILE_SIZE;
		const columns = bounds.width / TILE_SIZE;
		const rows = bounds.height / TILE_SIZE;
		for (let x = column; x < column + columns; x++) {
			candidates.push(cellCenter(x, row - 1), cellCenter(x, row + rows));
		}
		for (let y = row; y < row + rows; y++) {
			candidates.push(cellCenter(column - 1, y), cellCenter(column + columns, y));
		}
	}
	return candidates.filter(point => canInteract(target, point));
}
export function interactionAt(point: Point): Interaction | null {
	const prop = props.filter(item => item.interaction && item.footprint)
		.sort((a, b) => b.depth - a.depth).find(item => {
			const bounds = footprint(item)!;
			return point.x >= bounds.x - 3 && point.x <= bounds.x + bounds.width + 3 && point.y >= item.y + item.size * .1 && point.y <= bounds.y + bounds.height + 2;
		});
	return interactions.find(target => target.id === prop?.interaction) ?? null;
}
