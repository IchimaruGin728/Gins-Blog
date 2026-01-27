import { defineConfig, presetUno, presetIcons, presetTypography, presetWebFonts } from 'unocss';

export default defineConfig({
  theme: {
    colors: {
      brand: {
        dark: '#050505',
        primary: '#581C87', // Deep Purple
        secondary: '#7E22CE',
        accent: '#C084FC',
      },
    },
  },
  shortcuts: {
    'glass-panel': 'bg-white/10 dark:bg-black/20 backdrop-filter backdrop-blur-xl border border-white/10 shadow-xl',
     // Safari fix specific requirement
    'glass-safari': '-webkit-backdrop-filter: blur(20px)',
  },
  presets: [
    presetUno(),
    presetIcons(),
    presetTypography(),
    presetWebFonts({
      provider: 'google',
      fonts: {
        sans: 'Inter:400,500,600,700',
        mono: 'JetBrains Mono',
        display: 'Outfit:400,700', // Close to SF Pro Display feel available on Google Fonts
      },
    }),
  ],
});
