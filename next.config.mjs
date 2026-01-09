/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cad.onshape.com'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  outputFileTracing: true,
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Disable static page generation for API routes
    isrMemoryCacheSize: 0,
  },
}

export default nextConfig
