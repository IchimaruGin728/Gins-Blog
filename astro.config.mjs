import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import preact from '@astrojs/preact';
import unocss from 'unocss/astro';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.ichimarugin728.com',
  output: 'server',
  adapter: cloudflare({
    imageService: 'compile',
    platformProxy: {
      enabled: true,
    },
  }),
  integrations: [preact({
    compat: true,
  }), unocss({
    injectReset: true,
  }), sitemap()],
  prefetch: true,
  i18n: {
    defaultLocale: "en-SG",
    locales: ["en-SG", "zh-SG"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});