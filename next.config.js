/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: 'dist',
  experimental: {
    appDir: true,
  },
  // Specify the source directory
  srcDir: 'src',
};

module.exports = nextConfig;
