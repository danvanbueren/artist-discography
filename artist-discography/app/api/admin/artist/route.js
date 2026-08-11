import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { loadArtistData, saveArtistData } from '../../../../lib/artistData'

export async function POST(request) {
  try {
    const body = await request.json()
    const { password, name, bio, platforms, socials } = body ?? {}

    const dataResult = loadArtistData()
    const currentData = dataResult?.data ?? {}

    const adminAccess = Boolean(currentData?.adminAccess)
    const adminPassword = String(currentData?.adminPassword ?? '')

    if (!adminAccess) {
      return NextResponse.json(
        { success: false, error: 'Admin access is disabled in artist-data.json' },
        { status: 403 }
      )
    }

    if (password !== adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid admin password' },
        { status: 401 }
      )
    }

    const filePath = path.join(process.cwd(), 'data', 'artist-data.json')
    let fullJsonData = {}
    if (fs.existsSync(filePath)) {
      try {
        fullJsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      } catch (e) {
        fullJsonData = currentData
      }
    } else {
      fullJsonData = currentData
    }

    if (!fullJsonData.artist || typeof fullJsonData.artist !== 'object') {
      fullJsonData.artist = {}
    }

    fullJsonData.artist.name = String(name || '').trim()
    fullJsonData.artist.bio = String(bio || '').trim()

    if (!fullJsonData.artist.links || typeof fullJsonData.artist.links !== 'object') {
      fullJsonData.artist.links = { platforms: {}, socials: {} }
    }

    if (platforms && typeof platforms === 'object') {
      fullJsonData.artist.links.platforms = { ...(fullJsonData.artist.links.platforms || {}), ...platforms }
    }

    if (socials && typeof socials === 'object') {
      fullJsonData.artist.links.socials = { ...(fullJsonData.artist.links.socials || {}), ...socials }
    }

    const saveResult = saveArtistData(fullJsonData)
    if (!saveResult.success) {
      return NextResponse.json(
        { success: false, error: `Failed to save artist info: ${saveResult.error}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Artist profile updated successfully!',
    })
  } catch (err) {
    console.error('Error updating artist info:', err)
    return NextResponse.json(
      { success: false, error: `Server error: ${err.message}` },
      { status: 500 }
    )
  }
}
