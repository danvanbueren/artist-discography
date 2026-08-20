import packageJson from '../package.json'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import './globals.css'
import Providers from './providers'

import { loadArtistData } from '../lib/artistData'
import { getLogoDetails } from '../lib/logoUtils'

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
  const baseTitle = `${name} - Artist Discography`
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://polybitmusic.com'

  let logoMtime = '1'
  try {
    const logoDetails = getLogoDetails()
    if (logoDetails.mtimeMs) {
      logoMtime = Math.floor(logoDetails.mtimeMs).toString()
    }
  } catch {}

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: baseTitle,
      template: `${name} | %s`,
    },
    description: `All music by ${name}, in one place. Direct links to listen across all published streaming platforms.`,
    appleWebApp: {
      title: baseTitle,
      statusBarStyle: 'black-translucent',
    },
    icons: {
      icon: [
        { url: `/api/icon?w=32&v=${logoMtime}`, sizes: '32x32', type: 'image/png' },
        { url: `/api/icon?w=16&v=${logoMtime}`, sizes: '16x16', type: 'image/png' },
      ],
      shortcut: `/api/icon?w=32&v=${logoMtime}`,
      apple: [
        { url: `/api/icon?w=180&v=${logoMtime}`, sizes: '180x180', type: 'image/png' },
      ],
    },
    manifest: `/manifest.webmanifest?v=${logoMtime}`,
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/api/logo?w=240&fmt=webp"
          as="image"
          type="image/webp"
          fetchPriority="high"
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
