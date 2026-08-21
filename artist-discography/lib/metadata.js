import { loadConfigData, normalizeSiteUrl } from './artistData'
import { getLogoDetails } from './logoUtils'

/**
 * Generates the root metadata object for the application layout.
 *
 * @returns {Promise<import('next').Metadata>}
 */
export async function generateRootMetadata() {
  let artistName = ''
  let rawSiteUrl = ''
  try {
    const { data } = loadConfigData()
    artistName = data?.artist?.name?.trim() || ''
    rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || data?.siteUrl || data?.artist?.siteUrl || ''
  } catch (err) {
    console.error('Error reading artist name for metadata:', err)
  }

  const name = artistName || 'Artist'
  const baseTitle = `${name} - Artist Discography`
  const baseUrl = normalizeSiteUrl(rawSiteUrl)

  let logoMtime = '1'
  try {
    const logoDetails = getLogoDetails()
    if (logoDetails.mtimeMs) {
      logoMtime = Math.floor(logoDetails.mtimeMs).toString()
    }
  } catch {}

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: baseTitle,
      template: `${name} | %s`,
    },
    description: `All music by ${name}, in one place. Direct links to listen across all published streaming platforms.`,
    appleWebApp: {
      title: baseTitle,
      statusBarStyle: 'black-translucent',
    },
    icons: {
      icon: [
        { url: `/api/icon?w=32&v=${logoMtime}`, sizes: '32x32', type: 'image/png' },
        { url: `/api/icon?w=16&v=${logoMtime}`, sizes: '16x16', type: 'image/png' },
      ],
      shortcut: `/api/icon?w=32&v=${logoMtime}`,
      apple: [{ url: `/api/icon?w=180&v=${logoMtime}`, sizes: '180x180', type: 'image/png' }],
    },
    manifest: `/manifest.webmanifest?v=${logoMtime}`,
  }
}
