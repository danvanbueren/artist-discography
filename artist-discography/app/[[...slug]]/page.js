import { cookies } from 'next/headers'
import { loadArtistData } from '../../lib/artistData'
import MainDiscographyApp from '../../components/discography/MainDiscographyApp'
import { slugify, findProjectBySlug, findTrackBySlug } from '../../lib/slugs'
import { formatProjectDate } from '../../lib/dateUtils'
import { ensureAllMediaReadyFallback } from '../../lib/mediaWarmer'

export async function generateMetadata({ params }) {
  let resolvedParams = {}
  try {
    resolvedParams = (await params) ?? {}
  } catch (err) {}

  let dataResult = null
  try {
    dataResult = loadArtistData()
  } catch (err) {}

  const data = dataResult?.data ?? {}
  const rawArtistName = data?.artist?.name?.trim()
  const artistName = rawArtistName || 'Artist'
  const publicProjects = (data?.projects ?? []).filter((p) => p.visibility !== 'private')
  const slug = resolvedParams?.slug ?? []

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://polybitmusic.com'
  const getAbsoluteUrl = (path) => {
    if (!path) return `${baseUrl}/api/logo?w=1200&fmt=png`
    if (/^https?:\/\//i.test(path)) return path
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`
  }

  // 1. TRACK URL: /[project-slug]/[track-slug]
  if (slug.length >= 2) {
    const projSlug = slug[0]
    const trkSlug = slug[1]
    const project = findProjectBySlug(publicProjects, projSlug)

    if (project) {
      const track = findTrackBySlug(project.tracks ?? [], trkSlug)
      if (track) {
        const trackTitle = track.name || 'Untitled Track'
        const trackArtist = track.artist || project.artist || artistName
        const projectName = project.name || ''

        const title = projectName
          ? `${trackTitle} - ${trackArtist} (${projectName})`
          : `${trackTitle} - ${trackArtist}`

        const description = `Listen to "${trackTitle}" by ${trackArtist} on ${projectName || 'Discography'}. Direct streaming links and in-site audio player.`

        let rawCover = track.cover || project.cover || ''
        let coverWithParams = rawCover
        if (rawCover && rawCover.startsWith('/api/media')) {
          coverWithParams = rawCover.includes('?') ? `${rawCover}&w=1200&q=90&fmt=jpg` : `${rawCover}?w=1200&q=90&fmt=jpg`
        }
        const coverArtUrl = getAbsoluteUrl(coverWithParams)

        return {
          title: { absolute: title },
          description,
          openGraph: {
            title,
            description,
            type: 'music.song',
            url: `${baseUrl}/${projSlug}/${trkSlug}`,
            siteName: `${artistName} - Artist Discography`,
            images: [
              {
                url: coverArtUrl,
                width: 1200,
                height: 1200,
                alt: `${trackTitle} Artwork`,
              },
            ],
          },
          twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [coverArtUrl],
          },
        }
      }
    }
  }

  // 2. PROJECT URL: /[project-slug]
  if (slug.length === 1) {
    const projSlug = slug[0]
    const project = findProjectBySlug(publicProjects, projSlug)

    if (project) {
      const projectName = project.name || 'Project'
      const projectArtist = project.artist || artistName
      const title = `${projectName} - ${projectArtist}`
      const formattedDate = formatProjectDate(project.date)
      const description = `Listen to ${projectName} by ${projectArtist}.${formattedDate ? ` Released ${formattedDate}.` : ''} Stream on Spotify, Apple Music, YouTube, and all major platforms.`

      let rawCover = project.cover || ''
      let coverWithParams = rawCover
      if (rawCover && rawCover.startsWith('/api/media')) {
        coverWithParams = rawCover.includes('?') ? `${rawCover}&w=1200&q=90&fmt=jpg` : `${rawCover}?w=1200&q=90&fmt=jpg`
      }
      const coverArtUrl = getAbsoluteUrl(coverWithParams)

      return {
        title: { absolute: title },
        description,
        openGraph: {
          title,
          description,
          type: 'music.album',
          url: `${baseUrl}/${projSlug}`,
          siteName: `${artistName} - Artist Discography`,
          images: [
            {
              url: coverArtUrl,
              width: 1200,
              height: 1200,
              alt: `${projectName} Cover Art`,
            },
          ],
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: [coverArtUrl],
        },
      }
    }
  }

  // 3. MAIN SITE URL: /
  const title = `${artistName} - Artist Discography`
  const topProjects = publicProjects.slice(0, 3).map((p) => p.name).filter(Boolean)

  let description = `All music by ${artistName}, in one place.`
  if (topProjects.length >= 3) {
    description = `All music by ${artistName}, in one place. Listen to ${topProjects[0]}, ${topProjects[1]}, ${topProjects[2]}, and much more by ${artistName}. Links to your favorite platforms with just one click.`
  } else if (topProjects.length > 0) {
    description = `All music by ${artistName}, in one place. Listen to ${topProjects.join(', ')}, and much more by ${artistName}. Links to your favorite platforms with just one click.`
  } else {
    description = `All music by ${artistName}, in one place. Links to your favorite platforms with just one click.`
  }

  const logoImageUrl = getAbsoluteUrl('/api/logo?w=1200&fmt=png')

  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: baseUrl,
      siteName: `${artistName} - Artist Discography`,
      images: [
        {
          url: logoImageUrl,
          width: 1200,
          height: 630,
          alt: `${artistName} Logo`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [logoImageUrl],
    },
  }
}

export default async function Page({ params }) {
  let resolvedParams = {}
  try {
    resolvedParams = (await params) ?? {}
  } catch (err) {
    console.error('Failed to resolve page params:', err)
  }

  let initialThemeMode = null
  try {
    const cookieStore = await cookies()
    initialThemeMode = cookieStore.get('theme_mode')?.value || null
  } catch (err) {}

  let dataResult = null
  try {
    dataResult = loadArtistData()
  } catch (err) {
    console.error('Error loading artist data in Page:', err)
  }

  const data = dataResult?.data ?? {}
  const health = dataResult?.health ?? { isHealthy: false, createdNewFile: false, issues: ['Failed to load data'] }

  // Background fallback check: verifies and warms any missing optimized media assets
  try {
    ensureAllMediaReadyFallback(data)
  } catch (err) {
    console.warn('Fallback media readiness check warning:', err)
  }

  return (
    <MainDiscographyApp
      data={data}
      health={health}
      initialSlug={resolvedParams?.slug ?? []}
      initialThemeMode={initialThemeMode}
    />
  )
}
