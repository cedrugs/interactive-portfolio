import { useCallback, useEffect, useRef, useState } from 'react';
import { pageForPath, sectionForPath, siteUrl, structuredData, type PortfolioSection } from './pages';

function updateMetadata(path: string) {
	const page = pageForPath(path);
	document.title = page.title;
	const metadata = { description: page.description, 'og:title': page.title, 'og:description': page.description, 'og:url': `${siteUrl}${page.path}`, 'twitter:title': page.title, 'twitter:description': page.description, robots: page.path === '/legacy' ? 'noindex, follow' : 'index, follow, max-image-preview:large' };
	for (const [name, value] of Object.entries(metadata)) document.querySelector<HTMLMetaElement>(`meta[name="${name}"], meta[property="${name}"]`)?.setAttribute('content', value);
	document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', `${siteUrl}${page.path}`);
	const schema = document.getElementById('site-schema');
	if (schema) schema.textContent = JSON.stringify(structuredData(page));
}
export function usePortfolioRoute(): [PortfolioSection | null, (section: PortfolioSection | null) => void] {
	const base = useRef(window.location.pathname === '/legacy' ? '/legacy' : '/');
	const [section, setSection] = useState(() => sectionForPath(window.location.pathname));
	useEffect(() => {
		const sync = () => { setSection(sectionForPath(window.location.pathname)); updateMetadata(window.location.pathname); };
		sync();
		window.addEventListener('popstate', sync);
		return () => window.removeEventListener('popstate', sync);
	}, []);
	const navigate = useCallback((next: PortfolioSection | null) => {
		const path = next ? `/${next}` : base.current;
		if (window.location.pathname !== path) window.history.pushState(null, '', path);
		setSection(next);
		updateMetadata(path);
	}, []);
	return [section, navigate];
}
