/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001']
    }
  },
  images: {
    domains: ['localhost', 'a400-webapp.azurewebsites.net'],
  },
}

module.exports = nextConfig