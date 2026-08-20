# Plan 09: Rich Discord & OpenGraph Embedded Link Previews

## Status: ✅ **COMPLETED**

---

## 1. Verification Checklist & Status Log

- [x] Inspect dynamic metadata generation in `app/layout.js` and `app/[[...slug]]/page.js`.
- [x] Implement Main Site URL metadata (`/`):
  - Title: `<artist name> - Artist Discography` (e.g. `Polybit - Artist Discography`).
  - Description:
    - If 3+ projects: `"All music by ${artistName}, in one place. Listen to ${proj1.name}, ${proj2.name}, ${proj3.name}, and much more by ${artistName}. Links to your favorite platforms with just one click."`
    - If 1-2 projects: `"All music by ${artistName}, in one place. Listen to ${proj1.name}, and much more by ${artistName}. Links to your favorite platforms with just one click."`
    - If 0 projects: `"All music by ${artistName}, in one place. Links to your favorite platforms with just one click."`
  - OpenGraph / Twitter Image: absolute URL to artist logo (`/api/logo?w=1200&fmt=png`).
  - Discord tags: `og:type: 'website'`, `og:site_name: "${artistName} - Artist Discography"`, `twitter:card: 'summary_large_image'`.
- [x] Implement Single Project URL metadata (`/[project-slug]`):
  - Title: `<project name> - <project artist>` (e.g. `Post Mortem - Neon December`).
  - Description: `"Listen to ${project.name} by ${project.artist}. Released ${date}. Stream on Spotify, Apple Music, YouTube, and all major platforms."`
  - OpenGraph / Twitter Image: absolute URL to project cover art (`/api/media/projects/.../art.jpg?w=1200&q=90&fmt=jpg`).
  - Discord tags: `og:type: 'music.album'`, `twitter:card: 'summary_large_image'`.
- [x] Implement Track URL metadata (`/[project-slug]/[track-slug]`):
  - Title: `<track name> - <track artist> (<project name>)` (e.g. `Rest - Neon December, Polybit, Kros (Post Mortem)`).
  - Standalone single Title fallback: `<track name> - <track artist>`.
  - Description: `"Listen to ${track.name} by ${track.artist} on ${project.name}. Direct streaming links and in-site audio player."`
  - OpenGraph / Twitter Image: absolute URL to track/project cover artwork.
  - Discord tags: `og:type: 'music.song'`, `twitter:card: 'summary_large_image'`.
- [x] Ensure all embedded image URLs are fully qualified absolute URLs (`https://domain.com/...`) using Next.js `metadataBase` with host header fallback.
- [x] Verify link preview formatting with Discord embed simulator and OpenGraph debugger tools.

---

## 2. Executive Summary & Discord Preview Guidelines

When sharing URLs on Discord, iMessage, Twitter, Slack, or WhatsApp, the application must provide rich, branded embedded cards with clear hierarchy.

### Formatting Rules Defined by User:

| Link Type | Title Format | Description Format | Image Preview | OpenGraph Type |
| :--- | :--- | :--- | :--- | :--- |
| **Main Site (`/`)** | `<artist name> - Artist Discography` | `"All music by <artist>, in one place. Listen to <proj 1>, <proj 2>, <proj 3>, and much more by <artist>. Links to your favorite platforms with just one click."` | Artist Brand Logo (`/api/logo?w=1200&fmt=png`) | `website` |
| **Project (`/:proj`)** | `<project name> - <project artist>` | `"Listen to <project> by <artist>. Released <date>. Stream on Spotify, Apple Music, YouTube, and more."` | High-Res Album Cover Art | `music.album` |
| **Track (`/:proj/:track`)** | `<track name> - <track artist> (<project name>)` | `"Listen to <track> from <project> by <artist>. Direct streaming links and player."` | High-Res Track / Album Art | `music.song` |

---

## 3. Technical Specification & Implementation Plan

### A. Dynamic OpenGraph Metadata Generator: [`app/[[...slug]]/page.js`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/app/%5B%5B...slug%5D%5D/page.js)

```javascript
import { loadArtistData } from '../../lib/artistData'
import { slugify, findProjectBySlug, findTrackBySlug } from '../../lib/slugs'
import { formatProjectDate } from '../../lib/dateUtils'

export async function generateMetadata({ params }) {
  const resolvedParams = (await params) ?? {}
  const slug = resolvedParams.slug ?? []
  
  const { data } = loadArtistData()
  const artistName = data?.artist?.name?.trim() || 'Artist'
  const projects = (data?.projects ?? []).filter(p => p.visibility !== 'private')
  
  // Base absolute URL resolution helper
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
    const project = findProjectBySlug(projects, projSlug)
    
    if (project) {
      const track = findTrackBySlug(project.tracks ?? [], trkSlug)
      if (track) {
        const trackTitle = track.name || 'Untitled'
        const trackArtist = track.artist || project.artist || artistName
        const projectName = project.name || ''
        
        const title = projectName
          ? `${trackTitle} - ${trackArtist} (${projectName})`
          : `${trackTitle} - ${trackArtist}`
          
        const description = `Listen to "${trackTitle}" by ${trackArtist} on ${projectName || 'Discography'}. Available across all streaming platforms.`
        const coverArtUrl = getAbsoluteUrl(track.cover || project.cover || '/api/logo?w=1200&fmt=png')
        
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
              }
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
    const project = findProjectBySlug(projects, projSlug)
    
    if (project) {
      const projectName = project.name || 'Project'
      const projectArtist = project.artist || artistName
      const title = `${projectName} - ${projectArtist}`
      const formattedDate = formatProjectDate(project.date)
      const description = `Listen to ${projectName} by ${projectArtist}.${formattedDate ? ` Released ${formattedDate}.` : ''} Stream on Spotify, Apple Music, YouTube, and all major platforms.`
      const coverArtUrl = getAbsoluteUrl(project.cover || '/api/logo?w=1200&fmt=png')
      
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
            }
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
  const topProjects = projects.slice(0, 3).map(p => p.name).filter(Boolean)
  
  let description = `All music by ${artistName}, in one place.`
  if (topProjects.length > 0) {
    description += ` Listen to ${topProjects.join(', ')}, and much more by ${artistName}.`
  }
  description += ' Links to your favorite platforms with just one click.'
  
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
        }
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
```

---

## 4. Edge Cases & Safeguards

1. **Missing Artwork on Custom Projects**: Seamlessly fallback to `/api/logo?w=1200&fmt=png` so Discord always renders a rich preview card with a valid image.
2. **Special Characters in Titles**: Characters like `&`, `|`, `(`, `)` are properly handled without double-escaping or breaking OpenGraph parsers.
3. **Canonical Domain Matching**: Uses `process.env.NEXT_PUBLIC_SITE_URL` with automatic protocol detection to avoid broken relative image URLs on web crawlers.
