import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @sparticuz/chromium ships a chromium binary that must NOT be bundled by
  // Webpack/Turbopack — it has to be left as a real node_module so the file
  // path resolves at runtime in the serverless function. puppeteer-core is
  // grouped with it to keep them in sync.
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  // Vercel's file tracer only bundles JS files referenced from imports. The
  // chromium binary is resolved at runtime via `chromium.executablePath()`,
  // so the tracer misses /bin entirely and the function 500s with
  // "The input directory /var/task/node_modules/@sparticuz/chromium/bin
  // does not exist." Force-include those binary assets here for the
  // /api/generate-invoice route.
  outputFileTracingIncludes: {
    '/api/generate-invoice': [
      './node_modules/@sparticuz/chromium/bin/**/*',
    ],
  },
  images: {
    // Disable image optimization to reduce server load on shared hosting
    unoptimized: process.env.DISABLE_IMAGE_OPTIMIZATION === 'true',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'videos.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Prevents clickjacking
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Prevents MIME type sniffing
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block', // XSS protection for older browsers
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin', // Controls referrer info
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)', // Restrict permissions
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains', // HTTPS only (1 year)
          },
        ],
      },
      {
        // Additional security for API routes
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0', // No caching for API responses
          },
        ],
      },
    ];
  },
};

export default nextConfig;
