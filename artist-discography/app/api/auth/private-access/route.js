import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { loadArtistData } from '../../../../lib/artistData'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const isAuth = cookieStore.get('private_access_auth')?.value === 'true'
    return NextResponse.json({
      success: true,
      authenticated: isAuth,
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, authenticated: false, error: err.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const submittedCode = String(body.accessCode || '').trim()

    if (!submittedCode) {
      return NextResponse.json(
        { success: false, error: 'Please enter a private access code' },
        { status: 400 }
      )
    }

    const dataResult = loadArtistData()
    const currentData = dataResult?.data ?? {}
    const configuredCode = String(currentData?.privateAccessCode || '').trim()

    if (!configuredCode) {
      return NextResponse.json(
        { success: false, error: 'No private access code is configured on this site' },
        { status: 400 }
      )
    }

    if (submittedCode !== configuredCode) {
      return NextResponse.json(
        { success: false, error: 'Invalid private access code' },
        { status: 401 }
      )
    }

    const response = NextResponse.json({
      success: true,
      authenticated: true,
      message: 'Private access unlocked successfully!',
    })

    // Set 30-day authentication cookie
    response.cookies.set('private_access_auth', 'true', {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return response
  } catch (err) {
    console.error('Error verifying private access code:', err)
    return NextResponse.json(
      { success: false, error: `Server error: ${err.message}` },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const response = NextResponse.json({
      success: true,
      authenticated: false,
      message: 'Private access locked successfully',
    })

    response.cookies.set('private_access_auth', '', {
      path: '/',
      sameSite: 'lax',
      maxAge: 0,
    })

    return response
  } catch (err) {
    return NextResponse.json(
      { success: false, error: `Server error: ${err.message}` },
      { status: 500 }
    )
  }
}
