import { defineConfig } from "vite";
import { resolve } from "path";
import injectHTML from "vite-plugin-html-inject";
import { TailwindCSSVitePlugin } from "tailwindcss-vite-plugin";
import tailwind from "tailwindcss";
import autoprefixer from "autoprefixer";
import path from "path";

const root = resolve(__dirname, "src");
const outDir = resolve(__dirname, "dist");

export default defineConfig({
	appType: "mpa",
	root,
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
		},
	},
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
		assetsDir: "assets",
		emptyOutDir: true,
		rollupOptions: {
			input: {
				main: resolve(root, "index.html"),
				"mod-synth": resolve(root, "/mod-synth/index.html"),
				nada: resolve(root, "/nada/index.html"),
				shruti: resolve(root, "/nada/shruti/index.html"),
				oscillator: resolve(root, "/mod-synth/oscillator/index.html"),
				amplifier: resolve(root, "/mod-synth/amplifier/index.html"),
				lfo: resolve(root, "/mod-synth/lfo/index.html"),
				filter: resolve(root, "/mod-synth/filter/index.html"),
				aside: resolve(root, "/aside/index.html"),
				"history-of-sound": resolve(root, "/aside/history-of-sound.html"),
				timbre: resolve(root, "/aside/timbre/index.html"),
				"404": resolve(root, "404.html"),
				spandrel: resolve(root, "/aside/spandrel/index.html"),
			},
		},
	},
});
