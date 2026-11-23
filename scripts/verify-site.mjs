import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import { pages, siteUrl } from '../src/seo/pages.ts';

const base = process.argv[2] ?? 'http://127.0.0.1:3000';
async function request(path, options) {
	const response = await fetch(`${base}${path}`, options);
	for (const header of ['content-security-policy', 'x-content-type-options', 'strict-transport-security', 'referrer-policy', 'permissions-policy']) assert.ok(response.headers.has(header), `${path}: missing ${header}`);
	return response;
}
for (const page of pages) {
	const response = await request(page.path);
	assert.equal(response.status, 200, page.path);
	assert.equal(response.headers.get('cache-control'), 'no-store');
	const html = await response.text();
	assert.ok(html.includes(`<title>${page.title}</title>`));
	assert.ok(html.includes(`href="${siteUrl}${page.path}"`));
	assert.match(html, /<h1>/);
	assert.equal((html.match(/rel="canonical"/g) ?? []).length, 1);
	JSON.parse(html.match(/type="application\/ld\+json">(.*?)<\/script>/s)[1]);
	if (page.path !== '/') {
		const redirect = await request(`${page.path}/`, { redirect: 'manual' });
		assert.equal(redirect.status, 308);
		assert.equal(new URL(redirect.headers.get('location'), base).pathname, page.path);
	}
}
const home = await (await request('/')).text();
for (const asset of [home.match(/src="(\/assets\/[^"]+\.js)"/)[1], home.match(/href="(\/media\/[^"]+\.png)"/)[1]]) {
	const response = await request(asset);
	assert.equal(response.status, 200);
	assert.equal(response.headers.get('cache-control'), 'public, max-age=31536000, immutable');
	const etag = response.headers.get('etag');
	assert.ok(etag);
	assert.equal((await request(asset, { headers: { 'If-None-Match': etag } })).status, 304);
}
for (const path of ['/CV_Samuel_Cedric.pdf', '/CV_Samuel_Updated_Formatted.pdf', '/version.json', '/healthz']) {
	const response = await request(path);
	assert.equal(response.status, 200);
	assert.equal(response.headers.get('cache-control'), 'no-store');
}
for (const path of ['/missing-page', '/assets/missing.png', '/media/missing.png']) {
	const response = await request(path);
	assert.equal(response.status, 404);
	assert.equal(response.headers.get('cache-control'), 'no-store');
	assert.match(response.headers.get('x-robots-tag'), /noindex/);
}
for (const path of ['/favicon.ico', '/favicon.png', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png', '/social-card.jpg', '/site.webmanifest']) assert.equal((await request(path)).status, 200);
const icon = Buffer.from(await (await request('/favicon.png')).arrayBuffer());
assert.equal(icon.readUInt32BE(16), 48);
assert.equal(icon.readUInt32BE(20), 48);
const sitemap = await (await request('/sitemap.xml')).text();
for (const page of pages.filter(page => page.path !== '/legacy')) assert.ok(sitemap.includes(`<loc>${siteUrl}${page.path}</loc>`));
assert.equal(sitemap.includes('/legacy'), false);
assert.match(await (await request('/robots.txt')).text(), /Sitemap: https:\/\/samuelcedric.com\/sitemap.xml/);
console.log('Verified route metadata, sitemap, icons, security headers, cache lifetimes, revalidation, and real 404 responses.');
