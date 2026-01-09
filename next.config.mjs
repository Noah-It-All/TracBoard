/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cad.onshape.com'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

export default nextConfig
