import { loadArtistData } from '../../lib/artistData'
import DevArtistDiscographyView from '../../components/DevArtistDiscographyView'

export default function DevPage() {
  let dataResult = null
  try {
    dataResult = loadArtistData()
  } catch (err) {
    console.error('Error loading artist data in DevPage:', err)
  }

  const data = dataResult?.data ?? {}
  const health = dataResult?.health ?? { isHealthy: false, createdNewFile: false, issues: ['Failed to load data'] }

  return (
    <DevArtistDiscographyView
      data={data}
      health={health}
    />
  )
}
