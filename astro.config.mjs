import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import unocss from "@unocss/astro";
import { defineConfig } from "astro/config";

const site = process.env.SITE_URL?.trim() || "https://blog.ichimarugin728.com";

// https://astro.build/config
export default defineConfig({
	site,
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
		unocss(),
		sitemap(),
		mdx(),
	],
	prefetch: {
		defaultStrategy: "viewport",
	},
	i18n: {
		defaultLocale: "en-SG",
		locales: ["en-SG", "zh"],
		routing: {
			prefixDefaultLocale: false,
		},
	},
});
