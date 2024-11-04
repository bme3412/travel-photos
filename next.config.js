/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
      // Remove source-map-loader config as it's causing issues
      config.module.rules.push({
        test: /\.worker\.js$/,
        use: { loader: 'worker-loader' }
      });
      
      return config;
    },
    
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'api.mapbox.com',
        },
        {
          protocol: 'https',
          hostname: 'mapping.api.here.com',
        }
      ],
    },
    
    // Important for Mapbox GL
    transpilePackages: ['mapbox-gl']
  }
  
  module.exports = nextConfig;