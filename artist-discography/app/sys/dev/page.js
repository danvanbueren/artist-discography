import { redirect } from 'next/navigation'
import { loadArtistData } from '../../../lib/artistData'
import DevArtistDiscographyView from '../../../components/DevArtistDiscographyView'

export async function generateMetadata() {
  let artistName = ''
  try {
    const { data } = loadArtistData()
    artistName = data?.artist?.name?.trim() || ''
  } catch (err) { }

  const name = artistName || 'Artist'

  return {
    title: 'Dev Dashboard',
    description: `Developer preview dashboard for ${name}.`,
  }
}

export default function DevPage() {
  let dataResult = null
  try {
    dataResult = loadArtistData()
  } catch (err) {
    console.error('Error loading artist data in DevPage:', err)
  }

  const data = dataResult?.data ?? {}
  const health = dataResult?.health ?? { isHealthy: false, createdNewFile: false, issues: ['Failed to load data'] }
  const devAccess = Boolean(data?.devAccess)

  if (!devAccess) {
    redirect('/')
  }

  return (
    <DevArtistDiscographyView
      data={data}
      health={health}
    />
  )
}
