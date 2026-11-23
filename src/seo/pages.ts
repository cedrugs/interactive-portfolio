import { aboutData, contactData, experienceData, portfolioStack, projectsData } from '../../lib/data.ts';

export const siteUrl = 'https://samuelcedric.com';
export const sections = ['projects', 'about', 'stack', 'contact'] as const;
export type PortfolioSection = typeof sections[number];
export const pages = [
	{ path: '/', label: 'Sam’s Valley', title: 'Sam’s Valley | Samuel Cedric, Software Engineer', description: 'Meet Sam through a playable pixel-art farm. Explore Samuel Cedric’s software projects, AI products, experience, and technical skills.' },
	{ path: '/projects', label: 'Projects', title: 'Software and AI Projects | Samuel Cedric', description: 'Explore software built by Samuel Cedric, including Nutrisi AI, Pelajarin AI, RelayOn, and projects spanning web, mobile, AI, and infrastructure.' },
	{ path: '/about', label: 'About', title: 'About Sam | Samuel Cedric', description: 'Meet Samuel Cedric, a software engineer and technology founder studying Computer Science at Binus University, with a love for coding and farm life.' },
	{ path: '/stack', label: 'Stack', title: 'Tech Stack and Skills | Samuel Cedric', description: 'Explore Samuel Cedric’s tools for web, mobile, AI, APIs, and infrastructure, including TypeScript, React, Python, PostgreSQL, Docker, and Kubernetes.' },
	{ path: '/contact', label: 'Contact', title: 'Contact Sam | Samuel Cedric', description: 'Get in touch with Samuel Cedric about software projects, AI products, and collaboration. Find Sam’s email, GitHub, and LinkedIn.' },
	{ path: '/legacy', label: 'Legacy workshop', title: 'Legacy Workshop | Samuel Cedric', description: 'Visit the earlier interactive workshop portfolio by Samuel Cedric.' },
];
export type Page = typeof pages[number];
export function pageForPath(path: string): Page {
	return pages.find(page => page.path === path.replace(/\/$/, '')) ?? pages[0];
}
export function sectionForPath(path: string): PortfolioSection | null {
	return sections.find(section => path === `/${section}` || path === `/${section}/`) ?? null;
}
export function structuredData(page: Page) {
	const person = {
		'@type': 'Person', '@id': `${siteUrl}/#sam`, name: 'Samuel Cedric', alternateName: 'Sam',
		url: `${siteUrl}/about`, jobTitle: aboutData.name, description: aboutData.bio,
		email: contactData.email,
		sameAs: [contactData.github, contactData.linkedin].map(url => `https://${url}`),
		knowsAbout: Object.values(portfolioStack).flat(),
		worksFor: ['Nutrisi AI', 'Pelajarin AI'].map(name => ({ '@type': 'Organization', name })),
	};
	return {
		'@context': 'https://schema.org',
		'@graph': [
			person,
			{ '@type': 'WebSite', '@id': `${siteUrl}/#website`, url: `${siteUrl}/`, name: 'Sam’s Valley', inLanguage: 'en', author: { '@id': person['@id'] } },
			{ '@type': page.path === '/about' ? 'ProfilePage' : page.path === '/contact' ? 'ContactPage' : page.path === '/projects' ? 'CollectionPage' : 'WebPage', '@id': `${siteUrl}${page.path}#page`, url: `${siteUrl}${page.path}`, name: page.title, description: page.description, isPartOf: { '@id': `${siteUrl}/#website` }, about: { '@id': person['@id'] }, ...(page.path === '/about' ? { mainEntity: { '@id': person['@id'] } } : {}) },
			...(page.path === '/projects' ? [{ '@type': 'ItemList', itemListElement: projectsData.map((project, index) => ({ '@type': 'ListItem', position: index + 1, item: { '@type': 'CreativeWork', name: project.name, description: project.description, ...(project.link ? { url: project.link } : {}), creator: { '@id': person['@id'] } } })) }] : []),
		],
	};
}
export function escapeHtml(value: string): string {
	return value.replace(/[—–]/g, '-').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!));
}
export function renderHead(page: Page): string {
	const e = escapeHtml;
	return `<title>${e(page.title)}</title>
<meta name="description" content="${e(page.description)}" />
<meta name="robots" content="${page.path === '/legacy' ? 'noindex, follow' : 'index, follow, max-image-preview:large'}" />
<link rel="canonical" href="${siteUrl}${page.path}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Sam’s Valley" />
<meta property="og:locale" content="en_US" />
<meta property="og:title" content="${e(page.title)}" />
<meta property="og:description" content="${e(page.description)}" />
<meta property="og:url" content="${siteUrl}${page.path}" />
<meta property="og:image" content="${siteUrl}/social-card.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Sam’s Valley wooden lettering above a pixel-art mountain landscape" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${e(page.title)}" />
<meta name="twitter:description" content="${e(page.description)}" />
<meta name="twitter:image" content="${siteUrl}/social-card.jpg" />
<meta name="twitter:image:alt" content="Sam’s Valley wooden lettering above a pixel-art mountain landscape" />
<script id="site-schema" type="application/ld+json">${JSON.stringify(structuredData(page)).replaceAll('<', '\\u003c')}</script>`;
}
export function renderContent(page: Page): string {
	const e = escapeHtml;
	const about = aboutData.bio.split('\n\n').map(text => `<p>${e(text)}</p>`).join('');
	let content = about;
	if (page.path === '/projects') content = projectsData.map(project => `<article><h2>${e(project.name)}</h2><p>${e(project.description)}</p><p>${project.tech.map(e).join(', ')}</p>${project.link ? `<a href="${e(project.link)}">Explore ${e(project.name)}</a>` : ''}</article>`).join('');
	if (page.path === '/about') content = `${about}<p>${e(aboutData.education)}</p><a href="/CV_Samuel_Updated_Formatted.pdf">Download CV</a><h2>Experience</h2>${Object.entries(experienceData).map(([company, roles]) => `<section><h3>${e(company)}</h3>${roles.map(role => `<p>${e(role.position)} (${e(role.period)})</p><p>${e(role.description ?? '')}</p>`).join('')}</section>`).join('')}`;
	if (page.path === '/stack') content = Object.entries(portfolioStack).map(([category, tools]) => `<section><h2>${e(category)}</h2><ul>${tools.map(tool => `<li>${e(tool)}</li>`).join('')}</ul></section>`).join('');
	if (page.path === '/contact') content = `<p>Have a project, an interesting problem, or just want to say hello?</p><a href="mailto:${e(contactData.email)}">${e(contactData.email)}</a><p><a href="https://${e(contactData.github)}">GitHub</a> · <a href="https://${e(contactData.linkedin)}">LinkedIn</a></p>`;
	return `<main class="seo-fallback"><h1>${e(page.title)}</h1><nav aria-label="Portfolio">${pages.filter(item => item.path !== '/legacy').map(item => `<a href="${item.path}">${e(item.label)}</a>`).join(' · ')}</nav>${content}<noscript><p>Enable JavaScript to explore the interactive farm.</p></noscript></main>`;
}
