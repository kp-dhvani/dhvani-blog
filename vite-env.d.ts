/// <reference types="vite/client" />

interface ImportMetaEnv {
	VITE_API_URL: string;
	// Define any other environment variables you use, for example:
	VITE_ENV: "development" | "production";
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
