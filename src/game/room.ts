import { tileArea, toWorld, cellCenter, TILE_SIZE, type Point, type Rectangle, type TileArea } from './grid.ts';

export type StationId = 'projects' | 'about' | 'stack' | 'contact';
export type ActivityId = 'sit' | 'sleep' | 'watch' | 'cook';
export type InteractionId = StationId | ActivityId;
export interface Station { id: StationId; name: string; object: string; marker: Point; approach: Point }
export interface Activity { id: ActivityId; name: string; object: string; marker: Point; approach: Point; anchor: Point; row: number; exit: string }
export type Interaction = Station | Activity;
export interface Prop {
	id: string;
	tile: number;
	x: number;
	y: number;
	depth: number;
	size: number;
	grid: TileArea;
	atlas?: 'home';
	footprint?: Rectangle;
	interaction?: InteractionId;
}
interface Furniture {
	tile: number;
	atlas?: 'home';
	columns: number;
	rows: number;
	sourceSize: number;
	base: Rectangle;
}
const furniture = {
	bookshelf: { tile: 1, columns: 2, rows: 1, sourceSize: 56, base: { x: 8, y: 42, width: 40, height: 15 } },
	desk: { tile: 0, columns: 5, rows: 1, sourceSize: 80, base: { x: 3, y: 58, width: 74, height: 19 } },
	server: { tile: 2, columns: 2, rows: 1, sourceSize: 48, base: { x: 12, y: 34, width: 30, height: 16 } },
	officeChair: { tile: 6, columns: 1, rows: 1, sourceSize: 28, base: { x: 7, y: 14, width: 15, height: 12 } },
	fern: { tile: 4, columns: 1, rows: 1, sourceSize: 40, base: { x: 11, y: 25, width: 18, height: 12 } },
	sofa: { atlas: 'home', tile: 2, columns: 3, rows: 2, sourceSize: 64, base: { x: 8, y: 25, width: 49, height: 29 } },
	coffee: { atlas: 'home', tile: 3, columns: 2, rows: 1, sourceSize: 48, base: { x: 6, y: 24, width: 36, height: 12 } },
	aquarium: { atlas: 'home', tile: 14, columns: 4, rows: 2, sourceSize: 48, base: { x: 5, y: 28, width: 39, height: 14 } },
	mail: { tile: 3, columns: 1, rows: 1, sourceSize: 48, base: { x: 12, y: 31, width: 25, height: 15 } },
	plant: { atlas: 'home', tile: 12, columns: 1, rows: 1, sourceSize: 32, base: { x: 10, y: 18, width: 14, height: 11 } },
	counter: { atlas: 'home', tile: 4, columns: 3, rows: 2, sourceSize: 64, base: { x: 6, y: 34, width: 52, height: 26 } },
	dresser: { atlas: 'home', tile: 11, columns: 2, rows: 1, sourceSize: 48, base: { x: 6, y: 28, width: 36, height: 18 } },
	diningTable: { atlas: 'home', tile: 7, columns: 3, rows: 2, sourceSize: 48, base: { x: 6, y: 19, width: 36, height: 22 } },
	diningChair: { atlas: 'home', tile: 6, columns: 1, rows: 1, sourceSize: 24, base: { x: 5, y: 12, width: 14, height: 12 } },
	bed: { atlas: 'home', tile: 0, columns: 3, rows: 3, sourceSize: 72, base: { x: 10, y: 18, width: 52, height: 52 } },
	nightstand: { atlas: 'home', tile: 1, columns: 1, rows: 1, sourceSize: 28, base: { x: 7, y: 14, width: 16, height: 13 } },
	wardrobe: { atlas: 'home', tile: 5, columns: 2, rows: 1, sourceSize: 48, base: { x: 6, y: 26, width: 32, height: 21 } },
} satisfies Record<string, Furniture>;

function place(id: string, type: keyof typeof furniture, column: number, row: number, interaction?: InteractionId): Prop {
	const asset: Furniture = furniture[type];
	const grid = tileArea(column, row, asset.columns, asset.rows);
	const bounds = toWorld(grid);
	const scale = bounds.width / asset.base.width;
	const size = Math.round(asset.sourceSize * scale);
	const x = Math.round(bounds.x - asset.base.x * scale);
	const y = Math.round(bounds.y + bounds.height - (asset.base.y + asset.base.height) * scale);
	return { id, tile: asset.tile, atlas: asset.atlas, grid, x, y, size, depth: bounds.y + bounds.height, footprint: { x: bounds.x - x, y: bounds.y - y, width: bounds.width, height: bounds.height }, interaction };
}
function decorate(id: string, tile: number, column: number, row: number, span: number, atlas?: 'home'): Prop {
	const grid = tileArea(column, row, span, span);
	const bounds = toWorld(grid);
	return { id, tile, atlas, grid, x: bounds.x, y: bounds.y, size: bounds.width, depth: 0 };
}
export const props: Prop[] = [
	decorate('study-window', 5, 15, 2, 2),
	decorate('noticeboard', 13, 20, 2, 1),
	decorate('shelf', 9, 24, 2, 2),
	place('bookshelf', 'bookshelf', 18, 4, 'about'),
	place('desk', 'desk', 21, 6, 'projects'),
	place('server', 'server', 27, 4, 'stack'),
	place('office-chair', 'officeChair', 23, 7, 'projects'),
	place('study-fern', 'fern', 15, 10),
	decorate('study-rug', 8, 20, 9, 3),
	decorate('living-window', 5, 17, 16, 2),
	decorate('living-picture', 11, 26, 16, 1),
	decorate('entry-rug', 8, 21, 25, 2),
	decorate('living-rug', 9, 16, 20, 5, 'home'),
	place('sofa', 'sofa', 17, 19, 'sit'),
	place('coffee-table', 'coffee', 17, 24),
	place('aquarium', 'aquarium', 24, 18, 'watch'),
	place('mail-table', 'mail', 27, 24, 'contact'),
	place('living-plant', 'plant', 24, 26),
	decorate('kitchen-picture', 11, 9, 16, 1),
	place('stove', 'counter', 3, 18, 'cook'),
	place('kitchen-dresser', 'dresser', 9, 18),
	place('dining-table', 'diningTable', 6, 24),
	place('dining-chair-left', 'diningChair', 5, 24),
	place('dining-chair-right', 'diningChair', 9, 24),
	place('kitchen-plant', 'plant', 2, 26),
	decorate('bedroom-window', 5, 41, 16, 2),
	decorate('bedroom-picture', 11, 36, 16, 1),
	decorate('bedroom-rug', 8, 36, 19, 5, 'home'),
	place('bed', 'bed', 37, 18, 'sleep'),
	place('nightstand', 'nightstand', 41, 19),
	place('wardrobe', 'wardrobe', 33, 18),
	place('bedroom-dresser', 'dresser', 33, 25),
	place('bedroom-plant', 'plant', 42, 26),
];
function marker(id: string): Point {
	const prop = props.find(item => item.id === id)!;
	const bounds = toWorld(prop.grid);
	return { x: bounds.x + bounds.width / 2, y: prop.y - TILE_SIZE / 2 };
}
function anchor(id: string, inset: number): Point {
	const bounds = toWorld(props.find(item => item.id === id)!.grid);
	return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height - inset };
}
export const stations: Station[] = [
	{ id: 'projects', name: 'Projects', object: 'The workbench', marker: marker('desk'), approach: cellCenter(23, 8) },
	{ id: 'about', name: 'About me', object: 'The bookshelf', marker: marker('bookshelf'), approach: cellCenter(18, 5) },
	{ id: 'stack', name: 'My stack', object: 'The server rack', marker: marker('server'), approach: cellCenter(27, 5) },
	{ id: 'contact', name: 'Say hello', object: 'The letter tray', marker: marker('mail-table'), approach: cellCenter(27, 25) },
];
export const activities: Activity[] = [
	{ id: 'sit', name: 'Sit down', object: 'The sofa', marker: marker('sofa'), approach: cellCenter(18, 21), anchor: anchor('sofa', 3), row: 0, exit: 'Stand up' },
	{ id: 'sleep', name: 'Sleep', object: 'The bed', marker: marker('bed'), approach: cellCenter(38, 21), anchor: anchor('bed', 10), row: 1, exit: 'Wake up' },
	{ id: 'watch', name: 'Watch the fish', object: 'The aquarium', marker: marker('aquarium'), approach: cellCenter(26, 20), anchor: cellCenter(26, 20), row: 2, exit: 'Step away' },
	{ id: 'cook', name: 'Cook', object: 'The stove', marker: marker('stove'), approach: cellCenter(4, 20), anchor: cellCenter(4, 20), row: 3, exit: 'Stop cooking' },
];
export const interactions: Interaction[] = [...stations, ...activities];
export function isActivity(target: Interaction): target is Activity { return 'anchor' in target; }
