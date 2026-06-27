/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── SOOLE BRAND PALETTE ───────────────────────────────────────────────
        // #254832  Forest Green  → primary brand (primary-400)
        // #042011  Dark Green    → headers, dark surfaces (primary-500)
        // #1D754C  Emerald Green → secondary buttons, success (secondary-300)
        // #095B4F  Teal Green    → accents, links (teal-300)
        // #A7C957  Light Green   → highlights, accent (accent-400)
        // #DEDBEC  Light Gray    → borders, subtle backgrounds (neutral-100)
        // #FFFFFF  White         → backgrounds, text on dark
        // #BB7832  Golden Brown  → warnings, alerts (warning/danger)

        primary: {
          '50': '#eef4f0',   // very light forest green tint — hover states
          '75': '#dce9df',   // light tint — active nav bg, card accents
          '100': '#c3d9c9',  // medium-light tint — borders on primary elements
          '200': '#8aad96',  // medium — muted text on dark backgrounds
          '300': '#4d7a5e',  // medium-dark — secondary elements
          '400': '#254832',  // Forest Green — main brand color
          '500': '#042011',  // Dark Green — headers, primary surfaces
          DEFAULT: '#254832',
        },
        secondary: {
          '50': '#ebf5ef',
          '100': '#c8e5d4',
          '200': '#8ec8a7',
          '300': '#1D754C',  // Emerald Green — success, secondary actions
          '400': '#16593a',
          '500': '#0f3d28',
          DEFAULT: '#1D754C',
        },
        accent: {
          '50': '#f8fcf0',
          '100': '#edf7d5',
          '200': '#d4ea99',
          '300': '#bfdf6a',
          '400': '#A7C957',  // Light Green — highlights, badges, growth
          '500': '#8aaa3a',
          DEFAULT: '#A7C957',
        },
        teal: {
          '50': '#eaf3f2',
          '100': '#bde0dc',
          '200': '#6bb8af',
          '300': '#095B4F',  // Teal Green — accents, links
          '400': '#074841',
          '500': '#042011',
          DEFAULT: '#095B4F',
        },
        // Golden brown → warning / alert colour
        warning: {
          '50': '#fdf3e8',
          '100': '#f9ddb4',
          '200': '#f2b96c',
          '300': '#e89640',
          '400': '#BB7832',
          '500': '#8a5623',
          DEFAULT: '#BB7832',
          light: '#f2b96c',
          dark: '#8a5623',
        },
        // Danger uses golden brown (no red in brand palette)
        danger: {
          '50': '#fdf3e8',
          '100': '#f9ddb4',
          '200': '#f2b96c',
          '300': '#e89640',
          '400': '#BB7832',
          '500': '#8a5623',
          DEFAULT: '#BB7832',
          light: '#f2b96c',
          dark: '#8a5623',
        },
        success: {
          '50': '#ebf5ef',
          '100': '#c8e5d4',
          '200': '#8ec8a7',
          '300': '#1D754C',
          '400': '#16593a',
          '500': '#0f3d28',
          DEFAULT: '#1D754C',
          light: '#c8e5d4',
        },
        neutral: {
          '50': '#f5f4fa',   // very subtle — used for hover states, skeletons
          '100': '#DEDBEC',  // Light Gray brand — borders, dividers
          '200': '#042011',  // medium — muted / secondary text
          '300': '#9491b4',  // darker muted text
          '400': '#6a6898',
          '500': '#42415f',
          DEFAULT: '#DEDBEC',
        },
        info: {
          '50': '#eef1fb',
          '100': '#c8d3f0',
          '200': '#9aaee2',
          '300': '#7A95D8',
          '400': '#5c7bc9',
          '500': '#3d5ea8',
          DEFAULT: '#7A95D8',
        },
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        display: ['Funnel Display', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        form: '16px',
        card: '20px',
        btn: '32px',
      },
      spacing: {
        '76': '19rem',
      },
      boxShadow: {
        card: '0 2px 12px rgba(4,32,17,0.07)',
        'card-hover': '0 4px 20px rgba(4,32,17,0.13)',
        float: '0 8px 32px rgba(4,32,17,0.18)',
      },
    },
  },
  plugins: [],
}
