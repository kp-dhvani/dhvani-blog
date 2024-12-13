import { defineConfig } from "vite";
import { resolve } from "path";
import injectHTML from "vite-plugin-html-inject";
import path from "path";
import fs from "fs";

const root = resolve(__dirname, "src");
const outDir = resolve(__dirname, "dist");

// function to collect all HTML files recursively
function collectHtmlFiles(rootDir: string) {
	let htmlFiles: { [key: string]: string } = {};

	// walk through directories and collect HTML files
	function walkDirectory(dir: string) {
		const files = fs.readdirSync(dir);

		files.forEach((file) => {
			const filePath = path.join(dir, file);
			const stat = fs.statSync(filePath);

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
			transformIndexHtml(html, { filename }) {
				// Check if the file is an HTML file (can also be page-specific)
				if (filename.endsWith(".html")) {
					// Inject the script for common.ts just before </body> in all HTML files
					return html.replace(
						"</body>",
						'<script type="module" src="/shared/common.ts"></script></body>'
					);
				}
				return html; // For non-HTML files, return unchanged
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
				...articles,
			},
		},
	},
});
