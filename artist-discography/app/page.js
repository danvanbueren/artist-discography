import { loadArtistData } from '../lib/artistData'
import ArtistDiscographyView from './ArtistDiscographyView'

export default function Home() {
  const { data, health } = loadArtistData()

  return (
    <ArtistDiscographyView
      data={data}
      health={health}
    />
  )
}
