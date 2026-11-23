import { useEffect, useRef, useState } from 'react';
import './opening.css';

const lines = ['Beyond the rush of everyday life…', 'A little house waits between the trees.', 'Sam is expecting you.'];
export function OpeningStory({ onArrive, paused }: { onArrive: () => void; paused: boolean }) {
	const [page, setPage] = useState(0);
	const arrive = useRef(onArrive);
	useEffect(() => { arrive.current = onArrive; }, [onArrive]);
	useEffect(() => {
		if (paused) return;
		const advance = () => page < lines.length - 1 ? setPage(value => value + 1) : arrive.current();
		const timer = window.setTimeout(advance, 3000);
		const key = (event: KeyboardEvent) => {
			if (event.repeat) return;
			if (event.key === 'Escape') { event.preventDefault(); arrive.current(); }
			else if (['Enter', ' ', 'e', 'E'].includes(event.key)) { event.preventDefault(); advance(); }
		};
		window.addEventListener('keydown', key);
		return () => { clearTimeout(timer); window.removeEventListener('keydown', key); };
	}, [page, paused]);
	return <section className="opening-story" aria-label="Opening story">
		<button className="opening-text" onClick={() => page < lines.length - 1 ? setPage(value => value + 1) : onArrive()} disabled={paused} aria-label="Continue opening"><span key={page} style={{ animationPlayState: paused ? 'paused' : 'running' }}>{lines[page]}</span></button>
		<button className="opening-skip" onClick={onArrive} disabled={paused}>Skip intro <span aria-hidden="true">›</span></button>
	</section>;
}
