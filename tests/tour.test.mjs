import test from 'node:test';
import assert from 'node:assert/strict';
import { canTalkToSam, parseTourSave, tourStops, visitorName } from '../src/phaser/lab/tour.ts';
import { actions, approaches, clearSegment, route, SPAWN, walkable } from '../src/phaser/lab/world.ts';

test('tour checkpoints reject corrupt and out-of-range saves', () => {
	for (const raw of [null, '', '{', '{}', '{"version":2,"stop":0}', '{"version":1,"stop":-1}', '{"version":1,"stop":99}', '{"version":1,"stop":1.2}']) assert.equal(parseTourSave(raw), null);
	assert.equal(parseTourSave('{"version":1,"stop":2,"name":"Alex"}'), 2);
});

test('Sam can only be approached while waiting, within reach, without a wall between', () => {
	assert.equal(canTalkToSam({ x: 168, y: 160 }, SPAWN, 'waiting'), true);
	for (const phase of ['walking', 'dialogue', 'complete']) assert.equal(canTalkToSam({ x: 168, y: 160 }, SPAWN, phase), false);
	assert.equal(canTalkToSam({ x: 168, y: 200 }, SPAWN, 'waiting'), false);
	assert.equal(canTalkToSam({ x: 398, y: 110 }, { x: 424, y: 110 }, 'waiting'), false);
});

test('every tour stop connects to the next and leaves an approachable waiting position', () => {
	let previous = SPAWN;
	for (const stop of tourStops.slice(1)) {
		const action = actions.find(action => action.id === stop.action);
		assert.ok(action);
		const targets = approaches(action).sort((a, b) => Math.hypot(a.x - previous.x, a.y - previous.y) - Math.hypot(b.x - previous.x, b.y - previous.y));
		const path = route(previous, targets);
		assert.ok(path.length, stop.title);
		for (const point of path) { assert.ok(clearSegment(previous, point)); previous = point; }
		assert.ok(walkable(previous));
		assert.ok(targets.some(point => canTalkToSam(point, previous, 'waiting')));
	}
});

test('visitor names are bounded, trimmed, and never empty', () => {
	assert.equal(visitorName('  Alex  '), 'Alex');
	assert.equal(visitorName(''), 'Guest');
	assert.equal(visitorName(null), 'Guest');
	assert.equal(visitorName('a'.repeat(100)).length, 24);
	assert.equal(visitorName('Sam\n'), 'Sam');
});
