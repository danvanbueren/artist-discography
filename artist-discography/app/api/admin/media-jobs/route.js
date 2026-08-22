import { NextResponse } from 'next/server'
import { loadConfigData } from '@/lib/data/artistData'
import { getAllJobs, clearCompletedJobs, subscribeToJobs } from '@/lib/api/jobTracker'
import { warmAllArtistMedia } from '@/lib/media/mediaWarmer'

export const dynamic = 'force-dynamic'

function authenticateAdmin(request, bodyPassword = '') {
  const dataResult = loadConfigData()
  const currentData = dataResult?.data ?? {}

  const adminAccess = Boolean(currentData?.adminAccess)
  const adminPassword = String(currentData?.adminPassword ?? '')

  if (!adminAccess) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { success: false, error: 'Admin access is disabled in config.json' },
        { status: 403 },
      ),
    }
  }

  const effectivePassword = bodyPassword || request?.headers?.get('x-admin-password') || ''
  if (effectivePassword !== adminPassword) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid admin password' },
        { status: 401 },
      ),
    }
  }

  return { authenticated: true }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const isStream = searchParams.get('stream') === '1'

    if (!isStream) {
      const data = getAllJobs()
      return NextResponse.json({
        success: true,
        ...data,
      })
    }

    // Server-Sent Events (SSE) Stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        // Send initial state snapshot
        const initialSnapshot = getAllJobs()
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'snapshot', ...initialSnapshot })}\n\n`),
        )

        // Subscribe to job events
        const unsubscribe = subscribeToJobs((payload) => {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'update', ...payload })}\n\n`),
            )
          } catch {
            // Client may have disconnected
          }
        })

        // 15s Heartbeat Ping to prevent connection timeouts
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(': ping\n\n'))
          } catch {
            clearInterval(heartbeat)
          }
        }, 15000)

        // Handle client disconnection
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeat)
          unsubscribe()
          try {
            controller.close()
          } catch {}
        })
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err) {
    console.error('Error in media-jobs GET handler:', err)
    return NextResponse.json(
      { success: false, error: `Failed to retrieve media jobs: ${err.message}` },
      { status: 500 },
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const authCheck = authenticateAdmin(request, body.password)
    if (!authCheck.authenticated) {
      return authCheck.response
    }

    const action = String(body.action || 'warm-all').toLowerCase()

    if (action === 'clear-completed' || action === 'clear') {
      clearCompletedJobs()
      return NextResponse.json({
        success: true,
        message: 'Completed and failed jobs cleared.',
      })
    }

    if (action === 'warm-all' || action === 'optimize-all') {
      // Trigger media warming in background
      setTimeout(async () => {
        try {
          await warmAllArtistMedia()
        } catch (err) {
          console.error('Background catalog media warming failed:', err)
        }
      }, 50)

      return NextResponse.json({
        success: true,
        message: 'Catalog media optimization and pre-transcoding started.',
      })
    }

    return NextResponse.json(
      { success: false, error: `Unknown action: ${action}` },
      { status: 400 },
    )
  } catch (err) {
    console.error('Error in media-jobs POST handler:', err)
    return NextResponse.json(
      { success: false, error: `Server error: ${err.message}` },
      { status: 500 },
    )
  }
}
