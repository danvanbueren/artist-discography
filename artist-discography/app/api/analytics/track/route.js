import { NextResponse } from 'next/server'
import { recordAnalyticsEvent } from '@/lib/data/analyticsStorage'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
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

export async function POST(request) {
  try {
    let body = {}
    try {
      body = await request.json()
    } catch {
      // Fallback for beacon text payloads
      try {
        const text = await request.text()
        if (text) body = JSON.parse(text)
      } catch {}
    }

    const { type, project, projectSlug, track, path, referrer } = body ?? {}
    const userAgent = request.headers.get('user-agent') || ''

    const success = recordAnalyticsEvent({
      type: type === 'stream' ? 'stream' : 'pageview',
      project,
      projectSlug,
      track,
      path,
      referrer,
      userAgent,
    })

    return NextResponse.json({ success }, { headers: CORS_HEADERS })
  } catch (err) {
    console.warn('Warning: Analytics tracking request failed:', err)
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: CORS_HEADERS },
    )
  }
}
