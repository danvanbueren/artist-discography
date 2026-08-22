import { NextResponse } from 'next/server'
import { loadConfigData, saveConfigData } from '@/lib/data/artistData'

export async function POST(request) {
  try {
    const body = await request.json()
    const { password, name, bio, platforms, socials } = body ?? {}

    const dataResult = loadConfigData()
    const currentData = dataResult?.data ?? {}

    const adminAccess = Boolean(currentData?.adminAccess)
    const adminPassword = String(currentData?.adminPassword ?? '')

    if (!adminAccess) {
      return NextResponse.json(
        { success: false, error: 'Admin access is disabled in config.json' },
        { status: 403 },
      )
    }

    if (password !== adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid admin password' },
        { status: 401 },
      )
    }

    const configData = { ...currentData }

    if (!configData.artist || typeof configData.artist !== 'object') {
      configData.artist = {}
    }

    configData.artist.name = String(name || '').trim()
    configData.artist.bio = String(bio || '').trim()

    if (!configData.artist.links || typeof configData.artist.links !== 'object') {
      configData.artist.links = { platforms: {}, socials: {} }
    }

    if (platforms && typeof platforms === 'object') {
      configData.artist.links.platforms = {
        ...(configData.artist.links.platforms || {}),
        ...platforms,
      }
    }

    if (socials && typeof socials === 'object') {
      configData.artist.links.socials = { ...(configData.artist.links.socials || {}), ...socials }
    }

    if (body.privateAccessCode !== undefined) {
      configData.privateAccessCode = String(body.privateAccessCode || '').trim()
    }

    if (body.siteUrl !== undefined) {
      configData.siteUrl = String(body.siteUrl || '').trim()
    }

    if (body.adminAccess !== undefined) {
      configData.adminAccess = Boolean(body.adminAccess)
    }

    if (body.adminPassword !== undefined) {
      configData.adminPassword = String(body.adminPassword ?? '')
    }

    const saveResult = saveConfigData(configData)
    if (!saveResult.success) {
      return NextResponse.json(
        { success: false, error: `Failed to save artist info: ${saveResult.error}` },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profile and server settings updated successfully!',
    })
  } catch (err) {
    console.error('Error updating artist info:', err)
    return NextResponse.json(
      { success: false, error: `Server error: ${err.message}` },
      { status: 500 },
    )
  }
}
