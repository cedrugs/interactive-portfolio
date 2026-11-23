import { FarmAmbience } from './farm-ambience';
import Phaser from 'phaser';
import { FARM, FARM_DOOR, FARM_HOUSE, FARM_SPAWN, atFarmDoor, farmBanks, farmCameraZoom, farmGround, farmProps, farmSigns, nearbyFarmSign, moveOnFarm, type FarmSign } from './farm-world';
import { createFarmAnimals, farmAnimalBody, farmAnimalFrame, updateFarmAnimal, type FarmAnimal } from './farm-animals';
import { registerFarmTextures } from './farm-textures';
import { advanceStride, movementFacing, walkingFrame } from './motion';
import type { Facing, Point } from './world';

export interface FarmSignReading { sign: FarmSign; image: string }
export interface FarmCallbacks { door: (near: boolean) => void; sign: (sign: FarmSign | null) => void; read: (reading: FarmSignReading) => void; enter: (avatar: 'male' | 'female') => void; error: (message: string) => void }
export class FarmScene extends Phaser.Scene {
	private ambience?: FarmAmbience;
	private actor?: Phaser.GameObjects.Sprite;
	private shadow?: Phaser.GameObjects.Ellipse;
	private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
	private avatar: 'male' | 'female' = 'male';
	private point = { ...FARM_SPAWN };
	private facing: Facing = 'up';
	private stride = 0;
	private suspended = true;
	private entering = false;
	private fromHouse = false;
	private nearDoor = false;
	private nearSign: FarmSign | null = null;
	private animals: { state: FarmAnimal; sprite: Phaser.GameObjects.Image; shadow: Phaser.GameObjects.Ellipse }[] = [];
	private joystick = { x: 0, y: 0 };
	private callbacks: FarmCallbacks;

	constructor(callbacks: FarmCallbacks) { super('farm-arrival'); this.callbacks = callbacks; }
	create(): void {
		try { registerFarmTextures(this); } catch (error) { this.callbacks.error(error instanceof Error ? error.message : 'The farm could not load.'); return; }
		const ground = document.createElement('canvas');
		ground.width = FARM.width; ground.height = FARM.height;
		const ctx = ground.getContext('2d')!;
		ctx.imageSmoothingEnabled = false;
		ctx.translate(-FARM.x, -FARM.y);
		const grass = this.textures.get('farm-ground-0').getSourceImage() as HTMLCanvasElement;
		for (let y = FARM.y; y < FARM.y + FARM.height; y += 16) for (let x = FARM.x; x < FARM.x + FARM.width; x += 16) {
			const kind = farmGround(x, y);
			ctx.drawImage(this.textures.get(`farm-ground-${kind < 2 ? 0 : kind}`).getSourceImage() as HTMLCanvasElement, x, y);
			if (kind !== 2 && kind !== 4) continue;
			for (let i = 0; i < 16; i += 2) {
				const edge = 1 + Math.abs(i * 7 + x + y) % 3;
				if (farmGround(x - 16, y) < 2) ctx.drawImage(grass, 0, i, edge, 2, x, y + i, edge, 2);
				if (farmGround(x + 16, y) < 2) ctx.drawImage(grass, 16 - edge, i, edge, 2, x + 16 - edge, y + i, edge, 2);
				if (farmGround(x, y - 16) < 2) ctx.drawImage(grass, i, 0, 2, edge, x + i, y, 2, edge);
				if (farmGround(x, y + 16) < 2) ctx.drawImage(grass, i, 16 - edge, 2, edge, x + i, y + 16 - edge, 2, edge);
			}
		}
		if (!this.textures.exists('farm-floor')) this.textures.addCanvas('farm-floor', ground);
		this.add.image(FARM.x, FARM.y, 'farm-floor').setOrigin(0).setDepth(-10000);
		for (const bank of farmBanks) {
			if (bank.height === 24) {
				for (let x = bank.x; x < bank.x + bank.width; x += 32) this.add.image(x + 16, bank.y + 12, 'farm-bank').setDepth(bank.y + 24);
			} else {
				for (let y = bank.y; y < bank.y + bank.height; y += 32) this.add.image(bank.x + 12, y + 16, 'farm-bank').setAngle(bank.x < 0 ? -90 : 90).setDepth(y + 24);
			}
		}
		this.ambience = new FarmAmbience(this);
		for (const prop of farmProps) {
			if (prop.solid && prop.texture !== 'house') this.add.ellipse(prop.x + 3, prop.y, prop.solid.width + 10, 7, 0x26351b, .24).setDepth(-9999);
			const sprite = this.add.image(prop.x, prop.y, `farm-${prop.texture}`).setOrigin(.5, 1).setDepth(prop.texture === 'house' ? FARM_HOUSE.wallBottom : prop.y);
			this.ambience.addFoliage(sprite, prop);
		}
		for (const sign of farmSigns) {
			const board = this.add.graphics().setDepth(sign.y);
			board.fillStyle(0x56391e).fillRect(sign.x - 2, sign.y - 10, 4, 10);
			board.fillStyle(0xbf8641).fillRect(sign.x - 1, sign.y - 10, 2, 9);
			board.fillStyle(0x4d321e).fillRect(sign.x - 8, sign.y - 22, 16, 14);
			board.fillStyle(0xb77b34).fillRect(sign.x - 7, sign.y - 21, 14, 12);
			board.fillStyle(0xedbd66).fillRect(sign.x - 7, sign.y - 21, 14, 1);
			board.fillStyle(0x755025).fillRect(sign.x - 6, sign.y - 19, 12, 9);
			board.fillStyle(0xf8e6b8).fillRect(sign.x - 5, sign.y - 18, 10, 6);
			board.fillStyle(0xfff3d3).fillRect(sign.x - 5, sign.y - 18, 10, 1);
		}
		this.animals = createFarmAnimals().map(state => ({ state, sprite: this.add.image(state.point.x, state.point.y, `farm-${state.kind}-3`).setOrigin(.5, 1).setDepth(state.point.y), shadow: this.add.ellipse(state.point.x, state.point.y, state.kind === 'cow' ? 24 : 12, 4, 0x4d361d, .22).setDepth(-9999) }));
		this.shadow = this.add.ellipse(0, 0, 12, 4, 0x30251d, .32).setDepth(-9999);
		this.actor = this.add.sprite(0, 0, 'guest', 12).setOrigin(.5, 1);
		this.keys = this.input.keyboard?.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E') as Record<string, Phaser.Input.Keyboard.Key> ?? {};
		this.keys.E?.on('down', (_key: Phaser.Input.Keyboard.Key, event: KeyboardEvent) => { if (!event.repeat) this.interact(); });
		this.scale.on('resize', this.resize, this);
		this.game.events.on(Phaser.Core.Events.BLUR, this.resetInput, this);
		this.events.once('shutdown', () => { this.scale.off('resize', this.resize, this); this.game.events.off(Phaser.Core.Events.BLUR, this.resetInput, this); });
		const suspended = this.suspended;
		this.begin(this.avatar, this.fromHouse);
		this.setSuspended(suspended);
	}
	begin(avatar: 'male' | 'female', fromHouse = false): void {
		this.avatar = avatar;
		this.fromHouse = fromHouse;
		this.point = fromHouse ? { x: FARM_DOOR.x, y: FARM_DOOR.y + 32 } : { ...FARM_SPAWN };
		this.facing = fromHouse ? 'down' : 'up'; this.stride = 0; this.entering = false; this.nearDoor = false;
		this.callbacks.door(false);
		this.nearSign = null;
		this.callbacks.sign(null);
		if (!this.actor) return;
		this.actor.setTexture(avatar === 'female' ? 'guest-female' : 'guest', fromHouse ? 0 : 12).setPosition(this.point.x, this.point.y + 2);
		this.resize();
		this.cameras.main.fadeIn(650, 0, 0, 0);
		this.setSuspended(false);
	}
	private resize(): void {
		const camera = this.cameras.main;
		camera.setZoom(farmCameraZoom(this.scale.width, this.scale.height)).setBounds(FARM.x, FARM.y, FARM.width, FARM.height);
		if (this.actor) camera.startFollow(this.actor, true, 1, 1, 0, 84);
	}
	private resetInput(): void { this.joystick = { x: 0, y: 0 }; this.input.keyboard?.resetKeys(); }
	setSuspended(value: boolean): void {
		this.suspended = value;
		if (this.input.keyboard) {
			this.input.keyboard.enabled = !value;
			if (value) this.input.keyboard.disableGlobalCapture(); else this.input.keyboard.enableGlobalCapture();
		}
		if (value) this.resetInput();
	}
	setJoystick(point: Point): void { this.joystick = point; }
	interact(): void {
		if (this.suspended || this.entering) return;
		if (!atFarmDoor(this.point)) {
			const sign = nearbyFarmSign(this.point);
			if (sign) {
				this.setSuspended(true);
				const art = this.textures.get(`farm-${sign.icon}`).getSourceImage() as HTMLCanvasElement;
				this.callbacks.read({ sign, image: art.toDataURL() });
			}
			return;
		}
		this.entering = true;
		this.cameras.main.fadeOut(250, 0, 0, 0);
		this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.callbacks.enter(this.avatar));
	}
	update(_time: number, delta: number): void {
		if (!this.actor || this.suspended || this.entering) return;
		this.ambience?.update(delta);
		const herd = this.animals.map(animal => animal.state);
		for (const animal of this.animals) {
			updateFarmAnimal(animal.state, delta, this.point, herd);
			const { point, right, kind } = animal.state;
			animal.sprite.setPosition(Math.round(point.x), Math.round(point.y)).setDepth(point.y).setFlipX(right && animal.state.phase !== 'idle').setTexture(`farm-${kind}-${farmAnimalFrame(animal.state)}`);
			animal.shadow.setPosition(Math.round(point.x), Math.round(point.y));
		}
		const down = (key: string) => this.keys[key]?.isDown ? 1 : 0;
		let dx = down('D') + down('RIGHT') - down('A') - down('LEFT') + this.joystick.x;
		let dy = down('S') + down('DOWN') - down('W') - down('UP') + this.joystick.y;
		const length = Math.hypot(dx, dy);
		if (length > 1) { dx /= length; dy /= length; }
		const next = moveOnFarm(this.point, dx * 64 * Math.min(delta, 50) / 1000, dy * 64 * Math.min(delta, 50) / 1000, herd.map(animal => farmAnimalBody(animal)));
		const distance = Math.hypot(next.x - this.point.x, next.y - this.point.y);
		this.facing = movementFacing(dx, dy, this.facing);
		this.stride = advanceStride(this.stride, distance);
		this.point = next;
		this.actor.setPosition(Math.round(next.x), Math.round(next.y) + 2).setDepth(next.y).setFrame(walkingFrame(this.facing, this.stride, distance > .01));
		this.shadow?.setPosition(Math.round(next.x), Math.round(next.y) + 1);
		const near = atFarmDoor(next);
		if (near !== this.nearDoor) { this.nearDoor = near; this.callbacks.door(near); }
		const sign = nearbyFarmSign(next);
		if (sign !== this.nearSign) { this.nearSign = sign; this.callbacks.sign(sign); }
		if (import.meta.env.DEV) { this.game.canvas.dataset.farmX = next.x.toFixed(2); this.game.canvas.dataset.farmY = next.y.toFixed(2); }
	}
}
