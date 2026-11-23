import { TILE_SIZE } from './grid';
import { WALL_THICKNESS, BACK_WALL_HEIGHT, passages } from './layout';
import { closestInteraction, interactionApproaches, interactionAt, canInteract } from './interactions';
import { houseWallPixels } from './architecture';
import { findPath, movePlayer, rooms, floorAreas, SPAWN, WORLD_HEIGHT, WORLD_WIDTH, type Point } from './navigation';
import { props, isActivity, type Interaction, type Activity, type StationId } from './room';

interface EngineCallbacks {
	onNearby: (station: Interaction | null) => void;
	onInteract: (station: StationId) => void;
	onActivity: (activity: Activity | null) => void;
	onFrame: (player: Point) => void;
}

async function loadImage(source: string): Promise<HTMLImageElement> {
	const image = new Image();
	image.src = source;
	await image.decode();
	return image;
}

function pixelAtlas(image: HTMLImageElement, size: number): HTMLCanvasElement {
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const context = canvas.getContext('2d');
	if (!context) throw new Error('Canvas is unavailable.');
	context.imageSmoothingEnabled = false;
	context.drawImage(image, 0, 0, size, size);
	return canvas;
}

export async function createWorkshop(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
	const loaded = await Promise.all(['/assets/workshop/materials.webp', '/assets/workshop/furniture.webp', '/assets/workshop/character.webp', '/assets/workshop/home.webp', '/assets/workshop/actions.webp'].map(loadImage));
	const materials = pixelAtlas(loaded[0], 128);
	const furniture = pixelAtlas(loaded[1], 384);
	const character = pixelAtlas(loaded[2], 192);
	const home = pixelAtlas(loaded[3], 384);
	const actions = pixelAtlas(loaded[4], 192);
	canvas.width = WORLD_WIDTH;
	canvas.height = WORLD_HEIGHT;
	const context = canvas.getContext('2d', { alpha: false });
	if (!context) throw new Error('Canvas is unavailable.');
	context.imageSmoothingEnabled = false;
	const background = document.createElement('canvas');
	background.width = WORLD_WIDTH;
	background.height = WORLD_HEIGHT;
	const scene = background.getContext('2d');
	if (!scene) throw new Error('Canvas is unavailable.');
	scene.imageSmoothingEnabled = false;
	scene.fillStyle = '#08070a';
	scene.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
	const shell = houseWallPixels();
	const wallColors = ['#08070a', '#261722', '#794328', '#d99b57', '#a96736'];
	for (let y = 0; y < WORLD_HEIGHT; y++) {
		for (let x = 0; x < WORLD_WIDTH; x++) {
			const depth = shell[y * WORLD_WIDTH + x];
			if (!depth) continue;
			scene.fillStyle = wallColors[depth <= 2 ? 1 : depth <= 4 ? 2 : depth <= 7 ? 3 : 4];
			scene.fillRect(x, y, 1, 1);
		}
	}
	for (const room of rooms) {
		scene.save();
		scene.beginPath();
		scene.rect(room.x + WALL_THICKNESS, room.y + WALL_THICKNESS, room.width - WALL_THICKNESS * 2, BACK_WALL_HEIGHT);
		scene.clip();
		for (let x = room.x + WALL_THICKNESS; x < room.x + room.width - WALL_THICKNESS; x += TILE_SIZE * 2) {
			scene.drawImage(materials, 0, 64, 64, 64, x, room.y + WALL_THICKNESS, TILE_SIZE * 2, BACK_WALL_HEIGHT);
		}
		scene.fillStyle = '#553222';
		scene.fillRect(room.x + WALL_THICKNESS, room.y + WALL_THICKNESS + BACK_WALL_HEIGHT - 4, room.width - WALL_THICKNESS * 2, 4);
		scene.restore();
	}
	scene.save();
	scene.beginPath();
	for (const area of floorAreas) scene.rect(area.x, area.y, area.width, area.height);
	scene.clip();
	for (let y = 0; y < WORLD_HEIGHT; y += 32) {
		for (let x = 0; x < WORLD_WIDTH; x += 32) scene.drawImage(materials, 0, 0, 64, 64, x, y, 32, 32);
	}
	for (const room of rooms) {
		if (room.id === 'kitchen') {
			for (let y = room.y + WALL_THICKNESS + BACK_WALL_HEIGHT; y < room.y + room.height - WALL_THICKNESS; y += 16) {
				for (let x = room.x + WALL_THICKNESS; x < room.x + room.width - WALL_THICKNESS; x += 16) {
					scene.fillStyle = ((x - room.x - WALL_THICKNESS) / 16 + (y - room.y - WALL_THICKNESS - BACK_WALL_HEIGHT) / 16) % 2 ? '#8b967d' : '#c6bc94';
					scene.fillRect(x, y, 16, 16);
					scene.fillStyle = '#e5d9b333';
					scene.fillRect(x + 1, y + 1, 14, 1);
				}
			}
		} else if (room.material === 1) {
			scene.fillStyle = '#3b273326';
			scene.fillRect(room.x + WALL_THICKNESS, room.y + WALL_THICKNESS + BACK_WALL_HEIGHT, room.width - WALL_THICKNESS * 2, room.height - WALL_THICKNESS * 2 - BACK_WALL_HEIGHT);
		}
	}
	const stairway = passages[0];
	for (let y = stairway.y; y < stairway.y + stairway.height; y += TILE_SIZE / 2) {
		scene.fillStyle = '#6b402d';
		scene.fillRect(stairway.x, y, stairway.width, 3);
		scene.fillStyle = '#d99b57';
		scene.fillRect(stairway.x, y, stairway.width, 1);
	}
	scene.restore();
	function drawProp(target: CanvasRenderingContext2D, prop: typeof props[number]) {
		const row = Math.floor(prop.tile / 4);
		const inset = prop.atlas === 'home' ? row === 2 ? 12 : row > 0 ? 8 : 0 : row > 0 ? 3 : 1;
		const offset = inset * prop.size / 96;
		target.drawImage(prop.atlas === 'home' ? home : furniture, prop.tile % 4 * 96 + 1, row * 96 + inset, 94, 96 - inset, prop.x + prop.size / 96, prop.y + offset, prop.size * 94 / 96, prop.size - offset);
	}
	for (const prop of props.filter(item => item.depth === 0)) drawProp(scene, prop);
	const keys = new Set<string>();
	let joystick = { x: 0, y: 0 };
	let player = { ...SPAWN };
	let path: Point[] = [];
	let pending: Interaction | null = null;
	let direction = 0;
	let walkTime = 0;
	let nearby: Interaction | null = null;
	let active: Activity | null = null;
	let activityTime = 0;
	let paused = false;
	let disposed = false;
	let frame = 0;
	let previousTime = 0;
	let lastDraw = 0;
	const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
	let reducedMotion = motion.matches;
	const updateMotion = () => { reducedMotion = motion.matches; };
	motion.addEventListener('change', updateMotion);

	function clearInput() { keys.clear(); joystick = { x: 0, y: 0 }; path = []; pending = null; }
	function stopActivity() {
		if (!active) return;
		active = null;
		callbacks.onActivity(null);
	}
	function activate(target: Interaction) {
		clearInput();
		if (isActivity(target)) {
			active = target;
			activityTime = 0;
			walkTime = 0;
			callbacks.onActivity(target);
		} else callbacks.onInteract(target.id);
	}
	function interact() {
		if (paused) return;
		if (active) stopActivity();
		else if (nearby) activate(nearby);
	}
	function onKeyDown(event: KeyboardEvent) {
		if (paused || event.metaKey || event.ctrlKey || event.altKey || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
		const key = event.key.toLowerCase();
		if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
			event.preventDefault();
			stopActivity();
			keys.add(key);
			path = [];
			pending = null;
		} else if (key === 'escape') { stopActivity(); }
		else if (key === 'e' && !event.repeat) { event.preventDefault(); interact(); }
	}
	function onKeyUp(event: KeyboardEvent) { keys.delete(event.key.toLowerCase()); }
	function visibility() {
		clearInput();
		if (document.hidden) cancelAnimationFrame(frame);
		else if (!paused) { previousTime = 0; frame = requestAnimationFrame(tick); }
	}

	function tick(time: number) {
		if (disposed) return;
		frame = requestAnimationFrame(tick);
		if (time - lastDraw < 1000 / 60) return;
		const elapsed = previousTime ? Math.min((time - previousTime) / 1000, .04) : 0;
		previousTime = time;
		lastDraw = time;
		let velocity = { x: 0, y: 0 };
		if (active) activityTime += elapsed;
		if (!paused && !active) {
			const previousPosition = player;
			velocity = {
				x: Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft')) + joystick.x,
				y: Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup')) + joystick.y,
			};
			if (Math.hypot(velocity.x, velocity.y) < .05 && path.length) {
				const goal = path[0];
				const distance = Math.hypot(goal.x - player.x, goal.y - player.y);
				if (distance <= 64 * elapsed + .2) { player = goal; path.shift(); }
				else velocity = { x: (goal.x - player.x) / distance, y: (goal.y - player.y) / distance };
			}
			const next = movePlayer(player, velocity, elapsed);
			const walking = Math.hypot(next.x - previousPosition.x, next.y - previousPosition.y) > .01;
			if (walking) {
				walkTime += elapsed;
				const dx = next.x - previousPosition.x;
				const dy = next.y - previousPosition.y;
				direction = Math.abs(dx) > Math.abs(dy) ? dx < 0 ? 1 : 2 : dy < 0 ? 3 : 0;
			} else walkTime = 0;
			player = next;
			const nextNearby = closestInteraction(player);
			if (nextNearby?.id !== nearby?.id) { nearby = nextNearby; callbacks.onNearby(nearby); }
			if (!path.length && pending) {
				const target = pending;
				pending = null;
				if (canInteract(target, player)) activate(target);
			}
		}
		context!.drawImage(background, 0, 0);
		if (path.length) {
			const goal = path[path.length - 1];
			context!.strokeStyle = '#f7d99188';
			context!.strokeRect(Math.round(goal.x) - 3, Math.round(goal.y) - 2, 6, 4);
		}
		const layers = props.filter(prop => prop.depth > 0).map(prop => ({ depth: prop.depth, prop }));
		let drawn = false;
		const drawPlayer = () => {
			const x = Math.round(active?.anchor.x ?? player.x);
			const y = Math.round(active?.anchor.y ?? player.y);
			context!.fillStyle = '#160f124d';
			context!.beginPath();
			context!.ellipse(x, y, 8, 2, 0, 0, Math.PI * 2);
			context!.fill();
			if (active) {
				const pose = reducedMotion ? 0 : Math.floor(activityTime * 3) % 4;
				context!.drawImage(actions, pose * 48, active.row * 48, 48, 48, x - 24, y - 43, 48, 48);
				return;
			}
			const pose = walkTime ? Math.floor(walkTime * 8) % 4 : 1;
			context!.drawImage(character, pose * 48, direction * 48, 48, 48, x - 24, y - 43, 48, 48);
		};
		for (const layer of layers.sort((a, b) => a.depth - b.depth)) {
			if (!drawn && !active && player.y < layer.depth) { drawPlayer(); drawn = true; }
			const prop = layer.prop;
			drawProp(context!, prop);
		}
		if (!drawn) drawPlayer();
		if (active?.id === 'sleep') {
			const bed = props.find(prop => prop.id === 'bed');
			if (bed) {
				context!.save();
				context!.beginPath();
				context!.rect(bed.x, Math.round(bed.y + bed.size * .57), bed.size, bed.size);
				context!.clip();
				drawProp(context!, bed);
				context!.restore();
			}
		}
		if (active && !reducedMotion) {
			if (active.id === 'cook') {
				context!.fillStyle = '#f3ebce99';
				for (let i = 0; i < 3; i++) context!.fillRect(active.anchor.x + 12 + Math.round(Math.sin(activityTime * 2 + i) * 3), active.anchor.y - 38 - (Math.floor(activityTime * 9 + i * 5) % 18), 2, 2);
			} else if (active.id === 'sleep') {
				context!.fillStyle = '#ece7c9';
				context!.font = '8px monospace';
				context!.fillText('z', active.anchor.x + 15, active.anchor.y - 43 - Math.floor(activityTime * 3) % 8);
			} else if (active.id === 'watch') {
				context!.fillStyle = '#c1eddb99';
				context!.fillRect(active.anchor.x + 8, active.anchor.y - 32 - Math.floor(activityTime * 5) % 10, 1, 1);
			}
		}
		if (!reducedMotion) {
			context!.fillStyle = '#ffe9ac55';
			for (let i = 0; i < 8; i++) {
				const x = SPAWN.x - TILE_SIZE * 4 + i * 7 + Math.sin(time / 2800 + i) * 6;
				const y = SPAWN.y - TILE_SIZE * 3 + ((time / 80 + i * 19) % 64);
				context!.fillRect(Math.round(x), Math.round(y), 1, 1);
			}
		}
		callbacks.onFrame(active?.anchor ?? player);
		canvas.dataset.activity = active?.id ?? '';
		canvas.dataset.playerX = player.x.toFixed(1);
		canvas.dataset.playerY = player.y.toFixed(1);
	}

	window.addEventListener('keydown', onKeyDown);
	window.addEventListener('keyup', onKeyUp);
	window.addEventListener('blur', clearInput);
	document.addEventListener('visibilitychange', visibility);
	frame = requestAnimationFrame(tick);
	return {
		walkTo(point: Point) {
			if (paused) return;
			stopActivity();
			const target = interactionAt(point);
			if (target && canInteract(target, player)) { activate(target); return; }
			pending = target ?? null;
			path = findPath(player, target ? interactionApproaches(target) : point);
		},
		visit(station: Interaction) {
			if (paused) return;
			stopActivity();
			if (canInteract(station, player)) activate(station);
			else { path = findPath(player, interactionApproaches(station)); pending = station; }
		},
		setJoystick(point: Point) { joystick = point; if (point.x || point.y) { stopActivity(); path = []; pending = null; } },
		setPaused(value: boolean) {
			if (paused === value) return;
			paused = value;
			cancelAnimationFrame(frame);
			if (value) clearInput();
			else if (!document.hidden) { previousTime = 0; frame = requestAnimationFrame(tick); }
		},
		interact,
		dispose() {
			disposed = true;
			cancelAnimationFrame(frame);
			window.removeEventListener('keydown', onKeyDown);
			window.removeEventListener('keyup', onKeyUp);
			window.removeEventListener('blur', clearInput);
			document.removeEventListener('visibilitychange', visibility);
			motion.removeEventListener('change', updateMotion);
		},
	};
}

export type WorkshopEngine = Awaited<ReturnType<typeof createWorkshop>>;
