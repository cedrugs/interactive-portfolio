import test from 'node:test';
import assert from 'node:assert/strict';
import { FARM_SPAWN, farmWalkable, moveOnFarm, farmSigns, nearbyFarmSign, farmBanks } from '../src/phaser/lab/farm-world.ts';
import { createFarmAnimals, updateFarmAnimal, farmAnimalFrame } from '../src/phaser/lab/farm-animals.ts';

test('every farm sign, animal yard and building approach is connected to the house', () => {
	const key = point => `${point.x},${point.y}`;
	const queue = [{ ...FARM_SPAWN }];
	const seen = new Set([key(FARM_SPAWN)]);
	const targets = [...farmSigns.map(sign => ({ x: sign.x, y: sign.y + 16 })), { x: -112, y: 8 }, { x: 48, y: 8 }, { x: 608, y: 16 }, { x: -104, y: 440 }, { x: 40, y: 440 }];
	for (let i = 0; i < queue.length; i++) {
		const point = queue[i];
		for (const [dx, dy] of [[8, 0], [-8, 0], [0, 8], [0, -8]]) {
			const target = { x: point.x + dx, y: point.y + dy };
			if (seen.has(key(target)) || !farmWalkable(target)) continue;
			const next = moveOnFarm(point, dx, dy);
			if (next.x !== target.x || next.y !== target.y) continue;
			seen.add(key(target)); queue.push(target);
		}
	}
	for (const target of targets) assert.ok(seen.has(key(target)), `Unreachable farm destination ${key(target)}`);
	for (const sign of farmSigns) assert.equal(nearbyFarmSign({ x: sign.x, y: sign.y + 16 })?.id, sign.id);
	assert.equal(nearbyFarmSign(FARM_SPAWN), null);
});

test('animals wander, pause and peck while remaining in their yards on walkable ground', () => {
	assert.equal(new Set(createFarmAnimals().map(animal => `${animal.point.x},${animal.point.y}`)).size, 11);
	for (const animal of createFarmAnimals()) {
		const start = { ...animal.point };
		const phases = new Set();
		const frames = new Set();
		let traveled = 0;
		for (let i = 0; i < 3600; i++) {
			const before = { ...animal.point };
			updateFarmAnimal(animal, 1000 / 60, FARM_SPAWN);
			traveled += Math.hypot(animal.point.x - before.x, animal.point.y - before.y);
			phases.add(animal.phase); frames.add(farmAnimalFrame(animal));
			assert.ok(farmWalkable(animal.point), `${animal.kind} hit scenery`);
			assert.ok(animal.point.x >= animal.pen.x && animal.point.x <= animal.pen.x + animal.pen.width);
			assert.ok(animal.point.y >= animal.pen.y && animal.point.y <= animal.pen.y + animal.pen.height);
		}
		assert.ok(traveled > 100, `${animal.kind} stuck at ${start.x},${start.y}`);
		assert.ok(phases.has('walk') && phases.has('peck'));
		assert.ok(frames.has(0) && frames.has(1) && frames.has(2));
	}
});

test('an animal waits near a visitor and a stalled frame cannot teleport it', () => {
	const animal = createFarmAnimals()[0];
	animal.phase = 'walk'; animal.timer = 9000;
	animal.target = { x: animal.point.x + 64, y: animal.point.y };
	const start = { ...animal.point };
	updateFarmAnimal(animal, 30000, FARM_SPAWN);
	assert.ok(Math.hypot(animal.point.x - start.x, animal.point.y - start.y) <= .75);
	const before = { ...animal.point };
	updateFarmAnimal(animal, 16, { x: animal.point.x + 8, y: animal.point.y });
	assert.deepEqual(animal.point, before);
	assert.notEqual(animal.phase, 'walk');
});

test('rock banks block the north and side boundaries', () => {
	for (const bank of farmBanks) assert.equal(farmWalkable({ x: bank.x + bank.width / 2, y: bank.y + bank.height / 2 }), false);
});
