import { loadArtistData } from '../../lib/artistData'
import MainDiscographyApp from '../../components/MainDiscographyApp'
import { slugify } from '../../lib/slugs'

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
  const baseTitle = `${artistName} | Discography`
  const projects = data?.projects ?? []
  const slug = resolvedParams?.slug ?? []

  if (slug.length === 1) {
    const projSlug = slug[0]
    const project = projects.find(p => slugify(p.name || '') === projSlug)
    if (project?.name) {
      return {
        title: `${artistName} | ${project.name}`,
        description: `Listen to ${project.name} by ${artistName}.`,
      }
    }
  } else if (slug.length === 2) {
    const projSlug = slug[0]
    const trkSlug = slug[1]
    const project = projects.find(p => slugify(p.name || '') === projSlug)
    if (project) {
      const track = (project.tracks || []).find(t => slugify(t.name || '') === trkSlug)
      if (track?.name) {
        return {
          title: `${artistName} | ${track.name}`,
          description: `Listen to ${track.name} from ${project.name} by ${artistName}.`,
        }
      }
    }
  }

  return {
    title: {
      absolute: baseTitle,
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

  let dataResult = null
  try {
    dataResult = loadArtistData()
  } catch (err) {
    console.error('Error loading artist data in Page:', err)
  }

  const data = dataResult?.data ?? {}
  const health = dataResult?.health ?? { isHealthy: false, createdNewFile: false, issues: ['Failed to load data'] }

  return (
    <MainDiscographyApp
      data={data}
      health={health}
      initialSlug={resolvedParams?.slug ?? []}
    />
  )
}
