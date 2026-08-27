import fs from 'fs'
import { NextResponse } from 'next/server'
import { getFaviconPath } from '@/lib/media/logoUtils'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers':
    'Range, Content-Type, Accept-Encoding, Cache-Control, If-None-Match',
  'Access-Control-Expose-Headers': 'Content-Length, ETag, Last-Modified',
}

export const dynamic = 'force-dynamic'

/**
 * Handles CORS preflight requests for /apple-touch-icon.png.
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      'Access-Control-Max-Age': '86400',
    },
  })
}

/**
 * Handles HEAD requests for /apple-touch-icon.png headers.
 */
export async function HEAD() {
  try {
    const faviconInfo = await getFaviconPath(180)

    if (
      !faviconInfo ||
      !faviconInfo.filePath ||
      !fs.existsSync(/*turbopackIgnore: true*/ faviconInfo.filePath)
    ) {
      return new NextResponse(null, {
        status: 404,
        headers: CORS_HEADERS,
      })
    }

    const stat = fs.statSync(/*turbopackIgnore: true*/ faviconInfo.filePath)
    const etag = `W/"apple-icon-${(faviconInfo.sizeBytes || stat.size).toString(16)}-${Math.floor(faviconInfo.mtimeMs || stat.mtimeMs).toString(16)}"`
    const cacheControl = faviconInfo.isCustom
      ? 'public, max-age=60, stale-while-revalidate=300'
      : 'public, max-age=86400, stale-while-revalidate=604800'

    return new NextResponse(null, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'image/png',
        'Content-Length': stat.size.toString(),
        'Cache-Control': cacheControl,
        ETag: etag,
        'Last-Modified': new Date(stat.mtimeMs).toUTCString(),
      },
    })
  } catch (err) {
    console.error('Unexpected error in /apple-touch-icon.png HEAD route:', err)
  }

  return new NextResponse(null, {
    status: 404,
    headers: CORS_HEADERS,
  })
}

/**
 * Serves the Apple Touch Icon (180x180 PNG) directly at /apple-touch-icon.png.
 */
export async function GET(request) {
  try {
    const faviconInfo = await getFaviconPath(180)

    if (
      !faviconInfo ||
      !faviconInfo.filePath ||
      !fs.existsSync(/*turbopackIgnore: true*/ faviconInfo.filePath)
    ) {
      return new NextResponse('Apple touch icon not found', {
        status: 404,
        headers: CORS_HEADERS,
      })
    }

    const stat = fs.statSync(/*turbopackIgnore: true*/ faviconInfo.filePath)
    const etag = `W/"apple-icon-${(faviconInfo.sizeBytes || stat.size).toString(16)}-${Math.floor(faviconInfo.mtimeMs || stat.mtimeMs).toString(16)}"`
    const cacheControl = faviconInfo.isCustom
      ? 'public, max-age=60, stale-while-revalidate=300'
      : 'public, max-age=86400, stale-while-revalidate=604800'

    const ifNoneMatch = request?.headers?.get('if-none-match')
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

    const fileBuffer = fs.readFileSync(/*turbopackIgnore: true*/ faviconInfo.filePath)

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'image/png',
        'Content-Length': stat.size.toString(),
        'Cache-Control': cacheControl,
        ETag: etag,
        'Last-Modified': new Date(stat.mtimeMs).toUTCString(),
      },
    })
  } catch (err) {
    console.error('Unexpected error in /apple-touch-icon.png route:', err)
  }

  return new NextResponse('Apple touch icon not found', {
    status: 404,
    headers: CORS_HEADERS,
  })
}
