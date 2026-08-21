import { NextResponse } from 'next/server'
import { loadConfigData } from '../../../../lib/artistData'

export async function POST(request) {
  try {
    const body = await request.json()
    const { password } = body ?? {}

    const dataResult = loadConfigData()
    const data = dataResult?.data ?? {}

    const adminAccess = Boolean(data?.adminAccess)
    const adminPassword = String(data?.adminPassword ?? '')

    if (!adminAccess) {
      return NextResponse.json(
        { authenticated: false, error: 'Admin access is disabled in config.json' },
        { status: 403 },
      )
    }

    if (password !== adminPassword) {
      return NextResponse.json(
        { authenticated: false, error: 'Incorrect password' },
        { status: 401 },
      )
    }

    return NextResponse.json({ authenticated: true })
  } catch (err) {
    return NextResponse.json(
      { authenticated: false, error: `Authentication failed: ${err.message}` },
      { status: 500 },
    )
  }
}
