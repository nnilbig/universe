import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

export default <Partial<Config>>{
  darkMode: 'class',
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.{js,ts}',
    './app.vue',
    './error.vue'
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#0A0A0B',
          900: '#121214',
          800: '#1C1C1F',
          700: '#2A2A2E'
        },
        gold: {
          DEFAULT: '#C9A24B',
          light: '#E4C97A',
          dark: '#9C7B2E'
        },
        titanium: {
          DEFAULT: '#9CA3AA',
          light: '#C7CCD1',
          dark: '#6B7076'
        }
      },
      fontFamily: {
        // Inter first for Latin glyphs (weight does the differentiating between body/headings);
        // Noto Sans TC covers the CJK glyphs Inter doesn't have — the browser falls through to it
        // per-character, so mixed zh/en text renders each script in its own font automatically.
        sans: ['Inter', 'Noto Sans TC', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Inter', 'Noto Sans TC', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #9C7B2E, #E4C97A, #9C7B2E)',
        'titanium-gradient': 'linear-gradient(135deg, #6B7076, #C7CCD1, #6B7076)'
      },
      borderRadius: {
        card: '1rem'
      }
    }
  },
  plugins: [animate]
}
