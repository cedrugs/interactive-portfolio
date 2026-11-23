import { usePortfolioRoute } from '../seo/usePortfolioRoute';
import { Joystick, RotateIcon } from './Controls';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { createWorkshop, type WorkshopEngine } from './engine';
import { stations, activities, type Interaction, type Activity, type StationId } from './room';
import { cameraView, SPAWN, WORLD_HEIGHT, WORLD_WIDTH, type Point } from './navigation';
import { PortfolioPanel } from './PortfolioPanel';

export function Workshop() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const stageRef = useRef<HTMLElement>(null);
	const surfaceRef = useRef<HTMLDivElement>(null);
	const playerRef = useRef({ ...SPAWN });
	const viewportRef = useRef({ width: 0, height: 0 });
	const engineRef = useRef<WorkshopEngine | null>(null);
	const [ready, setReady] = useState(false);
	const [error, setError] = useState(false);
	const [attempt, setAttempt] = useState(0);
	const [nearby, setNearby] = useState<Interaction | null>(null);
	const [activity, setActivity] = useState<Activity | null>(null);
	const [panel, setPanel] = usePortfolioRoute();
	const [portrait, setPortrait] = useState(false);
	const [fullscreenMessage, setFullscreenMessage] = useState('');
	const returnFocus = useRef<HTMLElement | null>(null);

	function updateCamera(player: Point) {
		playerRef.current = player;
		const surface = surfaceRef.current;
		if (!surface) return;
		const view = cameraView(viewportRef.current.width, viewportRef.current.height, player);
		surface.style.width = `${WORLD_WIDTH * view.scale}px`;
		surface.style.height = `${WORLD_HEIGHT * view.scale}px`;
		surface.style.transform = `translate(${view.x}px, ${view.y}px)`;
	}

	useEffect(() => {
		const stage = stageRef.current;
		if (!stage) return;
		const observer = new ResizeObserver(entries => {
			const { width, height } = entries[0].contentRect;
			viewportRef.current = { width, height };
			updateCamera(playerRef.current);
		});
		observer.observe(stage);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		const query = window.matchMedia('(pointer: coarse) and (orientation: portrait)');
		const update = () => setPortrait(query.matches);
		update();
		query.addEventListener('change', update);
		return () => query.removeEventListener('change', update);
	}, []);

	useEffect(() => {
		let cancelled = false;
		let engine: WorkshopEngine | null = null;
		const canvas = canvasRef.current;
		if (!canvas) return;
		setReady(false);
		setError(false);
		createWorkshop(canvas, {
			onNearby: setNearby,
			onActivity: setActivity,
			onFrame: updateCamera,
			onInteract: id => {
				returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
				setPanel(id);
			},
		}).then(instance => {
			if (cancelled) { instance.dispose(); return; }
			engine = instance;
			engineRef.current = instance;
			setReady(true);
		}).catch(() => { if (!cancelled) setError(true); });
		return () => { cancelled = true; engine?.dispose(); engineRef.current = null; };
	}, [attempt, setPanel]);

	useEffect(() => { engineRef.current?.setPaused(Boolean(panel) || portrait); }, [panel, portrait, ready]);

	function openPanel(id: StationId) {
		returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		setPanel(id);
	}
	function closePanel() { setPanel(null); returnFocus.current?.focus({ preventScroll: true }); }
	function walk(event: PointerEvent<HTMLCanvasElement>) {
		if (event.button !== 0 || !ready) return;
		const rect = event.currentTarget.getBoundingClientRect();
		engineRef.current?.walkTo({ x: (event.clientX - rect.left) / rect.width * WORLD_WIDTH, y: (event.clientY - rect.top) / rect.height * WORLD_HEIGHT });
	}
	async function enterFullscreen() {
		try {
			if (document.fullscreenElement) { await document.exitFullscreen(); return; }
			if (!document.documentElement.requestFullscreen) {
				setFullscreenMessage('This browser keeps its toolbar visible. The game already fills the page.');
				return;
			}
			await document.documentElement.requestFullscreen();
			setFullscreenMessage('');
		} catch { setFullscreenMessage('Fullscreen is unavailable here. The game still fills the page.'); return; }
		if (window.matchMedia('(pointer: coarse)').matches) {
			const orientation = screen.orientation as ScreenOrientation & { lock?: (direction: 'landscape') => Promise<void> };
			try { await orientation.lock?.('landscape'); }
			catch { setFullscreenMessage('Turn your phone sideways to play.'); }
		}
	}

	return (
		<main className="workshop-app">
			<section ref={stageRef} className="game-stage" aria-label="Explore Samuel’s workshop">
				<div ref={surfaceRef} className={`world-surface ${ready ? 'is-ready' : ''}`}>
					<canvas ref={canvasRef} width={WORLD_WIDTH} height={WORLD_HEIGHT} onPointerDown={walk} aria-label="Pixel-art workshop. Use arrow keys or WASD to walk, E to interact. Select furniture to explore the portfolio." />
					{ready && <nav className="world-markers" aria-label="Walk to a place">{[...stations, ...activities].map(station => <button key={station.id} type="button" className="station-marker" style={{ left: `${station.marker.x / WORLD_WIDTH * 100}%`, top: `${station.marker.y / WORLD_HEIGHT * 100}%` }} aria-label={`Walk to ${station.object}: ${station.name}`} onClick={() => engineRef.current?.visit(station)}><span className="marker-diamond" aria-hidden="true" /></button>)}</nav>}
				</div>
				{!ready && <div className="loading-state" role="status"><span className="pixel-avatar" aria-hidden="true" /><h2>{error ? 'The room didn’t load.' : 'Opening the workshop…'}</h2><p>{error ? 'You can still browse the portfolio.' : 'Setting out the tools.'}</p>{error && <button className="pixel-button" type="button" onClick={() => setAttempt(value => value + 1)}>Try again</button>}{error && <button className="text-button" type="button" onClick={() => openPanel('projects')}>Open portfolio</button>}</div>}
			</section>
			{ready && !panel && !portrait && <div className="game-controls"><Joystick onChange={point => engineRef.current?.setJoystick(point)} /><button className={`interact-button ${nearby || activity ? 'available' : ''}`} type="button" disabled={!nearby && !activity} onClick={() => engineRef.current?.interact()}><span className="interact-key">E</span><span>{activity ? activity.exit : nearby ? nearby.name : 'Explore'}</span></button></div>}
			{fullscreenMessage && !portrait && <p className="fullscreen-notice" role="status">{fullscreenMessage}</p>}
			{portrait && !panel && <div className="rotate-prompt"><span className="rotate-eyebrow">CEDRIC’S WORKSHOP</span><RotateIcon /><h2>A little more room<br />to explore.</h2><p>Turn your phone sideways.<br />This world is made for landscape.</p><button type="button" className="pixel-button" onClick={enterFullscreen}>Enter fullscreen ↗</button>{fullscreenMessage && <p className="fullscreen-message" role="status">{fullscreenMessage}</p>}<button type="button" className="text-button" onClick={() => openPanel('projects')}>Or go straight to the portfolio →</button></div>}
			<PortfolioPanel active={panel} onChange={setPanel} onClose={closePanel} />
		</main>
	);
}
