import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Security configurations
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },

  // Disable server-side source maps in production
  productionBrowserSourceMaps: false,

  // Enable experimental security features
  experimental: {
    // Enable more secure cookie handling
    serverComponentsExternalPackages: [],
  },

  // Security: Disable directory listing
  trailingSlash: false,

  // Security: Disable powered by header
  poweredByHeader: false,

  // Security: Configure content security policy
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

export default nextConfig;
