import { useEffect, useRef } from 'react';
import type { FarmSignReading } from './FarmScene';
import './dialogue.css';

export function FarmSignPanel({ reading, onClose }: { reading: FarmSignReading; onClose: () => void }) {
	const button = useRef<HTMLButtonElement>(null);
	useEffect(() => {
		button.current?.focus({ preventScroll: true });
		const close = (event: KeyboardEvent) => {
			if (event.repeat || !['e', 'E', 'Escape'].includes(event.key)) return;
			event.preventDefault();
			onClose();
		};
		window.addEventListener('keydown', close);
		return () => window.removeEventListener('keydown', close);
	}, [onClose]);
	return <section className="dialogue-box farm-sign-reading" role="dialog" aria-modal="true" aria-label={reading.sign.label}>
		<img className="dialogue-art" src="/assets/workshop-lab/dialogue-frame.png" alt="" draggable={false} />
		<p className="dialogue-copy">{reading.sign.text}</p>
		<img className="dialogue-portrait" src={reading.image} alt="" draggable={false} />
		<span className="dialogue-name">Sam’s notes</span>
		<button ref={button} className="dialogue-advance" aria-label="Close sign" onClick={onClose}><span className="dialogue-cue" aria-hidden="true">▾</span></button>
	</section>;
}
