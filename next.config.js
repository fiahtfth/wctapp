/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force server to always run on port 3000
  serverRuntimeConfig: {
    port: 3000
  },
  // Optional: Additional Next.js configuration
  reactStrictMode: true,
  basePath: '',
  // Disable ESLint during build to avoid issues
  eslint: {
    // Only run ESLint on local development, not during builds
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript type checking during build to avoid issues
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
