/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.html", "./src/**/*.ts"],
	darkMode: false,
	theme: {
		extend: {
			fontFamily: {
				mono: ["JetBrains Mono", "monospace"],
			},
			borderColor: {
				"accent-color": "#FF6577",
			},
			colors: {
				"accent-color": "#FF6577",
			},
			translate: {
				"custom-x": "0.25rem",
				"custom-y": "-0.25rem",
			},
			boxShadow: {
				custom: "3px 3px 0 rgba(0, 0, 0, 1)",
			},
			transitionTimingFunction: {
				custom: "cubic-bezier(0.165, 0.84, 0.44, 1)",
			},
		},
	},
	safelist: ["border-accent-color"],
	variants: {
		extend: {},
	},
	plugins: [],
};
