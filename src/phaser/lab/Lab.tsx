import { usePortfolioRoute } from '../../seo/usePortfolioRoute';
import { StudioSplash } from '../../game/StudioSplash';
import { OpeningStory } from './OpeningStory';
import { FarmSignPanel } from './FarmSignPanel';
import type { FarmSignReading } from './FarmScene';
import type { FarmSign } from './farm-world';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Joystick, RotateIcon } from '../../game/Controls';
import { PortfolioPanel } from '../../game/PortfolioPanel';
import { actions, type ActionId } from './world';
import type { LabState, startGame } from './scene';
import './lab.css';
import { StoryScreen } from './StoryScreen';
import { DialogueBox } from './DialogueBox';
import { parseTourSave, tourStops, visitorName } from './tour';

export function Lab() {
	const dialogueInput = useRef<(() => void) | null>(null);
	const host = useRef<HTMLDivElement>(null);
	const engine = useRef<ReturnType<typeof startGame> | null>(null);
	const visit = useRef({ started: false, stop: 0, complete: false, avatar: 'male' as 'male' | 'female', name: 'Guest' });
	const markers = useRef(new Map<ActionId, HTMLButtonElement>());
	const [state, setState] = useState<LabState>({ nearby: null, active: null, tour: null });
	const [ready, setReady] = useState(false);
	const [booted, setBooted] = useState(false);
	const finishBoot = useCallback(() => setBooted(true), []);
	const showSplash = !booted || !ready;
	const [error, setError] = useState('');
	const [panel, setPanel] = usePortfolioRoute();
	const [portrait, setPortrait] = useState(false);
	const [attempt, setAttempt] = useState(0);
	const panelFocus = useRef<HTMLElement | null>(null);
	const [phase, setPhase] = useState<'title' | 'create' | 'intro' | 'farm' | 'playing'>('title');
	const [nearDoor, setNearDoor] = useState(false);
	const [nearSign, setNearSign] = useState<FarmSign | null>(null);
	const [readingSign, setReadingSign] = useState<FarmSignReading | null>(null);
	const closeSign = useCallback(() => setReadingSign(null), []);
	const [name, setName] = useState('');
	const [avatar, setAvatar] = useState<'male' | 'female'>('male');
	const [portraits, setPortraits] = useState({ sam: '', male: '', female: '' });
	const [tourPaused, setTourPaused] = useState(false);
	const [saved, setSaved] = useState<number | null>(() => { try { return parseTourSave(localStorage.getItem('workshop-visit-v1')); } catch { return null; } });
	const title = useCallback(() => setPhase('title'), []);
	const paused = Boolean(panel) || Boolean(readingSign) || portrait || (phase !== 'playing' && phase !== 'farm') || tourPaused;
	const pauseRef = useRef(paused);

	useEffect(() => {
		const media = matchMedia('(orientation: portrait) and (pointer: coarse), (max-width: 600px) and (orientation: portrait)');
		const update = () => setPortrait(media.matches);
		update();
		media.addEventListener('change', update);
		return () => media.removeEventListener('change', update);
	}, []);

	useEffect(() => {
		let disposed = false;
		let instance: ReturnType<typeof startGame> | null = null;
		const element = host.current;
		if (!element) return;
		setReady(false);
		setError('');
		import('./scene').then(({ startGame }) => {
			if (disposed) return;
			instance = startGame(element, {
				exit: () => {
					if (disposed) return;
					const current = engine.current;
					current?.scene.setSuspended(true);
					current?.game.scene.sleep('workshop-lab');
					current?.farm.begin(visit.current.avatar, true);
					current?.game.scene.run('farm-arrival');
					setTourPaused(false);
					setPhase('farm');
					try { localStorage.setItem('workshop-visit-v1', JSON.stringify({ version: 1, ...visit.current, location: 'farm' })); } catch { /* best effort */ }
				},
				dialogueAdvance: () => dialogueInput.current?.(),
				ready: assets => {
					if (disposed) return;
					setPortraits(assets);
					setReady(true);
					engine.current?.scene.setSuspended(pauseRef.current);
					const canvas = element.querySelector('canvas');
					canvas?.setAttribute('aria-label', 'Sam’s Valley. WASD or the joystick moves your guest. Press E at the front door to enter, or near Sam to talk.');
				},
				error: message => { if (!disposed) setError(message); },
				state: value => { if (!disposed) { if (value.tour) { visit.current.stop = value.tour.index; visit.current.complete = value.tour.phase === 'complete'; } setState(value); } },
				panel: id => {
					panelFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
					setPanel(id);
				},
				frame: frame => {
					for (const marker of frame.markers) {
						const button = markers.current.get(marker.id);
						if (button) { button.style.left = `${Math.round(marker.x)}px`; button.style.top = `${Math.round(marker.y)}px`; }
					}
					if (import.meta.env.DEV) {
						element.dataset.playerX = frame.player.x.toFixed(2);
						element.dataset.playerY = frame.player.y.toFixed(2);
						element.dataset.zoom = String(frame.zoom);
						element.dataset.samX = frame.sam.x.toFixed(2);
						element.dataset.samY = frame.sam.y.toFixed(2);
						element.dataset.reaction = frame.reaction;
					}
				},
			}, {
				door: near => { if (!disposed) setNearDoor(near); },
				sign: sign => { if (!disposed) setNearSign(sign); },
				read: reading => { if (!disposed) setReadingSign(reading); },
				error: message => { if (!disposed) setError(message); },
				enter: selected => {
					if (disposed) return;
					const current = engine.current;
					current?.farm.setSuspended(true);
					current?.game.scene.sleep('farm-arrival');
					current?.game.scene.wake('workshop-lab');
					current?.scene.setSuspended(false);
					if (visit.current.started) current?.scene.resumeVisit();
					else { current?.scene.beginTour(visit.current.stop, selected, visit.current.complete); visit.current.started = true; }
					setPhase('playing');
				},
			});
			engine.current = instance;
		}).catch(() => { if (!disposed) setError('The game could not start. Please reload.'); });
		return () => { disposed = true; instance?.game.destroy(true); engine.current = null; };
	}, [attempt, setPanel]);

	useEffect(() => {
		pauseRef.current = paused;
		engine.current?.scene.setSuspended(paused || phase !== 'playing');
		engine.current?.farm.setSuspended(paused || phase !== 'farm');
	}, [paused, ready, phase]);

	useEffect(() => {
		if (phase !== 'playing' || (state.tour?.phase !== 'dialogue' && state.tour?.phase !== 'waiting' && state.tour?.phase !== 'complete')) return;
		try { localStorage.setItem('workshop-visit-v1', JSON.stringify({ version: 1, location: 'house', stop: state.tour.index, avatar, name: visitorName(name), complete: state.tour.phase === 'complete' })); } catch { /* best effort */ }
	}, [state.tour?.phase, state.tour?.index, avatar, name, phase]);

	function arriveAtFarm(selected: 'male' | 'female' = avatar, guestName = name, resume = false) {
		if (!resume) visit.current = { started: false, stop: 0, complete: false, avatar: selected, name: visitorName(guestName) };
		setTourPaused(false);
		setPhase('farm');
		engine.current?.scene.setSuspended(true);
		engine.current?.game.scene.sleep('workshop-lab');
		engine.current?.farm.begin(selected);
		engine.current?.game.scene.run('farm-arrival');
		try { localStorage.setItem('workshop-visit-v1', JSON.stringify({ version: 1, ...visit.current, location: 'farm' })); } catch { /* best effort */ }
	}

	function returnToTitle() {
		try { setSaved(parseTourSave(localStorage.getItem('workshop-visit-v1'))); } catch { /* best effort */ }
		setPhase('title');
	}

	function continueVisit() {
		let selected: 'male' | 'female' = 'male';
		let complete = false;
		let location = 'house';
		let guestName = 'Guest';
		try {
			const value: unknown = JSON.parse(localStorage.getItem('workshop-visit-v1') ?? 'null');
			if (value && typeof value === 'object') {
				if ('avatar' in value && value.avatar === 'female') selected = 'female';
				guestName = visitorName('name' in value ? value.name : null);
				setName(guestName);
				if ('location' in value && value.location === 'farm') location = 'farm';
				complete = 'complete' in value && value.complete === true;
			}
		} catch { /* best effort */ }
		setAvatar(selected);
		visit.current = { started: false, stop: saved ?? 0, complete, avatar: selected, name: guestName };
		if (location === 'farm') { arriveAtFarm(selected, guestName, true); return; }
		engine.current?.farm.setSuspended(true);
		if (engine.current?.game.scene.isActive('farm-arrival')) engine.current.game.scene.sleep('farm-arrival');
		engine.current?.game.scene.wake('workshop-lab');
		setTourPaused(false);
		setPhase('playing');
		engine.current?.scene.setSuspended(false);
		engine.current?.scene.beginTour(saved ?? 0, selected, complete);
		visit.current.started = true;
	}

	async function enterFullscreen() {
		try {
			await document.documentElement.requestFullscreen?.();
			const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: 'landscape') => Promise<void> };
			await orientation.lock?.('landscape');
		} catch { /* best effort */ }
	}

	const nearby = actions.find(action => action.id === state.nearby);
	const tour = state.tour;
	const stop = tour ? tourStops[tour.index] : null;
	const dialogue = stop?.text.replaceAll('{guest}', visitorName(name)) ?? '';
	return <main className="workshop-app phaser-lab" data-screen={phase} data-tour={tour?.phase} data-can-talk={tour?.canTalk} data-activity={state.active ?? 'none'}>
		<div ref={host} className="phaser-canvas" />
		{ready && !paused && phase === 'playing' && <nav className="lab-markers" aria-label="Room interactions">{actions.filter(action => !tour || tour.phase === 'complete' || action.panel).map(action => <button ref={element => { if (element) markers.current.set(action.id, element); else markers.current.delete(action.id); }} className="station-marker" key={action.id} type="button" aria-label={action.label} onClick={() => engine.current?.scene.visit(action.id)}><span className="marker-diamond" aria-hidden="true" /></button>)}</nav>}

		{ready && !paused && phase === 'playing' && !tour && <div className="game-controls"><Joystick onChange={point => engine.current?.scene.setJoystick(point)} /><button type="button" className={`interact-button ${nearby || state.active ? 'available' : ''}`} disabled={!nearby && !state.active} onClick={() => engine.current?.scene.interact()}><span className="interact-key">E</span><span>{state.active ? state.active === 'sleep' ? 'Wake up' : state.active === 'cook' || state.active === 'water' || state.active === 'aquarium' ? 'Stop' : 'Get up' : nearby?.label ?? 'Explore'}</span></button></div>}
		{phase === 'title' && !showSplash && <StoryScreen key={phase} phase={phase} ready={ready} saved={saved !== null} onNew={() => { if (matchMedia('(pointer: coarse)').matches) void enterFullscreen(); setPhase('create'); }} onContinue={continueVisit} onPortfolio={() => setPanel('projects')} />}
		{phase === 'intro' && <OpeningStory paused={portrait || Boolean(panel)} onArrive={() => arriveAtFarm()} />}
		{phase === 'farm' && !portrait && !panel && !readingSign && <div className="tour-ui">
			<nav className="tour-toolbar" aria-label="Visit controls"><button onClick={() => setTourPaused(value => !value)}>{tourPaused ? 'Resume' : 'Pause'}</button><button onClick={returnToTitle}>Menu</button></nav>
			{!tourPaused && <><div className="guest-controls"><Joystick onChange={point => engine.current?.farm.setJoystick(point)} /></div>{nearDoor || nearSign ? <button className="tour-talk story-button" onClick={() => engine.current?.farm.interact()}>E · {nearDoor ? 'Enter Sam’s house' : `Read ${nearSign?.label.toLowerCase()}`}</button> : null}</>}
		</div>}
		{phase === 'farm' && readingSign && !portrait && <FarmSignPanel reading={readingSign} onClose={closeSign} />}
		{phase === 'create'  && <section className="story-screen story-intro" aria-label="Choose your character"><div className="story-landscape" /><div className="story-shade" /><div className="story-letter character-create"><p className="story-eyebrow">A new visitor</p><h1>Who’s at the door?</h1><p>Choose your character. Sam’s waiting inside.</p><label className="visitor-name">Your name<input value={name} onChange={event => setName(event.target.value)} maxLength={24} placeholder="Your name" autoComplete="nickname" /></label><div className="character-choices">{(['male', 'female'] as const).map(option => <button key={option} type="button" aria-pressed={avatar === option} className={avatar === option ? 'selected' : ''} onClick={() => setAvatar(option)}><img src={portraits[option]} alt="" /><span>{option === 'male' ? 'Male' : 'Female'}</span></button>)}</div><div className="story-letter-actions"><button className="story-text-button" onClick={title}>Back</button><button className="story-button" disabled={!name.trim()} onClick={() => setPhase('intro')}>Begin story <span aria-hidden="true">→</span></button></div></div></section>}
		{error && !showSplash && phase !== 'playing' && <div className="story-error" role="alert">{error}<button className="story-button" onClick={() => setAttempt(value => value + 1)}>Try again</button></div>}
		{phase === 'playing' && tour && stop && !portrait && !panel && <div className="tour-ui">
			<nav className="tour-toolbar" aria-label="Visit controls"><button onClick={() => setTourPaused(value => !value)}>{tourPaused ? 'Resume' : 'Pause'}</button><button onClick={returnToTitle}>Menu</button></nav>
			{!tourPaused && tour.phase === 'dialogue' && <DialogueBox key={tour.index} text={dialogue} inputRef={dialogueInput} onAdvance={() => engine.current?.scene.advanceTour()} link={stop.link} onLink={stop.panel ? () => setPanel(stop.panel!) : undefined} />}
			{!tourPaused && state.nearExit && <button className="tour-talk story-button" onClick={() => engine.current?.scene.interact()}>E · Go outside</button>}
			{!tourPaused && !state.nearExit && tour.phase === 'waiting' && tour.canTalk && <button className="tour-talk story-button" onClick={() => engine.current?.scene.interact()}>E · Talk to Sam</button>}
			{!tourPaused && !state.nearExit && tour.phase === 'complete' && (nearby || state.active) && <button className="tour-talk story-button" onClick={() => engine.current?.scene.interact()}>E · {state.active ? state.active === 'sleep' ? 'Wake up' : ['cook', 'water', 'aquarium'].includes(state.active) ? 'Stop' : 'Get up' : nearby?.label}</button>}
			{!tourPaused && tour.phase !== 'dialogue' && <div className="guest-controls"><Joystick onChange={point => engine.current?.scene.setJoystick(point)} /></div>}
		</div>}
		{portrait && !panel && !showSplash && <div className="rotate-prompt"><RotateIcon /><h2>Turn your phone sideways.</h2><p>This visit plays in landscape. Rotate your device to continue.</p><button type="button" className="pixel-button" onClick={enterFullscreen}>Enter fullscreen</button><button type="button" className="text-button" onClick={() => setPanel('projects')}>Browse the portfolio</button></div>}
		{showSplash && <StudioSplash ready={ready} error={error} onComplete={finishBoot} onRetry={() => setAttempt(value => value + 1)} />}
		<PortfolioPanel active={panel} onChange={setPanel} onClose={() => { setPanel(null); panelFocus.current?.focus({ preventScroll: true }); }} />
	</main>;
}
