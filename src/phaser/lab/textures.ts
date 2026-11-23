import type Phaser from 'phaser';

const furnitureArt = [
	{ key: 'desk', width: 64, height: 48 },
	{ key: 'books', width: 32, height: 48 },
	{ key: 'window', width: 32, height: 32 },
	{ key: 'ac', width: 48, height: 16 },
	{ key: 'sofa', width: 32, height: 48 },
	{ key: 'tv', width: 28, height: 48 },
	{ key: 'aquarium', width: 48, height: 40 },
	{ key: 'chair', width: 16, height: 24 },
	{ key: 'keyboards', width: 48, height: 24 },
	{ key: 'plant', width: 24, height: 32 },
	{ key: 'rug', width: 64, height: 48 },
	{ key: 'table', width: 32, height: 24 },
	{ key: 'side-chair', width: 16, height: 24 },
	{ key: 'water', width: 16, height: 32 },
	{ key: 'lantern', width: 12, height: 20 },
	{ key: 'mail', width: 24, height: 28 },
] as const;

const decorArt = [
	{ key: 'floor-lamp', width: 16, height: 40 },
	{ key: 'tall-plant', width: 24, height: 40 },
	{ key: 'media', width: 48, height: 28 },
	{ key: 'pinboard', width: 32, height: 24 },
] as const;

const houseArt = [
	{ key: 'bed', width: 48, height: 64 },
	{ key: 'wardrobe', width: 32, height: 48 },
	{ key: 'nightstand', width: 16, height: 24 },
	{ key: 'dresser', width: 32, height: 40 },
	{ key: 'sink', width: 48, height: 40 },
	{ key: 'stove', width: 32, height: 32 },
	{ key: 'fridge', width: 24, height: 48 },
	{ key: 'dining-table', width: 48, height: 32 },
	{ key: 'dining-east', width: 16, height: 24 },
	{ key: 'dining-west', width: 16, height: 24 },
	{ key: 'pantry', width: 32, height: 48 },
	{ key: 'kitchen-shelf', width: 32, height: 24 },
	{ key: 'botanical', width: 16, height: 24 },
	{ key: 'reading-chair', width: 24, height: 32 },
	{ key: 'reading-table', width: 24, height: 24 },
	{ key: 'sleeping', width: 20, height: 32 },
] as const;

export const art = [...furnitureArt, ...decorArt, ...houseArt];

function canvas(width: number, height: number): HTMLCanvasElement {
	const result = document.createElement('canvas');
	result.width = width;
	result.height = height;
	return result;
}

function context(source: HTMLCanvasElement): CanvasRenderingContext2D {
	const result = source.getContext('2d', { willReadFrequently: true });
	if (!result) throw new Error('Canvas rendering is unavailable');
	result.imageSmoothingEnabled = false;
	return result;
}

export function croppedCell(source: HTMLImageElement | HTMLCanvasElement, index: number, columns = 4, rowEdges?: number[]): HTMLCanvasElement {
	if ((columns !== 1 && !rowEdges && source.width !== source.height) || source.width < 256 || source.width > 4096) throw new Error('Invalid sprite atlas dimensions');
	const left = Math.round(index % columns * source.width / columns);
	const row = Math.floor(index / columns);
	const top = Math.round((rowEdges?.[row] ?? row / columns) * source.height);
	const bottom = Math.round((rowEdges?.[row + 1] ?? (row + 1) / columns) * source.height);
	const size = Math.round(source.width / columns);
	const height = bottom - top;
	const cell = canvas(size, height);
	const ctx = context(cell);
	ctx.drawImage(source, left, top, size, height, 0, 0, size, height);
	const pixels = ctx.getImageData(0, 0, size, height);
	let minX = size, minY = height, maxX = 0, maxY = 0;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < size; x++) {
			const alpha = (y * size + x) * 4 + 3;
			if (pixels.data[alpha] < 200) { pixels.data[alpha] = 0; continue; }
			pixels.data[alpha] = 255;
			minX = Math.min(minX, x); minY = Math.min(minY, y);
			maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
		}
	}
	if (minX > maxX || minY > maxY) throw new Error(`Empty sprite frame: ${index}`);
	ctx.putImageData(pixels, 0, 0);
	const crop = canvas(maxX - minX + 1, maxY - minY + 1);
	context(crop).drawImage(cell, minX, minY, crop.width, crop.height, 0, 0, crop.width, crop.height);
	return crop;
}

export function fitNative(source: HTMLCanvasElement, width: number, height: number): HTMLCanvasElement {
	const target = canvas(width, height);
	const scale = Math.min(width / source.width, height / source.height);
	const w = Math.max(1, Math.round(source.width * scale));
	const h = Math.max(1, Math.round(source.height * scale));
	context(target).drawImage(source, Math.floor((width - w) / 2), height - h, w, h);
	return target;
}

function alignedSpriteRow(source: HTMLImageElement, row: number, height: number, width: number): HTMLCanvasElement[] {
	const sources = Array.from({ length: 4 }, (_, column) => croppedCell(source, row * 4 + column));
	const scale = Math.min(height / Math.max(...sources.map(frame => frame.height)), (width - 4) / Math.max(...sources.map(frame => frame.width)));
	return sources.map(sprite => {
		const target = canvas(width, 40);
		const pixels = context(sprite).getImageData(0, 0, sprite.width, Math.floor(sprite.height * .42));
		let left = sprite.width, right = 0;
		for (let y = 0; y < pixels.height; y++) for (let x = 0; x < pixels.width; x++) {
			if (pixels.data[(y * pixels.width + x) * 4 + 3]) { left = Math.min(left, x); right = Math.max(right, x); }
		}
		context(target).drawImage(sprite, Math.round(width / 2 - (left + right + 1) / 2 * scale), 40 - height, Math.round(sprite.width * scale), Math.round(sprite.height * scale));
		return target;
	});
}

export function createActivityAtlas(source: HTMLImageElement): HTMLCanvasElement {
	const atlas = canvas(32 * 16, 40);
	for (let row = 0; row < 4; row++) {
		const height = row === 0 || row === 2 ? 25 : 32;
		const frames = alignedSpriteRow(source, row, height, 32);
		for (let column = 0; column < 4; column++) {
			if (column) {
				const target = context(frames[column]);
				target.clearRect(8, 40 - height, 16, 12);
				target.drawImage(frames[0], 8, 40 - height, 16, 12, 8, 40 - height, 16, 12);
			}
			context(atlas).drawImage(frames[column], (row * 4 + column) * 32, 0);
		}
	}
	return atlas;
}

export function createWalkAtlas(source: HTMLImageElement): HTMLCanvasElement {
	const atlas = canvas(24 * 16, 40);
	const atlasContext = context(atlas);
	for (let row = 0; row < 4; row++) {
		const frames = alignedSpriteRow(source, row, 32, 24);
		for (let column = 0; column < 4; column++) {
			const target = context(frames[column]);
			if (column === 3 && (row === 0 || row === 3)) {
				target.clearRect(0, 31, 24, 9);
				target.save();
				target.translate(24, 0);
				target.scale(-1, 1);
				target.drawImage(frames[1], 0, 31, 24, 9, 0, 31, 24, 9);
				target.restore();
			}
			if (column > 0) {
				target.clearRect(0, 0, 24, 24);
				target.drawImage(frames[0], 0, 0, 24, 24, 0, 0, 24, 24);
			}
			atlasContext.drawImage(frames[column], (row * 4 + column) * 24, 0);
		}
	}
	const pixels = atlasContext.getImageData(0, 0, atlas.width, atlas.height);
	for (let index = 3; index < pixels.data.length; index += 4) pixels.data[index] = pixels.data[index] >= 128 ? 255 : 0;
	atlasContext.putImageData(pixels, 0, 0);
	return atlas;
}

export function registerTextures(scene: Phaser.Scene): void {
	const furniture = scene.textures.get('furniture-source').getSourceImage();
	const character = scene.textures.get('character-source').getSourceImage();
	const walking = scene.textures.get('walk-source').getSourceImage();
	const guest = scene.textures.get('guest-source').getSourceImage();
	const female = scene.textures.get('guest-female-source').getSourceImage();
	const activities = scene.textures.get('activities-source').getSourceImage();
	const chair = scene.textures.get('chair-north-source').getSourceImage();
	const decor = scene.textures.get('decor-source').getSourceImage();
	const house = scene.textures.get('house-source').getSourceImage();
	if (!(female instanceof HTMLImageElement) || !(guest instanceof HTMLImageElement) || !(activities instanceof HTMLImageElement) || !(walking instanceof HTMLImageElement) || !(furniture instanceof HTMLImageElement) || !(character instanceof HTMLImageElement) || !(chair instanceof HTMLImageElement) || !(decor instanceof HTMLImageElement) || !(house instanceof HTMLImageElement)) throw new Error('Missing local artwork');
	furnitureArt.forEach((item, index) => {
		scene.textures.addCanvas(item.key, fitNative(item.key === 'chair' ? croppedCell(chair, 0, 1) : croppedCell(furniture, index), item.width, item.height));
	});
	decorArt.forEach((item, index) => scene.textures.addCanvas(item.key, fitNative(croppedCell(decor, index, 2), item.width, item.height)));
	houseArt.forEach((item, index) => scene.textures.addCanvas(item.key, fitNative(croppedCell(house, index, 4, [0, .28, .52, .76, 1]), item.width, item.height)));
	const actors = canvas(24 * 16, 40);
	const ctx = context(actors);
	for (let frame = 0; frame < 16; frame++) {
		const sprite = fitNative(croppedCell(character, frame), 20, frame >= 14 ? 25 : 32);
		ctx.drawImage(sprite, frame * 24 + 2, 40 - sprite.height);
	}
	const actorTexture = scene.textures.addCanvas('actor', actors);
	if (!actorTexture) throw new Error('Character atlas could not be registered');
	for (let frame = 0; frame < 16; frame++) actorTexture.add(frame, 0, frame * 24, 0, 24, 40);
	const walkTexture = scene.textures.addCanvas('walk', createWalkAtlas(walking));
	if (!walkTexture) throw new Error('Walk atlas could not be registered');
	for (let frame = 0; frame < 16; frame++) walkTexture.add(frame, 0, frame * 24, 0, 24, 40);
	const guestTexture = scene.textures.addCanvas('guest', createWalkAtlas(guest));
	if (!guestTexture) throw new Error('Guest atlas could not be registered');
	for (let frame = 0; frame < 16; frame++) guestTexture.add(frame, 0, frame * 24, 0, 24, 40);
	const femaleTexture = scene.textures.addCanvas('guest-female', createWalkAtlas(female));
	if (!femaleTexture) throw new Error('Guest atlas could not be registered');
	for (let frame = 0; frame < 16; frame++) femaleTexture.add(frame, 0, frame * 24, 0, 24, 40);
	const activityTexture = scene.textures.addCanvas('activities', createActivityAtlas(activities));
	if (!activityTexture) throw new Error('Activity atlas could not be registered');
	for (let frame = 0; frame < 16; frame++) activityTexture.add(frame, 0, frame * 32, 0, 32, 40);
	const tiles = canvas(96, 16);
	const tile = context(tiles);
	const colors = ['#ac7041', '#a5683d', '#b47a48', '#ae7345'];
	for (let frame = 0; frame < 4; frame++) {
		const x = frame * 16;
		tile.fillStyle = colors[frame]; tile.fillRect(x, 0, 16, 16);
		tile.fillStyle = '#805035'; tile.fillRect(x, 0, 1, 16); tile.fillRect(x + 8, 0, 1, 16);
		tile.fillStyle = '#c28b55'; tile.fillRect(x + 1, 0, 1, 16); tile.fillRect(x + 9, 0, 1, 16);
		tile.fillStyle = '#9b623b'; tile.fillRect(x + 5, frame * 3, 1, 7); tile.fillRect(x + 13, (frame * 3 + 6) % 12, 1, 4);
		if (frame % 2 === 0) { tile.fillStyle = '#805035'; tile.fillRect(x, 0, 8, 1); }
		else { tile.fillStyle = '#805035'; tile.fillRect(x + 8, 8, 8, 1); }
	}
	for (let frame = 4; frame < 6; frame++) {
		const x = frame * 16;
		tile.fillStyle = frame === 4 ? '#9da88a' : '#d6c9a3'; tile.fillRect(x, 0, 16, 16);
		tile.fillStyle = '#77816e'; tile.fillRect(x, 15, 16, 1); tile.fillRect(x + 15, 0, 1, 16);
		tile.fillStyle = frame === 4 ? '#b3bc9c' : '#e4d8b7'; tile.fillRect(x + 1, 1, 13, 1); tile.fillRect(x + 1, 1, 1, 13);
	}
	scene.textures.addCanvas('floor-tiles', tiles);
}
