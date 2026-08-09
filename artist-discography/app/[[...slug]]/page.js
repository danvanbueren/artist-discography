import { loadArtistData } from '../../lib/artistData'
import MainDiscographyApp from '../../components/MainDiscographyApp'

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
