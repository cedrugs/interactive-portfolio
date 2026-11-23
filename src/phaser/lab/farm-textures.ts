import type Phaser from 'phaser';
import { croppedCell, fitNative } from './textures';
import { farmArt, farmBuildingArt } from './farm-world';

export function registerFarmTextures(scene: Phaser.Scene): void {
	for (const [index, [key, width, height]] of farmArt.entries()) {
		if (scene.textures.exists(`farm-${key}`)) continue;
		const sheet = index === 0 ? 'house' : index < 5 ? 'trees' : 'props';
		const source = scene.textures.get(`farm-${sheet}-source`).getSourceImage() as HTMLImageElement;
		const crop = croppedCell(source, index === 0 ? 0 : index < 5 ? index - 1 : index - 5, index === 0 ? 1 : index < 5 ? 2 : 4, index >= 5 ? [0, .28, .51, .75, 1] : undefined);
		scene.textures.addCanvas(`farm-${key}`, fitNative(crop, width, height));
	}
	const buildings = scene.textures.get('farm-buildings-source').getSourceImage() as HTMLImageElement;
	for (const [index, [key, width, height]] of farmBuildingArt.entries()) {
		if (!scene.textures.exists(`farm-${key}`)) scene.textures.addCanvas(`farm-${key}`, fitNative(croppedCell(buildings, index, 2, [0, .52, 1]), width, height));
	}
	const animals = scene.textures.get('farm-animals-source').getSourceImage() as HTMLImageElement;
	for (const [row, kind] of ['white-hen', 'brown-hen', 'cow'].entries()) {
		const frames = Array.from({ length: 4 }, (_, column) => croppedCell(animals, row * 4 + column, 4, [0, 1 / 3, 2 / 3, 1]));
		const width = row === 2 ? 32 : 16;
		const height = row === 2 ? 24 : 16;
		const scale = Math.min(width / Math.max(...frames.map(frame => frame.width)), height / Math.max(...frames.map(frame => frame.height)));
		frames.forEach((frame, index) => {
			const key = `farm-${kind}-${index}`;
			if (scene.textures.exists(key)) return;
			const target = document.createElement('canvas');
			target.width = width; target.height = height;
			const ctx = target.getContext('2d')!;
			ctx.imageSmoothingEnabled = false;
			const w = Math.round(frame.width * scale), h = Math.round(frame.height * scale);
			ctx.drawImage(frame, Math.floor((width - w) / 2), height - h, w, h);
			scene.textures.addCanvas(key, target);
		});
	}
	const original = scene.textures.get('farm-ground-source').getSourceImage() as HTMLImageElement;
	const terrain = scene.textures.get('farm-terrain-source').getSourceImage() as HTMLImageElement;
	for (let index = 0; index < 7; index++) {
		if (scene.textures.exists(`farm-ground-${index}`)) continue;
		const source = index === 2 || index >= 4 ? terrain : original;
		const cell = index === 2 ? 0 : index >= 4 ? index - 4 : index;
		const tile = document.createElement('canvas');
		tile.width = tile.height = 16;
		const ctx = tile.getContext('2d')!;
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(source, cell % 2 * source.width / 2, Math.floor(cell / 2) * source.height / 2, source.width / 2, source.height / 2, 0, 0, 16, 16);
		scene.textures.addCanvas(`farm-ground-${index}`, tile);
	}
	if (!scene.textures.exists('farm-bank')) {
		const tile = document.createElement('canvas');
		tile.width = 32; tile.height = 24;
		const ctx = tile.getContext('2d')!;
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(terrain, terrain.width / 2, terrain.height / 2, terrain.width / 2, terrain.height / 2, 0, 0, 32, 24);
		scene.textures.addCanvas('farm-bank', tile);
	}
}
