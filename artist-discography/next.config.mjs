/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingExcludes: {
    '*': ['./data/**/*', './data/cache/**/*'],
  },
  serverExternalPackages: ['sharp'],
  async rewrites() {
    return [
      {
        source: '/_sys/_admin/:path*',
        destination: '/sys/admin/:path*',
      },
      {
        source: '/manifest.json',
        destination: '/manifest.webmanifest',
      },
      {
        source: '/apple-touch-icon-precomposed.png',
        destination: '/apple-touch-icon.png',
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/_sys/_dev/:path*',
        destination: '/_sys/_admin/:path*',
        permanent: false,
      },
      {
        source: '/sys/dev/:path*',
        destination: '/_sys/_admin/:path*',
        permanent: false,
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
