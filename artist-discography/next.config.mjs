/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingExcludes: {
    '*': ['./data/cache/**/*'],
  },
  serverExternalPackages: ['sharp'],
  async rewrites() {
    return [
      {
        source: '/_sys/_admin',
        destination: '/sys/admin',
      },
      {
        source: '/_sys/_dev',
        destination: '/sys/dev',
      },
      {
        source: '/manifest.json',
        destination: '/manifest.webmanifest',
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|webp)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

export default nextConfig
