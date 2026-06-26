/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── SOOLE BRAND PALETTE (8 official colors only) ──────────────────────
        // #042011  dark green    → primary background / text
        // #254832  forest green  → primary-400
        // #1D754C  emerald green → secondary / success
        // #095B4F  teal green    → teal / accent dark
        // #A7C957  light green   → accent highlight
        // #DEDBEC  light gray    → backgrounds / borders / neutral
        // #7A95D8  cornflower    → info / secondary text
        // #BB7832  golden brown  → warning / alert

        primary: {
          '50':  '#DEDBEC',
          '75':  '#DEDBEC',
          '100': '#DEDBEC',
          '200': '#7A95D8',
          '300': '#254832',
          '400': '#254832',
          '500': '#042011',
          DEFAULT: '#042011',
        },
        secondary: {
          '50':  '#DEDBEC',
          '100': '#A7C957',
          '200': '#254832',
          '300': '#1D754C',
          '400': '#095B4F',
          '500': '#042011',
          DEFAULT: '#1D754C',
        },
        accent: {
          '50':  '#DEDBEC',
          '100': '#DEDBEC',
          '200': '#A7C957',
          '300': '#A7C957',
          '400': '#A7C957',
          '500': '#A7C957',
          DEFAULT: '#A7C957',
        },
        teal: {
          '50':  '#DEDBEC',
          '100': '#DEDBEC',
          '200': '#095B4F',
          '300': '#095B4F',
          '400': '#095B4F',
          '500': '#042011',
          DEFAULT: '#095B4F',
        },
        // Golden brown → warning / alert colour
        warning: {
          '50':  '#DEDBEC',
          '100': '#DEDBEC',
          '200': '#BB7832',
          '300': '#BB7832',
          '400': '#BB7832',
          '500': '#BB7832',
          DEFAULT: '#BB7832',
          light:   '#DEDBEC',
          dark:    '#BB7832',
        },
        // Danger uses golden brown (no red in brand palette)
        danger: {
          '50':  '#DEDBEC',
          '100': '#DEDBEC',
          '200': '#BB7832',
          '300': '#BB7832',
          '400': '#BB7832',
          '500': '#BB7832',
          DEFAULT: '#BB7832',
          light:   '#DEDBEC',
          dark:    '#BB7832',
        },
        success: {
          '50':  '#DEDBEC',
          '100': '#DEDBEC',
          '200': '#1D754C',
          '300': '#1D754C',
          '400': '#1D754C',
          '500': '#1D754C',
          DEFAULT: '#1D754C',
          light:   '#DEDBEC',
        },
        neutral: {
          '50':  '#DEDBEC',
          '100': '#DEDBEC',
          '200': '#7A95D8',
          '300': '#7A95D8',
          '400': '#095B4F',
          '500': '#042011',
          DEFAULT: '#DEDBEC',
        },
        info: {
          '50':  '#DEDBEC',
          '100': '#DEDBEC',
          '200': '#7A95D8',
          '300': '#7A95D8',
          '400': '#7A95D8',
          '500': '#7A95D8',
          DEFAULT: '#7A95D8',
        },
      },
      fontFamily: {
        sans:    ['Geist', 'system-ui', 'sans-serif'],
        display: ['Funnel Display', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        form: '16px',
        card: '20px',
        btn:  '32px',
      },
      boxShadow: {
        card:         '0 2px 12px rgba(4,32,17,0.07)',
        'card-hover': '0 4px 20px rgba(4,32,17,0.13)',
        float:        '0 8px 32px rgba(4,32,17,0.18)',
      },
    },
  },
  plugins: [],
}
