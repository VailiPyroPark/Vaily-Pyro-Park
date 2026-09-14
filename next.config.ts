import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable gzip / brotli compression to minimize egress payload
  compress: true,

  // Remove x-powered-by header for security & byte saving
  poweredByHeader: false,

  // Image optimization settings for minimal Vercel usage and high caching efficiency
  images: {
    minimumCacheTTL: 31536000, // 1 year cache for optimized images on Vercel Edge CDN
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200],
    imageSizes: [32, 48, 64, 96, 128, 256],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'crmrxohserrcjvwhgylc.supabase.co',
        pathname: '/**',
      },
    ],
  },

  // HTTP caching headers to instruct browsers & CDNs to aggressively cache static assets
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|ico|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/favicon.ico',
        destination: '/favicon.ico',
      },
    ];
  },
};

export default nextConfig;
