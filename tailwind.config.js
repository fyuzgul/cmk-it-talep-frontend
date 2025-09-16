/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-red': 'rgb(230, 2, 17)',
        'primary-dark': 'rgb(41, 41, 38)',
        'primary-red-50': 'rgba(230, 2, 17, 0.05)',
        'primary-red-100': 'rgba(230, 2, 17, 0.1)',
        'primary-red-200': 'rgba(230, 2, 17, 0.2)',
        'primary-red-300': 'rgba(230, 2, 17, 0.3)',
        'primary-red-400': 'rgba(230, 2, 17, 0.4)',
        'primary-red-500': 'rgba(230, 2, 17, 0.5)',
        'primary-red-600': 'rgba(230, 2, 17, 0.6)',
        'primary-red-700': 'rgba(230, 2, 17, 0.7)',
        'primary-red-800': 'rgba(230, 2, 17, 0.8)',
        'primary-red-900': 'rgba(230, 2, 17, 0.9)',
        'primary-dark-50': 'rgba(41, 41, 38, 0.05)',
        'primary-dark-100': 'rgba(41, 41, 38, 0.1)',
        'primary-dark-200': 'rgba(41, 41, 38, 0.2)',
        'primary-dark-300': 'rgba(41, 41, 38, 0.3)',
        'primary-dark-400': 'rgba(41, 41, 38, 0.4)',
        'primary-dark-500': 'rgba(41, 41, 38, 0.5)',
        'primary-dark-600': 'rgba(41, 41, 38, 0.6)',
        'primary-dark-700': 'rgba(41, 41, 38, 0.7)',
        'primary-dark-800': 'rgba(41, 41, 38, 0.8)',
        'primary-dark-900': 'rgba(41, 41, 38, 0.9)',
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
}
