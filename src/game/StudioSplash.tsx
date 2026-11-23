import { useEffect, useState, type CSSProperties } from 'react';
import './studio-splash.css';

const startedAt = performance.now();

export function StudioSplash({ ready = false, error = '', onComplete, onRetry }: { ready?: boolean; error?: string; onComplete?: () => void; onRetry?: () => void }) {
	const [artReady, setArtReady] = useState(false);
	useEffect(() => {
		if (!ready || !artReady || error || !onComplete) return;
		const timer = window.setTimeout(onComplete, Math.max(0, 1600 - (performance.now() - startedAt)));
		return () => window.clearTimeout(timer);
	}, [ready, artReady, error, onComplete]);
	return <section className="studio-splash" aria-label="Sam’s studio" aria-busy={!ready && !error}>
		<div className="studio-leaves" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index} style={{ '--leaf-x': `${10 + index % 6 * 16}%`, '--leaf-y': `${12 + Math.floor(index / 6) * 36}%`, '--leaf-delay': `${-index * .43}s`, '--leaf-turn': `${index % 2 ? -35 : 35}deg` } as CSSProperties} />)}</div>
		<div className="studio-signature">
			<img className="studio-emblem" src="/assets/workshop-lab/studio-sam.png" alt="Sam beside a little sprout and computer" onLoad={() => setArtReady(true)} onError={() => setArtReady(true)} fetchPriority="high" />
			<p className="studio-byline">Made by Sam</p>
			{!error && <div className="studio-loading" role="status"><span className="studio-status">{ready ? 'Ready to visit' : 'Loading Sam’s Valley'}</span><span aria-hidden="true">•••</span></div>}
			{error && <div className="studio-error" role="alert"><p>The valley couldn’t load.</p><p>{error}</p>{onRetry && <button type="button" onClick={onRetry}>Try again</button>}</div>}
		</div>
		{ready && !error && onComplete && <button className="studio-skip" type="button" onClick={onComplete}>Skip intro <span aria-hidden="true">→</span></button>}
	</section>;
}
