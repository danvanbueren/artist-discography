import { loadArtistData } from '../lib/artistData'
import DevArtistDiscographyView from '../components/DevArtistDiscographyView'

export default function Home() {
  const { data, health } = loadArtistData()

  return (
    <DevArtistDiscographyView
      data={data}
      health={health}
    />
  )
}
