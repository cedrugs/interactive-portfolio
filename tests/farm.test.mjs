import test from 'node:test';
import assert from 'node:assert/strict';
import { FARM, FARM_PLAYABLE, farmCameraZoom, FARM_SPAWN, FARM_DOOR, FARM_HOUSE, farmProps, farmWalkable, moveOnFarm, atFarmDoor } from '../src/phaser/lab/farm-world.ts';

test('arrival has an unobstructed route to the front door', () => {
	assert.ok(farmWalkable(FARM_SPAWN));
	let point = { ...FARM_SPAWN };
	for (let i = 0; i < FARM_SPAWN.y - FARM_DOOR.y; i++) point = moveOnFarm(point, 0, -1);
	assert.deepEqual(point, FARM_DOOR);
	assert.ok(atFarmDoor(point));
	assert.equal(atFarmDoor(FARM_SPAWN), false);
});
test('house, well and tree bases block walking without tunneling', () => {
	assert.equal(farmWalkable({ x: 256, y: 150 }), false);
	assert.equal(farmWalkable({ x: 384, y: 242 }), false);
	assert.equal(farmWalkable({ x: 448, y: 140 }), false);
	assert.ok(moveOnFarm(FARM_SPAWN, 0, -200).y >= FARM_HOUSE.wallBottom + 4);
});
test('farm edges block movement and crop aisles remain open', () => {
	assert.equal(farmWalkable({ x: FARM_PLAYABLE.x - 1, y: 224 }), false);
	assert.ok(farmWalkable({ x: 80, y: 264 }));
	assert.ok(farmWalkable({ x: 184, y: 280 }));
	assert.ok(farmProps.every(prop => Number.isInteger(prop.x / 8) && Number.isInteger(prop.y / 8)));
});

test('porch is walkable across the facade and the door requires reaching it', () => {
	for (let x = 200; x <= 312; x += 8) assert.ok(farmWalkable({ x, y: 176 }));
	assert.equal(atFarmDoor({ x: 256, y: 192 }), false);
	assert.equal(atFarmDoor(FARM_DOOR), true);
	assert.equal(farmWalkable({ x: 168, y: 180 }), false);
	assert.equal(farmWalkable({ x: 208, y: 188 }), false);
	assert.ok(farmWalkable({ x: 256, y: 188 }));
});


test('camera view fits rendered terrain at phone, ultrawide and 8K sizes', () => {
	for (const [width, height] of [[844, 390], [1280, 720], [3440, 1440], [3840, 2160], [7680, 4320]]) {
		const zoom = farmCameraZoom(width, height);
		assert.ok(Number.isInteger(zoom));
		assert.ok(width / zoom < FARM.width);
		assert.ok(height / zoom < FARM.height);
	}
	assert.ok(FARM_PLAYABLE.x - FARM.x >= 512);
	assert.ok(FARM.x + FARM.width - FARM_PLAYABLE.x - FARM_PLAYABLE.width >= 512);
});

test('leaving the house lands on a clear porch approach without re-entering', () => {
	const exit = { x: FARM_DOOR.x, y: FARM_DOOR.y + 32 };
	assert.ok(farmWalkable(exit));
	assert.equal(atFarmDoor(exit), false);
	assert.deepEqual(moveOnFarm(exit, 0, -32), FARM_DOOR);
});
