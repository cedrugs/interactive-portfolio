import { useEffect, useRef, type CSSProperties } from 'react';
import './story.css';
import { PixelSign } from './PixelSign';

export function StoryScreen({ phase, ready, saved, onNew, onContinue, onPortfolio }: {
	phase: 'title';
	ready: boolean;
	saved: boolean;
	onNew: () => void;
	onContinue: () => void;
	onPortfolio: () => void;
}) {
	const primary = useRef<HTMLButtonElement>(null);
	useEffect(() => { primary.current?.focus(); }, [phase]);
	return <section className={`story-screen story-${phase}`} aria-label="Sam’s Valley title screen">
		<div className="story-landscape" aria-hidden="true" />
		<div className="story-shade" aria-hidden="true" />
		<div className="menu-wind" aria-hidden="true">{Array.from({ length: 36 }, (_, index) => <span
			key={index}
			className={`menu-wind-particle ${index % 3 === 0 ? 'is-leaf' : 'is-petal'}`}
			style={{
				'--wind-y': `${-16 + index * 29 % 105}%`,
				'--wind-duration': `${12 + index % 7 * 1.6}s`,
				'--wind-delay': `${-(index * 3.71 % 24)}s`,
				'--wind-size': `${8 + index % 4 * 3}px`,
				'--wind-fall': `${12 + index % 5 * 6}vh`,
				'--flutter-duration': `${2.2 + index % 5 * .45}s`,
			} as CSSProperties}
		><i /></span>)}</div>
		<div className="story-title-content">
			<h1 className="valley-logo"><PixelSign /></h1>
			<nav className="valley-menu" aria-label="Start your visit"><button ref={primary} className="valley-button" disabled={!ready} onClick={onNew}>New<img className="menu-icon" src="/assets/workshop-lab/menu-new.png" alt="" /></button><button className="valley-button" disabled={!ready || !saved} onClick={onContinue}>Continue<img className="menu-icon" src="/assets/workshop-lab/menu-continue.png" alt="" /></button><button className="valley-button" onClick={onPortfolio}>Portfolio<img className="menu-icon" src="/assets/workshop-lab/menu-portfolio.png" alt="" /></button></nav>


		</div>
	</section>;
}
