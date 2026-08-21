import { NextResponse } from 'next/server'
import { getOptimizedImage } from '../../../lib/mediaOptimizer'
import { getLogoDetails } from '../../../lib/logoUtils'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers':
    'Range, Content-Type, Accept-Encoding, Cache-Control, If-None-Match',
  'Access-Control-Expose-Headers': 'Content-Length, ETag, Last-Modified',
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

export async function GET(request) {
  try {
    const logoDetails = getLogoDetails()

    if (!logoDetails.exists || !logoDetails.fullPath) {
      return new NextResponse('Logo not found', {
        status: 404,
        headers: CORS_HEADERS,
      })
    }

    const { fullPath: logoPath, isCustom, sizeBytes, mtimeMs } = logoDetails

    const { searchParams } = new URL(request.url)
    const width = searchParams.get('w')
    const quality = searchParams.get('q')
    const format =
      searchParams.get('fmt') ||
      (searchParams.has('w') || searchParams.has('q') || searchParams.has('blur')
        ? 'webp'
        : 'original')
    const blur = searchParams.get('blur')

    const etag = `W/"logo-${(sizeBytes || 0).toString(16)}-${Math.floor(mtimeMs || 0).toString(16)}-w${width || 'orig'}-q${quality || 'def'}-f${format}-b${blur || 0}"`
    const cacheControl = isCustom
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
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': optimized.mimeType,
        'Cache-Control': cacheControl,
        ETag: etag,
      },
    })
  } catch (err) {
    console.error('Unexpected error in logo API route:', err)
  }

  return new NextResponse('Logo not found', {
    status: 404,
    headers: CORS_HEADERS,
  })
}
