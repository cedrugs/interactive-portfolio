import { TILE_SIZE, type Point, type Rectangle } from '../../game/grid.ts';

export interface Room { id: 'workshop' | 'bedroom' | 'kitchen'; floor: Rectangle; material: 'wood' | 'tile' }
export const FLOOR = { x: 32, y: 80, width: 256, height: 160 };
export const ENTRY = { x: 144, y: 240, width: 32, height: 32 };
export const ROOMS: Room[] = [
	{ id: 'workshop', floor: FLOOR, material: 'wood' },
	{ id: 'bedroom', floor: { x: 352, y: 80, width: 144, height: 144 }, material: 'wood' },
	{ id: 'kitchen', floor: { x: 352, y: 288, width: 192, height: 112 }, material: 'tile' },
];
export const HOUSE_EXIT = { x: 160, y: 264 };
export const HOUSE_RETURN = { x: 160, y: 232 };
export function atHouseExit(point: Point): boolean {
	return Math.abs(point.x - HOUSE_EXIT.x) <= 12 && Math.abs(point.y - HOUSE_EXIT.y) <= 12;
}
export const PASSAGES = [
	ENTRY,
	{ x: 288, y: 192, width: 64, height: 32 },
	{ x: 304, y: 224, width: 32, height: 144 },
	{ x: 336, y: 336, width: 16, height: 32 },
];
export const WORLD = { width: 576, height: 432 };

export function contains(box: Rectangle, point: Point): boolean {
	return point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height;
}

export function roomSurface(room: Room): Rectangle {
	return { ...room.floor, y: room.floor.y - TILE_SIZE * 3, height: room.floor.height + TILE_SIZE * 3 };
}

export function floorContains(point: Point): boolean {
	return [...ROOMS.map(room => room.floor), ...PASSAGES].some(box => contains(box, point));
}

export function surfaceContains(point: Point): boolean {
	return [...ROOMS.map(roomSurface), ...PASSAGES].some(box => contains(box, point));
}

export function boundaryEdges(): { from: Point; to: Point }[] {
	const edges: { from: Point; to: Point }[] = [];
	for (let y = 0; y < WORLD.height; y += TILE_SIZE) {
		for (let x = 0; x < WORLD.width; x += TILE_SIZE) {
			if (!surfaceContains({ x: x + 8, y: y + 8 })) continue;
			if (!surfaceContains({ x: x + 8, y: y - 8 })) edges.push({ from: { x, y }, to: { x: x + TILE_SIZE, y } });
			if (!surfaceContains({ x: x + 8, y: y + 24 })) edges.push({ from: { x, y: y + TILE_SIZE }, to: { x: x + TILE_SIZE, y: y + TILE_SIZE } });
			if (!surfaceContains({ x: x - 8, y: y + 8 })) edges.push({ from: { x, y }, to: { x, y: y + TILE_SIZE } });
			if (!surfaceContains({ x: x + 24, y: y + 8 })) edges.push({ from: { x: x + TILE_SIZE, y }, to: { x: x + TILE_SIZE, y: y + TILE_SIZE } });
		}
	}
	return edges;
}

export function solidWalls(): Rectangle[] {
	const walls: Rectangle[] = [];
	for (let y = 0; y < WORLD.height; y += TILE_SIZE) {
		let start: number | null = null;
		for (let x = 0; x <= WORLD.width; x += TILE_SIZE) {
			const solid = x < WORLD.width && !floorContains({ x: x + 8, y: y + 8 });
			if (solid && start === null) start = x;
			if (!solid && start !== null) { walls.push({ x: start, y, width: x - start, height: TILE_SIZE }); start = null; }
		}
	}
	return walls;
}
