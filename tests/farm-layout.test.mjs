import test from 'node:test';
import assert from 'node:assert/strict';
import { farmProps, farmGround, farmWalkable, moveOnFarm, feetOverlap } from '../src/phaser/lab/farm-world.ts';
import { createFarmAnimals, updateFarmAnimal, farmAnimalBody } from '../src/phaser/lab/farm-animals.ts';

test('main farm routes stay clear across yards, house and fields', () => {
	for (const [start, end] of [
		[[-216, 208], [720, 208]], [[-216, 448], [720, 448]],
		[[256, 208], [256, 680]], [[144, -48], [144, 184]],
		[[504, -48], [504, 416]], [[176, -48], [504, -48]],
	]) {
		const steps = Math.max(Math.abs(end[0] - start[0]), Math.abs(end[1] - start[1])) / 4;
		for (let i = 0; i <= steps; i++) {
			const point = { x: start[0] + (end[0] - start[0]) * i / steps, y: start[1] + (end[1] - start[1]) * i / steps };
			assert.ok(farmWalkable(point), `Blocked route at ${point.x},${point.y}`);
		}
	}
});

test('tree roots stay off paths and low planting never creates a collider', () => {
	for (const prop of farmProps) {
		if (['oak', 'pine', 'cherry'].includes(prop.texture)) {
			for (const dx of [-12, 0, 12]) assert.notEqual(farmGround(prop.x + dx, prop.y), 2, `Tree on path at ${prop.x},${prop.y}`);
		}
		if (['flowers', 'hedge', 'grass'].includes(prop.texture)) assert.equal(prop.solid, undefined);
	}
	assert.ok(farmWalkable({ x: 128, y: 128 }));
});

test('all farm buildings block movement through their walls from every side', () => {
	for (const prop of farmProps.filter(prop => ['barn', 'hay-barn', 'coop', 'greenhouse'].includes(prop.texture))) {
		const body = prop.solid;
		assert.ok(body.height >= 52);
		for (const [start, dx, dy] of [
			[{ x: prop.x, y: prop.y + 12 }, 0, -body.height - 32],
			[{ x: prop.x, y: body.y - 12 }, 0, body.height + 32],
			[{ x: body.x - 12, y: body.y + body.height / 2 }, body.width + 32, 0],
			[{ x: body.x + body.width + 12, y: body.y + body.height / 2 }, -body.width - 32, 0],
		]) {
			const result = moveOnFarm(start, dx, dy);
			assert.ok(!feetOverlap(result, body));
			if (dx) assert.equal(Math.sign(result.x - prop.x), Math.sign(start.x - prop.x));
			if (dy) assert.equal(Math.sign(result.y - body.y - body.height / 2), Math.sign(start.y - body.y - body.height / 2));
		}
	}
});

test('player cannot walk through a hen or cow, and can walk around either', () => {
	for (const animal of [createFarmAnimals()[0], createFarmAnimals()[8]]) {
		animal.point = { x: -80, y: animal.kind === 'cow' ? 80 : 560 };
		const body = farmAnimalBody(animal);
		for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
			const start = { x: animal.point.x - dx * 48, y: animal.point.y - dy * 48 };
			const stopped = moveOnFarm(start, dx * 96, dy * 96, [body]);
			assert.ok(!feetOverlap(stopped, body));
			assert.ok(Math.hypot(stopped.x - start.x, stopped.y - start.y) < 48);
		}
		const start = { x: animal.point.x - 48, y: animal.point.y + 24 };
		assert.deepEqual(moveOnFarm(start, 96, 0, [body]), { x: start.x + 96, y: start.y });
	}
});

test('animals respect the visitor and one another during continued movement', () => {
	const herd = createFarmAnimals();
	const guest = { x: -80, y: 560 };
	for (let frame = 0; frame < 1800; frame++) {
		for (const animal of herd) {
			updateFarmAnimal(animal, 1000 / 60, guest, herd);
			const body = farmAnimalBody(animal);
			assert.ok(!feetOverlap(guest, body));
			for (const other of herd) {
				if (other === animal) continue;
				const b = farmAnimalBody(other);
				assert.ok(!(body.x < b.x + b.width && body.x + body.width > b.x && body.y < b.y + b.height && body.y + body.height > b.y));
			}
		}
	}
});
