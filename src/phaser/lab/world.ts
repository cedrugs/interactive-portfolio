import { TILE_SIZE, cellCenter, toWorld, type Point, type Rectangle } from '../../game/grid.ts';

import { contains, floorContains, ROOMS, WORLD } from './architecture.ts';

export { TILE_SIZE };
export { contains, FLOOR, ENTRY, ROOMS, PASSAGES, WORLD } from './architecture.ts';
export type { Point, Rectangle };
export type Facing = 'down' | 'left' | 'right' | 'up';
export type ActionId = 'projects' | 'about' | 'theater' | 'aquarium' | 'chair' | 'contact' | 'water' | 'sleep' | 'cook' | 'read' | 'dine';
export interface Furnishing {
	id: string;
	texture: string;
	column: number;
	row: number;
	columns: number;
	rows: number;
	ground?: Rectangle;
	layer?: 'wall';
	frontCrop?: Rectangle;
	action?: ActionId;
}
export interface Action {
	id: ActionId;
	label: string;
	objects: string[];
	pose?: { point: Point; frame: number; facing: Facing; texture?: string; flipX?: boolean; depthOffset?: number };
	panel?: 'projects' | 'about' | 'contact';
}

export const SPAWN = cellCenter(10, 8);
export const FOOT = { width: 8, height: 4 };
export const furnishings: Furnishing[] = [
	{ id: 'aquarium', texture: 'aquarium', column: 3, row: 5, columns: 3, rows: 1, ground: { x: 3, y: 2, width: 42, height: 14 }, action: 'aquarium' },
	{ id: 'books', texture: 'books', column: 7, row: 5, columns: 2, rows: 1, ground: { x: 2, y: 0, width: 28, height: 16 }, action: 'about' },
	{ id: 'desk', texture: 'desk', column: 11, row: 5, columns: 4, rows: 2, ground: { x: 0, y: 14, width: 64, height: 18 }, action: 'projects' },
	{ id: 'chair', texture: 'chair', frontCrop: { x: 0, y: 8, width: 16, height: 16 }, column: 12, row: 7, columns: 2, rows: 1, ground: { x: 10, y: 4, width: 12, height: 12 }, action: 'chair' },
	{ id: 'sofa', texture: 'sofa', column: 3, row: 9, columns: 2, rows: 3, ground: { x: 3, y: 10, width: 26, height: 38 }, action: 'theater' },
	{ id: 'tv', texture: 'tv', column: 7, row: 9, columns: 2, rows: 3, ground: { x: 6, y: 14, width: 20, height: 34 }, action: 'theater' },
	{ id: 'table', texture: 'table', column: 5, row: 13, columns: 2, rows: 1, ground: { x: 2, y: 7, width: 28, height: 9 } },
	{ id: 'mail', texture: 'mail', column: 16, row: 10, columns: 2, rows: 1, ground: { x: 6, y: 2, width: 20, height: 14 }, action: 'contact' },
	{ id: 'plant', texture: 'plant', column: 12, row: 13, columns: 1, rows: 1, ground: { x: 2, y: 5, width: 12, height: 11 } },
	{ id: 'water', texture: 'water', column: 16, row: 7, columns: 1, rows: 1, ground: { x: 2, y: 2, width: 12, height: 14 }, action: 'water' },
	{ id: 'window', texture: 'window', column: 4, row: 2, columns: 2, rows: 2, layer: 'wall' },
	{ id: 'keyboards', texture: 'keyboards', column: 11, row: 2, columns: 4, rows: 2, layer: 'wall' },
	{ id: 'ac', texture: 'ac', column: 14, row: 2, columns: 3, rows: 1, layer: 'wall' },
	{ id: 'lantern', texture: 'lantern', column: 2, row: 2, columns: 1, rows: 2, layer: 'wall' },
	{ id: 'pinboard', texture: 'pinboard', column: 9, row: 2, columns: 2, rows: 2, layer: 'wall' },
	{ id: 'fern', texture: 'tall-plant', column: 2, row: 8, columns: 1, rows: 1, ground: { x: 3, y: 6, width: 10, height: 10 } },
	{ id: 'books-plant', texture: 'plant', column: 6, row: 7, columns: 1, rows: 1, ground: { x: 3, y: 6, width: 10, height: 10 } },
	{ id: 'floor-lamp', texture: 'floor-lamp', column: 2, row: 12, columns: 1, rows: 1, ground: { x: 4, y: 10, width: 8, height: 6 } },
	{ id: 'media', texture: 'media', column: 13, row: 12, columns: 3, rows: 1, ground: { x: 2, y: 4, width: 44, height: 12 } },
	{ id: 'bed', texture: 'bed', column: 25, row: 5, columns: 3, rows: 4, ground: { x: 2, y: 8, width: 44, height: 56 }, frontCrop: { x: 0, y: 28, width: 48, height: 36 }, action: 'sleep' },
	{ id: 'wardrobe', texture: 'wardrobe', column: 22, row: 5, columns: 2, rows: 1, ground: { x: 2, y: 1, width: 28, height: 15 } },
	{ id: 'nightstand', texture: 'nightstand', column: 28, row: 6, columns: 1, rows: 1, ground: { x: 1, y: 6, width: 14, height: 10 } },
	{ id: 'dresser', texture: 'dresser', column: 29, row: 5, columns: 2, rows: 1, ground: { x: 2, y: 3, width: 28, height: 13 } },
	{ id: 'reading-chair', texture: 'reading-chair', column: 29, row: 10, columns: 1, rows: 1, ground: { x: 0, y: 3, width: 16, height: 13 }, action: 'read' },
	{ id: 'reading-table', texture: 'reading-table', column: 27, row: 11, columns: 1, rows: 1, ground: { x: 0, y: 6, width: 16, height: 10 } },
	{ id: 'bedroom-plant', texture: 'tall-plant', column: 22, row: 10, columns: 1, rows: 1, ground: { x: 3, y: 6, width: 10, height: 10 } },
	{ id: 'bedroom-window', texture: 'window', column: 25, row: 2, columns: 2, rows: 2, layer: 'wall' },
	{ id: 'bedroom-art', texture: 'botanical', column: 29, row: 2, columns: 1, rows: 2, layer: 'wall' },
	{ id: 'bedroom-lamp', texture: 'floor-lamp', column: 30, row: 11, columns: 1, rows: 1, ground: { x: 4, y: 10, width: 8, height: 6 } },
	{ id: 'sink', texture: 'sink', column: 22, row: 18, columns: 3, rows: 1, ground: { x: 0, y: 4, width: 48, height: 12 } },
	{ id: 'stove', texture: 'stove', column: 25, row: 18, columns: 2, rows: 1, ground: { x: 0, y: 4, width: 32, height: 12 }, action: 'cook' },
	{ id: 'fridge', texture: 'fridge', column: 30, row: 18, columns: 2, rows: 1, ground: { x: 5, y: 0, width: 22, height: 16 } },
	{ id: 'pantry', texture: 'pantry', column: 32, row: 18, columns: 2, rows: 1, ground: { x: 2, y: 0, width: 28, height: 16 } },
	{ id: 'dining-table', texture: 'dining-table', column: 26, row: 22, columns: 3, rows: 1, ground: { x: 0, y: 4, width: 48, height: 12 } },
	{ id: 'dining-chair', texture: 'dining-east', column: 25, row: 22, columns: 1, rows: 1, ground: { x: 2, y: 4, width: 12, height: 12 }, action: 'dine' },
	{ id: 'dining-west', texture: 'dining-west', column: 29, row: 22, columns: 1, rows: 1, ground: { x: 2, y: 4, width: 12, height: 12 } },
	{ id: 'kitchen-herbs', texture: 'kitchen-shelf', column: 22, row: 15, columns: 3, rows: 2, layer: 'wall' },
	{ id: 'kitchen-lantern', texture: 'lantern', column: 29, row: 15, columns: 1, rows: 2, layer: 'wall' },
	{ id: 'kitchen-art', texture: 'botanical', column: 32, row: 15, columns: 1, rows: 2, layer: 'wall' },
	{ id: 'kitchen-plant', texture: 'plant', column: 22, row: 23, columns: 1, rows: 1, ground: { x: 3, y: 6, width: 10, height: 10 } },
	{ id: 'kitchen-storage', texture: 'books', column: 32, row: 23, columns: 2, rows: 1, ground: { x: 2, y: 2, width: 28, height: 14 } },
];

export const actions: Action[] = [
	{ id: 'projects', label: 'Projects', objects: ['desk'], panel: 'projects' },
	{ id: 'about', label: 'About me', objects: ['books'], panel: 'about' },
	{ id: 'theater', label: 'Watch TV', objects: ['sofa', 'tv'], pose: { point: { x: 71, y: 171 }, frame: 14, facing: 'right', depthOffset: 1 } },
	{ id: 'aquarium', label: 'Watch the fish', objects: ['aquarium'], pose: { point: { x: 72, y: 108 }, frame: 12, facing: 'up' } },
	{ id: 'chair', label: 'Sit at the desk', objects: ['chair'], pose: { point: { x: 208, y: 116 }, frame: 8, facing: 'up', texture: 'activities', depthOffset: .25 } },
	{ id: 'contact', label: 'Contact', objects: ['mail'], panel: 'contact' },
	{ id: 'water', label: 'Get water', objects: ['water'], pose: { point: { x: 264, y: 138 }, frame: 12, facing: 'right', texture: 'activities' } },
	{ id: 'sleep', label: 'Sleep', objects: ['bed'], pose: { point: { x: 424, y: 124 }, frame: 0, facing: 'down', texture: 'sleeping', depthOffset: .25 } },
	{ id: 'cook', label: 'Cook', objects: ['stove'], pose: { point: { x: 416, y: 306 }, frame: 4, facing: 'up', texture: 'activities' } },
	{ id: 'read', label: 'Read', objects: ['reading-chair'], pose: { point: { x: 468, y: 168 }, frame: 0, facing: 'left', texture: 'activities', depthOffset: 1 } },
	{ id: 'dine', label: 'Sit at the table', objects: ['dining-chair'], pose: { point: { x: 408, y: 362 }, frame: 14, facing: 'right', depthOffset: 1 } },
];

export function placement(item: Furnishing): Rectangle {
	return toWorld(item);
}

export function collider(item: Furnishing): Rectangle | null {
	if (!item.ground) return null;
	return { ...item.ground, x: item.column * TILE_SIZE + item.ground.x, y: item.row * TILE_SIZE + item.ground.y };
}

export const obstacles = furnishings.flatMap(item => {
	const box = collider(item);
	return box ? [box] : [];
});

export function walkable(point: Point): boolean {
	if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return false;
	for (const dx of [-FOOT.width / 2, FOOT.width / 2]) {
		for (const dy of [-FOOT.height / 2, FOOT.height / 2]) {
			if (!floorContains({ x: point.x + dx, y: point.y + dy })) return false;
		}
	}
	return !obstacles.some(box => point.x + FOOT.width / 2 > box.x && point.x - FOOT.width / 2 < box.x + box.width && point.y + FOOT.height / 2 > box.y && point.y - FOOT.height / 2 < box.y + box.height);
}

export function clearSegment(start: Point, end: Point): boolean {
	const steps = Math.max(1, Math.ceil(Math.hypot(end.x - start.x, end.y - start.y) / 2));
	for (let step = 1; step <= steps; step++) {
		if (!walkable({ x: start.x + (end.x - start.x) * step / steps, y: start.y + (end.y - start.y) * step / steps })) return false;
	}
	return true;
}

export function distanceToBox(point: Point, box: Rectangle): number {
	return Math.hypot(Math.max(box.x - point.x, 0, point.x - box.x - box.width), Math.max(box.y - point.y, 0, point.y - box.y - box.height));
}

export function approaches(action: Action): Point[] {
	const points: Point[] = [];
	for (const item of furnishings.filter(item => action.objects.includes(item.id))) {
		const box = collider(item);
		if (!box) continue;
		for (let x = box.x + 4; x <= box.x + box.width - 4; x += 8) points.push({ x, y: box.y - 6 }, { x, y: box.y + box.height + 6 });
		for (let y = box.y + 4; y <= box.y + box.height - 4; y += 8) points.push({ x: box.x - 8, y }, { x: box.x + box.width + 8, y });
	}
	return points.filter(walkable);
}

export function nearbyAction(point: Point): Action | null {
	if (!walkable(point)) return null;
	let nearest: Action | null = null;
	let distance = 16;
	for (const action of actions) {
		for (const item of furnishings.filter(item => action.objects.includes(item.id))) {
			const box = collider(item);
			if (!box) continue;
			const next = distanceToBox(point, box);
			if (next < distance && approaches(action).some(approach => Math.hypot(approach.x - point.x, approach.y - point.y) < 24 && clearSegment(point, approach))) {
				distance = next;
				nearest = action;
			}
		}
	}
	return nearest;
}

export function route(start: Point, targets: Point[]): Point[] {
	const valid = targets.filter(walkable);
	if (!valid.length || !walkable(start)) return [];
	const direct = valid.find(target => clearSegment(start, target));
	if (direct) return [direct];
	const step = 8;
	const columns = WORLD.width / step;
	const rows = WORLD.height / step;
	const center = (id: number) => ({ x: id % columns * step + step / 2, y: Math.floor(id / columns) * step + step / 2 });
	const queue: number[] = [];
	const parent = new Map<number, number>();
	const sx = Math.floor(start.x / step);
	const sy = Math.floor(start.y / step);
	for (let y = sy - 1; y <= sy + 1; y++) {
		for (let x = sx - 1; x <= sx + 1; x++) {
			const id = y * columns + x;
			if (x >= 0 && y >= 0 && x < columns && y < rows && clearSegment(start, center(id))) { queue.push(id); parent.set(id, -1); }
		}
	}
	for (let i = 0; i < queue.length; i++) {
		const id = queue[i];
		const point = center(id);
		const target = valid.find(target => Math.hypot(point.x - target.x, point.y - target.y) <= 12 && clearSegment(point, target));
		if (target) {
			const path = [target];
			for (let cursor = id; cursor !== -1; cursor = parent.get(cursor) ?? -1) path.push(center(cursor));
			return path.reverse();
		}
		for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
			const x = id % columns + dx;
			const y = Math.floor(id / columns) + dy;
			const next = y * columns + x;
			if (x < 0 || y < 0 || x >= columns || y >= rows || parent.has(next) || !clearSegment(point, center(next))) continue;
			parent.set(next, id);
			queue.push(next);
		}
	}
	return [];
}

export function safeExit(saved: Point, action: Action): Point {
	if (walkable(saved)) return { ...saved };
	return approaches(action).sort((a, b) => Math.hypot(a.x - saved.x, a.y - saved.y) - Math.hypot(b.x - saved.x, b.y - saved.y))[0] ?? { ...SPAWN };
}

export function validateWorld(): void {
	const ids = new Set<string>();
	for (const item of furnishings) {
		if (ids.has(item.id)) throw new Error('Duplicate furnishing ID');
		ids.add(item.id);
		if (![item.column, item.row, item.columns, item.rows].every(Number.isInteger)) throw new Error('Furnishing is off grid');
		const box = collider(item);
		if (box && !ROOMS.some(room => contains(room.floor, box) && contains(room.floor, { x: box.x + box.width, y: box.y + box.height }))) throw new Error('Collider outside room');
	}
	if (!walkable(SPAWN)) throw new Error('Blocked spawn');
	for (const action of actions) {
		if (!action.objects.every(id => ids.has(id)) || !route(SPAWN, approaches(action)).length) throw new Error(`Unreachable action: ${action.id}`);
	}
}
