import { NextResponse } from 'next/server'
import { getOptimizedImage } from '../../../lib/mediaOptimizer'
import { getLogoDetails } from '../../../lib/logoUtils'

export async function GET(request) {
  try {
    const logoDetails = getLogoDetails()

    if (!logoDetails.exists || !logoDetails.fullPath) {
      return new NextResponse('Logo not found', { status: 404 })
    }

    const { fullPath: logoPath, isCustom, sizeBytes, mtimeMs } = logoDetails

    const { searchParams } = new URL(request.url)
    const width = searchParams.get('w')
    const quality = searchParams.get('q')
    const format = searchParams.get('fmt') || (searchParams.has('w') || searchParams.has('q') || searchParams.has('blur') ? 'webp' : 'original')
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

