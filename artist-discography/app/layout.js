import packageJson from '../package.json'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import Providers from './providers'

import { loadArtistData } from '../lib/artistData'

const DEFAULT_PROJECT_NAME = packageJson.name
  .split('-')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ')

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata() {
  let artistName = ''
  try {
    const { data } = loadArtistData()
    artistName = data?.artist?.name?.trim() || ''
  } catch (err) {
    console.error('Error reading artist name for metadata:', err)
  }

  const name = artistName || 'Artist'
  const baseTitle = `${name} | Discography`

  return {
    title: {
      default: baseTitle,
      template: `${name} | %s`,
    },
    description: `${baseTitle} - A web app designed to showcase an artist's complete music discography, including albums, EPs, singles, and collaborations, with direct links to listen across all published streaming platforms.`,
    appleWebApp: {
      title: baseTitle,
    },
    icons: {
      icon: '/api/icon?v=custom',
      shortcut: '/api/icon?v=custom',
      apple: '/api/icon?v=custom',
    },
    manifest: '/favicons/manifest.json',
  }
}

const PLATFORM_ICON_PRELOADS = [
  '/platforms/spotify.webp',
  '/platforms/apple.webp',
  '/platforms/youtube.webp',
  '/platforms/soundcloud.webp',
  '/platforms/instagram.webp',
  '/platforms/facebook.webp',
  '/platforms/x.webp',
  '/platforms/tiktok.webp',
  '/platforms/discord.webp',
  '/platforms/snapchat.webp',
  '/platforms/bandcamp.webp',
  '/platforms/deezer.webp',
  '/platforms/tidal.webp',
  '/platforms/pandora.webp',
  '/platforms/amazon.webp',
  '/platforms/itunes.webp',
]

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {PLATFORM_ICON_PRELOADS.map(iconPath => (
          <link
            key={iconPath}
            rel="preload"
            href={iconPath}
            as="image"
            type="image/webp"
            fetchPriority="high"
          />
        ))}
      </head>
      <body suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
