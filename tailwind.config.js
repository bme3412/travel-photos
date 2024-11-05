module.exports = {
  content: [
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          700: '#0d9488',
          300: '#5eead4',
        },
      },
      fontFamily: {
        lora: ['Lora', 'serif'],
      },
      backgroundImage: {
        'world-map': "url('/images/world-map-pattern.png')",
      },
      animation: {
        'spin-slow': 'spin 10s linear infinite',
      },
    },
  },
  darkMode: 'media',
  plugins: [],
};