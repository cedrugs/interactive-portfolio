import type Phaser from 'phaser';
import { boundaryEdges, contains, ENTRY, PASSAGES, ROOMS, roomSurface } from './architecture';
import { TILE_SIZE } from './world';

export function buildShell(scene: Phaser.Scene): void {
	const shell = scene.add.graphics().setDepth(-1000);
	for (const box of [...ROOMS.map(roomSurface), ...PASSAGES]) shell.fillStyle(0xb87a44).fillRect(box.x, box.y, box.width, box.height);
	const edges = boundaryEdges();
	for (const [width, color] of [[20, 0x38262b], [14, 0x885435], [8, 0xe1a75f]]) {
		shell.lineStyle(width, color);
		shell.fillStyle(color);
		for (const edge of edges) {
			shell.lineBetween(edge.from.x, edge.from.y, edge.to.x, edge.to.y);
			shell.fillRect(edge.from.x - width / 2, edge.from.y - width / 2, width, width);
			shell.fillRect(edge.to.x - width / 2, edge.to.y - width / 2, width, width);
		}
	}
	for (const { floor, material } of [...ROOMS, ...PASSAGES.map(floor => ({ floor, material: 'wood' }))]) {
		const data = Array.from({ length: floor.height / TILE_SIZE }, (_, y) => Array.from({ length: floor.width / TILE_SIZE }, (_, x) => material === 'tile' ? 4 + (x + y) % 2 : (x * 3 + y) % 4));
		const map = scene.make.tilemap({ data, tileWidth: TILE_SIZE, tileHeight: TILE_SIZE });
		const tiles = map.addTilesetImage('floor-tiles', 'floor-tiles', TILE_SIZE, TILE_SIZE, 0, 0);
		if (!tiles) throw new Error('Missing floor tiles');
		map.createLayer(0, tiles, floor.x, floor.y)?.setDepth(-500);
	}
	const threshold = scene.add.graphics().setDepth(-90);
	const doorY = ENTRY.y + ENTRY.height;
	threshold.fillStyle(0x3c2823).fillRect(ENTRY.x, doorY - 4, ENTRY.width, 10);
	threshold.fillStyle(0x9f6539).fillRect(ENTRY.x + 2, doorY - 3, ENTRY.width - 4, 6);
	threshold.fillStyle(0xe3b46c).fillRect(ENTRY.x + 3, doorY - 3, ENTRY.width - 6, 1);
	threshold.fillStyle(0x563723).fillRect(ENTRY.x + 3, doorY + 1, ENTRY.width - 6, 1);
	for (const x of [ENTRY.x - 3, ENTRY.x + ENTRY.width - 2]) {
		threshold.fillStyle(0x5b3927).fillRect(x, doorY - 12, 5, 18);
		threshold.fillStyle(0xc28b4b).fillRect(x + 1, doorY - 11, 2, 16);
	}
	const wall = scene.add.graphics().setDepth(-100);
	for (const room of ROOMS) {
		const top = room.floor.y - TILE_SIZE * 3;
		const kitchen = room.id === 'kitchen';
		for (let x = room.floor.x; x < room.floor.x + room.floor.width; x += TILE_SIZE) {
			if (PASSAGES.some(passage => contains(passage, { x: x + 8, y: top + 8 }))) continue;
			wall.fillStyle(kitchen ? 0xcbd0ad : 0xe7d4ad).fillRect(x, top, TILE_SIZE, 32);
			wall.fillStyle(kitchen ? 0xa8b293 : 0xcbbb98).fillRect(x, top, 1, 32);
			wall.fillStyle(kitchen ? 0xe3dfbd : 0xf0dfba).fillRect(x + 1, top + 1, 1, 30);
			wall.fillStyle(0x765039).fillRect(x, top + 32, TILE_SIZE, 16);
			wall.fillStyle(0x4e342b).fillRect(x, top + 33, 1, 14);
			wall.fillStyle(0x9c6a42).fillRect(x + 2, top + 33, 1, 12);
			wall.fillStyle(0x5b3b2c).fillRect(x, top + 30, TILE_SIZE, 3).fillRect(x, top + 46, TILE_SIZE, 2).fillRect(x, top, TILE_SIZE, 3);
			wall.fillStyle(0xc58b50).fillRect(x, top + 29, TILE_SIZE, 1);
		}
	}
}
