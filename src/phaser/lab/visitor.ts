import Phaser from 'phaser';
import { charactersOverlap, moveCharacter } from './character-collision';
import { advanceStride, movementFacing, walkingFrame } from './motion';
import { approaches, furnishings, placement, route, safeExit, type Action, type Facing, type Point } from './world';

export class Visitor {
	readonly sprite: Phaser.GameObjects.Sprite;
	private shadow: Phaser.GameObjects.Ellipse;
	private props: Phaser.GameObjects.Graphics;
	point: Point = { x: 168, y: 160 };
	activity: Action | null = null;
	elapsed = 0;
	private exit = { ...this.point };
	private path: Point[] = [];
	private destination: Action | null = null;
	private facing: Facing = 'up';
	private stride = 0;
	blockedByCharacter = false;
	private blocker?: Point;

	constructor(scene: Phaser.Scene) {
		this.sprite = scene.add.sprite(this.point.x, this.point.y + 2, 'guest', 12).setOrigin(.5, 1).setAlpha(1).setBlendMode(Phaser.BlendModes.NORMAL).setVisible(false);
		this.shadow = scene.add.ellipse(this.point.x, this.point.y + 1, 12, 4, 0x30251d, .32).setVisible(false);
		this.props = scene.add.graphics();
	}

	reset(avatar: 'male' | 'female'): void {
		this.blocker = undefined;
		this.blockedByCharacter = false;
		this.stop();
		this.sprite.setTexture(avatar === 'female' ? 'guest-female' : 'guest', 12);
		this.point = { x: 168, y: 160 };
		this.path = [];
		this.destination = null;
		this.facing = 'up';
		this.sprite.setVisible(true);
		this.shadow.setVisible(true);
		this.draw(false);
	}

	relocate(point: Point): void {
		this.blocker = undefined;
		this.stop();
		this.point = { ...point };
		this.facing = 'up';
		this.stride = 0;
		this.blockedByCharacter = false;
		this.draw(false);
	}

	visit(action: Action): void {
		this.stop();
		const targets = approaches(action).sort((a, b) => Math.hypot(a.x - this.point.x, a.y - this.point.y) - Math.hypot(b.x - this.point.x, b.y - this.point.y));
		this.path = route(this.point, targets);
		this.destination = this.path.length ? action : null;
	}

	start(action: Action): void {
		if (!action.pose || (this.blocker && charactersOverlap(action.pose.point, this.blocker))) return;
		this.path = [];
		this.destination = null;
		this.exit = { ...this.point };
		this.point = { ...action.pose.point };
		this.facing = action.pose.facing;
		this.activity = action;
		this.elapsed = 0;
		this.draw(false);
	}

	stop(): void {
		if (this.activity) {
			const exit = safeExit(this.exit, this.activity);
			const available = [exit, ...approaches(this.activity)].find(point => !this.blocker || !charactersOverlap(point, this.blocker));
			if (!available) return;
			this.point = available;
		}
		this.activity = null;
		this.path = [];
		this.destination = null;
		this.sprite.setCrop().setScale(1);
		this.props.clear();
	}

	update(delta: number, input: Point, paused: boolean, blocker?: Point): void {
		this.blocker = blocker;
		this.blockedByCharacter = false;
		if (!this.sprite.visible) return;
		const dt = Math.min(delta, 34);
		let dx = 0, dy = 0;
		if (!paused) {
			if (input.x || input.y) this.stop();
			if (this.activity) this.elapsed += dt;
			else {
				const magnitude = Math.max(1, Math.hypot(input.x, input.y));
				dx = input.x / magnitude * 64 * dt / 1000;
				dy = input.y / magnitude * 64 * dt / 1000;
				const target = this.path[0];
				if (target && !dx && !dy) {
					const distance = Math.hypot(target.x - this.point.x, target.y - this.point.y);
					if (distance <= 1) { this.path.shift(); if (!this.path.length && this.destination) this.start(this.destination); }
					else { const step = Math.min(distance, 64 * dt / 1000); dx = (target.x - this.point.x) / distance * step; dy = (target.y - this.point.y) / distance * step; }
				}
			}
		}
		const before = { ...this.point };
		if (!this.activity) {
			const movement = moveCharacter(this.point, { x: dx, y: dy }, blocker);
			this.point = movement.point;
			this.blockedByCharacter = movement.blockedByCharacter;
		}
		const distance = Math.hypot(this.point.x - before.x, this.point.y - before.y);
		this.facing = movementFacing(dx, dy, this.facing);
		if (distance > .01) this.stride = advanceStride(this.stride, distance);
		this.draw(distance > .01);
	}

	private draw(moving: boolean): void {
		const action = this.activity;
		const seated = action && ['chair', 'theater', 'read', 'dine'].includes(action.id);
		const sleeping = action?.id === 'sleep';
		const item = action ? furnishings.find(item => item.id === action.objects[0]) : null;
		const area = item ? placement(item) : null;
		const depth = area && action?.pose?.depthOffset !== undefined ? area.y + area.height + action.pose.depthOffset : this.point.y + 1;
		const x = Math.round(this.point.x), y = Math.round(this.point.y);
		this.sprite.setPosition(x, y + 2 + (seated ? 6 : 0)).setDepth(depth).setFrame(walkingFrame(this.facing, this.stride, moving));
		if (seated) this.sprite.setCrop(0, 0, 24, 31);
		else if (sleeping) this.sprite.setCrop(0, 0, 24, 18);
		else this.sprite.setCrop();
		this.shadow.setPosition(x, y + 1).setDepth(y).setVisible(!action);
		this.props.clear().setDepth(depth + .1);
		if (action?.id === 'read') {
			const page = this.elapsed % 5200 > 4000 ? 1 : 0;
			this.props.fillStyle(0x61452c).fillRect(x - 8, y - 12, 14, 8);
			this.props.fillStyle(0xf2ddb0).fillRect(x - 7, y - 11, 12, 6);
			this.props.fillStyle(0xb79961).fillRect(x - 1 + page, y - 11, 1, 6);
		}
		if (action?.id === 'water') {
			const sip = this.elapsed % 5200 > 1700 && this.elapsed % 5200 < 3200;
			this.props.fillStyle(0xf2ddb0).fillRect(x + 5, y - (sip ? 24 : 15), 5, 6);
			this.props.fillStyle(0x8fc1c2).fillRect(x + 6, y - (sip ? 24 : 15), 3, 2);
		}
		if (action?.id === 'chair' || action?.id === 'cook') {
			const hand = Math.floor(this.elapsed / 240) % 2;
			this.props.fillStyle(0xe7b487).fillRect(x - 6, y - 16 - hand, 3, 2).fillRect(x + 4, y - 17 + hand, 3, 2);
		}
	}
}
