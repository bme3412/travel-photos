/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'mapbox-gl': require.resolve('mapbox-gl'),
    }
    return config
  },
  experimental: {
    webpackBuildWorker: true
  }
}

module.exports = nextConfig