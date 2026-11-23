import Phaser from 'phaser';
import { farmProps, type FarmProp } from './farm-world';

export class FarmAmbience {
	private elapsed = 0;
	private cherries = farmProps.filter(prop => prop.texture === 'cherry');
	private foliage: { sprite: Phaser.GameObjects.Image; x: number; phase: number }[] = [];
	private particles: Phaser.GameObjects.Graphics;
	private motion = matchMedia('(prefers-reduced-motion: reduce)');

	constructor(private scene: Phaser.Scene) {
		this.particles = scene.add.graphics().setDepth(2000);
	}

	addFoliage(sprite: Phaser.GameObjects.Image, prop: FarmProp): void {
		if (!['oak', 'pine', 'cherry', 'flowers', 'tomato'].includes(prop.texture)) return;
		const height = sprite.height;
		const split = Math.floor(height * (prop.texture === 'pine' ? .78 : .65));
		sprite.setCrop(0, split, sprite.width, height - split);
		const canopy = this.scene.add.image(prop.x, prop.y, sprite.texture.key).setOrigin(.5, 1).setDepth(sprite.depth + .01).setCrop(0, 0, sprite.width, split);
		this.foliage.push({ sprite: canopy, x: prop.x, phase: prop.x * .04 + prop.y * .07 });
	}

	update(delta: number): void {
		this.particles.clear();
		if (this.motion.matches) {
			for (const item of this.foliage) item.sprite.x = item.x;
			return;
		}
		this.elapsed += Math.min(delta, 50);
		const time = this.elapsed / 1000;
		for (const item of this.foliage) item.sprite.x = item.x + Math.round(Math.sin(time * 1.4 + item.phase) * .7);
		for (let i = 0; i < 5; i++) {
			const progress = (time / 4 + i / 5) % 1;
			const size = 3 + Math.floor(progress * 5);
			this.particles.fillStyle(0xf5ecd7, .32 * (1 - progress)).fillRect(Math.round(307 + Math.sin(progress * 4) * 6), Math.round(64 - progress * 40), size, size);
		}
		for (const tree of this.cherries) {
			for (let i = 0; i < 4; i++) {
				const progress = (time / 7 + i / 4 + Math.abs(tree.x) / 71) % 1;
				this.particles.fillStyle(i % 2 ? 0xf7c6cc : 0xe993b1, .85).fillRect(Math.round(tree.x - 24 + i * 14 + Math.sin(progress * 7) * 8), Math.round(tree.y - 64 + progress * 70), 2, 1);
			}
		}
		for (const [i, center] of [{ x: 304, y: 240 }, { x: 112, y: 208 }, { x: 576, y: 192 }, { x: -96, y: 224 }].entries()) {
			const x = Math.round(center.x + Math.sin(time * .6 + i) * 22);
			const y = Math.round(center.y + Math.cos(time * .8 + i) * 10);
			const wing = Math.floor(time * 7) % 2 ? 2 : 1;
			this.particles.fillStyle(i % 2 ? 0xf8d480 : 0xe0c4ee).fillRect(x - wing, y - 1, wing, 2).fillRect(x + 1, y - 1, wing, 2);
			this.particles.fillStyle(0x554735).fillRect(x, y, 1, 2);
		}
	}
}
