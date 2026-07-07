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
        paper: '#FAF6EF',
        ink: '#1B1713',
        accent: '#B4441C',
        muted: '#8A8075',
      },
      fontFamily: {
        lora: ['Lora', 'serif'],
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-archivo)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'world-map': "url('/images/world-map-pattern.png')",
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'spin-slow': 'spin 10s linear infinite',
        'fade-in': 'fade-in 0.45s ease',
      },
    },
  },
  darkMode: 'media',
  plugins: [],
};