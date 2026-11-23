import { props } from './room.ts';

import { TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT, type Point, type Rectangle } from './grid.ts';
import { floorAreas } from './layout.ts';
export { WORLD_WIDTH, WORLD_HEIGHT } from './grid.ts';
export type { Point, Rectangle } from './grid.ts';
export { rooms, passages, floorAreas, SPAWN } from './layout.ts';
export const STEP = TILE_SIZE;
export const obstacles: Rectangle[] = props.flatMap(prop => prop.footprint ? [{
	x: prop.x + prop.footprint.x, y: prop.y + prop.footprint.y,
	width: prop.footprint.width, height: prop.footprint.height,
}] : []);

export function cameraView(width: number, height: number, player: Point) {
	const scale = height < 500 ? 3 : 4;
	return {
		scale,
		x: Math.round(width / 2 - player.x * scale),
		y: Math.round(height / 2 - (player.y - 16) * scale),
	};
}

export function isFloor(point: Point): boolean {
	return floorAreas.some(area => point.x >= area.x && point.x <= area.x + area.width && point.y >= area.y && point.y <= area.y + area.height);
}

export function walkable(point: Point, blocks = obstacles): boolean {
	const halfWidth = 4;
	const halfHeight = 2;
	if (![[0, 0], [-halfWidth, -halfHeight], [halfWidth, -halfHeight], [-halfWidth, halfHeight], [halfWidth, halfHeight]].every(([dx, dy]) => isFloor({ x: point.x + dx, y: point.y + dy }))) return false;
	return !blocks.some(block => point.x > block.x - halfWidth && point.x < block.x + block.width + halfWidth && point.y > block.y - halfHeight && point.y < block.y + block.height + halfHeight);
}

export function clearSegment(start: Point, end: Point, blocks = obstacles): boolean {
	const steps = Math.max(1, Math.ceil(Math.hypot(end.x - start.x, end.y - start.y) / 2));
	for (let step = 1; step <= steps; step++) {
		if (!walkable({ x: start.x + (end.x - start.x) * step / steps, y: start.y + (end.y - start.y) * step / steps }, blocks)) return false;
	}
	return true;
}

export function findPath(start: Point, target: Point | Point[], blocks = obstacles): Point[] {
	const targets = Array.isArray(target) ? target : [target];
	if (!targets.length) return [];
	const columns = WORLD_WIDTH / STEP;
	const rows = WORLD_HEIGHT / STEP;
	const center = (id: number): Point => ({ x: id % columns * STEP + STEP / 2, y: Math.floor(id / columns) * STEP + STEP / 2 });
	const startId = Math.floor(start.y / STEP) * columns + Math.floor(start.x / STEP);
	const queue = [startId];
	const parents = new Map<number, number>([[startId, -1]]);
	let bestId = startId;
	let bestDistance = Infinity;
	for (let cursor = 0; cursor < queue.length; cursor++) {
		const id = queue[cursor];
		const point = center(id);
		const distance = Math.min(...targets.map(goal => Math.hypot(point.x - goal.x, point.y - goal.y)));
		if (distance < bestDistance) { bestDistance = distance; bestId = id; }
		if (distance < STEP / 2) break;
		const x = id % columns;
		const y = Math.floor(id / columns);
		for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
			const nx = x + dx;
			const ny = y + dy;
			const next = ny * columns + nx;
			if (nx < 0 || nx >= columns || ny < 0 || ny >= rows || parents.has(next) || !clearSegment(id === startId ? start : point, center(next), blocks)) continue;
			parents.set(next, id);
			queue.push(next);
		}
	}
	const path: Point[] = [];
	for (let id = bestId; id !== startId && id !== -1; id = parents.get(id) ?? -1) path.push(center(id));
	return path.reverse();
}

export function movePlayer(position: Point, direction: Point, elapsed: number): Point {
	const length = Math.hypot(direction.x, direction.y);
	if (!length) return position;
	const speed = 64 * Math.min(elapsed, 0.04) / Math.max(1, length);
	const candidate = { x: position.x + direction.x * speed, y: position.y };
	if (!walkable(candidate)) candidate.x = position.x;
	candidate.y += direction.y * speed;
	if (!walkable(candidate)) candidate.y = position.y;
	return candidate;
}
