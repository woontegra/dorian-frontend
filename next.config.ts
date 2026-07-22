import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@kurumsal/shared'],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;