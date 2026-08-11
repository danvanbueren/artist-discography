import { loadArtistData } from '../../lib/artistData'
import AdminDashboardClient from '../../components/AdminDashboardClient'

export async function generateMetadata() {
  let artistName = ''
  try {
    const { data } = loadArtistData()
    artistName = data?.artist?.name?.trim() || ''
  } catch (err) {}

  const name = artistName || 'Artist'

  return {
    title: `${name} | Admin Dashboard`,
    description: `Admin management portal for ${name} discography.`,
  }
}

export default async function AdminPage() {
  let adminAccess = true
  let artistName = 'Polybit'
  let data = {}

  try {
    const dataResult = loadArtistData()
    data = dataResult?.data ?? {}
    adminAccess = data?.adminAccess !== false
    artistName = data?.artist?.name?.trim() || 'Polybit'
  } catch (err) {
    console.error('Error loading artist data for admin page:', err)
  }

  return (
    <AdminDashboardClient
      adminAccess={adminAccess}
      defaultArtistName={artistName}
      initialData={data}
    />
  )
}
