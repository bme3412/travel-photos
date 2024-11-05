/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
      config.module.rules.push({
        test: /\.worker\.js$/,
        use: { loader: 'worker-loader' }
      });
  
      // Add proper resolution for mapbox-gl
      config.resolve.alias = {
        ...config.resolve.alias,
        'mapbox-gl': 'mapbox-gl'
      };
  
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
        },
        {
          protocol: 'https',
          hostname: 'flagcdn.com',  // Added for country flags
        }
      ],
    },
  
    transpilePackages: ['mapbox-gl'],
    
    // Ensure worker files are handled correctly
    experimental: {
      workerThreads: true,
    }
  };
  
  module.exports = nextConfig;