import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@kurumsal/shared'],
  // Monorepo kök ESLint kullanılır; `npm run lint` ile çalıştırılır
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
