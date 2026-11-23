import { tileArea, toWorld, cellCenter, TILE_SIZE } from './grid.ts';

export const rooms = [
	{ id: 'study', grid: tileArea(14, 1, 16, 12), material: 1 },
	{ id: 'living', grid: tileArea(15, 15, 14, 13), material: 0 },
	{ id: 'kitchen', grid: tileArea(1, 15, 12, 13), material: 0 },
	{ id: 'bedroom', grid: tileArea(32, 15, 13, 13), material: 1 },
].map(room => ({ ...room, ...toWorld(room.grid) }));
export const passageTiles = [tileArea(21, 12, 2, 6), tileArea(12, 21, 4, 2), tileArea(28, 21, 5, 2)];
export const passages = passageTiles.map(toWorld);
export const floorTiles = [
	...rooms.map(({ grid }) => tileArea(grid.column + 1, grid.row + 3, grid.columns - 2, grid.rows - 4)),
	...passageTiles,
];
export const floorAreas = floorTiles.map(toWorld);
export const walkingLanes = [tileArea(2, 21, 42, 2), tileArea(21, 8, 2, 19)].map(toWorld);
export const SPAWN = cellCenter(22, 23);
export const WALL_THICKNESS = TILE_SIZE;
export const BACK_WALL_HEIGHT = TILE_SIZE * 2;
