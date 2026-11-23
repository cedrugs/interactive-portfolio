import { useRef, useState, type PointerEvent } from 'react';
import type { Point } from './grid';

export function RotateIcon() {
	return <svg width="68" height="68" viewBox="0 0 68 68" fill="none" aria-hidden="true"><rect x="24" y="15" width="25" height="40" rx="3" transform="rotate(-28 36 35)" stroke="currentColor" strokeWidth="2" /><path d="M13 35a23 23 0 0 1 22-22m-5-5 6 5-6 5M55 34a23 23 0 0 1-22 22m5 5-6-5 6-5" stroke="currentColor" strokeWidth="2" /><path d="m38 48 3-2" stroke="currentColor" strokeWidth="2" /></svg>;
}

export function Joystick({ onChange }: { onChange: (point: Point) => void }) {
	const [knob, setKnob] = useState({ x: 0, y: 0 });
	const pointer = useRef<number | null>(null);
	function update(event: PointerEvent<HTMLDivElement>) {
		if (pointer.current !== event.pointerId) return;
		const rect = event.currentTarget.getBoundingClientRect();
		const dx = event.clientX - rect.left - rect.width / 2;
		const dy = event.clientY - rect.top - rect.height / 2;
		const length = Math.hypot(dx, dy);
		const scale = Math.min(length, 28) / (length || 1);
		setKnob({ x: dx * scale, y: dy * scale });
		onChange(length < 6 ? { x: 0, y: 0 } : { x: dx / Math.max(length, 28), y: dy / Math.max(length, 28) });
	}
	function release() { pointer.current = null; setKnob({ x: 0, y: 0 }); onChange({ x: 0, y: 0 }); }
	return <div className="joystick" aria-label="Drag to walk" onPointerDown={event => { pointer.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId); update(event); }} onPointerMove={update} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}><span className="joystick-cross" /><span className="joystick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} /></div>;
}

