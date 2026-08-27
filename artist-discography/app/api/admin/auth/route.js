import { NextResponse } from 'next/server'
import { loadConfigData } from '@/lib/data/artistData'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const dataResult = loadConfigData()
    const data = dataResult?.data ?? {}

    const adminAccess = Boolean(data?.adminAccess)
    const adminPassword = String(data?.adminPassword ?? '')

    if (!adminAccess) {
      return NextResponse.json(
        {
          authenticated: false,
          adminAccess: false,
          error: 'Admin access is disabled in config.json',
        },
        { status: 403 },
      )
    }

    if (adminPassword !== '') {
      const headerPass = request.headers.get('x-admin-password')
      const { searchParams } = new URL(request.url)
      const queryPass = searchParams.get('password')
      const candidate = headerPass ?? queryPass ?? ''

      if (candidate !== adminPassword) {
        return NextResponse.json(
          {
            authenticated: false,
            adminAccess: true,
            isPasswordless: false,
            error: 'Session expired or password was changed',
          },
          { status: 401 },
        )
      }

      return NextResponse.json({
        authenticated: true,
        adminAccess: true,
        isPasswordless: false,
      })
    }

    return NextResponse.json({
      authenticated: true,
      adminAccess: true,
      isPasswordless: true,
    })
  } catch (err) {
    return NextResponse.json(
      { authenticated: false, adminAccess: true, error: `Verification failed: ${err.message}` },
      { status: 500 },
    )
  }
}

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
        {
          authenticated: false,
          adminAccess: false,
          error: 'Admin access is disabled in config.json',
        },
        { status: 403 },
      )
    }

    if (password !== adminPassword) {
      return NextResponse.json(
        { authenticated: false, adminAccess: true, error: 'Incorrect password' },
        { status: 401 },
      )
    }

    return NextResponse.json({ authenticated: true, adminAccess: true })
  } catch (err) {
    return NextResponse.json(
      { authenticated: false, adminAccess: true, error: `Authentication failed: ${err.message}` },
      { status: 500 },
    )
  }
}
