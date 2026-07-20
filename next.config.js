/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd1mnon53ja4k10.cloudfront.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'global-travel.s3.us-east-1.amazonaws.com',
        port: '',
        pathname: '/albums/**',
      }
    ],
    minimumCacheTTL: 3600,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      // The destination hub shipped briefly as /cities before the segment
      // was renamed to match the product term.
      {
        source: '/cities/:city',
        destination: '/destinations/:city',
        permanent: true,
      },
      // The copy flow moved from the visit (/trips/<city>-<year>/copy) to
      // the destination hub. Copy-enabled trips all follow the
      // `<city>-<year>` id convention, which is what lets the year drop out.
      {
        source: '/trips/:city-:year(\\d{4})/copy/:path*',
        destination: '/destinations/:city/copy/:path*',
        permanent: true,
      },
    ];
  },
  webpack: (config) => {
    // Add fallback for 'fs' module required by Mapbox GL
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
  // Allow Mapbox GL JS to work in Next.js environment
  transpilePackages: ['mapbox-gl'],
};

module.exports = nextConfig;