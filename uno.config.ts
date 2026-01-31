import { defineConfig, presetUno, presetIcons, presetTypography, presetWebFonts } from 'unocss';

export default defineConfig({

  shortcuts: {
    'glass-panel': 'bg-white/10 dark:bg-black/20 backdrop-filter backdrop-blur-xl [-webkit-backdrop-filter:blur(24px)] border border-white/10 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:bg-white/15 dark:hover:bg-white/5 will-change-transform',
     // Safari fix specific requirement
    'glass-safari': '-webkit-backdrop-filter: blur(20px)',
    'btn-animated': 'transition-transform active:scale-95 hover:-translate-y-0.5 will-change-transform',
  },
  safelist: [
    // Preload all heroicons used in admin panel to prevent FOUC
    'i-heroicons-musical-note',
    'i-heroicons-users',
    'i-heroicons-arrow-right',
    'i-heroicons-globe-alt',
    'i-heroicons-eye',
    'i-heroicons-document-arrow-up',
    'i-heroicons-paper-airplane',
    'i-heroicons-photo',
    'i-heroicons-trash',
    'i-heroicons-check-circle',
    'i-heroicons-arrow-top-right-on-square',
    'i-heroicons-arrow-path',
    'i-heroicons-x-mark',
    'i-heroicons-power',
    'i-heroicons-building-office-2',
    'i-heroicons-server',
    'i-heroicons-map-pin',
    'i-heroicons-clock',
    'i-heroicons-signal',
    'i-heroicons-lock-closed',
    'i-heroicons-bolt',
    'i-heroicons-cpu-chip',
    'i-heroicons-computer-desktop',
    'i-heroicons-check',
    'i-heroicons-pencil-square',
    'i-heroicons-eye-slash',
    'i-simple-icons-apple',
    'i-simple-icons-windows',
    'i-simple-icons-android',
  ],
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
