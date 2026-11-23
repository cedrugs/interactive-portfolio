import test from 'node:test';
import assert from 'node:assert/strict';
import { activityFrame, blanketLift } from '../src/phaser/lab/activity-motion.ts';

test('reading holds the book still then turns a page before settling', () => {
	assert.deepEqual([0, 3999, 4000, 4400, 4800, 5200].map(time => activityFrame('read', time)), [0, 0, 1, 2, 3, 0]);
});

test('cooking cycles all stir poses and typing includes a rest', () => {
	assert.deepEqual([0, 260, 520, 780, 1040].map(time => activityFrame('cook', time)), [4, 5, 6, 7, 4]);
	assert.deepEqual([0, 140, 280, 420, 2400].map(time => activityFrame('chair', time)), [8, 9, 10, 11, 8]);
});

test('drinking raises the mug, holds a sip, lowers it, then rests', () => {
	assert.deepEqual([0, 1700, 2100, 3000, 3100, 3500, 5200].map(time => activityFrame('water', time)), [12, 13, 14, 14, 15, 12, 12]);
});

test('sleep breathing stays within one native pixel and returns to rest', () => {
	assert.equal(blanketLift(0), 0);
	assert.equal(blanketLift(1050), 1);
	assert.equal(blanketLift(4200), 0);
	for (let time = 0; time < 10000; time += 50) assert.ok([0, 1].includes(blanketLift(time)));
	assert.equal(activityFrame('sleep', 2000), null);
	assert.equal(activityFrame('theater', 2000), null);
});
