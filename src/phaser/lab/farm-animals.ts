import type { Point } from './world.ts';
import { farmWalkable, feetOverlap, type FarmRect } from './farm-world.ts';

export interface FarmAnimal {
	kind: 'white-hen' | 'brown-hen' | 'cow';
	point: Point;
	target: Point;
	pen: { x: number; y: number; width: number; height: number };
	phase: 'walk' | 'peck' | 'idle';
	timer: number;
	seed: number;
	stride: number;
	right: boolean;
}
function random(animal: FarmAnimal): number {
	animal.seed = (Math.imul(animal.seed, 1664525) + 1013904223) >>> 0;
	return animal.seed / 4294967296;
}
export function createFarmAnimals(): FarmAnimal[] {
	return Array.from({ length: 11 }, (_, index) => {
		const cow = index >= 8;
		const pen = cow ? { x: -184, y: 20, width: 272, height: 120 } : { x: -184, y: 488, width: 336, height: 128 };
		const point = cow ? { x: pen.x + 32 + (index - 8) * 80, y: pen.y + 40 + (index % 2) * 40 } : { x: pen.x + 24 + (index % 4) * 88, y: pen.y + 24 + Math.floor(index / 4) * 64 };
		return { kind: cow ? 'cow' : index % 2 ? 'brown-hen' : 'white-hen', point, target: { ...point }, pen, phase: 'idle', timer: index * 230, seed: index * 923 + 17, stride: 0, right: false };
	});
}
function chooseTarget(animal: FarmAnimal): void {
	for (let attempt = 0; attempt < 16; attempt++) {
		const target = { x: animal.pen.x + random(animal) * animal.pen.width, y: animal.pen.y + random(animal) * animal.pen.height };
		if (!farmWalkable(target)) continue;
		animal.target = target;
		animal.phase = 'walk';
		animal.timer = 9000;
		return;
	}
	animal.timer = 500;
}
export function updateFarmAnimal(animal: FarmAnimal, delta: number, guest: Point, herd: readonly FarmAnimal[] = []): void {
	const dt = Math.max(0, Math.min(delta, 50));
	if (!dt) return;
	animal.timer -= dt;
	if (animal.phase !== 'walk') {
		if (animal.timer <= 0) chooseTarget(animal);
		return;
	}
	const dx = animal.target.x - animal.point.x, dy = animal.target.y - animal.point.y;
	const distance = Math.hypot(dx, dy);
	const speed = animal.kind === 'cow' ? 9 : 15;
	const step = Math.min(distance, speed * dt / 1000);
	const next = distance ? { x: animal.point.x + dx / distance * step, y: animal.point.y + dy / distance * step } : animal.point;
	if (distance < 1 || animal.timer <= 0 || !animalCanStand(animal, next, guest, herd)) {
		animal.phase = random(animal) < .7 ? 'peck' : 'idle';
		animal.timer = 1000 + random(animal) * 2400;
		return;
	}
	if (Math.abs(dx) > 1) animal.right = dx > 0;
	animal.stride += step;
	animal.point = next;
}
export function farmAnimalFrame(animal: FarmAnimal): number {
	return animal.phase === 'walk' ? Math.floor(animal.stride / 3) % 2 : animal.phase === 'peck' ? (Math.floor(animal.timer / 280) % 3 === 0 ? 0 : 2) : 3;
}

export function farmAnimalBody(animal: FarmAnimal, point = animal.point): FarmRect {
	const width = animal.kind === 'cow' ? 24 : 12;
	const height = animal.kind === 'cow' ? 10 : 6;
	return { x: point.x - width / 2, y: point.y - height, width, height };
}
function animalCanStand(animal: FarmAnimal, point: Point, guest: Point, herd: readonly FarmAnimal[]): boolean {
	const body = farmAnimalBody(animal, point);
	if (feetOverlap(guest, body)) return false;
	for (const x of [body.x, body.x + body.width]) {
		if (!farmWalkable({ x, y: point.y })) return false;
	}
	return !herd.some(other => {
		if (other === animal) return false;
		const obstacle = farmAnimalBody(other);
		return body.x < obstacle.x + obstacle.width && body.x + body.width > obstacle.x && body.y < obstacle.y + obstacle.height && body.y + body.height > obstacle.y;
	});
}
