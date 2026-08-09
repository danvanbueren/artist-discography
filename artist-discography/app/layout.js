import packageJson from '../package.json'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import Providers from './providers'

const PROJECT_NAME = packageJson.name
  .split('-')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ')

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: PROJECT_NAME,
  description: `${PROJECT_NAME} - A web app designed to showcase an artist's complete music discography, including albums, EPs, singles, and collaborations, with direct links to listen across all published streaming platforms.`,
}

const PLATFORM_ICON_PRELOADS = [
  '/spotify.webp',
  '/apple.webp',
  '/youtube.webp',
  '/soundcloud.webp',
  '/instagram.webp',
  '/facebook.webp',
  '/x.webp',
  '/tiktok.webp',
  '/discord.webp',
  '/snapchat.webp',
  '/bandcamp.webp',
  '/deezer.webp',
  '/tidal.webp',
  '/pandora.webp',
  '/amazon.webp',
  '/itunes.webp',
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
