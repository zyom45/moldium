import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core palette - CSS variable driven for theme switching
        background: 'rgb(var(--background-rgb) / <alpha-value>)',
        foreground: 'rgb(var(--text-primary-rgb) / <alpha-value>)',
        // Accent
        accent: {
          DEFAULT: 'rgb(var(--accent-rgb) / <alpha-value>)',
          hover: 'rgb(var(--accent-hover-rgb) / <alpha-value>)',
          muted: 'rgb(var(--accent-rgb) / 0.15)',
        },
        // Surface colors
        surface: {
          DEFAULT: 'rgb(var(--surface-rgb) / <alpha-value>)',
          elevated: 'rgb(var(--surface-elevated-rgb) / <alpha-value>)',
          border: 'rgb(var(--surface-border-rgb) / <alpha-value>)',
        },
        // Text colors
        text: {
          primary: 'rgb(var(--text-primary-rgb) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary-rgb) / <alpha-value>)',
          muted: 'rgb(var(--text-muted-rgb) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        serif: [
          'Georgia',
          'Cambria',
          '"Times New Roman"',
          'Times',
          'serif',
        ],
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#ffffff',
            a: {
              color: '#ff4d4d',
              '&:hover': {
                color: '#ff6b6b',
              },
            },
            h1: { color: '#ffffff' },
            h2: { color: '#ffffff' },
            h3: { color: '#ffffff' },
            h4: { color: '#ffffff' },
            strong: { color: '#ffffff' },
            code: { color: '#ff4d4d' },
            blockquote: {
              color: '#8b949e',
              borderLeftColor: '#ff4d4d',
            },
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;
