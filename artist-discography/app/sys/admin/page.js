import { redirect } from 'next/navigation'
import { loadArtistData } from '@/lib/data/artistData'
import { getLogoDetails } from '@/lib/media/logoUtils'
import AdminDashboard from '@/components/admin/AdminDashboard'

export async function generateMetadata() {
  let artistName = ''
  try {
    const { data } = loadArtistData()
    artistName = data?.artist?.name?.trim() || ''
  } catch (err) {}

  const name = artistName || 'Artist'

  return {
    title: 'Admin Dashboard',
    description: `Admin management portal for ${name} discography.`,
  }
}

export default async function AdminPage() {
  let adminAccess = true
  let artistName = 'Artist'
  let data = {}

  try {
    const dataResult = loadArtistData()
    data = dataResult?.data ?? {}
    adminAccess = data?.adminAccess !== false
    artistName = data?.artist?.name?.trim() || 'Artist'
    data.logoInfo = getLogoDetails()
  } catch (err) {
    console.error('Error loading artist data for admin page:', err)
  }

  if (!adminAccess) {
    redirect('/')
  }

  return (
    <AdminDashboard adminAccess={adminAccess} defaultArtistName={artistName} initialData={data} />
  )
}
