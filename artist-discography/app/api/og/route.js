import { NextResponse } from 'next/server'
import { getOrRenderOgCard } from '@/lib/media/og/ogCacheManager'

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
    const { searchParams } = new URL(request.url)
    const projSlug = searchParams.get('proj') || undefined
    const trackSlug = searchParams.get('track') || undefined

    const { buffer, hash } = await getOrRenderOgCard({
      projSlug,
      trackSlug,
    })

    const etag = `W/"og-${hash || 'default'}"`
    const cacheControl = 'public, max-age=86400, stale-while-revalidate=604800'

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

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'image/png',
        'Cache-Control': cacheControl,
        ETag: etag,
      },
    })
  } catch (err) {
    console.error('Error in /api/og endpoint:', err)
    return new NextResponse('Failed to generate preview card', {
      status: 500,
      headers: CORS_HEADERS,
    })
  }
}
