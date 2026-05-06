import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ],
  },
};

export default nextConfig;
