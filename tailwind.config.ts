import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7f1', 100: '#d6ecdd', 200: '#aedbbd',
          300: '#7fc596', 400: '#4fa96e', 500: '#2f8f52',
          600: '#217140', 700: '#1b5a34', 800: '#17482b', 900: '#123a23'
        }
      }
    }
  },
  plugins: []
}
export default config
