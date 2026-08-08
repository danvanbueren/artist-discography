import { loadArtistData } from '../../lib/artistData'
import ArtistDiscographyView from '../ArtistDiscographyView'

export default function DevPage() {
  const { data, health } = loadArtistData()

  return (
    <ArtistDiscographyView
      data={data}
      health={health}
    />
  )
}
