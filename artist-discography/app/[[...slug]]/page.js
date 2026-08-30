import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { loadArtistData, normalizeSiteUrl } from '@/lib/data/artistData'
import DiscographyApp from '@/components/discography/DiscographyApp'
import { slugify, findProjectBySlug, findTrackBySlug } from '@/lib/data/slugs'
import { formatProjectDate } from '@/lib/data/dateUtils'
import {
  resolveGeneralOgContext,
  resolveProjectOgContext,
  resolveTrackOgContext,
} from '@/lib/media/og/ogEntityResolver'

const STATIC_ASSET_REGEX =
  /\.(js|mjs|cjs|css|map|json|png|jpg|jpeg|webp|gif|svg|ico|txt|xml|woff|woff2|ttf|eot)$/i

function isStaticAssetSlug(slug = []) {
  if (!Array.isArray(slug)) return false
  return slug.some(
    (segment) =>
      typeof segment === 'string' && (STATIC_ASSET_REGEX.test(segment) || segment.startsWith('_')),
  )
}

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
  if (isStaticAssetSlug(slug)) {
    return {}
  }

  const rawSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || data?.siteUrl || data?.artist?.siteUrl || ''
  const baseUrl = normalizeSiteUrl(rawSiteUrl)

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

        let trackContext = null
        try {
          trackContext = await resolveTrackOgContext(projSlug, trkSlug)
        } catch (ogErr) {
          console.warn('Error resolving track OG context:', ogErr.message)
        }

        const ogVersion = trackContext?.hash ? `&v=${trackContext.hash}` : ''
        const ogImageUrl = `${baseUrl}/api/og?proj=${encodeURIComponent(projSlug)}&track=${encodeURIComponent(trkSlug)}${ogVersion}`
        const themeColorHex = trackContext?.palette?.themeColorHex || '#5865F2'

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
                url: ogImageUrl,
                width: 1200,
                height: 630,
                type: 'image/png',
                alt: `${trackTitle} Artwork`,
              },
            ],
          },
          twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImageUrl],
          },
          other: {
            'theme-color': themeColorHex,
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

      let projContext = null
      try {
        projContext = await resolveProjectOgContext(projSlug)
      } catch (ogErr) {
        console.warn('Error resolving project OG context:', ogErr.message)
      }

      const ogVersion = projContext?.hash ? `&v=${projContext.hash}` : ''
      const ogImageUrl = `${baseUrl}/api/og?proj=${encodeURIComponent(projSlug)}${ogVersion}`
      const themeColorHex = projContext?.palette?.themeColorHex || '#5865F2'

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
              url: ogImageUrl,
              width: 1200,
              height: 630,
              type: 'image/png',
              alt: `${projectName} Cover Art`,
            },
          ],
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: [ogImageUrl],
        },
        other: {
          'theme-color': themeColorHex,
        },
      }
    }
  }

  // 3. MAIN SITE URL: /
  const title = `${artistName} | Discography`
  const topProjects = publicProjects
    .slice(0, 3)
    .map((p) => p.name)
    .filter(Boolean)

  let description = `All music by ${artistName}, in one place.`
  if (topProjects.length >= 3) {
    description = `All music by ${artistName}, in one place. Listen to ${topProjects[0]}, ${topProjects[1]}, ${topProjects[2]}, and much more by ${artistName}. Links to your favorite platforms with just one click.`
  } else if (topProjects.length > 0) {
    description = `All music by ${artistName}, in one place. Listen to ${topProjects.join(', ')}, and much more by ${artistName}. Links to your favorite platforms with just one click.`
  } else {
    description = `All music by ${artistName}, in one place. Links to your favorite platforms with just one click.`
  }

  let generalContext = null
  try {
    generalContext = await resolveGeneralOgContext()
  } catch (ogErr) {
    console.warn('Error resolving general OG context:', ogErr.message)
  }

  const ogVersion = generalContext?.hash ? `?v=${generalContext.hash}` : ''
  const ogImageUrl = `${baseUrl}/api/og${ogVersion}`
  const themeColorHex = generalContext?.palette?.themeColorHex || '#5865F2'

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
          url: ogImageUrl,
          width: 1200,
          height: 630,
          type: 'image/png',
          alt: `${artistName} Logo`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
    other: {
      'theme-color': themeColorHex,
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

  const slug = resolvedParams?.slug ?? []
  if (isStaticAssetSlug(slug)) {
    notFound()
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
  const health = dataResult?.health ?? {
    isHealthy: false,
    createdNewFile: false,
    issues: ['Failed to load data'],
  }

  return (
    <DiscographyApp
      data={data}
      health={health}
      initialSlug={resolvedParams?.slug ?? []}
      initialThemeMode={initialThemeMode}
    />
  )
}
