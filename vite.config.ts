import { defineConfig } from "vite";
import { resolve } from "path";
import injectHTML from "vite-plugin-html-inject";
import path from "path";
import { readdirSync, statSync } from "fs";

const root = resolve(__dirname, "src");
const outDir = resolve(__dirname, "dist");
const mode = process.env.NODE_ENV;

// function to collect all HTML files recursively
function collectHtmlFiles(rootDir: string) {
	let htmlFiles: { [key: string]: string } = {};

	// walk through directories and collect HTML files
	function walkDirectory(dir: string) {
		const files = readdirSync(dir);

		files.forEach((file) => {
			const filePath = path.join(dir, file);
			const stat = statSync(filePath);

			if (stat.isDirectory()) {
				walkDirectory(filePath);
			} else if (filePath.endsWith(".html")) {
				const relativePath = path.relative(rootDir, filePath);
				// remove the '.html' extension from the key
				let key = relativePath.replace(/\.html$/, "");
				// handle the case where the file is 'index.html' in any subdirectory
				if (key.endsWith("/index")) {
					// extract the last folder name
					const parts = key.split("/");
					key = parts.length > 2 ? parts[parts.length - 2] : parts[0]; // use the last folder name
				}
				htmlFiles[key] = resolve(rootDir, relativePath);
			}
		});
	}

	walkDirectory(rootDir);

	return htmlFiles;
}

const articles = collectHtmlFiles(root);

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
		{
			name: "inject-common-script",
			enforce: "post",
			transformIndexHtml: {
				order: "post",
				handler(html) {
					if (mode === "development") {
						const commonJsPath = path.resolve(root, "/shared/common.ts");
						return html.replace(
							"</body>",
							`<script type="module" src="${commonJsPath}"></script></body>`
						);
					}
					// Inject the compiled JavaScript file into all HTML files
					return html.replace(
						"</body>",
						'<script type="module" src="/shared/common.js"></script></body>'
					);
				},
			},
		},
	],
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
				"404": resolve(root, "404.html"),
				common: resolve(root, "shared/common.ts"),
				...articles,
			},
			output: {
				entryFileNames: (chunk) => {
					if (chunk.name === "common") {
						return "shared/[name].js"; // Place the common.js file in the 'shared' folder
					}
					return "[name].js"; // For other entry points, keep them in the root
				},
			},
		},
	},
});
