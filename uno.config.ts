import { defineConfig, presetUno, presetIcons, presetTypography, presetWebFonts } from 'unocss';

export default defineConfig({

  shortcuts: {
    'glass-panel': 'bg-white/10 dark:bg-black/20 backdrop-filter backdrop-blur-xl [-webkit-backdrop-filter:blur(24px)] border border-white/10 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:bg-white/15 dark:hover:bg-white/5 will-change-transform',
     // Safari fix specific requirement
    'glass-safari': '-webkit-backdrop-filter: blur(20px)',
    'btn-animated': 'transition-transform active:scale-95 hover:-translate-y-0.5 will-change-transform',
  },
  presets: [
    presetUno(),
    presetIcons(),
    presetTypography(),
  ],
  theme: {
    fontFamily: {
      sans: 'Inter Variable, Inter, sans-serif',
      mono: 'JetBrains Mono Variable, JetBrains Mono, monospace',
      display: 'Outfit Variable, Outfit, sans-serif',
    },
    // ... existing colors/animation
    colors: {
      brand: {
        dark: '#050505',
        primary: '#581C87', // Deep Purple
        secondary: '#7E22CE',
        accent: '#C084FC',
      },
    },
    animation: {
      keyframes: {
        'fade-in-up': '{ from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }',
        'fade-in': '{ from { opacity: 0; } to { opacity: 1; } }',
      },
      durations: {
        'fade-in-up': '0.6s',
        'fade-in': '0.4s',
      },
      timingFns: {
        'fade-in-up': 'ease-out',
      },
    },
  },
});
