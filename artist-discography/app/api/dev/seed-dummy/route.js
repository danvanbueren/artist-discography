import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import {
  loadConfigData,
  saveConfigData,
  saveProjectData,
  loadArtistData,
  getProjectsDirPath,
} from '@/lib/data/artistData'
import { slugify } from '@/lib/data/slugs'

const ARTIST_NAMES = [
  'Astraea & The Neon Sun',
  'Kaelen Voss',
  'Lunar Echoes',
  'Obsidian Horizons',
  'Vaporwave Symphony',
  'Solaris Spectrum',
  'Velvet Frequency',
  'Aetherial Drift',
]

const ARTIST_BIOS = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Producer and composer pushing the boundaries of ambient synthwave and cinematic soundscapes. Curating immersive audio experiences for late-night dreamers.',
  'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Multi-instrumentalist creating textured electronic soundscapes blending organic acoustics with retro-futuristic synthesis.',
  'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Crafting melodic soundwaves and ethereal beats from an underground studio.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Synthesizing analog warmth with crisp digital sound design across cinematic releases.',
]

const ALBUM_COVERS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop',
]

const PROJECT_TITLES = [
  'Midnight Echoes',
  'Celestial Drift',
  'Quantum Reverie',
  'Velvet Dusk',
  'Neon Sunset Boulevard',
  'Subterranean Shift',
  'Hyperdrive',
  'Solar Flare',
  'Aetherial Horizons',
  'Vapor Trail Paradigm',
]

const TRACK_TITLES = [
  'Starlight Pulse',
  'Fragmented Dreams',
  'Subterranean Shift',
  'Hyperdrive',
  'Solar Flare',
  'Infinite Horizon',
  'Chasing Shadows',
  'Vapor Trail',
  'Echo Chamber',
  'Aether',
  'Luminescence',
  'Neon Rain',
  'Oscillation #4',
  'Silent Reverie',
  'Orbital Resonance',
]

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getRandomItems(arr, count) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

function getRandomDate(startYear = 2021, endYear = 2026) {
  const year = Math.floor(Math.random() * (endYear - startYear + 1)) + startYear
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function POST(request) {
  try {
    const configResult = loadConfigData()
    const currentData = configResult?.data ?? {}

    const adminAccess = Boolean(currentData?.adminAccess !== false)
    if (!adminAccess) {
      return NextResponse.json(
        { success: false, error: 'Admin access is disabled in config.json' },
        { status: 403 },
      )
    }

    const adminPassword = String(currentData?.adminPassword ?? '')
    if (adminPassword) {
      let reqPassword = request.headers.get('x-admin-password') || ''
      if (!reqPassword) {
        try {
          const body = await request.clone().json()
          reqPassword = String(body?.password || '')
        } catch {}
      }

      if (!reqPassword || reqPassword !== adminPassword) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Unauthorized: Invalid admin password. Dummy data generation requires admin authentication.',
          },
          { status: 401 },
        )
      }
    }

    const artistName = getRandomItem(ARTIST_NAMES)
    const artistBio = getRandomItem(ARTIST_BIOS)
    const handleSlug = artistName.toLowerCase().replace(/[^a-z0-9]/g, '')

    const allPlatforms = {
      amazon: `https://music.amazon.com/artists/${handleSlug}`,
      apple: `https://music.apple.com/artist/${handleSlug}/123456789`,
      bandcamp: `https://${handleSlug}.bandcamp.com`,
      deezer: `https://www.deezer.com/artist/${handleSlug}`,
      itunes: `https://itunes.apple.com/artist/${handleSlug}/id123456789`,
      pandora: `https://www.pandora.com/artist/${handleSlug}`,
      soundcloud: `https://soundcloud.com/${handleSlug}`,
      spotify: `https://open.spotify.com/artist/${handleSlug}`,
      tidal: `https://tidal.com/artist/${handleSlug}`,
      youtube: `https://youtube.com/@${handleSlug}`,
    }

    // Randomize platform links (50% chance per platform)
    const platforms = {}
    Object.entries(allPlatforms).forEach(([k, url]) => {
      platforms[k] = Math.random() > 0.45 ? url : ''
    })

    const allSocials = {
      discord: `https://discord.gg/${handleSlug}`,
      facebook: `https://facebook.com/${handleSlug}`,
      instagram: `https://instagram.com/${handleSlug}`,
      snapchat: `https://snapchat.com/add/${handleSlug}`,
      tiktok: `https://tiktok.com/@${handleSlug}`,
      x: `https://x.com/${handleSlug}`,
    }

    // Randomize social account links (50% chance per social)
    const socials = {}
    Object.entries(allSocials).forEach(([k, url]) => {
      socials[k] = Math.random() > 0.45 ? url : ''
    })

    // Generate 4 randomized projects (1 Single, 1 EP, 2 Albums)
    const projectTypes = ['Single', 'EP', 'Album', 'Album']
    const selectedTitles = getRandomItems(PROJECT_TITLES, 4)
    const selectedCovers = getRandomItems(ALBUM_COVERS, 4)

    const projects = projectTypes.map((type, idx) => {
      const pTitle = selectedTitles[idx]
      const coverUrl = selectedCovers[idx]
      const pDate = getRandomDate(2021, 2026)

      let trackCount = 1
      if (type === 'EP') trackCount = Math.floor(Math.random() * 3) + 3 // 3-5 tracks
      if (type === 'Album') trackCount = Math.floor(Math.random() * 4) + 6 // 6-9 tracks

      const pTrackTitles = getRandomItems(TRACK_TITLES, trackCount)
      const tracks = pTrackTitles.map((tName, tIdx) => {
        const tSlug = tName.toLowerCase().replace(/[^a-z0-9]/g, '')

        const allTrackLinks = {
          amazon: `https://music.amazon.com/albums/${handleSlug}?track=${tIdx + 1}`,
          apple: `https://music.apple.com/song/${tSlug}`,
          bandcamp: `https://${handleSlug}.bandcamp.com/track/${tSlug}`,
          deezer: `https://www.deezer.com/track/${tIdx + 1000}`,
          itunes: `https://itunes.apple.com/song/${tSlug}`,
          pandora: `https://www.pandora.com/tr/${tSlug}`,
          soundcloud: `https://soundcloud.com/${handleSlug}/${tSlug}`,
          spotify: `https://open.spotify.com/track/${tSlug}`,
          tidal: `https://tidal.com/track/${tIdx + 1000}`,
          youtube: `https://youtube.com/watch?v=dummy${tIdx + 1}`,
        }

        // For each track, randomly select 2-5 platform links (approx 35% chance per platform)
        const trackLinks = {}
        Object.entries(allTrackLinks).forEach(([k, u]) => {
          trackLinks[k] = Math.random() > 0.65 ? u : ''
        })

        return {
          name: tName,
          artist: Math.random() > 0.8 ? `${artistName} feat. Guest Artist` : '',
          links: trackLinks,
        }
      })

      return {
        name: pTitle,
        type,
        artist: Math.random() > 0.85 ? `${artistName} (Side Project)` : '',
        date: pDate,
        cover: coverUrl,
        tracks,
      }
    })

    const updatedConfig = {
      ...currentData,
      adminAccess: true,
      adminPassword: currentData.adminPassword ?? '',
      artist: {
        name: artistName,
        bio: artistBio,
        links: {
          platforms,
          socials,
        },
      },
    }

    const saveConfigResult = saveConfigData(updatedConfig)
    if (!saveConfigResult.success) {
      return NextResponse.json(
        { success: false, error: `Failed to write dummy config: ${saveConfigResult.error}` },
        { status: 500 },
      )
    }

    // Write dummy projects
    for (let i = 0; i < projects.length; i++) {
      const proj = projects[i]
      const pSlug = slugify(proj.name) || `dummy-project-${i + 1}`
      saveProjectData(pSlug, proj)
    }

    const reloaded = loadArtistData()

    return NextResponse.json({
      success: true,
      message: `Successfully randomized discography data for "${artistName}"!`,
      data: reloaded?.data ?? { ...updatedConfig, projects },
    })
  } catch (err) {
    console.error('Error generating randomized dummy data:', err)
    return NextResponse.json(
      { success: false, error: `Server error generating dummy data: ${err.message}` },
      { status: 500 },
    )
  }
}
