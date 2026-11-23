import type Phaser from 'phaser';
import type { Reaction } from './character-collision';

const symbols = {
	heart: ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'],
	annoyed: ['.#...#.', '.##.##.', '..#.#..', '.......', '..#.#..', '.##.##.', '.#...#.'],
	attention: ['..##...', '..##...', '..##...', '..##...', '..##...', '.......', '..##...'],
} as const;

export function drawReaction(bubble: Phaser.GameObjects.Graphics, reaction: Reaction, x: number, y: number): void {
	bubble.clear();
	if (!reaction) return;
	bubble.setPosition(Math.round(x) - 8, Math.round(y) - 51);
	bubble.fillStyle(0x382b32).fillRect(3, 0, 10, 1).fillRect(1, 1, 14, 2).fillRect(0, 3, 16, 9).fillRect(1, 12, 14, 2).fillRect(3, 14, 10, 1).fillRect(6, 15, 4, 1).fillRect(7, 16, 2, 1);
	bubble.fillStyle(0xfff0d2).fillRect(3, 1, 10, 1).fillRect(2, 2, 12, 1).fillRect(1, 3, 14, 9).fillRect(2, 12, 12, 1).fillRect(3, 13, 10, 1).fillRect(7, 14, 2, 2);
	if (reaction === 'waiting') {
		bubble.fillStyle(0x74513b).fillRect(3, 7, 2, 2).fillRect(7, 7, 2, 2).fillRect(11, 7, 2, 2);
		return;
	}
	const symbol = symbols[reaction];
	for (let row = 0; row < symbol.length; row++) for (let col = 0; col < symbol[row].length; col++) {
		if (symbol[row][col] === '#') bubble.fillStyle(reaction === 'heart' ? 0xe56b72 : 0xc54438).fillRect(5 + col, 4 + row, 1, 1);
	}
	if (reaction === 'heart') bubble.fillStyle(0xffb99b).fillRect(6, 5, 1, 2);
}
