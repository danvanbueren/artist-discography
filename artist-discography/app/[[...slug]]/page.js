import { loadArtistData } from '../../lib/artistData'
import MainDiscographyApp from '../../components/MainDiscographyApp'

export default async function Page({ params }) {
  const resolvedParams = await params
  const { data, health } = loadArtistData()

  return (
    <MainDiscographyApp
      data={data}
      health={health}
      initialSlug={resolvedParams?.slug ?? []}
    />
  )
}
