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
        // Core palette
        background: "#050810",
        foreground: "#ffffff",
        // Accent
        accent: {
          DEFAULT: "#ff4d4d",
          hover: "#ff6b6b",
          muted: "rgba(255, 77, 77, 0.15)",
        },
        // Surface colors
        surface: {
          DEFAULT: "#0d1117",
          elevated: "#161b22",
          border: "#21262d",
        },
        // Text colors
        text: {
          primary: "#ffffff",
          secondary: "#8b949e",
          muted: "#6e7681",
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
