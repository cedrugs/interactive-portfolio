import assert from 'node:assert/strict';
import test from 'node:test';
import { findPath, movePlayer, walkable, obstacles, cameraView, clearSegment, SPAWN } from '../src/game/navigation.ts';
import { interactions, activities, props } from '../src/game/room.ts';
import { cellCenter, TILE_SIZE, toWorld } from '../src/game/grid.ts';
import { rooms, passageTiles, floorAreas, walkingLanes } from '../src/game/layout.ts';
import { closestInteraction, interactionApproaches, canInteract, interactionBounds, interactionAt } from '../src/game/interactions.ts';

for (const target of interactions) {
	test(`reach ${target.id} through doorways and leave safely`, () => {
		assert.ok(walkable(target.approach));
		for (const start of [SPAWN, ...activities.map(activity => activity.approach)]) {
			const path = findPath(start, target.approach);
			let previous = start;
			for (const point of path) {
				assert.ok(clearSegment(previous, point), `${target.id}: blocked segment`);
				previous = point;
			}
			assert.ok(Math.hypot(previous.x - target.approach.x, previous.y - target.approach.y) <= 4);
		}
		assert.equal(closestInteraction(target.approach)?.id, target.id);
	});
}

test('furniture footprints share the placement data and block their solid bases', () => {
	assert.equal(obstacles.length, props.filter(prop => prop.footprint).length);
	for (const block of obstacles) assert.equal(walkable({ x: block.x + block.width / 2, y: block.y + block.height / 2 }), false);
	assert.ok(walkable(cellCenter(21, 26)), 'rug remains walkable');
	assert.ok(walkable(cellCenter(18, 18)), 'floor behind sofa remains walkable');
});

test('walls and black void cannot be crossed, including large frame intervals', () => {
	assert.equal(walkable({ x: 480, y: 280 }), false);
	assert.equal(walkable({ x: 240, y: 270 }), false);
	let point = cellCenter(16, 25);
	for (let i = 0; i < 60; i++) point = movePlayer(point, { x: -1, y: 0 }, 2);
	assert.ok(point.x >= 260);
	assert.ok(walkable(point));
});

test('diagonal walking has the same speed and taps in the void stop on safe floor', () => {
	const start = { x: 340, y: 324 };
	const straight = movePlayer(start, { x: 1, y: 0 }, .016);
	const diagonal = movePlayer(start, { x: 1, y: 1 }, .016);
	assert.ok(Math.abs(Math.hypot(diagonal.x - start.x, diagonal.y - start.y) - (straight.x - start.x)) < .001);
	const path = findPath(start, { x: 700, y: 20 });
	assert.ok(path.length);
	assert.ok(path.every(point => walkable(point)));
});

for (const [width, height, scale] of [[1440, 900, 4], [2560, 1440, 4], [844, 390, 3], [667, 375, 3]]) {
	test(`camera follows at fixed integer zoom for ${width}x${height}`, () => {
		const view = cameraView(width, height, SPAWN);
		const next = cameraView(width, height, { x: SPAWN.x + 24, y: SPAWN.y + 16 });
		assert.equal(view.scale, scale);
		assert.equal(next.x - view.x, -24 * scale);
		assert.equal(next.y - view.y, -16 * scale);
		assert.ok(Math.abs(view.x + SPAWN.x * scale - width / 2) <= .5);
	});
}


test('walking between the sofa and coffee table has a broad lane in both directions', () => {
	for (let y = 21 * TILE_SIZE + 4; y <= 24 * TILE_SIZE - 4; y += 4) {
		for (const direction of [-1, 1]) {
			let point = { x: cellCenter(direction < 0 ? 20 : 16, 0).x, y };
			for (let frame = 0; frame < 60; frame++) point = movePlayer(point, { x: direction, y: 0 }, 1 / 60);
			assert.ok(direction < 0 ? point.x < cellCenter(17, 0).x : point.x > cellCenter(19, 0).x, `blocked at y=${y} moving ${direction}`);
		}
	}
	assert.equal(walkable(cellCenter(17, 24)), false);
});


test('bed can be used from either side and the foot', () => {
	const bed = activities.find(activity => activity.id === 'sleep');
	for (const approach of interactionApproaches(bed)) {
		assert.ok(walkable(approach));
		assert.equal(closestInteraction(approach)?.id, 'sleep');
		const path = findPath(SPAWN, approach);
		assert.ok(canInteract(bed, path.at(-1)));
	}
	for (const point of [cellCenter(36, 19), cellCenter(40, 19), cellCenter(38, 21)]) assert.equal(closestInteraction(point)?.id, 'sleep');
});

test('bedroom entrance stays clear across the width of the hallway', () => {
	for (let y = 21 * TILE_SIZE + 4; y <= 23 * TILE_SIZE - 4; y += 4) {
		assert.ok(clearSegment({ x: 380, y }, { x: 540, y }), `entrance obstructed at y=${y}`);
	}
});


for (const target of interactions) {
	test(`${target.id} responds along every accessible edge, with a reachable click destination`, () => {
		const bounds = interactionBounds(target);
		let checked = 0;
		for (let x = bounds.x - 8; x <= bounds.x + bounds.width + 8; x += 4) {
			for (let y = bounds.y - 8; y <= bounds.y + bounds.height + 8; y += 4) {
				if (!walkable({ x, y }) || !canInteract(target, { x, y })) continue;
				checked++;
				assert.ok(closestInteraction({ x, y }));
			}
		}
		assert.ok(checked > 10);
		for (const start of [SPAWN, ...activities.map(activity => activity.approach)]) {
			const path = findPath(start, interactionApproaches(target));
			assert.ok(canInteract(target, path.at(-1) ?? start));
		}
	});
}

test('sofa, stove, aquarium and desk respond from multiple sides', () => {
	for (const [id, column, row] of [
		['sit', 18, 21], ['sit', 16, 19], ['sit', 20, 19],
		['cook', 2, 19], ['cook', 6, 19], ['cook', 4, 20],
		['watch', 26, 20], ['watch', 23, 18],
		['projects', 20, 6], ['projects', 26, 6],
	]) assert.equal(closestInteraction(cellCenter(column, row))?.id, id, `${id} at ${column},${row}`);
});


test('solid furniture and walls prevent reaching through to another object', () => {
	const aquarium = interactions.find(target => target.id === 'watch');
	assert.equal(canInteract(aquarium, { x: 420, y: 276 }), false);
	for (const target of interactions) assert.equal(canInteract(target, { x: 480, y: 280 }), false);
});

test('clicking furniture uses its visible bounds for portfolio stations and activities', () => {
	for (const target of interactions) {
		const prop = props.find(item => item.interaction === target.id);
		const bounds = interactionBounds(target);
		assert.equal(interactionAt({ x: bounds.x + bounds.width / 2, y: prop.y + prop.size / 2 })?.id, target.id);
	}
});


test('workstation is usable directly in front of its chair without removing movement collisions', () => {
	for (const x of [378, 384, 390, 396]) {
		for (const y of [130, 136, 142, 148]) {
			assert.equal(closestInteraction({ x, y })?.id, 'projects', `workstation unavailable at ${x},${y}`);
		}
	}
	assert.equal(walkable({ x: 386, y: 120 }), false);
	assert.equal(interactionAt({ x: 385, y: 116 })?.id, 'projects');
});

const overlap = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

test('rooms, passages, furniture and collision footprints occupy whole shared tiles', () => {
	for (const area of [...rooms.map(room => room.grid), ...passageTiles, ...props.map(prop => prop.grid)]) {
		assert.ok(Object.values(area).every(Number.isInteger));
	}
	const solid = props.filter(prop => prop.footprint);
	for (const prop of solid) {
		const bounds = toWorld(prop.grid);
		assert.deepEqual({ ...prop.footprint, x: prop.x + prop.footprint.x, y: prop.y + prop.footprint.y }, bounds);
		assert.ok(Object.values(bounds).every(value => value % TILE_SIZE === 0));
		for (let x = bounds.x + TILE_SIZE / 2; x < bounds.x + bounds.width; x += TILE_SIZE) {
			for (let y = bounds.y + TILE_SIZE / 2; y < bounds.y + bounds.height; y += TILE_SIZE) {
				assert.ok(floorAreas.some(area => x > area.x && x < area.x + area.width && y > area.y && y < area.y + area.height), prop.id);
			}
		}
	}
	for (let i = 0; i < solid.length; i++) {
		for (const other of solid.slice(i + 1)) assert.equal(overlap(toWorld(solid[i].grid), toWorld(other.grid)), false, `${solid[i].id} overlaps ${other.id}`);
	}
});

test('reserved two-tile circulation lanes stay clear across room boundaries', () => {
	for (const lane of walkingLanes) {
		assert.ok(obstacles.every(block => !overlap(block, lane)));
		for (let x = lane.x + 4; x <= lane.x + lane.width - 4; x += 4) {
			for (let y = lane.y + 4; y <= lane.y + lane.height - 4; y += 4) assert.ok(walkable({ x, y }), `lane blocked at ${x},${y}`);
		}
	}
});

test('click destinations use the same tile centers as navigation', () => {
	for (const target of interactions) {
		const approaches = interactionApproaches(target);
		assert.ok(approaches.length > 0);
		for (const point of approaches) {
			assert.equal(point.x % TILE_SIZE, TILE_SIZE / 2);
			assert.equal(point.y % TILE_SIZE, TILE_SIZE / 2);
		}
	}
});
