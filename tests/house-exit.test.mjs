import test from 'node:test';
import assert from 'node:assert/strict';
import { HOUSE_EXIT, HOUSE_RETURN, ENTRY, ROOMS, atHouseExit } from '../src/phaser/lab/architecture.ts';
import { actions, approaches, walkable, clearSegment, route } from '../src/phaser/lab/world.ts';

test('front doorway ends at the exterior instead of continuing into another room', () => {
	assert.ok(walkable(HOUSE_EXIT));
	assert.ok(walkable(HOUSE_RETURN));
	assert.ok(clearSegment(HOUSE_RETURN, HOUSE_EXIT));
	assert.equal(walkable({ x: HOUSE_EXIT.x, y: ENTRY.y + ENTRY.height + 4 }), false);
	assert.equal(walkable({ x: 160, y: 320 }), false);
	assert.ok(atHouseExit(HOUSE_EXIT));
	assert.equal(atHouseExit(HOUSE_RETURN), false);
	assert.equal(atHouseExit({ x: 320, y: 264 }), false);
});

test('kitchen and bedroom are reached through the east hall without crossing the front doorway', () => {
	for (const id of ['cook', 'sleep']) {
		const action = actions.find(action => action.id === id);
		const path = route(HOUSE_RETURN, approaches(action));
		assert.ok(path.length, id);
		assert.ok(path.every(point => !atHouseExit(point)), id);
	}
	for (const y of [338, 352, 366]) assert.ok(clearSegment({ x: 320, y }, { x: 376, y }));
	const kitchen = ROOMS.find(room => room.id === 'kitchen').floor;
	const bedroom = ROOMS.find(room => room.id === 'bedroom').floor;
	const path = route(HOUSE_RETURN, approaches(actions.find(action => action.id === 'cook')));
	assert.ok(path.every(point => !(point.x >= bedroom.x && point.x <= bedroom.x + bedroom.width && point.y < bedroom.y + bedroom.height)));
	assert.ok(kitchen.x > ENTRY.x + ENTRY.width);
});
