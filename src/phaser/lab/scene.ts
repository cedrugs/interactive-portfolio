import { FarmScene, type FarmCallbacks } from './FarmScene';
import Phaser from 'phaser';
import { Visitor } from './visitor';
import { advanceReaction, currentReaction, moveCharacter, type ReactionState } from './character-collision';
import { drawReaction } from './reaction-bubble';
import { canTalkToSam, initialTour, tourStops, type TourState } from './tour';
import { furnishFloor, lightRoom } from './atmosphere';
import { buildShell } from './room-shell';
import { activityFrame, blanketLift } from './activity-motion';
import { advanceStride, movementFacing, movementHold, walkingFrame } from './motion';
import { atHouseExit, HOUSE_RETURN, solidWalls } from './architecture';
import { art, registerTextures } from './textures';
import { actions, approaches, FOOT, furnishings, nearbyAction, obstacles, placement, route, safeExit, SPAWN, TILE_SIZE, WORLD, validateWorld, walkable, type Action, type ActionId, type Facing, type Point } from './world';

export interface LabState { nearExit?: boolean; nearby: ActionId | null; active: ActionId | null; tour: TourState | null }
export interface LabFrame {
	player: Point;
	sam: Point;
	reaction: string;
	zoom: number;
	markers: { id: ActionId; x: number; y: number }[];
}
export interface LabCallbacks {
	exit: () => void;
	dialogueAdvance: () => void;
	ready: (portraits: { sam: string; male: string; female: string }) => void;
	error: (message: string) => void;
	state: (state: LabState) => void;
	frame: (frame: LabFrame) => void;
	panel: (id: 'projects' | 'about' | 'contact') => void;
}

export class WorkshopScene extends Phaser.Scene {
	private callbacks: LabCallbacks;
	private feet!: Phaser.GameObjects.Rectangle;
	private body!: Phaser.Physics.Arcade.Body;
	private actor!: Phaser.GameObjects.Sprite;
	private shadow!: Phaser.GameObjects.Ellipse;
	private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
	private direction: Facing = 'down';
	private stride = 0;
	private motionIdleMs = 80;
	private lastFeet = { ...SPAWN };
	private path: Point[] = [];
	private destination: Action | null = null;
	private activity: Action | null = null;
	private savedExit = { ...SPAWN };
	private lastState = '';
	private joystick = { x: 0, y: 0 };
	private suspended = false;
	private loaded = false;
	private leaving = false;
	private debug?: Phaser.GameObjects.Graphics;
	private tvLight!: Phaser.GameObjects.Graphics;
	private steam!: Phaser.GameObjects.Graphics;
	private ambience!: Phaser.GameObjects.Graphics;
	private blanket!: Phaser.GameObjects.Image;
	private activityElapsed = 0;
	private blanketBaseY = 0;
	private visitor!: Visitor;
	private tour: TourState | null = null;
	private reaction!: Phaser.GameObjects.Graphics;
	private reactionState: ReactionState = { blockedMs: 0, heartMs: 0 };

	constructor(callbacks: LabCallbacks) {
		super('workshop-lab');
		this.callbacks = callbacks;
	}

	preload(): void {
		for (const sheet of ['house', 'trees', 'props', 'ground', 'buildings', 'animals', 'terrain']) this.load.image(`farm-${sheet}-source`, `/assets/workshop-lab/farm-${sheet}${sheet === 'house' ? '-v2' : ''}.png`);
		this.load.image('furniture-source', '/assets/workshop-lab/furniture.png');
		this.load.image('activities-source', '/assets/workshop-lab/sam-activities.png');
		this.load.image('guest-female-source', '/assets/workshop-lab/guest-female-walk-clean.png');
		this.load.image('guest-source', '/assets/workshop-lab/guest-walk.png');
		this.load.image('walk-source', '/assets/workshop-lab/sam-walk.png');
		this.load.image('character-source', '/assets/workshop-lab/character.png');
		this.load.image('house-source', '/assets/workshop-lab/house.png');
		this.load.image('decor-source', '/assets/workshop-lab/decor.png');
		this.load.image('chair-north-source', '/assets/workshop-lab/chair-north.png');
		this.load.on('loaderror', () => this.callbacks.error('The artwork did not load. Reload to try again.'));
	}

	create(): void {
		try {
			validateWorld();
			registerTextures(this);
			this.buildRoom();
		} catch (error) {
			this.callbacks.error(error instanceof Error ? error.message : 'The room could not start.');
			return;
		}
		const walls = this.physics.add.staticGroup();
		for (const box of [...obstacles, ...solidWalls()]) {
			const obstacle = this.add.rectangle(box.x + box.width / 2, box.y + box.height / 2, box.width, box.height).setVisible(false);
			this.physics.add.existing(obstacle, true);
			walls.add(obstacle);
		}
		this.feet = this.add.rectangle(SPAWN.x, SPAWN.y, FOOT.width, FOOT.height).setVisible(false);
		this.physics.add.existing(this.feet);
		if (!(this.feet.body instanceof Phaser.Physics.Arcade.Body)) throw new Error('Missing player body');
		this.body = this.feet.body;
		this.body.setSize(FOOT.width, FOOT.height).setMaxVelocity(64, 64);
		this.physics.add.collider(this.feet, walls);
		this.shadow = this.add.ellipse(SPAWN.x, SPAWN.y, 12, 4, 0x30251d, .32);
		this.actor = this.add.sprite(SPAWN.x, SPAWN.y + 2, 'walk', 0).setOrigin(.5, 1).setAlpha(1).setBlendMode(Phaser.BlendModes.NORMAL);
		this.reaction = this.add.graphics().setDepth(1100);
		this.visitor = new Visitor(this);
		const keyboard = this.input.keyboard;
		if (keyboard) {
			this.keys = keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,ESC') as Record<string, Phaser.Input.Keyboard.Key>;
			keyboard.on('keydown-E', (event: KeyboardEvent) => { if (!event.repeat) this.interact(); });
			keyboard.on('keydown-ESC', () => { if (!this.tour) this.stopActivity(); else if (this.tour.phase === 'complete') this.visitor.stop(); });
			if (import.meta.env.DEV) keyboard.on('keydown-F2', () => this.toggleDebug());
		}
		this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, objects: Phaser.GameObjects.GameObject[]) => {
			if (objects.length || this.suspended || this.tour) return;
			const point = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
			this.walkTo(point);
		});
		this.scale.on('resize', this.resizeCamera, this);
		this.game.events.on(Phaser.Core.Events.BLUR, this.resetInput, this);
		this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
			this.events.off(Phaser.Scenes.Events.POST_UPDATE, this.syncVisuals, this);
			this.scale.off('resize', this.resizeCamera, this);
			this.game.events.off(Phaser.Core.Events.BLUR, this.resetInput, this);
		});
		this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.syncVisuals, this);
		this.cameras.main.startFollow(this.actor, true, .12, .12, 0, 26);
		this.resizeCamera();
		this.cameras.main.centerOn(SPAWN.x, SPAWN.y - (this.scale.height < 500 ? 12 : 24));
		this.loaded = true;
		this.callbacks.ready({ sam: this.textures.getBase64('walk', 0), male: this.textures.getBase64('guest', 0), female: this.textures.getBase64('guest-female', 0) });
	}

	private buildRoom(): void {
		buildShell(this);
		furnishFloor(this);
		for (const item of furnishings) {
			const area = placement(item);
			const sprite = this.add.image(area.x + area.width / 2, area.y + area.height, item.texture).setOrigin(.5, 1).setDepth(item.layer === 'wall' ? -50 : area.y + area.height);
			if (item.frontCrop) {
				const crop = item.frontCrop;
				this.add.image(area.x + area.width / 2, area.y + area.height, item.texture).setOrigin(.5, 1).setCrop(crop.x, crop.y, crop.width, crop.height).setDepth(area.y + area.height + .5);
			}
			if (item.action) {
				sprite.setInteractive({ pixelPerfect: true, alphaTolerance: 200, useHandCursor: true });
				sprite.on('pointerdown', () => this.visit(item.action!));
			}
		}
		const bed = placement(furnishings.find(item => item.id === 'bed')!);
		this.blanketBaseY = bed.y + bed.height;
		this.blanket = this.add.image(bed.x + bed.width / 2, bed.y + bed.height, 'bed').setOrigin(.5, 1).setCrop(14, 28, 20, 16).setDepth(bed.y + bed.height + .6).setVisible(false);
		this.ambience = this.add.graphics().setDepth(190);
		lightRoom(this);
		this.steam = this.add.graphics().setDepth(500).setVisible(false);
		this.tvLight = this.add.graphics().setDepth(191).setVisible(false);
		this.tvLight.fillStyle(0x8cc6b3, .12).fillPoints([{ x: 122, y: 161 }, { x: 122, y: 184 }, { x: 80, y: 194 }, { x: 80, y: 148 }], true);
	}

	private syncVisuals(): void {
		if (!this.loaded) return;
		const pose = this.activity?.pose;
		const target = this.activity ? furnishings.find(item => item.id === this.activity?.objects[0]) : undefined;
		const area = target ? placement(target) : undefined;
		const depth = pose?.depthOffset !== undefined && area ? area.y + area.height + pose.depthOffset : this.feet.y + 1;
		this.actor.setPosition(Math.round(this.feet.x), Math.round(this.feet.y + 2)).setDepth(depth);
		this.shadow.setPosition(this.feet.x, this.feet.y + 1).setDepth(this.feet.y).setVisible(!this.activity);
		drawReaction(this.reaction, this.tour && this.tour.phase !== 'dialogue' ? currentReaction(this.reactionState, this.tour.phase === 'waiting') : null, this.feet.x, this.feet.y);
	}

	private resizeCamera(): void {
		this.cameras.main.setZoom(this.scale.height < 500 ? 3 : 4).setRoundPixels(true).setFollowOffset(0, this.scale.height < 500 ? 14 : 26);
	}

	private resetInput(): void {
		this.input.keyboard?.resetKeys();
		this.joystick = { x: 0, y: 0 };
		this.body?.setVelocity(0, 0);
		if (!this.tour) { this.path = []; this.destination = null; }
	}

	setSuspended(value: boolean): void {
		this.suspended = value;
		if (this.input.keyboard) {
			this.input.keyboard.enabled = !value;
			if (value) this.input.keyboard.disableGlobalCapture();
			else this.input.keyboard.enableGlobalCapture();
		}
		if (value) this.resetInput();
	}

	setJoystick(point: Point): void { this.joystick = point; }

	walkTo(target: Point): void {
		if (!this.loaded || this.suspended || !walkable(target)) return;
		this.stopActivity();
		this.destination = null;
		this.path = route(this.feet, [target]);
	}

	visit(id: ActionId, fromTour = false): void {
		if (!this.loaded || this.suspended) return;
		const action = actions.find(action => action.id === id);
		if (!action) return;
		if (this.tour && !fromTour) {
			if (action.panel) this.callbacks.panel(action.panel);
			else if (this.tour.phase === 'complete') this.visitor.visit(action);
			return;
		}
		this.stopActivity();
		const targets = approaches(action).sort((a, b) => Phaser.Math.Distance.Between(this.feet.x, this.feet.y, a.x, a.y) - Phaser.Math.Distance.Between(this.feet.x, this.feet.y, b.x, b.y));
		this.path = route(this.feet, targets);
		this.destination = this.path.length ? action : null;
	}

	interact(): void {
		if (!this.loaded || this.suspended || this.leaving) return;
		if (this.tour && this.tour.phase !== 'dialogue' && !this.visitor.activity && atHouseExit(this.visitor.point)) {
			this.leaving = true;
			this.setSuspended(true);
			this.cameras.main.fadeOut(250, 0, 0, 0);
			this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.callbacks.exit());
			return;
		}
		if (this.tour) {
			if (this.tour.phase === 'dialogue') this.callbacks.dialogueAdvance();
			else if (canTalkToSam(this.visitor.point, this.feet, this.tour.phase)) { this.tour.phase = 'dialogue'; this.direction = movementFacing(this.visitor.point.x - this.feet.x, this.visitor.point.y - this.feet.y, this.direction); }
			else if (this.tour.phase === 'complete') {
				if (this.visitor.activity) this.visitor.stop();
				else {
					const action = nearbyAction(this.visitor.point);
					if (action?.panel) this.callbacks.panel(action.panel);
					else if (action) this.visitor.start(action);
				}
			}
			return;
		}
		if (this.activity) { this.stopActivity(); return; }
		const action = nearbyAction(this.feet);
		if (action) this.startActivity(action);
	}

	private startActivity(action: Action): void {
		this.path = [];
		this.destination = null;
		this.body.setVelocity(0, 0);
		if (this.tour) { this.tour.phase = 'waiting'; this.tour.canTalk = false; return; }
		if (action.panel) { if (!this.tour) this.callbacks.panel(action.panel); return; }
		if (!action.pose) return;
		this.savedExit = { x: this.feet.x, y: this.feet.y };
		this.activity = action;
		this.activityElapsed = 0;
		this.body.enable = false;
		this.feet.setPosition(action.pose.point.x, action.pose.point.y);
		this.direction = action.pose.facing;
		this.actor.anims.stop();
		this.actor.setTexture(action.pose.texture ?? 'actor', action.pose.frame).setFlipX(action.pose.flipX ?? false);
		this.blanket.setVisible(action.id === 'sleep');
		this.steam.setVisible(action.id === 'cook');
		this.tvLight.setVisible(action.id === 'theater');
	}

	private stopActivity(): void {
		if (!this.activity) return;
		const exit = safeExit(this.savedExit, this.activity);
		this.activity = null;
		this.activityElapsed = 0;
		this.blanket.setVisible(false);
		this.ambience.clear();
		this.actor.setTexture('actor', 0).setFlipX(false);
		this.steam.setVisible(false);
		this.body.enable = true;
		this.body.reset(exit.x, exit.y);
		this.lastFeet = { ...exit };
		this.stride = 0;
		this.tvLight.setVisible(false);
	}


	resumeVisit(): void {
		if (!this.loaded || !this.tour) return;
		this.visitor.relocate(HOUSE_RETURN);
		this.leaving = false;
		this.reactionState = { blockedMs: 0, heartMs: 0 };
		this.cameras.main.fadeIn(250, 0, 0, 0);
		this.setSuspended(false);
	}

	beginTour(index = 0, avatar: 'male' | 'female' = 'male', complete = false): void {
		if (!this.loaded) return;
		this.stopActivity();
		this.path = [];
		this.destination = null;
		this.body.reset(SPAWN.x, SPAWN.y);
		this.lastFeet = { ...SPAWN };
		this.direction = 'down';
		this.body.moves = false;
		this.reactionState = { blockedMs: 0, heartMs: 0 };
		this.leaving = false;
		this.visitor.reset(avatar);
		this.visitor.relocate(HOUSE_RETURN);
		this.tour = { ...initialTour, index: Math.max(0, Math.min(tourStops.length - 1, index)) };
		this.cameras.main.startFollow(this.visitor.sprite, true, .12, .12, 0, this.scale.height < 500 ? 14 : 26);
		this.cameras.main.fadeIn(600, 9, 8, 11);
		if (complete) this.tour.phase = 'complete';
		else if (index > 0) this.goToTourStop();
	}

	advanceTour(): void {
		if (!this.tour || this.suspended || this.tour.phase !== 'dialogue') return;
		if (this.tour.index === tourStops.length - 1) {
			this.tour.phase = 'complete';
			this.tour.canTalk = false;
			this.cameras.main.startFollow(this.visitor.sprite, true, .12, .12, 0, 26);
			return;
		}
		this.tour.index++;
		this.cameras.main.startFollow(this.visitor.sprite, true, .12, .12, 0, this.scale.height < 500 ? 14 : 26);
		this.goToTourStop();
	}

	private goToTourStop(): void {
		if (!this.tour) return;
		const action = tourStops[this.tour.index].action;
		this.tour.phase = 'walking';
		if (action) this.visit(action, true);
	}

	private toggleDebug(): void {
		if (this.debug) { this.debug.destroy(); this.debug = undefined; return; }
		this.debug = this.add.graphics().setDepth(10000);
		this.debug.lineStyle(1, 0xffffff, .16);
		for (let x = 0; x <= WORLD.width; x += TILE_SIZE) this.debug.lineBetween(x, 0, x, WORLD.height);
		for (let y = 0; y <= WORLD.height; y += TILE_SIZE) this.debug.lineBetween(0, y, WORLD.width, y);
		for (const box of obstacles) this.debug.lineStyle(1, 0xff6f73, .85).strokeRect(box.x, box.y, box.width, box.height);
		for (const action of actions) for (const point of approaches(action)) this.debug.fillStyle(0x7aeea8).fillRect(point.x, point.y, 1, 1);
	}

	update(_time: number, delta: number): void {
		if (!this.loaded) return;
		let dx = 0, dy = 0;
		if (!this.suspended) {
			dx = Number(this.keys.D?.isDown || this.keys.RIGHT?.isDown) - Number(this.keys.A?.isDown || this.keys.LEFT?.isDown) + this.joystick.x;
			dy = Number(this.keys.S?.isDown || this.keys.DOWN?.isDown) - Number(this.keys.W?.isDown || this.keys.UP?.isDown) + this.joystick.y;
			if (this.tour) {
				this.visitor.update(delta, { x: dx, y: dy }, this.tour.phase === 'dialogue', this.feet);
				this.tour.canTalk = canTalkToSam(this.visitor.point, this.feet, this.tour.phase);
				dx = 0; dy = 0;
			} else if (dx || dy) { this.stopActivity(); this.path = []; this.destination = null; }
			if (!dx && !dy && this.path.length) {
				const target = this.path[0];
				const distance = Phaser.Math.Distance.Between(this.feet.x, this.feet.y, target.x, target.y);
				const nearTarget = distance < Math.max(1.1, 64 * Math.min(delta, 34) / 1000);
				const arrival = this.tour && nearTarget ? moveCharacter(this.feet, { x: target.x - this.feet.x, y: target.y - this.feet.y }, this.visitor.point) : null;
				const canArrive = !arrival || Math.hypot(arrival.point.x - target.x, arrival.point.y - target.y) < .001;
				if (nearTarget && canArrive) {
					this.body.reset(target.x, target.y);
					this.path.shift();
					if (!this.path.length && this.destination) this.startActivity(this.destination);
				} else if (distance > .001) { dx = (target.x - this.feet.x) / distance; dy = (target.y - this.feet.y) / distance; }
			}
		}
		const magnitude = Math.hypot(dx, dy);
		if (this.tour) {
			const step = 64 * Math.min(delta, 34) / 1000 / Math.max(1, magnitude);
			const movement = moveCharacter(this.feet, { x: dx * step, y: dy * step }, this.visitor.point);
			this.body.reset(movement.point.x, movement.point.y);
			if (!this.suspended) {
				const walking = this.tour.phase === 'walking' && this.path.length > 0;
				this.reactionState = advanceReaction(this.reactionState, { walking, blocked: movement.blockedByCharacter }, delta);
			}
		} else this.body.setVelocity(dx / Math.max(1, magnitude) * 64, dy / Math.max(1, magnitude) * 64);
		if (!this.activity) {
			const distance = Math.hypot(this.feet.x - this.lastFeet.x, this.feet.y - this.lastFeet.y);
			this.direction = movementFacing(dx, dy, this.direction);
			const motion = movementHold(this.motionIdleMs, distance, delta, !this.suspended && (magnitude > 0 || this.path.length > 0));
			this.motionIdleMs = motion.idleMs;
			const walking = motion.moving;
			if (walking) this.stride = advanceStride(this.stride, distance);
			else if (!magnitude && !this.path.length) this.stride = 0;
			this.actor.setTexture('walk', walkingFrame(this.direction, this.stride, walking));
		}
		this.lastFeet = { x: this.feet.x, y: this.feet.y };

		if (this.activity && !this.suspended) this.activityElapsed += Math.min(delta, 100);
		const activityTime = this.tour ? this.visitor.elapsed : this.activityElapsed;
		const ambientActivity = this.tour ? this.visitor.activity : this.activity;
		if (this.tour) { this.blanket.setVisible(ambientActivity?.id === 'sleep'); this.steam.setVisible(ambientActivity?.id === 'cook'); this.tvLight.setVisible(ambientActivity?.id === 'theater'); }
		const frame = this.activity ? activityFrame(this.activity.id, activityTime) : null;
		if (frame !== null) this.actor.setFrame(frame);
		this.blanket.setY(this.blanketBaseY - blanketLift(activityTime));
		this.tvLight.setAlpha(.75 + Math.sin(activityTime / 600) * .2);
		this.ambience.clear();
		if (ambientActivity?.id === 'aquarium') {
			for (let i = 0; i < 3; i++) {
				const progress = (activityTime / 2400 + i / 3) % 1;
				this.ambience.fillStyle(0xd6ece4, .55 * (1 - progress)).fillRect(61 + i * 11 + Math.round(Math.sin(progress * 6)), 82 - Math.round(progress * 15), 1, 1);
			}
		}
		if (ambientActivity?.id === 'cook') {
			this.steam.clear();
			for (let i = 0; i < 3; i++) {
				const progress = (activityTime / 1300 + i / 3) % 1;
				this.steam.fillStyle(0xf3e4c8, (1 - progress) * .55).fillRect(415 + Math.round(Math.sin(progress * 5 + i) * 3), 278 - Math.round(progress * 14), 2, 2);
			}
		}

		const state: LabState = { nearExit: Boolean(this.tour && this.tour.phase !== 'dialogue' && !this.visitor.activity && atHouseExit(this.visitor.point)), nearby: nearbyAction(this.tour ? this.visitor.point : this.feet)?.id ?? null, active: (this.tour ? this.visitor.activity : this.activity)?.id ?? null, tour: this.tour ? { ...this.tour } : null };
		const signature = `${state.nearExit}:${state.nearby}:${state.active}:${state.tour?.index}:${state.tour?.phase}:${state.tour?.canTalk}`;
		if (signature !== this.lastState) { this.lastState = signature; this.callbacks.state(state); }
		const camera = this.cameras.main;
		const markers = actions.map(action => {
			const item = furnishings.find(item => item.id === action.objects[0])!;
			const box = placement(item);
			const height = art.find(art => art.key === item.texture)?.height ?? 32;
			const x = box.x + box.width / 2;
			const y = box.y + box.height - height - 6;
			return { id: action.id, x: (x - camera.scrollX - camera.width / 2) * camera.zoom + camera.width / 2, y: (y - camera.scrollY - camera.height / 2) * camera.zoom + camera.height / 2 };
		});
		this.callbacks.frame({ sam: { x: this.feet.x, y: this.feet.y }, reaction: this.tour?.phase === 'dialogue' ? '' : currentReaction(this.reactionState, this.tour?.phase === 'waiting') ?? '', player: this.tour ? { ...this.visitor.point } : { x: this.feet.x, y: this.feet.y }, zoom: camera.zoom, markers });
	}
}

export function startGame(parent: HTMLElement, callbacks: LabCallbacks, farmCallbacks: FarmCallbacks): { game: Phaser.Game; scene: WorkshopScene; farm: FarmScene } {
	const scene = new WorkshopScene(callbacks);
	const farm = new FarmScene(farmCallbacks);
	const game = new Phaser.Game({
		type: Phaser.AUTO,
		parent,
		backgroundColor: '#09080b',
		banner: false,
		pixelArt: true,
		roundPixels: true,
		antialias: false,
		scale: { mode: Phaser.Scale.RESIZE, width: parent.clientWidth, height: parent.clientHeight },
		physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, fps: 60, fixedStep: true, debug: false } },
		input: { activePointers: 3 },
		audio: { noAudio: true },
		scene: [scene, farm],
	});
	return { game, scene, farm };
}
