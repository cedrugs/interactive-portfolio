import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import { pageForPath, renderHead } from './pages';

export async function siteAssets(): Promise<Plugin> {
	const assets: { name: string; source: Buffer }[] = [];
	async function collect(directory: string, prefix = '') {
		for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
			const name = `${prefix}${entry.name}`;
			if (entry.isDirectory()) await collect(join(directory, entry.name), `${name}/`);
			else assets.push({ name, source: await readFile(join(directory, entry.name)) });
		}
	}
	await collect('public/assets');
	const hash = createHash('sha256');
	for (const asset of assets) hash.update(asset.name).update('\0').update(asset.source);
	const prefix = `/media/${hash.digest('hex').slice(0, 16)}`;
	const directories = [...new Set(assets.map(asset => asset.name.split('/')[0]))];
	const version = (source: string) => directories.reduce((text, directory) => text.replaceAll(`/assets/${directory}/`, `${prefix}/${directory}/`), source);
	let production = false;
	return {
		name: 'portfolio-pages-and-assets',
		enforce: 'pre',
		configResolved(config) { production = config.command === 'build'; },
		transform(source, id) {
			if (!production || id.includes('node_modules') || !/\.(tsx?|css)(\?|$)/.test(id)) return;
			return { code: version(source), map: null };
		},
		transformIndexHtml: {
			order: 'pre',
			handler(html, context) {
				const result = html.replace(/<!-- seo:start -->[\s\S]*?<!-- seo:end -->/, `<!-- seo:start -->${renderHead(pageForPath(context.path))}<!-- seo:end -->`);
				return production ? version(result) : result;
			},
		},
		generateBundle() {
			for (const asset of assets) this.emitFile({ type: 'asset', fileName: `${prefix.slice(1)}/${asset.name}`, source: asset.source });
		},
	};
}
