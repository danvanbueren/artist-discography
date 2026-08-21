import { NextResponse } from 'next/server'
import { loadConfigData } from '../../../../lib/artistData'
import { getLogoDetails, saveCustomLogo, deleteCustomLogo } from '../../../../lib/logoUtils'
import { scheduleAutomatedCachePrune } from '../../../../lib/cacheCleaner'

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
    const logoDetails = getLogoDetails()
    return NextResponse.json({
      success: true,
      logo: logoDetails,
    })
  } catch (err) {
    console.error('Error fetching logo info:', err)
    return NextResponse.json(
      { success: false, error: `Failed to fetch logo details: ${err.message}` },
      { status: 500 },
    )
  }
}

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let password = ''
    let action = 'upload'
    let logoFile = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      password = String(formData.get('password') || '')
      action = String(formData.get('action') || 'upload')
      logoFile = formData.get('logoFile')
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
      const deleteResult = deleteCustomLogo()
      if (!deleteResult.success) {
        return NextResponse.json(
          { success: false, error: deleteResult.error || 'Failed to remove custom logo.' },
          { status: 500 },
        )
      }
      scheduleAutomatedCachePrune(5000)
      return NextResponse.json({
        success: true,
        logo: deleteResult.logo,
        message: 'Custom logo removed. Reverted to default logo in public/logo.png.',
      })
    }

    if (
      !logoFile ||
      typeof logoFile !== 'object' ||
      typeof logoFile.arrayBuffer !== 'function' ||
      logoFile.size === 0
    ) {
      return NextResponse.json(
        { success: false, error: 'No logo image file was provided.' },
        { status: 400 },
      )
    }

    const buffer = Buffer.from(await logoFile.arrayBuffer())
    const saveResult = await saveCustomLogo(buffer, logoFile.name)

    if (!saveResult.success) {
      return NextResponse.json(
        { success: false, error: saveResult.error || 'Failed to save custom logo file.' },
        { status: 500 },
      )
    }

    scheduleAutomatedCachePrune(10000)

    return NextResponse.json({
      success: true,
      logo: saveResult.logo,
      message: `Custom logo (${saveResult.logo?.filename}) uploaded and optimized successfully!`,
    })
  } catch (err) {
    console.error('Error handling logo upload:', err)
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

    const deleteResult = deleteCustomLogo()
    if (!deleteResult.success) {
      return NextResponse.json(
        { success: false, error: deleteResult.error || 'Failed to remove custom logo.' },
        { status: 500 },
      )
    }

    scheduleAutomatedCachePrune(5000)

    return NextResponse.json({
      success: true,
      logo: deleteResult.logo,
      message: 'Custom logo removed. Reverted to default logo in public/logo.png.',
    })
  } catch (err) {
    console.error('Error handling logo deletion:', err)
    return NextResponse.json(
      { success: false, error: `Server error: ${err.message}` },
      { status: 500 },
    )
  }
}
