/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force server to always run on port 3000
  serverRuntimeConfig: {
    port: 3000
  },
  // Optional: Additional Next.js configuration
  reactStrictMode: true,
  basePath: '',
};

module.exports = nextConfig;
