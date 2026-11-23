import test from 'node:test';
import assert from 'node:assert/strict';
import { pages, renderHead, renderContent, sectionForPath, structuredData } from '../src/seo/pages.ts';
import { projectsData } from '../lib/data.ts';
import { characterZoom } from '../src/phaser/lab/camera.ts';
import { farmCameraZoom } from '../src/phaser/lab/farm-world.ts';

test('every indexable section has unique metadata, its own canonical, and readable content', () => {
	assert.equal(new Set(pages.map(page => page.title)).size, pages.length);
	assert.equal(new Set(pages.map(page => page.description)).size, pages.length);
	for (const page of pages) {
		const head = renderHead(page);
		assert.ok(head.includes(`href="https://samuelcedric.com${page.path}"`));
		assert.ok(head.includes('summary_large_image'));
		assert.doesNotMatch(head + renderContent(page), /[—–]/);
		assert.ok(renderContent(page).includes('<h1>'));
	}
});
test('projects and current profile are present without executing the game', () => {
	const projects = renderContent(pages.find(page => page.path === '/projects'));
	for (const project of projectsData) assert.ok(projects.includes(project.name));
	const person = structuredData(pages[0])['@graph'][0];
	assert.deepEqual(person.worksFor.map(company => company.name), ['Nutrisi AI', 'Pelajarin AI']);
	assert.equal('alumniOf' in person, false);
});
test('section routing accepts known pages without making unknown routes indexable', () => {
	assert.equal(sectionForPath('/about'), 'about');
	assert.equal(sectionForPath('/projects/'), 'projects');
	assert.equal(sectionForPath('/unknown'), null);
	assert.match(renderHead(pages.find(page => page.path === '/legacy')), /noindex, follow/);
});
test('the guest keeps the same camera scale inside and outside at common viewports', () => {
	for (const [width, height] of [[844, 390], [1280, 720], [1920, 1080], [2560, 1440], [3840, 2160]]) assert.equal(farmCameraZoom(width, height), characterZoom(height));
});
