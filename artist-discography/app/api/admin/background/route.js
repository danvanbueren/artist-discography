import { NextResponse } from 'next/server'
import { loadConfigData } from '@/lib/data/artistData'
import {
  getBackgroundDetails,
  saveCustomBackground,
  deleteCustomBackground,
} from '@/lib/media/backgroundUtils'
import { scheduleAutomatedCachePrune } from '@/lib/media/cacheCleaner'

function authenticateAdmin(password, request) {
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

  const effectivePassword = password || request?.headers?.get('x-admin-password') || ''
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

export async function GET() {
  try {
    const backgroundDetails = getBackgroundDetails()
    return NextResponse.json({
      success: true,
      background: backgroundDetails,
    })
  } catch (err) {
    console.error('Error fetching background info:', err)
    return NextResponse.json(
      { success: false, error: `Failed to fetch background details: ${err.message}` },
      { status: 500 },
    )
  }
}

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let password = ''
    let action = 'upload'
    let backgroundFile = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      password = String(formData.get('password') || '')
      action = String(formData.get('action') || 'upload')
      backgroundFile = formData.get('backgroundFile')
    } else {
      const body = await request.json().catch(() => ({}))
      password = String(body.password || '')
      action = String(body.action || 'upload')
    }

    const authCheck = authenticateAdmin(password, request)
    if (!authCheck.authenticated) {
      return authCheck.response
    }

    if (action === 'delete' || action === 'reset') {
      const deleteResult = deleteCustomBackground()
      if (!deleteResult.success) {
        return NextResponse.json(
          { success: false, error: deleteResult.error || 'Failed to remove custom background.' },
          { status: 500 },
        )
      }
      scheduleAutomatedCachePrune(5000)
      return NextResponse.json({
        success: true,
        background: deleteResult.background,
        message: 'Custom background removed. Reverted to newest release artwork fallback.',
      })
    }

    if (
      !backgroundFile ||
      typeof backgroundFile !== 'object' ||
      typeof backgroundFile.arrayBuffer !== 'function' ||
      backgroundFile.size === 0
    ) {
      return NextResponse.json(
        { success: false, error: 'No background image file was provided.' },
        { status: 400 },
      )
    }

    const buffer = Buffer.from(await backgroundFile.arrayBuffer())
    const saveResult = await saveCustomBackground(buffer, backgroundFile.name)

    if (!saveResult.success) {
      return NextResponse.json(
        { success: false, error: saveResult.error || 'Failed to save custom background file.' },
        { status: 500 },
      )
    }

    scheduleAutomatedCachePrune(10000)

    return NextResponse.json({
      success: true,
      background: saveResult.background,
      message: `Custom background (${saveResult.background?.filename}) uploaded successfully!`,
    })
  } catch (err) {
    console.error('Error handling background upload:', err)
    return NextResponse.json(
      { success: false, error: `Server error: ${err.message}` },
      { status: 500 },
    )
  }
}

export async function DELETE(request) {
  try {
    let password = request.headers.get('x-admin-password') || ''
    if (!password) {
      const body = await request.json().catch(() => ({}))
      password = String(body.password || '')
    }

    const authCheck = authenticateAdmin(password, request)
    if (!authCheck.authenticated) {
      return authCheck.response
    }

    const deleteResult = deleteCustomBackground()
    if (!deleteResult.success) {
      return NextResponse.json(
        { success: false, error: deleteResult.error || 'Failed to remove custom background.' },
        { status: 500 },
      )
    }

    scheduleAutomatedCachePrune(5000)

    return NextResponse.json({
      success: true,
      background: deleteResult.background,
      message: 'Custom background removed. Reverted to newest release artwork fallback.',
    })
  } catch (err) {
    console.error('Error handling background deletion:', err)
    return NextResponse.json(
      { success: false, error: `Server error: ${err.message}` },
      { status: 500 },
    )
  }
}
