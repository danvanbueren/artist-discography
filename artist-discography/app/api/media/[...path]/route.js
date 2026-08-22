import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import { getOptimizedImage } from '@/lib/media/mediaOptimizer'

const MEDIA_MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers':
    'Range, Content-Type, Accept-Encoding, Cache-Control, If-None-Match',
  'Access-Control-Expose-Headers': 'Content-Length, ETag, Last-Modified, X-Media-Cache',
}

export const dynamic = 'force-dynamic'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      'Access-Control-Max-Age': '86400',
    },
  })
}

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params
    const pathSegments = resolvedParams?.path ?? []
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse('Media path not specified', {
        status: 400,
        headers: CORS_HEADERS,
      })
    }

    const dataDir = path.join(process.cwd(), 'data')
    const requestedPath = pathSegments.join('/')

    // Prevent directory traversal attacks
    const fullProjectsPath = path.resolve(path.join(dataDir, 'projects', requestedPath))
    const fullCoversPath = path.resolve(path.join(dataDir, 'covers', requestedPath))
    const fallbackDataPath = path.resolve(path.join(dataDir, requestedPath))

    let targetFilePath = null
    if (
      fallbackDataPath.startsWith(dataDir) &&
      fs.existsSync(fallbackDataPath) &&
      fs.statSync(/*turbopackIgnore: true*/ fallbackDataPath).isFile()
    ) {
      targetFilePath = fallbackDataPath
    } else if (
      fullProjectsPath.startsWith(dataDir) &&
      fs.existsSync(fullProjectsPath) &&
      fs.statSync(/*turbopackIgnore: true*/ fullProjectsPath).isFile()
    ) {
      targetFilePath = fullProjectsPath
    } else if (
      fullCoversPath.startsWith(dataDir) &&
      fs.existsSync(fullCoversPath) &&
      fs.statSync(/*turbopackIgnore: true*/ fullCoversPath).isFile()
    ) {
      targetFilePath = fullCoversPath
    }

    if (!targetFilePath) {
      return new NextResponse('Media file not found', {
        status: 404,
        headers: CORS_HEADERS,
      })
    }

    const stat = fs.statSync(/*turbopackIgnore: true*/ targetFilePath)
    const { searchParams } = new URL(request.url)
    const width = searchParams.get('w')
    const quality = searchParams.get('q')
    const format =
      searchParams.get('fmt') ||
      (searchParams.has('w') || searchParams.has('q') || searchParams.has('blur')
        ? 'webp'
        : 'original')
    const blur = searchParams.get('blur')

    // Compute strong ETag based on source stat and transformation parameters
    const etag = `W/"media-${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}-w${width || 'orig'}-q${quality || 'def'}-f${format}-b${blur || 0}"`
    const cacheControl = 'public, max-age=86400, stale-while-revalidate=604800'

    // HTTP 304 Validation
    const ifNoneMatch = request.headers.get('if-none-match')
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ...CORS_HEADERS,
          ETag: etag,
          'Cache-Control': cacheControl,
          'Last-Modified': new Date(stat.mtimeMs).toUTCString(),
        },
      })
    }

    const ext = path.extname(targetFilePath).toLowerCase()
    const isRasterImage = ['.png', '.jpg', '.jpeg', '.webp', '.avif'].includes(ext)

    // Apply sharp optimization for raster images when resized, blurred, or format-converted
    if (isRasterImage && (width || quality || blur || format === 'webp' || format === 'avif')) {
      const optimized = await getOptimizedImage(targetFilePath, {
        width,
        quality,
        format,
        blur,
      })

      return new NextResponse(optimized.buffer, {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': optimized.mimeType,
          'Content-Length': optimized.buffer.length.toString(),
          ETag: etag,
          'Cache-Control': cacheControl,
          'Last-Modified': new Date(stat.mtimeMs).toUTCString(),
          'X-Media-Cache': optimized.isFromCache ? 'HIT' : 'MISS',
        },
      })
    }

    // Default response for vector / original files
    const mimeType = MEDIA_MIME_TYPES[ext] || 'application/octet-stream'
    const fileBuffer = fs.readFileSync(/*turbopackIgnore: true*/ targetFilePath)

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': mimeType,
        'Content-Length': stat.size.toString(),
        ETag: etag,
        'Cache-Control': cacheControl,
        'Last-Modified': new Date(stat.mtimeMs).toUTCString(),
      },
    })
  } catch (err) {
    console.error('Error reading media file:', err)
    return new NextResponse('Internal Server Error', {
      status: 500,
      headers: CORS_HEADERS,
    })
  }
}
