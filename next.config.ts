import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  output: 'standalone',
  distDir: process.env.IADDS_REVIEW_BUILD==='true'?'.next-review':'.next',
  outputFileTracingExcludes: { '/*': ['./.data/**/*','./docs/**/*','./qa/**/*'] },
  poweredByHeader: false,
  experimental: { cpus: 1, webpackMemoryOptimizations: true },
  turbopack: { root: path.resolve(process.cwd()) },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Content-Security-Policy', value: "object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'" },
    ] }];
  },
};
export default nextConfig;
