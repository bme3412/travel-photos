// tailwind.config.js
module.exports = {
    content: [
      './src/**/*.{js,jsx,ts,tsx}', // Ensure all relevant files are included
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
    darkMode: 'media', // Enables dark mode based on user's system preferences
    plugins: [],
  };
  