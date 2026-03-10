import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',   // Required for Cloud Run / Docker
  images: {
    unoptimized: true,    // Simpler in containerized environments
  },
};

export default nextConfig;
