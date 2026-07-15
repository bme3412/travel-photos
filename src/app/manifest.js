export default function manifest() {
  return {
    name: 'Copy This Trip',
    short_name: 'Copy This Trip',
    description:
      'Choose a trip that really happened, keep what you love, and make it yours.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF6EF',
    theme_color: '#B4441C',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
