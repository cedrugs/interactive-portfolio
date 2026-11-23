import Phaser from 'phaser';
import { contains, ROOMS, roomSurface, surfaceContains } from './architecture';
import { collider, ENTRY, FLOOR, furnishings, placement, WORLD, type Rectangle } from './world';

function rug(scene: Phaser.Scene, box: Rectangle, colors: [number, number, number]): void {
	const g = scene.add.graphics().setDepth(-220);
	g.fillStyle(colors[0]).fillRect(box.x, box.y, box.width, box.height);
	g.fillStyle(colors[1]).fillRect(box.x + 2, box.y + 2, box.width - 4, box.height - 4);
	g.lineStyle(1, colors[2]).strokeRect(box.x + 5, box.y + 5, box.width - 10, box.height - 10);
	for (let y = box.y + 12; y < box.y + box.height - 8; y += 16) {
		for (let x = box.x + 12; x < box.x + box.width - 8; x += 16) {
			g.fillStyle(colors[2], .42).fillPoints([{ x, y: y - 2 }, { x: x + 3, y }, { x, y: y + 2 }, { x: x - 3, y }], true);
		}
	}
	for (let x = box.x + 1; x < box.x + box.width; x += 3) g.fillStyle(colors[0]).fillRect(x, box.y - 2, 1, 2).fillRect(x, box.y + box.height, 1, 2);
}

export function furnishFloor(scene: Phaser.Scene): void {
	rug(scene, { x: 44, y: 142, width: 100, height: 84 }, [0xc4ac73, 0x375d52, 0x97ac78]);
	rug(scene, { x: 200, y: 152, width: 80, height: 76 }, [0xb98a58, 0x80513e, 0xd1ae78]);
	rug(scene, { x: ENTRY.x, y: FLOOR.y + FLOOR.height - 32, width: ENTRY.width, height: 28 }, [0xc4ac73, 0x606b43, 0xa5ad73]);
	rug(scene, { x: 392, y: 80, width: 64, height: 88 }, [0xc4ac73, 0x596448, 0xa5ad73]);
	rug(scene, { x: 424, y: 152, width: 64, height: 64 }, [0xc4ac73, 0x715142, 0xb89c74]);
	rug(scene, { x: 400, y: 336, width: 80, height: 48 }, [0xb9a778, 0x65714d, 0xc5c391]);
	rug(scene, { x: 360, y: 306, width: 64, height: 22 }, [0xb9a778, 0x65714d, 0xc5c391]);
	const sun = scene.add.graphics().setDepth(-210);
	for (const offset of [0, 18]) {
		sun.fillStyle(0xffe7ac, .1).fillPoints([{ x: 65 + offset, y: 80 }, { x: 77 + offset, y: 80 }, { x: 112 + offset, y: 151 }, { x: 92 + offset, y: 151 }], true);
	}
	const shade = scene.add.graphics().setDepth(-190);
	for (const item of furnishings) {
		const box = collider(item);
		if (!box) continue;
		const area = placement(item);
		const y = box.y + box.height;
		shade.fillStyle(0x342b32, .17).fillPoints([{ x: box.x, y: box.y }, { x: box.x + box.width, y: box.y }, { x: box.x + box.width + 7, y: y + 5 }, { x: box.x + 5, y: y + 5 }], true);
		shade.fillStyle(0x29232a, .22).fillEllipse(area.x + area.width / 2, y, box.width + 3, 5);
	}
}

export function lightRoom(scene: Phaser.Scene): void {
	const texture = scene.textures.createCanvas('room-light', WORLD.width, WORLD.height);
	if (!texture) throw new Error('Room lighting could not be created');
	const pixels = texture.context.createImageData(WORLD.width, WORLD.height);
	const lights = [
		{ x: 80, y: 76, radius: 84, color: [.23, .24, .19] },
		{ x: 184, y: 88, radius: 56, color: [.26, .18, .08] },
		{ x: 40, y: 177, radius: 66, color: [.29, .22, .08] },
		{ x: 40, y: 52, radius: 40, color: [.22, .15, .06] },
		{ x: 72, y: 82, radius: 34, color: [.02, .13, .13] },
		{ x: 124, y: 164, radius: 38, color: [.04, .12, .14] },
		{ x: 416, y: 76, radius: 76, color: [.19, .21, .17] },
		{ x: 456, y: 91, radius: 54, color: [.28, .20, .09] },
		{ x: 488, y: 161, radius: 54, color: [.27, .20, .08] },
		{ x: 472, y: 260, radius: 90, color: [.28, .22, .13] },
		{ x: 416, y: 292, radius: 46, color: [.16, .09, .03] },
		{ x: 440, y: 356, radius: 64, color: [.13, .13, .08] },
	];
	for (let y = 0; y < WORLD.height; y++) {
		for (let x = 0; x < WORLD.width; x++) {
			if (!surfaceContains({ x, y })) continue;
			const room = ROOMS.find(room => contains(roomSurface(room), { x, y }));
			const floor = room?.floor;
			const edge = floor ? Math.max(0, 1 - Math.min(x - floor.x, floor.x + floor.width - x) / 10) * .09 : 0;
			const baseboard = floor && y >= floor.y && y < floor.y + 7 ? (1 - (y - floor.y) / 7) * .13 : 0;
			const color = [.81 - edge - baseboard, .77 - edge - baseboard, .76 - edge - baseboard];
			for (const light of lights) {
				const falloff = Math.max(0, 1 - Math.hypot(x - light.x, y - light.y) / light.radius) ** 2;
				for (let channel = 0; channel < 3; channel++) color[channel] += light.color[channel] * falloff;
			}
			const index = (y * WORLD.width + x) * 4;
			for (let channel = 0; channel < 3; channel++) pixels.data[index + channel] = Math.min(255, Math.round(color[channel] * 255));
			pixels.data[index + 3] = 255;
		}
	}
	texture.context.putImageData(pixels, 0, 0);
	texture.refresh();
	scene.add.image(0, 0, 'room-light').setOrigin(0).setDepth(1000).setBlendMode(Phaser.BlendModes.MULTIPLY);
}
