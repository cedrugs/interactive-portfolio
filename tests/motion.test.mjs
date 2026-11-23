import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceStride, walkingFrame } from '../src/phaser/lab/motion.ts';

for (const [row, facing] of ['down', 'left', 'right', 'up'].entries()) {
	test(`${facing} alternates both contacts with a passing pose between`, () => {
		assert.deepEqual([0, 8, 16, 24].map(phase => walkingFrame(facing, phase, true) - row * 4), [1, 0, 3, 2]);
		assert.equal(walkingFrame(facing, 19, false), row * 4);
	});
}

test('stride depends on distance rather than frame rate', () => {
	const travel = fps => Array.from({ length: fps }, () => 64 / fps).reduce(advanceStride, 0);
	for (const fps of [30, 60, 120, 144]) assert.ok(Math.min(Math.abs(travel(fps)), Math.abs(travel(fps) - 32)) < 1e-8);
});

test('blocked movement does not advance the stride and turns preserve the planted foot', () => {
	const phase = advanceStride(0, 17);
	assert.equal(advanceStride(phase, 0), phase);
	assert.equal(walkingFrame('down', phase, true) % 4, walkingFrame('right', phase, true) % 4);
	assert.equal(walkingFrame('up', phase, false), 12);
});

import { movementFacing, movementHold } from '../src/phaser/lab/motion.ts';

test('diagonal facing remains stable across small axis fluctuations', () => {
	let facing = 'down';
	for (let i = 0; i < 120; i++) {
		facing = movementFacing(-1, i % 2 ? -.99 : -1.01, facing);
		assert.equal(facing, 'left');
	}
	assert.equal(movementFacing(0, -1, facing), 'up');
});

test('120Hz rendering holds the walking pose between 60Hz physics steps', () => {
	let idle = 80;
	for (let frame = 0; frame < 120; frame++) {
		const result = movementHold(idle, frame % 2 ? 0 : 64 / 60, 1000 / 120, true);
		idle = result.idleMs;
		assert.equal(result.moving, true);
	}
	assert.equal(movementHold(idle, 0, 100, true).moving, false);
	assert.equal(movementHold(0, 1, 16, false).moving, false);
});
