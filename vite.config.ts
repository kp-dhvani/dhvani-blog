import { defineConfig } from "vite";
import { resolve } from "path";
import injectHTML from "vite-plugin-html-inject";
import { TailwindCSSVitePlugin } from "tailwindcss-vite-plugin";
import tailwind from "tailwindcss";
import autoprefixer from "autoprefixer";

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
	css: {
		postcss: {
			plugins: [tailwind, autoprefixer],
		},
	},
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
				oscillator: resolve(root, "/oscillator/index.html"),
				amplifier: resolve(root, "/amplifier/index.html"),
				lfo: resolve(root, "/lfo/index.html"),
				filter: resolve(root, "/filter/index.html"),
				aside: resolve(root, "/aside/index.html"),
			},
		},
	},
});
