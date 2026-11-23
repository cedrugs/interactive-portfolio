import { lazy, Suspense } from 'react';
import { StudioSplash } from './game/StudioSplash';

const Lab = lazy(() => import('./phaser/lab/Lab').then(module => ({ default: module.Lab })));
const Legacy = lazy(() => import('./game/Workshop').then(module => ({ default: module.Workshop })));

export function App() {
	return <Suspense fallback={<StudioSplash />}>
		{window.location.pathname === '/legacy' ? <Legacy /> : <Lab />}
	</Suspense>;
}
