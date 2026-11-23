import { useCallback, useEffect, useState, type RefObject } from 'react';
import { dialoguePages } from './dialogue-pages';
import './dialogue.css';

interface DialogueBoxProps {
	text: string;
	inputRef: RefObject<(() => void) | null>;
	onAdvance: () => void;
	link?: string;
	onLink?: () => void;
}

export function DialogueBox({ text, inputRef, onAdvance, link, onLink }: DialogueBoxProps) {
	const pages = dialoguePages(text);
	const [page, setPage] = useState(0);
	const [count, setCount] = useState(0);
	const current = pages[page];
	const complete = count >= current.length;
	const advance = useCallback(() => {
		if (!complete) setCount(current.length);
		else if (page < pages.length - 1) { setPage(page + 1); setCount(0); }
		else onAdvance();
	}, [complete, current.length, page, pages.length, onAdvance]);

	useEffect(() => {
		inputRef.current = advance;
		return () => { inputRef.current = null; };
	}, [inputRef, advance]);


	useEffect(() => {
		if (complete) return;
		const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
		const timer = window.setInterval(() => setCount(value => Math.min(current.length, value + (reduced ? current.length : 2))), 30);
		return () => window.clearInterval(timer);
	}, [current, complete]);

	return <section className="dialogue-box" aria-label="Sam’s dialogue" data-page={page + 1} data-pages={pages.length}>
		<img className="dialogue-art" src="/assets/workshop-lab/dialogue-frame.png" alt="" draggable={false} />
		<p className="dialogue-copy" aria-label={current}><span aria-hidden="true">{current.slice(0, count)}</span></p>
		<img className="dialogue-portrait" src="/assets/workshop-lab/sam-portrait.png" alt="Sam" draggable={false} />
		<span className="dialogue-name">Sam</span>
		<button type="button" className="dialogue-advance" aria-label={complete ? 'Continue Sam’s dialogue' : 'Reveal Sam’s dialogue'} onClick={advance}>
			{complete && <span className="dialogue-cue" aria-hidden="true">▾</span>}
		</button>
		{onLink && <button type="button" className="dialogue-link" onClick={onLink}>{link}</button>}
	</section>;
}
