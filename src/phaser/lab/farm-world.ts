import { characterZoom } from './camera.ts';
import type { Point } from './world.ts';

export const FARM = { x: -768, y: -512, width: 2048, height: 1536, tile: 16 };
export const FARM_PLAYABLE = { x: -256, y: -160, width: 1024, height: 864 };
export function farmCameraZoom(width: number, height: number): number {
	return Math.max(characterZoom(height), Math.ceil(width / (FARM.width - 2)), Math.ceil(height / (FARM.height - 2)));
}
export const FARM_SPAWN = { x: 272, y: 232 };
export const FARM_DOOR = { x: 272, y: 168 };
export const FARM_HOUSE = { x: 160, y: 48, width: 192, height: 144, wallBottom: 156, porchBottom: 184 };
export const farmPorchRails = [
	{ x: 164, y: 164, width: 24, height: 20 }, { x: 324, y: 164, width: 24, height: 20 },
	{ x: 164, y: 184, width: 68, height: 6 }, { x: 280, y: 184, width: 68, height: 6 },
];
export const farmArt = [
	['house', FARM_HOUSE.width, FARM_HOUSE.height], ['oak', 80, 96], ['pine', 64, 112], ['cherry', 80, 96], ['hedge', 32, 24],
	['well', 40, 48], ['scarecrow', 24, 32], ['barrel', 16, 20], ['crate', 16, 16], ['mailbox', 16, 28], ['lamp', 16, 40], ['bench', 32, 24], ['logs', 32, 24], ['pot', 16, 20], ['flowers', 16, 16], ['rock', 24, 16], ['grass', 16, 16], ['fence', 32, 24], ['side-fence', 16, 32], ['cabbage', 16, 16], ['tomato', 16, 32],
] as const;
export const farmBuildingArt = [['barn', 128, 112], ['coop', 80, 80], ['greenhouse', 112, 112], ['hay-barn', 112, 96]] as const;
export type FarmTexture = typeof farmArt[number][0] | typeof farmBuildingArt[number][0];
export interface FarmRect { x: number; y: number; width: number; height: number }
export interface FarmProp { texture: FarmTexture; x: number; y: number; solid?: FarmRect }
export const farmPaths: FarmRect[] = [
	{ x: 224, y: 192, width: 64, height: 512 },
	{ x: -224, y: 192, width: 960, height: 32 },
	{ x: -224, y: 432, width: 960, height: 32 },
	{ x: -224, y: 224, width: 48, height: 208 },
	{ x: 128, y: -64, width: 32, height: 256 },
	{ x: 480, y: -64, width: 48, height: 496 },
	{ x: 160, y: -64, width: 320, height: 32 },
	{ x: 240, y: -32, width: 32, height: 64 },
	{ x: 160, y: 256, width: 208, height: 32 },
	{ x: 352, y: 224, width: 64, height: 48 },
	{ x: 368, y: 272, width: 32, height: 112 },
	{ x: 320, y: 368, width: 144, height: 32 },
	{ x: 448, y: 400, width: 32, height: 272 },
	{ x: 288, y: 560, width: 160, height: 32 },
	{ x: -176, y: 336, width: 208, height: 32 },
	{ x: 592, y: 144, width: 32, height: 48 },
];
const soilBeds: FarmRect[] = [
	{ x: 48, y: 224, width: 128, height: 96 },
	{ x: 544, y: 288, width: 160, height: 128 },
	{ x: 528, y: 32, width: 64, height: 80 },
	{ x: 624, y: 32, width: 64, height: 80 },
	{ x: 304, y: 288, width: 48, height: 48 },
	{ x: 416, y: 288, width: 48, height: 48 },
];
const farmYards: FarmRect[] = [
	{ x: -208, y: -16, width: 320, height: 176 },
	{ x: -208, y: 448, width: 384, height: 192 },
	{ x: 512, y: -16, width: 192, height: 160 },
	{ x: -160, y: 344, width: 160, height: 24 },
];
function contains(rect: FarmRect, x: number, y: number): boolean {
	return x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height;
}
export const farmProps: FarmProp[] = [];
function prop(texture: FarmTexture, x: number, y: number, width = 0, height = 0) {
	farmProps.push({ texture, x, y, solid: width ? { x: x - width / 2, y: y - height, width, height } : undefined });
}
function plants(texture: 'hedge' | 'flowers' | 'grass', points: readonly (readonly [number, number])[]) {
	for (const [x, y] of points) prop(texture, x, y);
}
function trees(points: readonly (readonly ['oak' | 'pine' | 'cherry', number, number])[]) {
	for (const [texture, x, y] of points) prop(texture, x, y, 20, 12);
}
prop('house', 256, 192);
farmProps[0].solid = { x: FARM_HOUSE.x + 4, y: 96, width: FARM_HOUSE.width - 8, height: FARM_HOUSE.wallBottom - 96 };
prop('mailbox', 376, 184, 8, 6);
prop('pot', 200, 160, 12, 8);
prop('pot', 312, 160, 12, 8);
trees([['pine', 392, 104], ['cherry', 448, 144]]);
plants('hedge', [[368, 144], [400, 152], [176, 40], [208, 40], [304, 40], [336, 40]]);
plants('flowers', [[360, 160], [408, 176], [192, 192], [320, 192]]);
prop('bench', 208, 8, 28, 10);
prop('bench', 304, 8, 28, 10);
prop('lamp', 336, -16, 8, 6);
prop('pot', 176, 8, 12, 8);
prop('pot', 336, 8, 12, 8);
trees([['cherry', 192, -72], ['oak', 312, -80], ['pine', 424, -80], ['oak', 128, -104], ['pine', 256, -112], ['oak', 376, -120], ['pine', 480, -96]]);
plants('hedge', [[176, -16], [208, -16], [304, -16], [336, -16], [368, -80], [448, -80]]);
plants('grass', [[224, -88], [368, -8], [408, 16], [440, 0]]);
plants('flowers', [[392, -16], [432, 24], [352, 24]]);

prop('barn', -112, -8, 120, 76);
prop('hay-barn', 48, -8, 104, 64);
prop('greenhouse', 608, 0, 104, 80);
prop('coop', -104, 424, 72, 52);
prop('coop', 40, 424, 72, 52);
for (const [x, y] of [[-192, -32], [104, -24], [536, -16], [688, -16], [-168, 416]]) prop('barrel', x, y, 12, 10);
for (const [x, y] of [[-192, -8], [104, 0], [688, 8], [-168, 392]]) prop('crate', x, y, 12, 10);
for (let x = -192; x <= 96; x += 32) prop('fence', x, 160, 32, 5);
for (const y of [32, 64, 96, 128, 160]) prop('side-fence', -216, y, 6, 24);
for (const y of [32, 64, 128, 160]) prop('side-fence', 120, y, 6, 24);
plants('grass', [[-176, 48], [-160, 64], [-48, 64], [-32, 72], [64, 112], [80, 104], [-144, 120], [-128, 128]]);
plants('hedge', [[-176, 184], [-144, 184], [-80, 184], [-48, 184], [16, 184], [48, 184], [96, 184]]);
prop('logs', -32, -16, 28, 12);

for (let x = -192; x <= 160; x += 32) prop('fence', x, 640, 32, 5);
for (const y of [480, 512, 544, 576, 608, 640]) prop('side-fence', -216, y, 6, 24);
for (const y of [480, 512, 608, 640]) prop('side-fence', 176, y, 6, 24);
plants('grass', [[-176, 552], [-160, 560], [-152, 584], [64, 592], [80, 608], [-64, 608], [-48, 600]]);
plants('hedge', [[-176, 664], [-144, 664], [-80, 664], [-48, 664], [16, 664], [48, 664], [112, 664], [144, 664]]);

for (const x of [64, 96, 128, 160]) {
	prop('fence', x, 232, 32, 5);
	prop('fence', x, 344, 32, 5);
	for (const y of [256, 288, 320]) prop(y === 288 ? 'tomato' : 'cabbage', x, y, 10, 6);
}
for (const y of [240, 272, 304, 336]) prop('side-fence', 40, y, 6, 24);
prop('scarecrow', 184, 240, 8, 6);
prop('logs', 128, 400, 28, 12);
prop('barrel', 168, 400, 12, 10);
prop('crate', 192, 400, 12, 10);
plants('hedge', [[32, 248], [32, 288], [32, 328], [64, 360], [96, 360], [128, 360], [160, 360]]);
plants('flowers', [[184, 240], [184, 320], [192, 352], [152, 400], [112, 408]]);
trees([['oak', -120, 280], ['oak', -24, 304]]);
prop('bench', -112, 320, 28, 10);
prop('lamp', -64, 320, 8, 6);
prop('pot', -144, 320, 12, 8);
prop('pot', -32, 320, 12, 8);
plants('hedge', [[-160, 296], [-128, 296], [-96, 296], [-64, 304]]);
plants('flowers', [[-152, 264], [-80, 288], [-48, 264], [-160, 400], [-64, 408]]);
plants('grass', [[-160, 296], [-56, 304], [-32, 416], [-80, 248]]);

prop('well', 384, 248, 26, 16);
prop('bench', 336, 360, 28, 10);
prop('bench', 432, 360, 28, 10);
prop('lamp', 304, 360, 8, 6);
prop('pot', 464, 360, 12, 8);
for (const x of [320, 344, 432, 456]) for (const y of [304, 328]) prop('flowers', x, y);
plants('hedge', [[320, 280], [344, 280], [432, 280], [456, 280], [320, 416], [352, 416], [384, 416], [416, 416]]);
plants('grass', [[304, 240], [328, 248], [440, 248]]);
plants('flowers', [[304, 400], [432, 400], [416, 256]]);

for (const x of [544, 576, 640, 672]) for (const y of [48, 80, 112]) prop(y === 80 ? 'tomato' : 'flowers', x, y, y === 80 ? 10 : 0, 6);
plants('hedge', [[544, 136], [576, 136], [640, 136], [672, 136]]);
prop('bench', 560, 168, 28, 10);
prop('lamp', 640, 168, 8, 6);
prop('pot', 528, 168, 12, 8);
trees([['pine', 720, -24], ['oak', 720, 112], ['cherry', 592, 264], ['oak', 688, 264]]);
plants('hedge', [[544, 248], [560, 264], [624, 264], [720, 264]]);
plants('flowers', [[632, 240], [664, 248], [704, 160], [736, 192]]);
for (const y of [304, 336, 368, 400]) for (const x of [560, 592, 624, 656, 688]) prop(y === 336 || y === 400 ? 'tomato' : 'cabbage', x, y, 10, 6);
for (const x of [560, 592, 624, 656, 688]) { prop('fence', x, 280, 32, 5); prop('fence', x, 424, 32, 5); }
prop('scarecrow', 720, 336, 8, 6);
prop('crate', 720, 392, 12, 10);
prop('barrel', 720, 416, 12, 10);

prop('bench', 400, 608, 28, 10);
prop('lamp', 432, 608, 8, 6);
prop('pot', 368, 608, 12, 8);
trees([['cherry', 328, 528], ['cherry', 408, 544], ['cherry', 336, 648], ['cherry', 416, 680]]);
plants('hedge', [[304, 496], [360, 504], [432, 520], [304, 624], [376, 664], [448, 656]]);
plants('flowers', [[320, 544], [384, 552], [304, 608], [352, 672], [432, 632]]);
plants('grass', [[312, 664], [360, 536], [424, 496], [320, 608]]);

trees([
	['oak', 576, 544], ['pine', 648, 528], ['oak', 720, 552], ['pine', 688, 608],
	['cherry', 552, 656], ['oak', 624, 688], ['pine', 736, 696], ['pine', 592, 608],
	['pine', -216, -80], ['oak', -200, -16], ['pine', 720, -96],
]);
prop('bench', 520, 592, 28, 10);
prop('rock', 656, 656, 16, 8);
prop('rock', 712, 488, 16, 8);
plants('hedge', [[528, 496], [560, 496], [624, 488], [704, 512], [520, 624], [584, 680], [672, 688], [736, 640]]);
plants('flowers', [[544, 568], [664, 568], [632, 624], [688, 648], [504, 656]]);
plants('grass', [[608, 544], [696, 584], [560, 608], [608, 648], [672, 504], [728, 664]]);

let forestSeed = 73427;
function forestRandom(): number {
	forestSeed = (Math.imul(forestSeed, 1664525) + 1013904223) >>> 0;
	return forestSeed / 4294967296;
}
const forestCells = new Map<string, Point[]>();
for (let attempt = 0; attempt < 16000; attempt++) {
	const x = Math.round((FARM.x + forestRandom() * FARM.width) / 8) * 8;
	const y = Math.round((FARM.y + forestRandom() * (FARM.height + 64)) / 8) * 8;
	if (x > -264 && x < 784 && y > -152 && y < 752) continue;
	const col = Math.floor(x / 40), row = Math.floor(y / 40);
	let crowded = false;
	for (let cy = row - 1; cy <= row + 1; cy++) for (let cx = col - 1; cx <= col + 1; cx++) {
		if (forestCells.get(`${cx},${cy}`)?.some(tree => Math.hypot(tree.x - x, (tree.y - y) * 1.2) < 40)) crowded = true;
	}
	if (crowded) continue;
	const key = `${col},${row}`;
	const cell = forestCells.get(key) ?? [];
	cell.push({ x, y }); forestCells.set(key, cell);
	prop(forestRandom() < .62 ? 'pine' : 'oak', x, y, 20, 12);
}
export const farmBanks = [
	{ x: -256, y: -160, width: 1024, height: 24 },
	{ x: -256, y: -136, width: 24, height: 824 },
	{ x: 744, y: -136, width: 24, height: 824 },
];
for (const x of [-224, -192, -160, -128, -96, -64, -32, 0, 32, 64, 96, 128, 160, 192, 304, 336, 368, 400, 432, 464, 496, 528, 560, 592, 624, 656, 688, 720]) prop('fence', x, 696, 32, 5);
export interface FarmSign { id: string; label: string; text: string; x: number; y: number; icon: FarmTexture }
export const farmSigns: FarmSign[] = [
	{ id: 'welcome', label: 'SAM’S VALLEY', x: 296, y: 400, icon: 'house', text: "I love coding, but I’ve always wanted to grow a farm, too. Sam’s Valley is a little version of that dream: a life with a keyboard on my desk and soil on my boots. — Sam" },
	{ id: 'barns', label: 'BARNYARD', x: 168, y: 64, icon: 'barn', text: "I imagine mornings starting here: feed the animals, tidy the barn, then sit down to code. I want room for both kinds of work in my life. — Sam" },
	{ id: 'hens', label: 'HEN HOUSE', x: 192, y: 536, icon: 'coop', text: "A flock of chickens is definitely part of the dream. Gather the eggs, listen to the clucking, and take a break from everything happening on a screen. — Sam" },
	{ id: 'garden', label: 'GREENHOUSE', x: 688, y: 144, icon: 'greenhouse', text: "Some things can’t be rushed with better code. I want to learn the patience of planting, watering, and waiting for something to grow. This garden is that wish. — Sam" },
	{ id: 'orchard', label: 'ORCHARD', x: 488, y: 584, icon: 'cherry', text: "Building technology and living traditionally don’t feel like opposites to me. I’d love to close my laptop and spend the rest of the afternoon under my own trees. — Sam" },
];
export const farmObstacles = [...farmProps.flatMap(prop => prop.solid ? [prop.solid] : []), ...farmPorchRails, ...farmBanks, ...farmSigns.map(sign => ({ x: sign.x - 4, y: sign.y - 5, width: 8, height: 5 }))];

export function nearbyFarmSign(point: Point): FarmSign | null {
	return farmSigns.find(sign => Math.hypot(point.x - sign.x, point.y - sign.y) <= 28 && point.y >= sign.y - 8) ?? null;
}

export function farmWalkable(point: Point, movingObstacles: readonly FarmRect[] = []): boolean {
	return point.x >= FARM_PLAYABLE.x && point.x <= FARM_PLAYABLE.x + FARM_PLAYABLE.width && point.y >= FARM_PLAYABLE.y && point.y <= FARM_PLAYABLE.y + FARM_PLAYABLE.height && !farmObstacles.some(solid => feetOverlap(point, solid)) && !movingObstacles.some(solid => feetOverlap(point, solid));
}
export function moveOnFarm(point: Point, dx: number, dy: number, movingObstacles: readonly FarmRect[] = []): Point {
	const next = { ...point };
	const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 2));
	for (let i = 0; i < steps; i++) {
		if (farmWalkable({ x: next.x + dx / steps, y: next.y }, movingObstacles)) next.x += dx / steps;
		if (farmWalkable({ x: next.x, y: next.y + dy / steps }, movingObstacles)) next.y += dy / steps;
	}
	return next;
}
export function atFarmDoor(point: Point): boolean { return Math.hypot(point.x - FARM_DOOR.x, point.y - FARM_DOOR.y) <= 14; }
export function feetOverlap(point: Point, solid: FarmRect): boolean {
	return point.x + 5 > solid.x && point.x - 5 < solid.x + solid.width && point.y + 2 > solid.y && point.y - 4 < solid.y + solid.height;
}
export function farmGround(x: number, y: number): number {
	if (soilBeds.some(rect => contains(rect, x, y))) return 3;
	if (farmPaths.some(rect => contains(rect, x, y))) return 2;
	if (farmYards.some(rect => contains(rect, x, y))) return 4;
	return 0;
}
