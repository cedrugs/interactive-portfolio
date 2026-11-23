import { Buffer } from 'node:buffer';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { pages, renderContent, renderHead, siteUrl } from '../src/seo/pages.ts';

const template = await readFile('dist/index.html', 'utf8');
for (const page of pages) {
	const directory = join('dist', page.path);
	await mkdir(directory, { recursive: true });
	const html = template.replace(/<!-- seo:start -->[\s\S]*?<!-- seo:end -->/, `<!-- seo:start -->${renderHead(page)}<!-- seo:end -->`).replace('<div id="root"></div>', `<div id="root">${renderContent(page)}</div>`);
	await writeFile(join(directory, 'index.html'), html);
}
await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.filter(page => page.path !== '/legacy').map(page => `<url><loc>${siteUrl}${page.path}</loc></url>`).join('')}</urlset>\n`);
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
const icon = 'public/assets/workshop-lab/menu-new.png';
for (const [name, size] of [['favicon', 48], ['apple-touch-icon', 180], ['icon-192', 192], ['icon-512', 512]]) {
	await sharp(icon).resize(size, size, { kernel: 'nearest' }).png().toFile(`dist/${name}.png`);
}
const png = await readFile('dist/favicon.png');
const ico = Buffer.alloc(22);
ico.writeUInt16LE(1, 2);
ico.writeUInt16LE(1, 4);
ico[6] = 48;
ico[7] = 48;
ico.writeUInt16LE(1, 10);
ico.writeUInt16LE(32, 12);
ico.writeUInt32LE(png.length, 14);
ico.writeUInt32LE(22, 18);
await writeFile('dist/favicon.ico', Buffer.concat([ico, png]));
await writeFile('dist/site.webmanifest', JSON.stringify({ name: 'Sam’s Valley | Samuel Cedric', short_name: 'Sam’s Valley', id: '/', start_url: '/', display: 'browser', background_color: '#161f1c', theme_color: '#161f1c', icons: [192, 512].map(size => ({ src: `/icon-${size}.png`, sizes: `${size}x${size}`, type: 'image/png', purpose: 'any' })) }));
const logo = await sharp('public/assets/workshop-lab/sams-valley-logo.png').resize(820, 420, { fit: 'inside', kernel: 'nearest' }).toBuffer();
const dimensions = await sharp(logo).metadata();
await sharp('public/assets/workshop-lab/title-mountains.png').resize(1200, 630, { fit: 'cover', kernel: 'nearest' }).composite([{ input: logo, left: Math.round((1200 - dimensions.width) / 2), top: 38 }]).jpeg({ quality: 88 }).toFile('dist/social-card.jpg');
await writeFile('dist/404.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Page not found | Sam’s Valley</title><link rel="icon" href="/favicon.png"></head><body><main><h1>This path leads off the farm.</h1><p>The page you requested could not be found.</p><a href="/">Return to Sam’s Valley</a></main></body></html>`);
