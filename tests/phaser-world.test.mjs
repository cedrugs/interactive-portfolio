import test from 'node:test';
import assert from 'node:assert/strict';
import { actions, approaches, clearSegment, collider, ENTRY, furnishings, nearbyAction, route, safeExit, SPAWN, validateWorld, walkable } from '../src/phaser/lab/world.ts';

test('the test room has a valid grid and reachable interaction approaches', () => {
	assert.doesNotThrow(validateWorld);
	for (const action of actions) {
		const path = route(SPAWN, approaches(action));
		assert.ok(path.length, action.id);
		let previous = SPAWN;
		for (const point of path) { assert.ok(clearSegment(previous, point), action.id); previous = point; }
	}
});

test('the floor above the coffee table is walkable across its full width', () => {
	assert.ok(clearSegment({ x: 72, y: 212 }, { x: 120, y: 212 }));
	assert.equal(walkable({ x: 96, y: 220 }), false);
	assert.ok(walkable({ x: 96, y: 228 }));
});

test('sofa interaction works from both ends and the open seating side', () => {
	for (const point of [{ x: 64, y: 148 }, { x: 86, y: 168 }, { x: 64, y: 198 }]) {
		assert.ok(walkable(point));
		assert.equal(nearbyAction(point)?.id, 'theater');
	}
});

test('desk and chair remain individually reachable from nearby floor', () => {
	assert.equal(nearbyAction({ x: 248, y: 102 })?.id, 'projects');
	assert.equal(nearbyAction({ x: 200, y: 134 })?.id, 'chair');
});

test('two-tile entrance and theater aisle have continuous clearance', () => {
	for (const x of [ENTRY.x + 4, ENTRY.x + ENTRY.width / 2, ENTRY.x + ENTRY.width - 4]) {
		assert.ok(clearSegment({ x, y: ENTRY.y + ENTRY.height - 8 }, { x, y: 104 }));
	}
	assert.ok(clearSegment({ x: 96, y: 136 }, { x: 96, y: 208 }));
	assert.equal(walkable({ x: ENTRY.x - 4, y: ENTRY.y + 16 }), false);
	assert.equal(walkable({ x: ENTRY.x + ENTRY.width + 4, y: ENTRY.y + 16 }), false);
});

test('activity exits return to the entry position and recover a blocked entry safely', () => {
	for (const action of actions.filter(action => action.pose)) {
		const saved = approaches(action)[0];
		assert.deepEqual(safeExit(saved, action), saved);
		assert.ok(walkable(safeExit({ x: 0, y: 0 }, action)));
	}
});

test('click paths cannot cross solid furniture or escape the room', () => {
	for (const item of furnishings) {
		const box = collider(item);
		if (!box) continue;
		assert.equal(walkable({ x: box.x + box.width / 2, y: box.y + box.height / 2 }), false, item.id);
	}
	assert.deepEqual(route(SPAWN, [{ x: -1, y: 50 }]), []);
	assert.deepEqual(route(SPAWN, [{ x: NaN, y: 80 }]), []);
});

test('all interaction destinations remain connected to one another', () => {
	for (const start of actions) {
		const origin = approaches(start)[0];
		for (const destination of actions) assert.ok(route(origin, approaches(destination)).length, `${start.id} to ${destination.id}`);
	}
});

test('bedroom doorway and kitchen junction stay open while the north wall is solid', () => {
	for (const y of [194, 208, 222]) assert.ok(clearSegment({ x: 280, y }, { x: 376, y }));
	assert.equal(walkable({ x: 320, y: 184 }), false);
	assert.ok(walkable({ x: 320, y: 232 }));
	assert.equal(walkable({ x: 296, y: 248 }), false);
});

test('the bed responds from either side and its foot, and waking restores a safe approach', () => {
	const sleep = actions.find(action => action.id === 'sleep');
	for (const point of [{ x: 392, y: 110 }, { x: 452, y: 130 }, { x: 424, y: 150 }]) {
		assert.ok(walkable(point));
		assert.equal(nearbyAction(point)?.id, 'sleep');
		assert.deepEqual(safeExit(point, sleep), point);
	}
});

test('cooking approaches are reachable without walking into the counter or through the wall', () => {
	for (const point of [{ x: 396, y: 312 }, { x: 416, y: 318 }, { x: 436, y: 300 }]) {
		assert.ok(walkable(point));
		assert.equal(nearbyAction(point)?.id, 'cook');
	}
	assert.equal(nearbyAction({ x: 416, y: 282 }), null);
});

test('room borders form closed loops with no dangling wall ends', async () => {
	const { boundaryEdges } = await import('../src/phaser/lab/architecture.ts');
	const vertices = new Map();
	for (const edge of boundaryEdges()) {
		for (const point of [edge.from, edge.to]) {
			const key = `${point.x},${point.y}`;
			vertices.set(key, (vertices.get(key) ?? 0) + 1);
		}
	}
	for (const [point, degree] of vertices) assert.equal(degree, 2, point);
});

test('physics walls and navigation agree on every floor and doorway tile', async () => {
	const { contains, floorContains, solidWalls, WORLD } = await import('../src/phaser/lab/architecture.ts');
	const walls = solidWalls();
	for (let y = 8; y < WORLD.height; y += 16) {
		for (let x = 8; x < WORLD.width; x += 16) {
			assert.equal(walls.some(wall => contains(wall, { x, y })), !floorContains({ x, y }), `${x},${y}`);
		}
	}
});
