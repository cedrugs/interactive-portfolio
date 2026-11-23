export interface Point { x: number; y: number }
export interface Rectangle { x: number; y: number; width: number; height: number }
export interface TileArea { column: number; row: number; columns: number; rows: number }
export const TILE_SIZE = 16;
export const WORLD_COLUMNS = 46;
export const WORLD_ROWS = 30;
export const WORLD_WIDTH = WORLD_COLUMNS * TILE_SIZE;
export const WORLD_HEIGHT = WORLD_ROWS * TILE_SIZE;

export function tileArea(column: number, row: number, columns: number, rows: number): TileArea {
	if (![column, row, columns, rows].every(Number.isInteger) || columns < 1 || rows < 1) throw new Error('Layout areas must occupy whole tiles.');
	return { column, row, columns, rows };
}
export function toWorld(area: TileArea): Rectangle {
	return { x: area.column * TILE_SIZE, y: area.row * TILE_SIZE, width: area.columns * TILE_SIZE, height: area.rows * TILE_SIZE };
}
export function cellCenter(column: number, row: number): Point {
	return { x: (column + .5) * TILE_SIZE, y: (row + .5) * TILE_SIZE };
}
