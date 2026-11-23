import { WALL_THICKNESS } from './layout.ts';
import { rooms, passages, WORLD_WIDTH, WORLD_HEIGHT } from './navigation.ts';

export function houseWallPixels(): Uint8Array {
	const width = WORLD_WIDTH;
	const height = WORLD_HEIGHT;
	const distance = new Uint8Array(width * height);
	const queue = new Int32Array(width * height);
	const shapes = [...rooms, ...passages.map(hall => ({ x: hall.x - WALL_THICKNESS, y: hall.y - WALL_THICKNESS, width: hall.width + WALL_THICKNESS * 2, height: hall.height + WALL_THICKNESS * 2 }))];
	let tail = 0;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const index = y * width + x;
			const inside = shapes.some(shape => x >= shape.x - 2 && x < shape.x + shape.width + 2 && y >= shape.y - 2 && y < shape.y + shape.height + 2);
			if (inside) distance[index] = 255;
			else queue[tail++] = index;
		}
	}
	for (let head = 0; head < tail; head++) {
		const index = queue[head];
		const nextDistance = distance[index] + 1;
		if (nextDistance > WALL_THICKNESS + 2) continue;
		const x = index % width;
		const y = Math.floor(index / width);
		for (let dy = -1; dy <= 1; dy++) {
			for (let dx = -1; dx <= 1; dx++) {
				const nx = x + dx;
				const ny = y + dy;
				if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
				const neighbor = ny * width + nx;
				if (distance[neighbor] <= nextDistance) continue;
				distance[neighbor] = nextDistance;
				queue[tail++] = neighbor;
			}
		}
	}
	return distance;
}
