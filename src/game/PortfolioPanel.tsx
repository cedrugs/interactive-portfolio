import { useEffect, useRef } from 'react';
import { aboutData, contactData, experienceData, projectsData, portfolioStack } from '@/lib/data';
import type { StationId } from './room';
import { PixelIcon } from './PixelIcon';
import './portfolio.css';

const tabs: { id: StationId; label: string; title: string; subtitle: string }[] = [
	{ id: 'projects', label: 'Projects', title: 'From the workbench', subtitle: 'A selection of things I’ve built.' },
	{ id: 'about', label: 'About', title: 'Hi, I’m Sam.', subtitle: 'The person behind the keyboard.' },
	{ id: 'stack', label: 'Stack', title: 'Tools of the trade', subtitle: 'From interfaces to infrastructure.' },
	{ id: 'contact', label: 'Contact', title: 'Leave me a note', subtitle: 'Good things often start with a conversation.' },
];

export function PortfolioPanel({ active, onChange, onClose }: { active: StationId | null; onChange: (id: StationId) => void; onClose: () => void }) {
	const ref = useRef<HTMLDialogElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const dialog = ref.current;
		if (active && !dialog?.open) dialog?.showModal();
		else if (!active && dialog?.open) dialog.close();
		if (contentRef.current) contentRef.current.scrollTop = 0;
	}, [active]);
	const selected = tabs.find(tab => tab.id === active) ?? tabs[0];
	return <dialog ref={ref} className="portfolio-panel" aria-labelledby="panel-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
		<div className="panel-inner">
			<header className="panel-top"><span className="panel-kicker">Sam’s field notes</span><button className="icon-button" type="button" onClick={onClose} aria-label="Close portfolio">×</button></header>
			<nav className="panel-tabs" aria-label="Portfolio sections">{tabs.map(tab => <button key={tab.id} type="button" aria-current={active === tab.id ? 'page' : undefined} onClick={() => onChange(tab.id)}><img src={`/assets/workshop-lab/${tab.id === 'projects' ? 'menu-portfolio' : tab.id === 'about' ? 'menu-new' : 'menu-continue'}.png`} alt="" />{tab.label}</button>)}</nav>
			<div className="panel-content" ref={contentRef}>
				<div className="panel-heading"><h2 id="panel-title">{selected.title}</h2><p>{selected.subtitle}</p></div>
				{active === 'projects' && <div className="project-pages">{projectsData.map((project, index) => <article className="project-page" key={project.name}><div className="project-number">0{index + 1} / Project</div><h3 className="project-title"><PixelIcon name={project.icon} />{project.name}</h3><p>{project.description}</p><ul className="tech-tags" aria-label="Technologies">{project.tech.map(tech => <li key={tech}><PixelIcon name={tech} />{tech}</li>)}</ul>{project.link && <a className="project-link" href={project.link} target="_blank" rel="noopener noreferrer">Explore project <span aria-hidden="true">↗</span></a>}</article>)}</div>}
				{active === 'about' && <div className="about-page">{aboutData.bio.split('\n\n').map(paragraph => <p key={paragraph}>{paragraph}</p>)}<p>{aboutData.education}</p><a className="project-link" href="/CV_Samuel_Updated_Formatted.pdf" download="Samuel-Cedric-CV.pdf">Download CV <span aria-hidden="true">↓</span></a><h3 className="section-heading">Experience</h3>{Object.entries(experienceData).map(([company, roles]) => <section className="experience-note" key={company}><h4>{company}</h4>{roles.map(role => <div key={role.position}><p>{role.position}</p><span>{role.period}</span>{role.description && <p className="experience-description">{role.description}</p>}</div>)}</section>)}</div>}
				{active === 'stack' && <div className="stack-page">{Object.entries(portfolioStack).map(([category, tools]) => <section key={category}><h3>{category}</h3><ul>{tools.map(tool => <li key={tool}><PixelIcon name={tool} />{tool}</li>)}</ul></section>)}</div>}
				{active === 'contact' && <div className="contact-page"><span className="letter-sprite" aria-hidden="true" /><p>Have a project, an interesting problem, or just want to say hello?</p><a className="pixel-button email-link" href={`mailto:${contactData.email}`}>{contactData.email} ↗</a><div className="contact-links"><a href={`https://${contactData.github}`} target="_blank" rel="noopener noreferrer">GitHub ↗</a><a href={`https://${contactData.linkedin}`} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a></div></div>}
			</div>
			<footer className="panel-footer"><div className="panel-profile"><img src="/assets/workshop-lab/sam-portrait.png" alt="" /><span>Sam<small>Code, crops & a little curiosity.</small></span></div><button type="button" onClick={onClose}>Back to the room ↵</button></footer>
		</div>
	</dialog>;
}
