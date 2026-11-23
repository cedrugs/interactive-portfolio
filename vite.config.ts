import { siteAssets } from './src/seo/build';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
	plugins: [await siteAssets(), react(), tailwindcss()],
	resolve: {
		alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
	},
	server: { port: 5173, strictPort: true },
	preview: { port: 4173, strictPort: true },
});
