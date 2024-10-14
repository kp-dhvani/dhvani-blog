import { defineConfig } from "vite";
import { resolve } from "path";
import injectHTML from "vite-plugin-html-inject";
import { TailwindCSSVitePlugin } from "tailwindcss-vite-plugin";

const root = resolve(__dirname, "src");
const outDir = resolve(__dirname, "dist");

export default defineConfig({
	root,
	plugins: [
		injectHTML(),
		TailwindCSSVitePlugin({
			config: "/tailwind.config.js",
		}),
	],
	server: {
		port: 3000,
		hmr: true,
	},
	build: {
		outDir,
		emptyOutDir: true,
		rollupOptions: {
			input: {
				main: resolve(root, "index.html"),
			},
		},
	},
});
