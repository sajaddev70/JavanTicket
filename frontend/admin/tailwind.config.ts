import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#16a34a',
          600: '#15803d',
          700: '#166534',
        },
        brand: {
          blue: '#2563eb',
          purple: '#7c3aed',
          dark: '#0f172a',
        }
      },
      fontFamily: {
        sans: ['vazirmatn', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
