import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceReaction, charactersOverlap, currentReaction, moveCharacter } from '../src/phaser/lab/character-collision.ts';
import { walkable } from '../src/phaser/lab/world.ts';

const sam = { x: 168, y: 136 };

test('a guest cannot walk through Sam from any direction, even across a long frame', () => {
	for (const offset of [{ x: 24, y: 0 }, { x: -24, y: 0 }, { x: 0, y: 24 }, { x: 0, y: -24 }]) {
		const start = { x: sam.x + offset.x, y: sam.y + offset.y };
		const result = moveCharacter(start, { x: -offset.x * 2, y: -offset.y * 2 }, sam);
		assert.ok(result.blockedByCharacter);
		assert.equal(charactersOverlap(result.point, sam), false);
		assert.ok(walkable(result.point));
	}
});

test('Sam stops at the guest and resumes towards the same waypoint once the guest moves', () => {
	const target = { x: 168, y: 160 };
	const blocked = moveCharacter(sam, { x: 0, y: 24 }, target);
	assert.ok(blocked.blockedByCharacter);
	assert.equal(charactersOverlap(blocked.point, target), false);
	const resumed = moveCharacter(blocked.point, { x: 0, y: target.y - blocked.point.y }, { x: 192, y: 160 });
	assert.deepEqual(resumed.point, target);
	assert.equal(resumed.blockedByCharacter, false);
});

test('diagonal movement slides past character feet without penetrating', () => {
	const result = moveCharacter({ x: 156, y: 140 }, { x: 5, y: 10 }, sam);
	assert.ok(result.point.y > 140);
	assert.equal(charactersOverlap(result.point, sam), false);
});

test('a character can escape an overlapping spawn without being trapped', () => {
	const result = moveCharacter(sam, { x: 0, y: 12 }, sam);
	assert.equal(charactersOverlap(result.point, sam), false);
});

test('brief bumps stay quiet, sustained blocking waits, clearing the way shows a heart once', () => {
	let state = { blockedMs: 0, heartMs: 0 };
	state = advanceReaction(state, { walking: true, blocked: true }, 100);
	assert.equal(currentReaction(state), null);
	state = advanceReaction(state, { walking: true, blocked: false }, 16);
	assert.equal(currentReaction(state), null);
	for (let i = 0; i < 3; i++) state = advanceReaction(state, { walking: true, blocked: true }, 100);
	assert.equal(currentReaction(state), 'waiting');
	state = advanceReaction(state, { walking: true, blocked: false }, 16);
	assert.equal(currentReaction(state), 'heart');
	for (let i = 0; i < 13; i++) state = advanceReaction(state, { walking: true, blocked: false }, 100);
	assert.equal(currentReaction(state), null);
});


test('Sam becomes annoyed after three seconds and advertises available dialogue', () => {
	let state = { blockedMs: 0, heartMs: 0 };
	assert.equal(currentReaction(state, true), 'attention');
	assert.equal(currentReaction(state, false), null);
	for (let i = 0; i < 30; i++) state = advanceReaction(state, { walking: true, blocked: true }, 100);
	assert.equal(currentReaction(state, true), 'annoyed');
	state = advanceReaction(state, { walking: true, blocked: false }, 16);
	assert.equal(currentReaction(state, true), 'heart');
	for (let i = 0; i < 12; i++) state = advanceReaction(state, { walking: true, blocked: false }, 100);
	assert.equal(currentReaction(state, true), 'attention');
});


test('standing against an idle Sam never builds frustration', () => {
	let state = { blockedMs: 0, heartMs: 0 };
	for (let i = 0; i < 100; i++) state = advanceReaction(state, { walking: false, blocked: true }, 100);
	assert.deepEqual(state, { blockedMs: 0, heartMs: 0 });
	assert.equal(currentReaction(state, true), 'attention');
	assert.equal(currentReaction(state, false), null);
});

test('arriving at a stop immediately clears annoyance and any thank-you heart', () => {
	for (const previous of [{ blockedMs: 5000, heartMs: 0 }, { blockedMs: 0, heartMs: 900 }]) {
		const state = advanceReaction(previous, { walking: false, blocked: true }, 16);
		assert.deepEqual(state, { blockedMs: 0, heartMs: 0 });
		assert.equal(currentReaction(state, true), 'attention');
	}
});

test('guest contact alone does not annoy Sam when his own route is clear', () => {
	let state = { blockedMs: 0, heartMs: 0 };
	for (let i = 0; i < 100; i++) state = advanceReaction(state, { walking: true, blocked: false }, 100);
	assert.equal(currentReaction(state), null);
});
