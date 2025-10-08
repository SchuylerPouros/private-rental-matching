/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  distDir: 'out',
  // basePath: '/private-rental-matching', // Temporarily disabled for local testing
}

module.exports = nextConfig
