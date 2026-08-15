import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import { getOptimizedImage } from '../../../lib/mediaOptimizer'

const IMAGE_MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
}

function findLogoFile(dir) {
  if (!fs.existsSync(dir)) return null
  try {
    const files = fs.readdirSync(dir)
    const logoFile = files.find(file => {
      const lower = file.toLowerCase()
      const ext = path.extname(lower)
      return lower.startsWith('logo.') && Object.keys(IMAGE_MIME_TYPES).includes(ext)
    })
    return logoFile ? path.join(dir, logoFile) : null
  } catch (err) {
    console.error(`Error searching directory ${dir} for logo:`, err)
    return null
  }
}

export async function GET(request) {
  try {
    const dataDir = path.join(process.cwd(), 'data')
    const publicDir = path.join(process.cwd(), 'public')

    // 1. Check data/ directory for custom logo override
    let logoPath = findLogoFile(dataDir)
    let isCustom = true

    // 2. Fallback to default logo in public/ directory
    if (!logoPath) {
      logoPath = findLogoFile(publicDir)
      isCustom = false
    }

    if (!logoPath) {
      return new NextResponse('Logo not found', { status: 404 })
    }

    const stats = fs.statSync(/*turbopackIgnore: true*/ logoPath)
    const mtimeMs = stats.mtimeMs

    const { searchParams } = new URL(request.url)
    const width = searchParams.get('w')
    const quality = searchParams.get('q')
    const format = searchParams.get('fmt') || (searchParams.has('w') || searchParams.has('q') || searchParams.has('blur') ? 'webp' : 'original')
    const blur = searchParams.get('blur')

    const etag = `W/"logo-${stats.size.toString(16)}-${Math.floor(mtimeMs).toString(16)}-w${width || 'orig'}-q${quality || 'def'}-f${format}-b${blur || 0}"`
    const cacheControl = isCustom
      ? 'public, max-age=60, stale-while-revalidate=300'
      : 'public, max-age=86400, stale-while-revalidate=604800'

    const ifNoneMatch = request?.headers?.get('if-none-match')
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          'Cache-Control': cacheControl,
        },
      })
    }

    const optimized = await getOptimizedImage(logoPath, {
      width,
      quality,
      format,
      blur,
    })

    return new NextResponse(optimized.buffer, {
      headers: {
        'Content-Type': optimized.mimeType,
        'Cache-Control': cacheControl,
        ETag: etag,
      },
    })
  } catch (err) {
    console.error('Unexpected error in logo API route:', err)
  }

  return new NextResponse('Logo not found', { status: 404 })
}

