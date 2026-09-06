/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Strict Mode
  reactStrictMode: true,
  
  // Experimental features for Next.js 16
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Enable Turbopack (already using in Next.js 16)
  },
  
  // Image optimization
  images: {
    remotePatterns: [],
    // Allow uploads directory
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
  
  // Redirects can be added here if needed
  async redirects() {
    return [];
  },
  
  // Rewrites can be added here if needed
  async rewrites() {
    return [];
  },
  
  // Enable TypeScript type checking during build
  typescript: {
    ignoreBuildErrors: false,
  },
  

  
  // Webpack configuration (if needed for custom loaders)
  webpack: (config) => {
    // Add support for SVG imports
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });
    
    return config;
  },
  
  // Enable compression (Next.js has built-in compression in production)
  compress: true,
  
  // Enable logging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  
  // Output directory
  output: 'standalone',
  
  // Add empty turbopack config to silence warning
  turbopack: {},
};

module.exports = nextConfig;
