import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StructuredData } from '@/components/StructuredData';
import { App } from './App';
import '@fontsource-variable/cascadia-mono';
import '@fontsource-variable/pixelify-sans';
import './game/world.css';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<StructuredData />
		<App />
	</StrictMode>,
);
