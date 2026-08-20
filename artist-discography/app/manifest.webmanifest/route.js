import { NextResponse } from 'next/server'
import { loadArtistData } from '../../lib/artistData'
import { getLogoDetails } from '../../lib/logoUtils'

export const dynamic = 'force-dynamic'

export async function GET() {
  let artistName = 'Artist'
  let artistBio = ''
  try {
    const { data } = loadArtistData()
    if (data?.artist?.name) artistName = data.artist.name.trim()
    if (data?.artist?.bio) artistBio = data.artist.bio.trim()
  } catch (err) {
    console.error('Error loading artist data for manifest:', err)
  }

  const logoDetails = getLogoDetails()
  const logoMtime = logoDetails.mtimeMs ? Math.floor(logoDetails.mtimeMs) : '1'

  const manifest = {
    name: `${artistName} | Discography`,
    short_name: artistName,
    description: artistBio || `Official discography and music player for ${artistName}`,
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0f',
    theme_color: '#0a0a0f',
    icons: [
      {
        src: `/api/icon?w=192&v=${logoMtime}`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable any',
      },
      {
        src: `/api/icon?w=512&v=${logoMtime}`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable any',
      },
    ],
  }

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  })
}
