import { NextResponse } from 'next/server'
import { loadConfigData } from '@/lib/data/artistData'
import { getAnalyticsSummary, clearAnalyticsData } from '@/lib/data/analyticsStorage'

export const dynamic = 'force-dynamic'

function verifyAdminAuth(request, providedPassword = null) {
  const dataResult = loadConfigData()
  const currentData = dataResult?.data ?? {}

  const adminAccess = Boolean(currentData?.adminAccess ?? true)
  const adminPassword = String(currentData?.adminPassword ?? '')

  if (!adminAccess) {
    return { ok: false, status: 403, error: 'Admin access is disabled in config.json' }
  }

  if (adminPassword !== '') {
    const headerPass = request.headers.get('x-admin-password')
    const { searchParams } = new URL(request.url)
    const queryPass = searchParams.get('password')
    const candidate = providedPassword ?? headerPass ?? queryPass ?? ''

    if (candidate !== adminPassword) {
      return { ok: false, status: 401, error: 'Unauthorized: Invalid admin password' }
    }
  }

  return { ok: true }
}

export async function GET(request) {
  try {
    const authCheck = verifyAdminAuth(request)
    if (!authCheck.ok) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status },
      )
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'

    const summary = getAnalyticsSummary({ range })
    return NextResponse.json({
      success: true,
      analytics: summary,
    })
  } catch (err) {
    console.error('Error fetching admin analytics:', err)
    return NextResponse.json(
      { success: false, error: `Failed to fetch analytics: ${err.message}` },
      { status: 500 },
    )
  }
}

export async function DELETE(request) {
  try {
    let body = {}
    try {
      body = await request.json()
    } catch {}

    const authCheck = verifyAdminAuth(request, body?.password)
    if (!authCheck.ok) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status },
      )
    }

    const cleared = clearAnalyticsData()
    if (!cleared) {
      return NextResponse.json(
        { success: false, error: 'Failed to reset analytics data' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Analytics data has been archived and reset successfully.',
    })
  } catch (err) {
    console.error('Error resetting analytics data:', err)
    return NextResponse.json(
      { success: false, error: `Failed to reset analytics: ${err.message}` },
      { status: 500 },
    )
  }
}
