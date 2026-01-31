import cloudflare from "@astrojs/cloudflare";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import unocss from "unocss/astro";

// https://astro.build/config
export default defineConfig({
	site: "https://blog.ichimarugin728.com",
	output: "server",
	adapter: cloudflare({
		imageService: "compile",
		platformProxy: {
			enabled: true,
		},
	}),
	integrations: [
		preact({
			compat: true,
		}),
		unocss({
			injectReset: true,
		}),
		sitemap(),
	],
	prefetch: {
		defaultStrategy: "hover",
	},
	i18n: {
		defaultLocale: "en-SG",
		locales: ["en-SG", "zh"],
		routing: {
			prefixDefaultLocale: false,
		},
	},
});
