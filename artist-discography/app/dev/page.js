import { loadArtistData } from '../../lib/artistData'
import DevArtistDiscographyView from '../../components/DevArtistDiscographyView'

export default function DevPage() {
  const { data, health } = loadArtistData()

  return (
    <DevArtistDiscographyView
      data={data}
      health={health}
    />
  )
}
