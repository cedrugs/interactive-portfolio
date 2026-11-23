import { clearSegment, type ActionId, type Point } from './world.ts';

export interface TourStop {
	title: string;
	text: string;
	action?: ActionId;
	panel?: 'projects' | 'about' | 'contact';
	link?: string;
}

export const tourStops: TourStop[] = [
	{ title: 'Come on in.', text: "Hey, {guest}! I’m Sam. I study Computer Science at Binus and build AI products. Welcome to my little place! Walk over and talk whenever you’re ready." },
	{ title: 'The workbench', action: 'chair', text: "This desk is where I build things. I founded Pelajarin AI, which has grown to 1.2 million users, and co-founded Nutrisi AI. My work goes from mobile apps and backend APIs to AI models and Kubernetes.", panel: 'projects', link: 'See the projects' },
	{ title: 'A little pause', action: 'aquarium', text: 'The keyboards up there are my collection. I wanted this place to feel personal, from the things on my desk to this little aquarium. You can watch the fish when we’re done.' },
	{ title: 'After hours', action: 'theater', text: 'Here’s my mini theater. I wanted a proper couch facing the screen. After the tour, try it yourself—walk up to the couch or TV and press E.' },
	{ title: 'One more chapter', action: 'read', text: "I started with freelance projects, then worked as a junior software engineer at Dewaweb. These days I’m building my own products while studying at Binus. I also lead research and development at BNCC. My updated CV is here if you’d like the full story.", panel: 'about', link: 'More about Sam' },
	{ title: 'Something on the stove', action: 'cook', text: 'I like connecting small pieces into something useful. That’s why this place has working little details, too. The stove, water dispenser, and seats are yours to try after we finish.' },
	{ title: 'Make yourself at home.', action: 'contact', text: "Before you go, {guest}, there’s something behind this little valley. I love coding, but I’ve always wanted to grow a farm. To build technology and still live traditionally—two different lives, together. A morning with the chickens, an afternoon writing code, and something I grew for dinner. This farm is my way of imagining it. Thanks for spending a little time here! Leave me a note, or head outside and explore.", panel: 'contact', link: 'Leave a note' },
];

export type TourPhase = 'dialogue' | 'walking' | 'waiting' | 'complete';
export interface TourState { index: number; phase: TourPhase; canTalk: boolean }
export const initialTour: TourState = { index: 0, phase: 'waiting', canTalk: false };

export function parseTourSave(raw: string | null): number | null {
	try {
		const value: unknown = JSON.parse(raw ?? 'null');
		if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1 || !('stop' in value)) return null;
		return typeof value.stop === 'number' && Number.isInteger(value.stop) && value.stop >= 0 && value.stop < tourStops.length ? value.stop : null;
	} catch { return null; }
}

export function canTalkToSam(guest: Point, sam: Point, phase: TourPhase): boolean {
	return phase === 'waiting' && Math.hypot(guest.x - sam.x, guest.y - sam.y) <= 36 && clearSegment(guest, sam);
}

export function visitorName(value: unknown): string {
	return typeof value === 'string' ? [...value].filter(letter => letter.charCodeAt(0) >= 32 && letter.charCodeAt(0) !== 127).join('').trim().slice(0, 24) || 'Guest' : 'Guest';
}
